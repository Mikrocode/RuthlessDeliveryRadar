import { describe, expect, it } from 'vitest';
import { AddressInfo } from 'node:net';
import { buildApp } from '../src/app.js';
import { initDatabase } from '../src/db/index.js';
import { AppConfig } from '../src/config.js';

describe('health endpoint', () => {
  it('returns ok true', async () => {
    const config: AppConfig = {
      githubOwner: 'dummy-owner',
      githubRepo: 'dummy-repo',
      githubToken: undefined,
      databasePath: ':memory:',
      port: 0,
    };

    const db = initDatabase(':memory:');
    const app = await buildApp(config, db);

    await app.listen({ port: 0 });
    const { port } = app.server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    expect(body).toEqual({ ok: true });

    await app.close();
  });
});
