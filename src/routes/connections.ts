import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateChallenge, generateVerifier } from '../auth/pkce.js';
import { ConnectionMeta } from '../types/index.js';
import { deleteConnection, getConnection, upsertConnection } from '../db/connections.js';
import { generateState, consumeProviderSession, setProviderSession } from '../utils/session.js';

const jiraScopes = ['read:jira-work', 'read:jira-user'];
const gitlabScope = 'read_api';

const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

function isoNow(): string {
  return new Date().toISOString();
}

export async function connectionsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/connections', async (request, reply) => {
    const jira = getConnection(app.db, 'jira');
    const gitlab = getConnection(app.db, 'gitlab');

    return reply.view('connections', {
      title: 'RuthlessDeliveryRadar',
      subtitle: 'Connections',
      jira,
      gitlab,
    });
  });

  app.get('/auth/jira/start', async (request, reply) => {
    const { jiraClientId, jiraRedirectUri } = app.config;
    if (!jiraClientId || !jiraRedirectUri) {
      return reply.status(400).view('error', { message: 'Jira OAuth is not configured.' });
    }

    const state = generateState();
    const verifier = generateVerifier();
    const challenge = generateChallenge(verifier);

    setProviderSession(reply, request, 'jira', { state, verifier });

    const authorizeUrl = new URL('https://auth.atlassian.com/authorize');
    authorizeUrl.searchParams.set('audience', 'api.atlassian.com');
    authorizeUrl.searchParams.set('client_id', jiraClientId);
    authorizeUrl.searchParams.set('scope', jiraScopes.join(' '));
    authorizeUrl.searchParams.set('redirect_uri', jiraRedirectUri);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('code_challenge', challenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');

    return reply.redirect(authorizeUrl.toString());
  });

  app.get('/auth/jira/callback', async (request, reply) => {
    const parsed = callbackQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).view('error', { message: 'Invalid Jira callback parameters.' });
    }

    if (parsed.data.error) {
      return reply.status(400).view('error', { message: parsed.data.error_description || parsed.data.error });
    }

    const session = consumeProviderSession(reply, request, 'jira');
    if (!session || session.state !== parsed.data.state) {
      return reply.status(400).view('error', { message: 'Invalid OAuth state for Jira.' });
    }

    const { jiraClientId, jiraClientSecret, jiraRedirectUri } = app.config;
    if (!jiraClientId || !jiraClientSecret || !jiraRedirectUri) {
      return reply.status(400).view('error', { message: 'Jira OAuth is not configured.' });
    }

    const tokenResp = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: jiraClientId,
        client_secret: jiraClientSecret,
        code: parsed.data.code,
        redirect_uri: jiraRedirectUri,
        code_verifier: session.verifier,
      }),
    });

    if (!tokenResp.ok) {
      return reply.status(400).view('error', { message: 'Failed to exchange Jira code.' });
    }

    const tokenData = (await tokenResp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    const meta: ConnectionMeta = {};
    try {
      const siteResp = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (siteResp.ok) {
        const sites = (await siteResp.json()) as Array<{ id: string; name?: string }>;
        if (sites.length > 0) {
          meta.cloudId = sites[0].id;
          meta.siteName = sites[0].name;
          try {
            const issueResp = await fetch(
              `https://api.atlassian.com/ex/jira/${sites[0].id}/rest/api/3/search?jql=statusCategory!=Done&maxResults=5&fields=summary,status`,
              { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
            );
            if (issueResp.ok) {
              const payload = (await issueResp.json()) as { issues?: Array<{ fields?: { summary?: string; status?: { name?: string } }; key?: string }> };
              meta.issues =
                payload.issues?.map((issue) => ({
                  title: issue.fields?.summary ?? issue.key ?? 'Issue',
                  status: issue.fields?.status?.name,
                  url: meta.cloudId ? `https://api.atlassian.com/ex/jira/${meta.cloudId}/browse/${issue.key ?? ''}` : undefined,
                })) ?? [];
            }
          } catch (error) {
            // ignore best-effort issues lookup
          }
        }
      }
    } catch (error) {
      // ignore best-effort lookup
    }

    const now = isoNow();
    const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;

    upsertConnection(app.db, {
      provider: 'jira',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      meta_json: JSON.stringify(meta),
      connected_at: now,
      updated_at: now,
    });

    return reply.redirect('/connections');
  });

  app.post('/auth/jira/disconnect', async (_request, reply) => {
    deleteConnection(app.db, 'jira');
    return reply.redirect('/connections');
  });

  app.get('/auth/gitlab/start', async (request, reply) => {
    const { gitlabClientId, gitlabRedirectUri, gitlabBaseUrl } = app.config;
    if (!gitlabClientId || !gitlabRedirectUri) {
      return reply.status(400).view('error', { message: 'GitLab OAuth is not configured.' });
    }

    const state = generateState();
    const verifier = generateVerifier();
    const challenge = generateChallenge(verifier);
    setProviderSession(reply, request, 'gitlab', { state, verifier });

    const authorizeUrl = new URL('/oauth/authorize', gitlabBaseUrl);
    authorizeUrl.searchParams.set('client_id', gitlabClientId);
    authorizeUrl.searchParams.set('redirect_uri', gitlabRedirectUri);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('scope', gitlabScope);
    authorizeUrl.searchParams.set('code_challenge', challenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');

    return reply.redirect(authorizeUrl.toString());
  });

  app.get('/auth/gitlab/callback', async (request, reply) => {
    const parsed = callbackQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).view('error', { message: 'Invalid GitLab callback parameters.' });
    }

    if (parsed.data.error) {
      return reply.status(400).view('error', { message: parsed.data.error_description || parsed.data.error });
    }

    const session = consumeProviderSession(reply, request, 'gitlab');
    if (!session || session.state !== parsed.data.state) {
      return reply.status(400).view('error', { message: 'Invalid OAuth state for GitLab.' });
    }

    const { gitlabClientId, gitlabClientSecret, gitlabRedirectUri, gitlabBaseUrl } = app.config;
    if (!gitlabClientId || !gitlabClientSecret || !gitlabRedirectUri) {
      return reply.status(400).view('error', { message: 'GitLab OAuth is not configured.' });
    }

    const tokenResp = await fetch(new URL('/oauth/token', gitlabBaseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: gitlabClientId,
        client_secret: gitlabClientSecret,
        code: parsed.data.code,
        grant_type: 'authorization_code',
        redirect_uri: gitlabRedirectUri,
        code_verifier: session.verifier,
      }),
    });

    if (!tokenResp.ok) {
      return reply.status(400).view('error', { message: 'Failed to exchange GitLab code.' });
    }

    const tokenData = (await tokenResp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    };

    const meta: ConnectionMeta = {};
    try {
      const userResp = await fetch(new URL('/api/v4/user', gitlabBaseUrl).toString(), {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userResp.ok) {
        const user = (await userResp.json()) as { id: number; username?: string };
        meta.gitlabUserId = user.id;
        meta.gitlabUsername = user.username;
      }
      try {
        const issuesResp = await fetch(new URL('/api/v4/issues?per_page=5&state=opened', gitlabBaseUrl).toString(), {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (issuesResp.ok) {
          const issues = (await issuesResp.json()) as Array<{ title: string; state?: string; web_url?: string }>;
          meta.issues = issues.map((i) => ({ title: i.title, status: i.state, url: i.web_url }));
        }
      } catch (error) {
        // ignore best-effort issues lookup
      }
    } catch (error) {
      // ignore best-effort lookup
    }

    const now = isoNow();
    const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;

    upsertConnection(app.db, {
      provider: 'gitlab',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      meta_json: JSON.stringify(meta),
      connected_at: now,
      updated_at: now,
    });

    return reply.redirect('/connections');
  });

  app.post('/auth/gitlab/disconnect', async (_request, reply) => {
    deleteConnection(app.db, 'gitlab');
    return reply.redirect('/connections');
  });
}
