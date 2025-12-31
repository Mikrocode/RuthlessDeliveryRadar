import { randomBytes } from 'node:crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

const COOKIE_NAME = 'rdr_session';

type ProviderSession = {
  state: string;
  verifier: string;
};

type SessionData = {
  jira?: ProviderSession;
  gitlab?: ProviderSession;
};

export function loadSession(request: FastifyRequest): SessionData {
  const raw = (request.cookies?.[COOKIE_NAME] as string | undefined) ?? '';
  if (!raw) return {};

  try {
    return JSON.parse(raw) as SessionData;
  } catch (error) {
    return {};
  }
}

export function saveSession(reply: FastifyReply, session: SessionData): void {
  reply.setCookie(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function generateState(): string {
  return randomBytes(16).toString('hex');
}

export function setProviderSession(
  reply: FastifyReply,
  request: FastifyRequest,
  provider: 'jira' | 'gitlab',
  data: ProviderSession,
): void {
  const session = loadSession(request);
  session[provider] = data;
  saveSession(reply, session);
}

export function consumeProviderSession(
  reply: FastifyReply,
  request: FastifyRequest,
  provider: 'jira' | 'gitlab',
): ProviderSession | null {
  const session = loadSession(request);
  const providerSession = session[provider];
  if (!providerSession) return null;

  delete session[provider];
  saveSession(reply, session);
  return providerSession;
}
