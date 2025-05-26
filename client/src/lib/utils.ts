import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  
  // If less than 24 hours ago, show relative time
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 1000 * 60) {
    return 'Just now';
  } else if (diff < 1000 * 60 * 60) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diff < 1000 * 60 * 60 * 24) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diff < 1000 * 60 * 60 * 24 * 7) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Otherwise show the date
  return date.toLocaleDateString();
}

export type PotType = {
  id: string;
  name: string;
  description: string;
  goalAmount: number;
  currentBalance: number;
  createdBy: string;
  payoutStructure: 'one-to-many' | 'many-to-one' | 'many-to-selected';
  withdrawalMethod: 'democratic' | 'admin' | 'timed' | 'auto-withdraw';
  voteThreshold?: number;
  releaseDate?: string;
  creator: string;
  members: string[];
  recipients: string[];
  memberContributions?: Record<string, number>;
  memberPayouts?: Record<string, number>;
  createdAt: string;
  status?: 'active' | 'completed';
  completedDate?: string;
  contributionMethod?: 'equal-split' | 'individual-contribution' | 'just-reach-goal';
};

export type TransactionType = {
  id: string;
  potId: string;
  type: 'deposit' | 'withdrawal' | 'vote' | 'request';
  amount?: number;
  user: string;
  description?: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'rejected';
  balanceAfter?: number;
  voteCount?: number;
  voteTotal?: number;
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
