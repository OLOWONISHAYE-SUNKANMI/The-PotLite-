import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import * as schema from "@shared/schema";
import { z } from "zod";
import * as promoCodeEngine from "./promoCodeEngine";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // API prefix
  const apiPrefix = '/api';
  
  // Error handler helper
  const handleError = (res: any, error: any) => {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  };
  
  // Get all pots
  app.get(`${apiPrefix}/pots`, async (req, res) => {
    try {
      const pots = await storage.getPots();
      res.json(pots);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get a single pot by ID
  app.get(`${apiPrefix}/pots/:id`, async (req, res) => {
    try {
      const potId = parseInt(req.params.id);
      const pot = await storage.getPotById(potId);
      
      if (!pot) {
        return res.status(404).json({ message: 'Pot not found' });
      }
      
      res.json(pot);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Create a new pot
  app.post(`${apiPrefix}/pots`, async (req, res) => {
    try {
      const validatedData = schema.insertPotSchema.parse(req.body);
      const pot = await storage.createPot(validatedData);
      res.status(201).json(pot);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Update a pot
  app.patch(`${apiPrefix}/pots/:id`, async (req, res) => {
    try {
      const potId = parseInt(req.params.id);
      const validatedData = schema.insertPotSchema.partial().parse(req.body);
      const pot = await storage.updatePot(potId, validatedData);
      
      if (!pot) {
        return res.status(404).json({ message: 'Pot not found' });
      }
      
      res.json(pot);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Delete a pot
  app.delete(`${apiPrefix}/pots/:id`, async (req, res) => {
    try {
      const potId = parseInt(req.params.id);
      const pot = await storage.deletePot(potId);
      
      if (!pot) {
        return res.status(404).json({ message: 'Pot not found' });
      }
      
      res.json({ message: 'Pot deleted successfully' });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Add a member to a pot
  app.post(`${apiPrefix}/pots/:potId/members`, async (req, res) => {
    try {
      const potId = parseInt(req.params.potId);
      const validatedData = schema.insertPotMemberSchema.parse({
        ...req.body,
        potId
      });
      
      const member = await storage.addPotMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Remove a member from a pot
  app.delete(`${apiPrefix}/pots/:potId/members/:userId`, async (req, res) => {
    try {
      const potId = parseInt(req.params.potId);
      const userId = parseInt(req.params.userId);
      
      const member = await storage.removePotMember(potId, userId);
      
      if (!member) {
        return res.status(404).json({ message: 'Member not found in pot' });
      }
      
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get transactions for a pot
  app.get(`${apiPrefix}/pots/:potId/transactions`, async (req, res) => {
    try {
      const potId = parseInt(req.params.potId);
      const transactions = await storage.getTransactionsByPotId(potId);
      res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Create a new transaction
  app.post(`${apiPrefix}/transactions`, async (req, res) => {
    try {
      const validatedData = schema.insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Submit feedback
  app.post(`${apiPrefix}/feedback`, async (req, res) => {
    try {
      const validatedData = schema.insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(validatedData);
      res.status(201).json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get all feedback
  app.get(`${apiPrefix}/feedback`, async (req, res) => {
    try {
      const feedback = await storage.getAllFeedback();
      res.json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Promo Code API Endpoints
  
  // Generate a promo code
  app.post(`${apiPrefix}/promo-code/generate`, async (req, res) => {
    try {
      const { userId, potId, potType, userBalance, potGoalStatus } = req.body;
      
      // Validate required fields
      if (!userId || !potId || !potType) {
        return res.status(400).json({ message: 'Missing required fields: userId, potId, potType' });
      }
      
      // Check if user can generate a promo code
      const canGenerate = promoCodeEngine.canGeneratePromoCode(potType, userBalance, potGoalStatus);
      
      if (!canGenerate) {
        const reason = potType === 'PP' 
          ? 'Personal Pot balance must be at least ₡5 to generate a promo code'
          : 'Group Pot goal must be met to generate a promo code';
        return res.status(400).json({ message: reason });
      }
      
      const promoCode = promoCodeEngine.generatePromoCode(potType, potId, userId);
      
      res.json({
        promoCode,
        status: 'success'
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Verify a promo code (for merchant systems)
  app.post(`${apiPrefix}/promo-code/verify`, async (req, res) => {
    try {
      const { promoCode } = req.body;
      
      if (!promoCode) {
        return res.status(400).json({ message: 'Promo code is required' });
      }
      
      const verification = promoCodeEngine.verifyPromoCodeWithMerchant(promoCode);
      res.json(verification);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Flag promo code reuse
  app.post(`${apiPrefix}/promo-code/flag-reuse`, async (req, res) => {
    try {
      const { userId, promoCode } = req.body;
      
      if (!userId || !promoCode) {
        return res.status(400).json({ message: 'userId and promoCode are required' });
      }
      
      const result = promoCodeEngine.handleCodeReuse(userId);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get user's promo codes (for dashboard display)
  app.get(`${apiPrefix}/promo-codes/user/:userId`, async (req, res) => {
    try {
      const { userId } = req.params;
      const userCodes = promoCodeEngine.getPromoCodesByUser(userId);
      res.json(userCodes);
    } catch (error) {
      handleError(res, error);
    }
  });

  // AI Pot Creation - Generate pot draft from user prompt
  app.post(`${apiPrefix}/pots/ai-draft`, async (req, res) => {
    try {
      const { prompt, userId } = req.body;
      
      if (!prompt || !userId) {
        return res.status(400).json({ message: 'Missing required fields: prompt and userId' });
      }

      // ========== N8N WEBHOOK PLACEHOLDER ==========
      // TODO: Replace this with actual N8N webhook call
      // 
      // WEBHOOK REQUEST FORMAT:
      // POST to your N8N webhook URL with this payload:
      // {
      //   "prompt": "user's text input describing the pot",
      //   "userId": 1 (the current user's ID)
      // }
      //
      // EXPECTED WEBHOOK RESPONSE FORMAT:
      // {
      //   "name": "Summer Vacation Fund",
      //   "description": "Saving for family trip to Hawaii",
      //   "goalAmount": 5000,
      //   "payoutStructure": "many-to-one",
      //   "withdrawalMethod": "timed_release",
      //   "releaseDate": "2025-06-01T00:00:00.000Z",
      //   "voteThreshold": null
      // }
      //
      // IMPLEMENTATION EXAMPLE:
      // const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      // const response = await fetch(n8nWebhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ prompt, userId }),
      //   signal: AbortSignal.timeout(15000) // 15 second timeout
      // });
      // const aiGeneratedData = await response.json();
      // ============================================

      // MOCK RESPONSE - Remove this when implementing N8N
      const aiGeneratedData = {
        name: "AI Generated Pot",
        description: "This is a mock response. Replace with N8N webhook integration.",
        goalAmount: 1000,
        payoutStructure: "many-to-one",
        withdrawalMethod: "admin_approval",
        voteThreshold: null,
        releaseDate: null
      };

      // Validate the AI-generated data against schema
      const validatedDraft = schema.aiPotDraftSchema.parse(aiGeneratedData);

      res.json({
        draft: validatedDraft,
        status: 'success'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'AI generated invalid pot data', 
          errors: error.errors 
        });
      }
      console.error('AI Draft Error:', error);
      return res.status(500).json({ message: 'Failed to generate pot draft' });
    }
  });

  return httpServer;
}
