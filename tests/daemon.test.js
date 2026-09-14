const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { server } = require('../core-spine/daemon.js');

const TEST_PORT = 8099;

function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

test.before((t, done) => {
    server.listen(TEST_PORT, '127.0.0.1', done);
});

test.after((t, done) => {
    server.close(done);
});

test('GET /health returns 200 and healthy JSON payload', async () => {
    const res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/health',
        method: 'GET'
    });

    assert.strictEqual(res.statusCode, 200);
    assert.match(res.headers['content-type'], /application\/json/);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'HEALTHY');
    assert.strictEqual(body.version, '2.0.0');
    assert.strictEqual(body.subsystems.acp_bridge, 'READY');
});

test('OPTIONS / returns 204 for CORS preflight', async () => {
    const res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/health',
        method: 'OPTIONS'
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
});

test('POST /api/dispatch with valid JSON returns 200 and DISPATCHED status', async () => {
    const payload = JSON.stringify({
        intent: 'run_audit',
        backend: 'opencode',
        prompt: 'Audit core spine'
    });

    const res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/dispatch',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, payload);

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'DISPATCHED');
    assert.strictEqual(body.intent, 'run_audit');
    assert.ok(body.task_id.startsWith('task_'));
});

test('NEGATIVE MUTANT: POST /api/dispatch with malformed JSON returns 400', async () => {
    const malformed = '{ intent: broken, missing quotes }';

    const res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/dispatch',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(malformed)
        }
    }, malformed);

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error, 'Response must contain an error message');
});

test('NEGATIVE MUTANT: GET /nonexistent returns 404', async () => {
    const res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/random_non_existent_route',
        method: 'GET'
    });

    assert.strictEqual(res.statusCode, 404);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error, 'Endpoint not found');
});
