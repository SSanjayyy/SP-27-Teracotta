// Encrypts Spotify tokens before they go into spotify_connections, and decrypts them after
// reading. AES-GCM (Web Crypto) with a 256-bit key from the TOKEN_ENCRYPTION_KEY function secret:
//
//   supabase secrets set TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
//
// Stored format: base64(12-byte random iv || ciphertext-with-auth-tag).
// If the key is ever changed, existing tokens can't be decrypted: users just connect Spotify again.

let keyPromise: Promise<CryptoKey> | null = null;

// (Return types are left to inference so newer TypeScript sees an ArrayBuffer-backed array,
// which is what Web Crypto wants.)
function fromBase64(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    const raw = Deno.env.get('TOKEN_ENCRYPTION_KEY') ?? '';
    let bytes = new Uint8Array(0);
    try {
      bytes = fromBase64(raw.trim());
    } catch {
      // not valid base64; the length check below reports it
    }
    if (bytes.length !== 32) {
      return Promise.reject(new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded.'));
    }
    keyPromise = crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  return keyPromise;
}

export async function encryptToken(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), new TextEncoder().encode(plain))
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return toBase64(out);
}

export async function decryptToken(stored: string): Promise<string> {
  const bytes = fromBase64(stored);
  if (bytes.length < 13) throw new Error('Stored token is not in the encrypted format.');
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12) },
    await getKey(),
    bytes.slice(12)
  );
  return new TextDecoder().decode(plain);
}
