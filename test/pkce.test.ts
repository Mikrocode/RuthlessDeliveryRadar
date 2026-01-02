import { describe, expect, it } from 'vitest';
import { generateChallenge, generateVerifier, base64UrlEncode } from '../src/auth/pkce.js';
import { createHash } from 'node:crypto';

describe('pkce helpers', () => {
  it('creates a base64url-encoded challenge from verifier', () => {
    const verifier = generateVerifier(64);
    const challenge = generateChallenge(verifier);
    const expected = base64UrlEncode(createHash('sha256').update(verifier).digest());
    expect(challenge).toEqual(expected);
    expect(challenge).not.toContain('+');
    expect(challenge).not.toContain('/');
    expect(challenge.endsWith('=')).toBe(false);
  });
});
