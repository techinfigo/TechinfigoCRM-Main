// Client-side encryption for sensitive credential fields using the browser's
// built-in Web Crypto API (AES-GCM with PBKDF2 key derivation). Nothing leaves
// the browser and no external library is used. The master passphrase is never
// stored — only kept in memory for the session — so even someone with access to
// Firestore cannot read encrypted values without it.

const ENC_PREFIX = 'enc:v1:'; // marks a value as encrypted so we know to decrypt

const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const fromB64 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptValue(plaintext: string, passphrase: string): Promise<string> {
  if (!plaintext) return plaintext;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  return ENC_PREFIX + toB64(salt.buffer) + ':' + toB64(iv.buffer) + ':' + toB64(cipher);
}

export const isEncrypted = (value?: string): boolean =>
  typeof value === 'string' && value.startsWith(ENC_PREFIX);

export async function decryptValue(value: string, passphrase: string): Promise<string> {
  if (!isEncrypted(value)) return value;
  const [saltB64, ivB64, cipherB64] = value.slice(ENC_PREFIX.length).split(':');
  if (!saltB64 || !ivB64 || !cipherB64) {
    throw new Error('Malformed encrypted value.');
  }
  const salt = fromB64(saltB64);
  const iv = fromB64(ivB64);
  const key = await deriveKey(passphrase, salt);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      fromB64(cipherB64),
    );
    return dec.decode(plain);
  } catch {
    // AES-GCM fails authentication when the passphrase is wrong or the
    // ciphertext was tampered with — both look the same from here.
    throw new Error('Could not decrypt — wrong passphrase or corrupted value.');
  }
}
