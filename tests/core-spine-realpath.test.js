'use strict';

const assert = require('assert');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(err => err ? reject(err) : resolve(port));
    });
  });
}

function request(port, method, route, body) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? null : Buffer.from(body);
    const req = http.request({
      host: '127.0.0.1',
      port,
      method,
      path: route,
      headers: payload ? {
        'content-type': 'application/json',
        'content-length': payload.length
      } : {}
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(1000, () => req.destroy(new Error('request timeout')));
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitHealthy(port, child) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`daemon exited early with code ${child.exitCode}`);
    }
    try {
      const response = await request(port, 'GET', '/health');
      if (response.status === 200) return;
    } catch (_) {
      // Bounded startup polling only.
    }
    await new Promise(resolve => setTimeout(resolve, 75));
  }
  throw new Error('daemon did not become healthy within 5s');
}

async function main() {
  const port = await freePort();
  const daemonPath = path.join(__dirname, '..', 'core-spine', 'daemon.js');
  const child = spawn(process.execPath, [daemonPath], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });

  try {
    await waitHealthy(port, child);

    let response = await request(port, 'GET', '/health');
    assert.strictEqual(response.status, 200);
    const health = JSON.parse(response.body);
    assert.strictEqual(health.status, 'HEALTHY');
    assert.strictEqual(health.version, '2.0.0');

    response = await request(port, 'GET', '/definitely-missing');
    assert.strictEqual(response.status, 404);
    assert.match(response.body, /Endpoint not found/);

    response = await request(port, 'POST', '/api/dispatch', '{not-json');
    assert.strictEqual(response.status, 400);
    assert.strictEqual(JSON.parse(response.body).status, 'INVALID_REQUEST');

    // Negative mutant: missing intent must return 400 INVALID_REQUEST
    response = await request(
      port,
      'POST',
      '/api/dispatch',
      JSON.stringify({ backend: 'opencode' })
    );
    assert.strictEqual(response.status, 400);
    assert.strictEqual(JSON.parse(response.body).status, 'INVALID_REQUEST');

    // Unconfigured backend must FAIL CLOSED with 501 BACKEND_NOT_CONFIGURED
    response = await request(
      port,
      'POST',
      '/api/dispatch',
      JSON.stringify({ intent: 'smoke', backend: 'opencode', prompt: 'noop' })
    );
    assert.strictEqual(response.status, 501);
    const dispatch = JSON.parse(response.body);
    assert.strictEqual(dispatch.status, 'BACKEND_NOT_CONFIGURED');
    assert.strictEqual(dispatch.intent, 'smoke');
    assert.strictEqual(dispatch.backend, 'opencode');
    assert.match(dispatch.error, /refusing to claim false dispatch/);
  } finally {
    if (child.exitCode === null) child.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => child.once('exit', resolve)),
      new Promise((_, reject) => setTimeout(
        () => reject(new Error('daemon failed to terminate within 2s')),
        2000
      ))
    ]);
  }

  assert.throws(() => process.kill(child.pid, 0));
  if (stderr) process.stderr.write(stderr);
  console.log('core-spine real-path contract: PASS (Fail-Closed Verified)');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
