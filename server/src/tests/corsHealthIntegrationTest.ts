import http from 'http';
import assert from 'assert';
import { app, server } from '../index.js';

async function runCorsHealthIntegrationTests() {
  console.log('\n=============================================================');
  console.log('  CIVICRESOLVE CORS & HEALTH ENDPOINT INTEGRATION SUITE');
  console.log('=============================================================\n');

  const port = (server.address() as any)?.port || 5000;
  const baseUrl = `http://127.0.0.1:${port}`;

  const tests = [
    {
      name: 'TEST-CORS-01: GET /api/health returns 200 OK with valid health schema',
      fn: async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.strictEqual(res.status, 200, `Expected HTTP 200, got ${res.status}`);
        const data: any = await res.json();
        assert.strictEqual(data.status, 'ok');
        assert.strictEqual(data.service, 'CivicResolve Backend API');
        assert.ok(data.timestamp);
        assert.ok(data.integrations);
        return `Health endpoint verified: status=${data.status}, uptime=${data.uptimeSeconds}s`;
      },
    },
    {
      name: 'TEST-CORS-02: OPTIONS Preflight from production frontend origin allows request',
      fn: async () => {
        const res = await fetch(`${baseUrl}/api/complaints`, {
          method: 'OPTIONS',
          headers: {
            Origin: 'https://civicresolve-7j40.onrender.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization',
          },
        });
        assert.strictEqual(res.status, 204, `Expected HTTP 204, got ${res.status}`);
        const allowOrigin = res.headers.get('access-control-allow-origin');
        assert.strictEqual(
          allowOrigin,
          'https://civicresolve-7j40.onrender.com',
          `Expected allow-origin https://civicresolve-7j40.onrender.com, got ${allowOrigin}`
        );
        const allowMethods = res.headers.get('access-control-allow-methods');
        assert.ok(allowMethods?.includes('POST'), `Expected POST in allowed methods, got ${allowMethods}`);
        assert.ok(allowMethods?.includes('OPTIONS'), `Expected OPTIONS in allowed methods, got ${allowMethods}`);
        const allowHeaders = res.headers.get('access-control-allow-headers');
        assert.ok(allowHeaders?.includes('Authorization'), `Expected Authorization in allowed headers, got ${allowHeaders}`);
        return `Preflight allowed: origin=${allowOrigin}, methods=${allowMethods}`;
      },
    },
    {
      name: 'TEST-CORS-03: GET request from production frontend origin includes CORS header',
      fn: async () => {
        const res = await fetch(`${baseUrl}/api/health`, {
          headers: {
            Origin: 'https://civicresolve-7j40.onrender.com',
          },
        });
        assert.strictEqual(res.status, 200);
        const allowOrigin = res.headers.get('access-control-allow-origin');
        assert.strictEqual(allowOrigin, 'https://civicresolve-7j40.onrender.com');
        return `CORS header present on GET: ${allowOrigin}`;
      },
    },
    {
      name: 'TEST-CORS-04: Non-browser request (no Origin header) succeeds without error',
      fn: async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.strictEqual(res.status, 200);
        const data: any = await res.json();
        assert.strictEqual(data.status, 'ok');
        return 'Server-to-server request without Origin header succeeded.';
      },
    },
    {
      name: 'TEST-CORS-05: Unauthorized Origin is rejected with HTTP 403 Forbidden',
      fn: async () => {
        const res = await fetch(`${baseUrl}/api/complaints`, {
          method: 'OPTIONS',
          headers: {
            Origin: 'https://unauthorized-malicious-site.example.com',
            'Access-Control-Request-Method': 'POST',
          },
        });
        assert.strictEqual(res.status, 403, `Expected HTTP 403, got ${res.status}`);
        const data: any = await res.json();
        assert.strictEqual(data.error?.code, 'CORS_ORIGIN_DENIED');
        assert.ok(data.error?.message?.includes('not allowed by CivicResolve API allowlist'));
        return `Unauthorized origin correctly rejected with HTTP 403: ${data.error.code}`;
      },
    },
  ];

  let passed = 0;
  for (const test of tests) {
    try {
      const msg = await test.fn();
      console.log(`[PASS] ${test.name}`);
      console.log(`       Evidence: ${msg}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${test.name}`);
      console.error(`       Error: ${err.message}`);
    }
  }

  console.log('\n=============================================================');
  console.log(`TEST SUMMARY: ${passed}/${tests.length} TESTS PASSED`);
  console.log('=============================================================\n');

  if (passed !== tests.length) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
  if (server && server.listening) {
    server.close();
  }
}

runCorsHealthIntegrationTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exitCode = 1;
});
