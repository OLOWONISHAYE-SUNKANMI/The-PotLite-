import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    // Seed users
    const defaultUsers = [
      { username: "current_user", password: "password123", name: "Current User", email: "current@example.com" },
      { username: "alice", password: "password123", name: "Alice", email: "alice@example.com" },
      { username: "bob", password: "password123", name: "Bob", email: "bob@example.com" },
      { username: "charlie", password: "password123", name: "Charlie", email: "charlie@example.com" },
      { username: "david", password: "password123", name: "David", email: "david@example.com" },
      { username: "emma", password: "password123", name: "Emma", email: "emma@example.com" },
      { username: "sarah", password: "password123", name: "Sarah", email: "sarah@example.com" },
      { username: "mike", password: "password123", name: "Mike", email: "mike@example.com" },
      { username: "jessica", password: "password123", name: "Jessica", email: "jessica@example.com" },
      { username: "alex", password: "password123", name: "Alex", email: "alex@example.com" }
    ];

    // Check for existing users before seeding
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      console.log("Seeding users...");
      
      // Insert users
      for (const user of defaultUsers) {
        await db.insert(schema.users).values(user);
      }
      
      // Get seeded users for references
      const users = await db.select().from(schema.users);
      const userMap = users.reduce((map, user) => {
        map[user.username] = user.id;
        return map;
      }, {} as Record<string, number>);
      
      // Create a default pot
      console.log("Seeding default pot...");
      
      const defaultPot = {
        name: "Weekend Trip Fund",
        description: "Saving for our group weekend getaway",
        goalAmount: 500,
        currentBalance: 320,
        payoutStructure: "many-to-one",
        withdrawalMethod: "admin",
        createdBy: userMap["current_user"],
      };
      
      const [pot] = await db.insert(schema.pots).values(defaultPot).returning();
      
      // Add pot members
      console.log("Adding pot members...");
      
      const potMembers = [
        { potId: pot.id, userId: userMap["current_user"], isAdmin: true, isRecipient: false },
        { potId: pot.id, userId: userMap["mike"], isAdmin: false, isRecipient: false },
        { potId: pot.id, userId: userMap["alex"], isAdmin: false, isRecipient: false },
        { potId: pot.id, userId: userMap["jessica"], isAdmin: false, isRecipient: false },
        { potId: pot.id, userId: userMap["sarah"], isAdmin: false, isRecipient: true },
        { potId: pot.id, userId: userMap["emma"], isAdmin: false, isRecipient: false },
        { potId: pot.id, userId: userMap["david"], isAdmin: false, isRecipient: false }
      ];
      
      for (const member of potMembers) {
        await db.insert(schema.potMembers).values(member);
      }
      
      // Add transactions
      console.log("Adding transactions...");
      
      // Function to create timestamps relative to now
      const getRelativeTimestamp = (daysAgo: number) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
      };
      
      const transactions = [
        {
          potId: pot.id,
          userId: userMap["mike"],
          type: "deposit",
          amount: 50,
          description: "Initial deposit",
          status: "completed",
          metadata: { balanceAfter: 50 },
          createdAt: getRelativeTimestamp(5)
        },
        {
          potId: pot.id,
          userId: userMap["alex"],
          type: "vote",
          description: "Voted on withdrawal request",
          status: "completed",
          metadata: { voteCount: 3, voteTotal: 6 },
          createdAt: getRelativeTimestamp(2)
        },
        {
          potId: pot.id,
          userId: userMap["jessica"],
          type: "deposit",
          amount: 30,
          description: "Weekly contribution",
          status: "completed",
          metadata: { balanceAfter: 80 },
          createdAt: getRelativeTimestamp(1)
        },
        {
          potId: pot.id,
          userId: userMap["sarah"],
          type: "request",
          amount: 200,
          description: "For booking hotel rooms",
          status: "pending",
          createdAt: getRelativeTimestamp(2)
        },
        {
          potId: pot.id,
          userId: userMap["current_user"], // Changed from john to current_user
          type: "deposit",
          amount: 100,
          description: "Monthly contribution",
          status: "completed",
          metadata: { balanceAfter: 180 },
          createdAt: getRelativeTimestamp(3)
        },
        {
          potId: pot.id,
          userId: userMap["emma"],
          type: "deposit",
          amount: 90,
          description: "Trip savings",
          status: "completed",
          metadata: { balanceAfter: 270 },
          createdAt: getRelativeTimestamp(4)
        },
        {
          potId: pot.id,
          userId: userMap["david"],
          type: "deposit",
          amount: 50,
          description: "Initial deposit",
          status: "completed",
          metadata: { balanceAfter: 320 },
          createdAt: getRelativeTimestamp(5)
        }
      ];
      
      for (const transaction of transactions) {
        await db.insert(schema.transactions).values(transaction);
      }
      
      console.log("Seed completed successfully!");
    } else {
      console.log("Database already has data. Skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
