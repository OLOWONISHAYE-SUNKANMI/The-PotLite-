import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import * as schema from "@shared/schema";
import { z } from "zod";

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
  
  return httpServer;
}
