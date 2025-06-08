// PromoCodeEngine.ts – The Pot Promo Code Logic

export type PromoCodeRecord = {
  promoCode: string;
  potType: 'PP' | 'GP';
  potId: string;
  userId: string;
  status: 'unused' | 'used';
  createdAt: Date;
  encryptedKey: string;
};

const promoCodes = new Map<string, PromoCodeRecord>(); // In-memory store for sandbox testing

export function canGeneratePromoCode(potType: 'PP' | 'GP', userBalance: number, potGoalStatus: 'GOAL_MET' | 'NOT_MET'): boolean {
  if (potType === 'PP') {
    return userBalance >= 5;
  } else if (potType === 'GP') {
    return potGoalStatus === 'GOAL_MET';
  }
  return false;
}

export function generatePromoCode(potType: 'PP' | 'GP', potId: string, userId: string): string {
  const codeType = potType === 'PP' ? 'PP' : 'GP';
  const uniqueID = Math.floor(100000 + Math.random() * 900000).toString();
  const promoCode = `THEPOT-${codeType}-${uniqueID}`;

  const record: PromoCodeRecord = {
    promoCode,
    potType,
    potId,
    userId,
    status: 'unused',
    createdAt: new Date(),
    encryptedKey: encryptBackendKey(promoCode)
  };

  promoCodes.set(promoCode, record);
  return promoCode;
}

function encryptBackendKey(code: string): string {
  // Simple example for mock encryption
  return Buffer.from(code).toString('base64');
}

export function verifyPromoCodeWithMerchant(promoCode: string) {
  if (!promoCodes.has(promoCode)) return { status: 'invalid' };

  const record = promoCodes.get(promoCode)!;

  if (record.status === 'used') return { status: 'used' };

  record.status = 'used';
  promoCodes.set(promoCode, record);

  return {
    status: 'valid',
    potId: record.potId,
    potType: record.potType,
    encryptedKey: record.encryptedKey
  };
}

export function handleCodeReuse(userId: string) {
  // Lock user's ability to create Pots
  return {
    userId,
    restrictions: ['no-pot-creation'],
    supportTicketGenerated: true
  };
}

// Additional helper functions for the app
export function getPromoCodesByUser(userId: string): PromoCodeRecord[] {
  const userCodes: PromoCodeRecord[] = [];
  for (const [code, record] of promoCodes) {
    if (record.userId === userId) {
      userCodes.push(record);
    }
  }
  return userCodes;
}

export function getAllPromoCodes(): PromoCodeRecord[] {
  return Array.from(promoCodes.values());
}

export { promoCodes };