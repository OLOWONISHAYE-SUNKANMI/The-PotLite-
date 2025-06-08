
// PromoCodeEngine.js – The Pot Promo Code Logic

const promoCodes = new Map(); // In-memory store for sandbox testing

function canGeneratePromoCode(potType, userBalance, potGoalStatus) {
  if (potType === 'PP') {
    return userBalance >= 5;
  } else if (potType === 'GP') {
    return potGoalStatus === 'GOAL_MET';
  }
  return false;
}

function generatePromoCode(potType, potId, userId) {
  const codeType = potType === 'PP' ? 'PP' : 'GP';
  const uniqueID = Math.floor(100000 + Math.random() * 900000).toString();
  const promoCode = `THEPOT-${codeType}-${uniqueID}`;

  const record = {
    promoCode,
    potType,
    potId,
    userId,
    status: 'unused',
    createdAt: new Date(),
    encryptedKey: encryptBackendKey(promoCode) // Mock function
  };

  promoCodes.set(promoCode, record);
  return promoCode;
}

function encryptBackendKey(code) {
  // Simple example for mock encryption
  return Buffer.from(code).toString('base64');
}

function verifyPromoCodeWithMerchant(promoCode) {
  if (!promoCodes.has(promoCode)) return { status: 'invalid' };

  const record = promoCodes.get(promoCode);

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

function handleCodeReuse(userId) {
  // Lock user's ability to create Pots
  return {
    userId,
    restrictions: ['no-pot-creation'],
    supportTicketGenerated: true
  };
}

module.exports = {
  canGeneratePromoCode,
  generatePromoCode,
  verifyPromoCodeWithMerchant,
  handleCodeReuse
};
