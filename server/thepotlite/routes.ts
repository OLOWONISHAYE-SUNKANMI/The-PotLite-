import { Router } from "express";
import { z } from "zod";
import {
  registerAdultUser,
  authenticateAdultUser,
  setupTwoFactorForUser,
  enableTwoFactorForUser,
  verifyTOTPCode,
} from "./auth";
import { getUserOrgMembership } from "./permissions";
import { db } from "@db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

export const thePotLiteRouter = Router();

// Validation Schemas
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  organizationId: z.number().optional(),
  role: z.enum(["Organizer", "Member"]).optional(),
  title: z.string().optional(),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const verifyTwoFactorSchema = z.object({
  userId: z.number(),
  code: z.string().length(6, "Code must be 6 digits"),
});

// Helper for error handling
const handleRouteError = (res: any, error: any) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: "Validation error", details: error.errors });
  }
  const status = error.statusCode || 400;
  return res.status(status).json({ error: error.message || "An unexpected error occurred" });
};

/**
 * POST /api/v1/auth/register
 * Register adult account (Organizer or Member)
 */
thePotLiteRouter.post("/auth/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await registerAdultUser(data);

    // Save in session if available
    if ((req as any).session) {
      (req as any).session.userId = user.id;
    }

    return res.status(201).json({
      message: "Adult account registered successfully",
      user,
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate with username/email and password
 */
thePotLiteRouter.post("/auth/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authenticateAdultUser(data);

    if (result.requiresTwoFactor) {
      return res.status(200).json({
        requiresTwoFactor: true,
        userId: result.userId,
        username: result.username,
        message: "Please enter your 6-digit two-factor authentication code.",
      });
    }

    if ((req as any).session && result.user) {
      (req as any).session.userId = result.user.id;
    }

    return res.status(200).json({
      requiresTwoFactor: false,
      user: result.user,
      message: "Authenticated successfully",
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

/**
 * POST /api/v1/auth/2fa/setup
 * Generates TOTP secret and QR code URI for Organizers
 */
thePotLiteRouter.post("/auth/2fa/setup", async (req, res) => {
  try {
    const userId = req.body.userId ?? (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const setupData = await setupTwoFactorForUser(Number(userId));
    return res.status(200).json(setupData);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

/**
 * POST /api/v1/auth/2fa/enable
 * Verifies code and locks in 2FA for the user
 */
thePotLiteRouter.post("/auth/2fa/enable", async (req, res) => {
  try {
    const { userId, code } = verifyTwoFactorSchema.parse(req.body);
    const result = await enableTwoFactorForUser(userId, code);
    return res.status(200).json({
      message: "Two-factor authentication successfully enabled",
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

/**
 * POST /api/v1/auth/2fa/verify
 * Validates 2FA code during login challenge
 */
thePotLiteRouter.post("/auth/2fa/verify", async (req, res) => {
  try {
    const { userId, code } = verifyTwoFactorSchema.parse(req.body);
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA is not configured for this user" });
    }

    const isValid = verifyTOTPCode(user.twoFactorSecret, code);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid two-factor authentication code" });
    }

    if ((req as any).session) {
      (req as any).session.userId = user.id;
    }

    return res.status(200).json({
      message: "Two-factor verification successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

/**
 * GET /api/v1/auth/me
 * Retrieves active session and user's organization memberships
 */
thePotLiteRouter.get("/auth/me", async (req, res) => {
  try {
    const userId = (req as any).session?.userId ?? Number(req.query.userId);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const memberships = await db.query.organizationMembers.findMany({
      where: eq(schema.organizationMembers.userId, user.id),
      with: {
        organization: true,
      },
    });

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      memberships: memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization?.name,
        role: m.role,
        title: m.title,
      })),
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

/**
 * POST /api/v1/auth/logout
 */
thePotLiteRouter.post("/auth/logout", (req, res) => {
  if ((req as any).session) {
    (req as any).session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  } else {
    res.status(200).json({ message: "Logged out successfully" });
  }
});
