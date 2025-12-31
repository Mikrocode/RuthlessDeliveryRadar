import { createHash, randomBytes } from 'node:crypto';

export function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateVerifier(length = 64): string {
  const bytes = randomBytes(length);
  return base64UrlEncode(bytes);
}

export function generateChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}
