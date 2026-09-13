import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import * as schema from "@shared/schema";
import { z } from "zod";
import * as promoCodeEngine from "./promoCodeEngine";
import { stripeService } from "./stripe/stripe.service";
import { calculatePayoutAllocations, type DistributionType } from "./stripe/payouts.engine";
import { processStripeWebhook } from "./stripe/webhook.handler";
import { SUPPORTED_CURRENCIES } from "./stripe/stripe.utils";
import {
  paymentOrchestrator,
  reconciliationService,
  unitProvider,
  feeEngine,
} from "./modules/payments";

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
      // Convert releaseDate string to Date object if present
      const potData = {
        ...req.body,
        releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : undefined
      };
      
      const validatedData = schema.insertPotSchema.parse(potData);
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

      // N8N Webhook Integration
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      
      if (!n8nWebhookUrl) {
        return res.status(500).json({ message: 'N8N webhook URL not configured' });
      }

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        return res.status(500).json({ 
          message: `N8N webhook failed with status ${response.status}`,
          details: await response.text()
        });
      }

      const n8nResponse = await response.json();
      
      // Extract the output object from N8N response
      const output = n8nResponse.output || n8nResponse;
      
      // Transform N8N response to match our schema
      // Handle empty strings for optional fields
      const aiGeneratedData = {
        name: output.name,
        description: output.description || undefined,
        goalAmount: output.goalAmount,
        payoutStructure: output.payoutStructure,
        withdrawalMethod: output.withdrawalMethod,
        // Map timedReleaseDate from N8N to releaseDate, handle empty strings
        releaseDate: output.timedReleaseDate || output.releaseDate || undefined,
        voteThreshold: output.voteThreshold || undefined
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

  // ==========================================
  // UNIT FINANCIAL INFRASTRUCTURE & ORCHESTRATOR
  // ==========================================

  // Unit Webhook Endpoint
  app.post(`${apiPrefix}/webhooks/unit`, async (req, res) => {
    const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers["unit-signature"] as string | undefined;

    try {
      const result = await unitProvider.handleWebhook(rawBody, signature);
      res.status(200).json(result);
    } catch (err: any) {
      console.error("[Unit Webhook] Error processing event:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Agnostic Funding (ACH via Unit or Card via Stripe)
  app.post(`${apiPrefix}/payments/funding`, async (req, res) => {
    try {
      const { potId, amount, paymentRail = "ach", userId = 1, description, sourceToken, counterpartyId } = req.body;

      if (!potId || !amount || amount <= 0) {
        return res.status(400).json({ message: "potId and a positive amount are required" });
      }

      // Convert amount to cents if passed as decimal dollars (e.g. 25 -> 2500)
      const amountInCents = Number(amount) > 1000 ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

      const result = await paymentOrchestrator.fundPot({
        potId: Number(potId),
        userId: Number(userId),
        amount: amountInCents,
        paymentRail: paymentRail as "ach" | "card",
        description,
        sourceToken,
        counterpartyId,
        idempotencyKey: `fund_${potId}_${userId}_${Date.now()}`,
      });

      res.status(201).json({
        ...result,
        displayAmount: amountInCents / 100,
      });
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Agnostic Funding Status
  app.get(`${apiPrefix}/payments/funding/:id`, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }
      res.json(payment);
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Agnostic Withdrawals (Outbound ACH via Unit)
  app.post(`${apiPrefix}/payments/withdrawals`, async (req, res) => {
    try {
      const { potId, amount, destinationAccountId, userId = 1, description } = req.body;

      if (!potId || !amount || amount <= 0) {
        return res.status(400).json({ message: "potId and positive amount are required" });
      }

      const amountInCents = Number(amount) > 1000 ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

      const result = await paymentOrchestrator.withdrawFromPot({
        potId: Number(potId),
        userId: Number(userId),
        amount: amountInCents,
        destinationAccountId,
        description,
        idempotencyKey: `with_${potId}_${userId}_${Date.now()}`,
      });

      res.status(201).json({
        ...result,
        displayAmount: amountInCents / 100,
      });
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Pot Transfers (Instant Book Payments between Personal Pot and Group Pot)
  app.post(`${apiPrefix}/payments/transfers`, async (req, res) => {
    try {
      const { potId, amount, sourceAccountId = "22170443", destinationAccountId = "22170444", userId = 1, description } = req.body;

      if (!potId || !amount || amount <= 0) {
        return res.status(400).json({ message: "potId and positive amount are required" });
      }

      const amountInCents = Number(amount) > 1000 ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

      const result = await paymentOrchestrator.transferBetweenPots({
        potId: Number(potId),
        userId: Number(userId),
        amount: amountInCents,
        sourceAccountId,
        destinationAccountId,
        description,
        idempotencyKey: `trans_${potId}_${userId}_${Date.now()}`,
      });

      res.status(201).json({
        ...result,
        displayAmount: amountInCents / 100,
      });
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Get Banking & Deposit Account details for a Pot
  app.get(`${apiPrefix}/banking/accounts`, async (req, res) => {
    try {
      const potId = req.query.potId ? parseInt(req.query.potId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;

      if (potId) {
        const details = await paymentOrchestrator.getPotBankingDetails(potId, userId);
        return res.json(details);
      }

      const userAccounts = await storage.getFinancialAccountsByUserId(userId);
      res.json(userAccounts);
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Connect External Bank Account
  app.post(`${apiPrefix}/banking/connect`, async (req, res) => {
    try {
      const { userId = 1, routingNumber, accountNumber, institutionName, name } = req.body;

      const last4 = accountNumber ? String(accountNumber).slice(-4) : "1234";
      const method = await storage.createPaymentMethod({
        userId: Number(userId),
        provider: "unit",
        type: "ach",
        providerMethodId: `cp_unit_${Date.now()}`,
        name: name || "Primary Checking",
        last4,
        routingNumber: routingNumber || "812345678",
        institutionName: institutionName || "Unit Bank Partner",
        isDefault: true,
        status: "active",
      });

      res.status(201).json(method);
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Fee calculation query applying $100+ rule
  app.get(`${apiPrefix}/payments/fees`, (req, res) => {
    const amount = req.query.amount ? parseFloat(req.query.amount as string) : 50;
    const isPersonal = req.query.isPersonal === "true";
    const amountInCents = Math.round(amount * 100);

    const feeBreakdown = feeEngine.calculateFee(amountInCents, 0, isPersonal);
    res.json({
      ...feeBreakdown,
      grossDollars: feeBreakdown.grossAmount / 100,
      feeDollars: feeBreakdown.platformFee / 100,
      netDollars: feeBreakdown.netAmount / 100,
    });
  });

  // Reconciliation History
  app.get(`${apiPrefix}/admin/reconciliation`, async (_req, res) => {
    try {
      const records = await reconciliationService.getHistory(20);
      res.json(records);
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Trigger On-Demand Reconciliation
  app.post(`${apiPrefix}/admin/reconciliation/run`, async (req, res) => {
    try {
      const { provider = "all" } = req.body;
      const result = await reconciliationService.runReconciliation(provider);
      res.json(result);
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Provider Transactions Log
  app.get(`${apiPrefix}/admin/provider-transactions`, async (_req, res) => {
    try {
      const transactions = await storage.getProviderTransactions(50);
      res.json(transactions);
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // Unit Sandbox Simulation Trigger
  app.post(`${apiPrefix}/admin/unit/simulate`, async (req, res) => {
    try {
      const { action, paymentId, accountId = "22170443", amount = 10000 } = req.body;

      let simResult: any;
      if (action === "clear_ach") {
        simResult = await unitProvider.simulations.clearAchPayment(paymentId || `ach_${Date.now()}`);
      } else if (action === "return_ach") {
        simResult = await unitProvider.simulations.returnAchPayment(paymentId || `ach_${Date.now()}`);
      } else if (action === "receive_payment") {
        simResult = await unitProvider.simulations.simulateReceivedPayment(accountId, amount);
      } else {
        return res.status(400).json({ message: "Unknown simulation action. Valid: clear_ach, return_ach, receive_payment" });
      }

      res.json({
        status: "success",
        action,
        result: simResult,
      });
    } catch (err: any) {
      handleError(res, err);
    }
  });

  // ==========================================
  // STRIPE PAYMENT INTEGRATION ENDPOINTS
  // ==========================================

  // Get Stripe Configuration
  app.get(`${apiPrefix}/stripe/config`, (_req, res) => {
    res.json({
      publishableKey: stripeService.getPublishableKey(),
      isMock: stripeService.isMockMode(),
      supportedCurrencies: SUPPORTED_CURRENCIES,
      platformFeePercent: 2,
    });
  });

  // Stripe Webhook Endpoint (Supports both /api/webhooks/stripe and /api/v1/webhooks/stripe)
  const handleWebhook = async (req: any, res: any) => {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

    try {
      const result = await processStripeWebhook(rawBody, signature);
      if (!result.received && result.status === 'signature_verification_failed') {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('Stripe webhook handling exception:', err);
      return res.status(500).json({ error: err.message });
    }
  };

  app.post(`${apiPrefix}/webhooks/stripe`, handleWebhook);
  app.post('/api/v1/webhooks/stripe', handleWebhook);

  // Create Stripe PaymentIntent for Pot Deposit
  app.post(`${apiPrefix}/payments/create-intent`, async (req, res) => {
    try {
      const { potId, amount, currency = 'USD', userId = 1, description } = req.body;

      if (!potId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Missing or invalid potId or amount' });
      }

      // Convert amount to cents (e.g. $10 -> 1000 cents)
      const amountInCents = Math.round(Number(amount) * 100);

      const intentResult = await stripeService.createPaymentIntent({
        amount: amountInCents,
        currency,
        potId,
        userId,
        description,
      });

      // Record pending payment in storage (safe if DB offline)
      try {
        await storage.createPayment({
          potId: Number(potId),
          userId: Number(userId),
          stripePaymentIntentId: intentResult.paymentIntentId,
          amount: amountInCents,
          currency: intentResult.currency,
          status: 'pending',
        });
      } catch (dbErr: any) {
        console.warn('[Payments] DB payment record creation skipped in sandbox:', dbErr.message);
      }

      res.status(201).json({
        ...intentResult,
        displayAmount: Number(amount),
      });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Create Stripe Checkout Session for Pot Deposit
  app.post(`${apiPrefix}/payments/checkout-session`, async (req, res) => {
    try {
      const { potId, amount, potName, userEmail, currency = 'USD', userId = 1, successUrl, cancelUrl } = req.body;

      if (!potId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Missing or invalid potId or amount' });
      }

      const amountInCents = Math.round(Number(amount) * 100);

      const sessionResult = await stripeService.createCheckoutSession({
        amount: amountInCents,
        currency,
        potId,
        userId,
        potName: potName || `Pot #${potId}`,
        userEmail,
        successUrl,
        cancelUrl,
      });

      try {
        await storage.createPayment({
          potId: Number(potId),
          userId: Number(userId),
          stripeCheckoutSessionId: sessionResult.sessionId,
          amount: amountInCents,
          currency: sessionResult.currency,
          status: 'pending',
        });
      } catch (dbErr: any) {
        console.warn('[Payments] DB payment record creation skipped in sandbox:', dbErr.message);
      }

      res.status(201).json({
        ...sessionResult,
        displayAmount: Number(amount),
      });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Refund a Payment
  app.post(`${apiPrefix}/payments/:id/refund`, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { reason = 'requested_by_customer', amount } = req.body;

      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      if (payment.stripePaymentIntentId) {
        await stripeService.createRefund({
          paymentIntentId: payment.stripePaymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason,
        });
      }

      await storage.updatePayment(paymentId, { status: 'refunded' });

      // Add refund transaction record
      await storage.createTransaction({
        potId: payment.potId,
        userId: payment.userId || 1,
        type: 'refund',
        amount: amount || Math.round(payment.amount / 100),
        currency: payment.currency,
        direction: 'DEBIT',
        reference: `tx_refund_${paymentId}_${Date.now()}`,
        description: `Refund for payment #${paymentId}`,
        status: 'completed',
      });

      res.json({ message: 'Refund processed successfully', paymentId, status: 'refunded' });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Calculate & Execute Programmable Pot Payout
  app.post(`${apiPrefix}/pots/:id/payout`, async (req, res) => {
    try {
      const potId = parseInt(req.params.id);
      const {
        amount,
        distributionType = 'EQUAL',
        customAllocations,
        members = [],
        historicalContributions = [],
        initiatedById = 1,
        currency = 'USD'
      } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Payout amount must be greater than zero' });
      }

      // 1. Calculate member payout allocations
      const allocations = calculatePayoutAllocations(
        Number(amount),
        distributionType as DistributionType,
        members.length > 0 ? members : [{ userId: '1', userName: 'Admin', userEmail: 'admin@thepot.com' }],
        historicalContributions,
        customAllocations
      );

      // 2. Save Payout Record (safe if DB offline)
      let savedPayout: any = null;
      try {
        savedPayout = await storage.createPayout({
          potId,
          initiatedById: Number(initiatedById),
          amount: Number(amount),
          currency,
          distributionType,
          allocations: allocations as any,
          status: 'completed',
          processedAt: new Date(),
        });
      } catch (dbErr: any) {
        console.warn('[Payouts] DB payout record creation skipped in sandbox:', dbErr.message);
        savedPayout = {
          id: Math.floor(Math.random() * 10000),
          potId,
          amount,
          distributionType,
          allocations,
          status: 'completed',
        };
      }

      // 3. Create transactions and deduct pot balance
      try {
        await storage.createTransaction({
          potId,
          userId: Number(initiatedById),
          type: 'payout',
          amount: Number(amount),
          currency,
          direction: 'DEBIT',
          reference: `tx_payout_${savedPayout.id || Date.now()}`,
          description: `Payout via ${distributionType} distribution to ${allocations.length} recipients`,
          status: 'completed',
          metadata: {
            allocations,
            distributionType,
          } as any
        });
      } catch (txErr: any) {
        console.warn('[Payouts] Transaction ledger update skipped in sandbox:', txErr.message);
      }

      res.status(201).json({
        payout: savedPayout,
        allocations,
        totalAmount: Number(amount),
        distributionType,
        status: 'completed',
      });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Get Payouts for a Pot
  app.get(`${apiPrefix}/pots/:id/payouts`, async (req, res) => {
    try {
      const potId = parseInt(req.params.id);
      const payouts = await storage.getPayoutsByPotId(potId);
      res.json(payouts);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  return httpServer;
}
