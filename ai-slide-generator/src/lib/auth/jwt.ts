/**
 * Simple JWT utilities using Web Crypto API.
 * This ensures compatibility with Edge Runtime.
 */

const encoder = new TextEncoder();

/**
 * Get the secret key as a CryptoKey
 */
async function getSecretKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Encode to Base64URL
 */
function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? encoder.encode(input) : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode from Base64URL
 */
function decodeBase64url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sign a payload to create a JWT
 */
export async function signJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const key = await getSecretKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, data);

  const encodedSignature = base64url(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT
 */
export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    const key = await getSecretKey(secret);
    const data = encoder.encode(`${header}.${payload}`);
    const signatureBytes = decodeBase64url(signature);

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes as any, data);

    if (!isValid) return null;

    const decodedPayload = new TextDecoder().decode(decodeBase64url(payload));
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}
