export default async function handler(req, res) {
  try {
    const apiKey = process.env.DOUBAO_API_KEY;
    const baseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';

    if (!apiKey) {
      res.status(500).json({ error: 'Server missing DOUBAO_API_KEY' });
      return;
    }

    // Extract subpath after /api/doubao
    const url = req.url || '';
    const match = url.match(/\/api\/doubao\/?(.*)$/);
    const subPath = (match && match[1]) ? match[1] : '';
    const targetUrl = `${baseUrl}/${subPath || ''}`.replace(/\/$/, '');

    // Forward method, headers, and body (JSON) to Doubao Ark API
    const method = req.method || 'POST';

    // Read the JSON body
    let payload = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        payload = req.body && Object.keys(req.body).length ? req.body : await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', chunk => { data += chunk; });
          req.on('end', () => {
            try { resolve(data ? JSON.parse(data) : undefined); } catch (e) { reject(e); }
          });
          req.on('error', reject);
        });
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON body', details: String(e) });
        return;
      }
    }

    const forwardRes = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: (method !== 'GET' && method !== 'HEAD' && payload) ? JSON.stringify(payload) : undefined
    });

    const contentType = forwardRes.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (contentType.includes('application/json')) {
      const data = await forwardRes.json();
      res.status(forwardRes.status).json(data);
      return;
    }

    const text = await forwardRes.text();
    res.status(forwardRes.status).send(text);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: String(error) });
  }
}
