/**
 * MIGL Sovereign Agent Hexagonal Daemon
 * Core spine for sovereign agent orchestration, events SSE, and tool dispatch.
 */

const http = require('http');

const PORT = process.env.PORT || 8099;

// In-memory subscriber list for ACP SSE Stream
const clients = [];

function broadcastSSE(event, data) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => client.write(message));
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Safe WHATWG URL parsing
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Health Check Endpoint
    if (pathname === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'HEALTHY',
            version: '2.0.0',
            subsystems: {
                acp_bridge: 'READY',
                proot_env: 'STANDALONE',
                mcp_gateway: 'STANDBY'
            },
            timestamp: Date.now()
        }));
        return;
    }

    // ACP Event Stream (Server-Sent Events)
    if (pathname === '/events' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);
        clients.push(res);

        req.on('close', () => {
            const index = clients.indexOf(res);
            if (index !== -1) {
                clients.splice(index, 1);
            }
        });
        return;
    }

    // Tool / Intent Dispatcher
    if (pathname === '/api/dispatch' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { intent, backend = 'opencode' } = payload;

                if (!intent || typeof intent !== 'string' || !intent.trim()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'INVALID_REQUEST',
                        error: 'intent must be a non-empty string'
                    }));
                    return;
                }

                // No executable backend adapter is configured yet in this repository.
                // Fail closed rather than claiming a false-green dispatch that never occurred.
                broadcastSSE('DISPATCH_REJECTED', {
                    intent,
                    backend,
                    reason: 'BACKEND_NOT_CONFIGURED',
                    timestamp: Date.now()
                });
                res.writeHead(501, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'BACKEND_NOT_CONFIGURED',
                    intent,
                    backend,
                    error: `No executable backend adapter is configured for backend '${backend}'; refusing to claim false dispatch.`
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'INVALID_REQUEST', error: err.message }));
            }
        });
        return;
    }

    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

if (require.main === module) {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`[✓] MIGL Sovereign Agent Hexagonal Daemon running on port ${PORT}`);
        console.log(`[✓] ACP SSE Stream available at http://localhost:${PORT}/events`);
    });
}

module.exports = { server, broadcastSSE, clients };
