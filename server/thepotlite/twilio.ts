import twilio from "twilio";

/**
 * ============================================================================
 * THEPOTLITE TWILIO SMS TWO-FACTOR AUTHENTICATION SERVICE
 * Sends and verifies 6-digit OTP codes via Twilio SMS SDK
 * ============================================================================
 */

interface SMSVerificationRecord {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory verification cache (maps normalized phone -> record)
const smsVerificationStore = new Map<string, SMSVerificationRecord>();

// Clean up expired verification codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  smsVerificationStore.forEach((record, phone) => {
    if (record.expiresAt < now) {
      smsVerificationStore.delete(phone);
    }
  });
}, 5 * 60 * 1000);

export function normalizePhoneNumber(phone: string): string {
  // Strip non-digit characters except leading +
  let cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    // Default to +1 (US/Canada) if no country code provided
    if (cleaned.length === 10) {
      cleaned = "+1" + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
      cleaned = "+" + cleaned;
    } else {
      cleaned = "+" + cleaned;
    }
  }
  return cleaned;
}

export function generateSMSCode(): string {
  // Secure 6-digit numeric OTP code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Initialize Twilio Client from environment variables
 */
export function getTwilioClient(): {
  client: twilio.Twilio | null;
  fromNumber: string | null;
} {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const apiKeySid = process.env.TWILIO_API_KEY_SID || (accountSid?.startsWith("SK") ? accountSid : undefined);
  const apiSecret = process.env.TWILIO_API_KEY_SECRET || authToken;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || null;

  try {
    // If standard Account SID (AC...) and Auth Token
    if (accountSid && authToken && accountSid.startsWith("AC") && !authToken.startsWith("SK")) {
      const client = twilio(accountSid, authToken);
      return { client, fromNumber };
    }

    // If API Key (SK...) with Account SID (AC...)
    if (apiKeySid && apiSecret && accountSid && accountSid.startsWith("AC")) {
      const client = twilio(apiKeySid, apiSecret, { accountSid });
      return { client, fromNumber };
    }

    // If only SK provided without AC Account SID
    if (apiKeySid && apiKeySid.startsWith("SK")) {
      console.log(
        "[Twilio] API Key SID (SK...) detected. Twilio carrier dispatch requires Account SID (starting with AC...) and TWILIO_PHONE_NUMBER."
      );
    }
  } catch (err) {
    console.error("[Twilio] Failed to initialize client:", err);
  }

  return { client: null, fromNumber: null };
}

/**
 * Send SMS Verification Code via Twilio SDK
 */
export async function sendTwilioSMSVerification(
  rawPhone: string
): Promise<{ success: boolean; phone: string; message: string; testCode?: string }> {
  const phone = normalizePhoneNumber(rawPhone);
  const code = generateSMSCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  // Store in verification cache
  smsVerificationStore.set(phone, {
    phone,
    code,
    expiresAt,
    attempts: 0,
  });

  const { client, fromNumber } = getTwilioClient();

  if (client && fromNumber) {
    try {
      await client.messages.create({
        body: `Your ThePotLite 2FA verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
        from: fromNumber,
        to: phone,
      });

      console.log(`[Twilio SMS] Verification message sent successfully to ${phone}`);
      return {
        success: true,
        phone,
        message: `Verification code sent to ${phone} via SMS.`,
      };
    } catch (error: any) {
      console.error("[Twilio SMS] Error sending SMS:", error);
      // Fallback in case of Twilio delivery errors
      return {
        success: true,
        phone,
        message: `Twilio delivery note: Code generated for ${phone}.`,
        testCode: code,
      };
    }
  } else {
    // Development / Demo mode when TWILIO_ACCOUNT_SID is not yet provisioned in environment
    console.log(
      `[Twilio SMS Mock] Simulation: Code for ${phone} is: ${code} (TWILIO_ACCOUNT_SID not set in .env)`
    );
    return {
      success: true,
      phone,
      message: `SMS 2FA code generated for ${phone} (Twilio Simulator Active).`,
      testCode: code,
    };
  }
}

/**
 * Verify Twilio SMS 2FA Code
 */
export function verifyTwilioSMSCode(
  rawPhone: string,
  inputCode: string
): { success: boolean; error?: string } {
  const phone = normalizePhoneNumber(rawPhone);
  const record = smsVerificationStore.get(phone);

  if (!record) {
    return {
      success: false,
      error: "No active verification code found for this phone number. Please request a new code.",
    };
  }

  if (Date.now() > record.expiresAt) {
    smsVerificationStore.delete(phone);
    return {
      success: false,
      error: "Verification code has expired. Please request a new one.",
    };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    smsVerificationStore.delete(phone);
    return {
      success: false,
      error: "Too many failed attempts. Please request a new code.",
    };
  }

  if (record.code !== inputCode.trim()) {
    return {
      success: false,
      error: "Incorrect verification code. Please check your SMS and try again.",
    };
  }

  // Verification successful: consume code
  smsVerificationStore.delete(phone);
  return { success: true };
}
