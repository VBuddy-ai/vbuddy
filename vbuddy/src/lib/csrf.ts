// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32; // 256 bits
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Store CSRF tokens in memory (consider using Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Generate a random string using Web Crypto API
async function generateRandomString(length: number): Promise<string> {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generateCSRFToken(sessionId: string): Promise<string> {
  const token = await generateRandomString(CSRF_TOKEN_LENGTH);
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;

  csrfTokens.set(sessionId, { token, expires });
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

export function clearCSRFToken(sessionId: string): void {
  csrfTokens.delete(sessionId);
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expires) {
      csrfTokens.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
