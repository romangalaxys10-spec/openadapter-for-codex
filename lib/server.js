/**
 * OpenAdapter for Codex - High Performance Wire Protocol Gateway
 * 
 * Bridges OpenAI Codex CLI (/v1/responses) to OpenAdapter.ai (/v1/chat/completions)
 */

const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');
const { loadConfig } = require('./config');

function createServer(customConfig = {}) {
  const config = { ...loadConfig(), ...customConfig };

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Health & Info Endpoint
    if (pathname === '/' || pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'ok',
        service: 'OpenAdapter for Codex',
        version: '1.0.0',
        openadapter_base_url: config.openadapter_base_url,
        configured_key: Boolean(config.openadapter_api_key)
      }));
    }

    // Models Endpoint
    if (pathname === '/v1/models' && req.method === 'GET') {
      return handleModels(req, res, config);
    }

    // Responses Endpoint (Codex CLI Wire Protocol)
    if (pathname === '/v1/responses' && req.method === 'POST') {
      return handleResponses(req, res, config);
    }

    // Chat Completions Passthrough
    if (pathname === '/v1/chat/completions' && req.method === 'POST') {
      return handleChatCompletions(req, res, config);
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `Route not found: ${pathname}`, code: 404 } }));
  });

  return {
    server,
    listen: (port = config.port, host = config.host) => {
      return new Promise((resolve, reject) => {
        server.listen(port, host, (err) => {
          if (err) return reject(err);
          resolve({ port, host });
        });
      });
    },
    close: () => {
      return new Promise((resolve) => server.close(resolve));
    }
  };
}

function handleModels(req, res, config) {
  const actualModels = [
    "0G-DeepSeek-v4-Pro",
    "0G-DeepSeek-v4-Flash",
    "0G-DeepSeek-V3",
    "0G-GLM-5.2",
    "0G-GLM-5.1",
    "0G-GLM-5",
    "0GM-1.0-35B-A3B",
    "0G-Qwen3.7-max",
    "0G-Qwen3.6",
    "0G-Qwen-VL",
    "0g-minimax-m3",
    "OA-Robin-Mini-Preview",
    "Qwen2.5-Coder",
    "deepseek-ai/deepseek-v4-pro",
    "deepseek-ai/deepseek-v4-flash",
    "deepseek-ai/deepseek-coder-6.7b-instruct",
    "glm-5.2",
    "glm-5.1",
    "glm-5",
    "glm-4.7",
    "meta/llama-4-maverick-17b-128e-instruct",
    "meta/codellama-70b",
    "moonshotai/kimi-k2.6",
    "minimaxai/minimax-m3",
    "stepfun-ai/step-3.7-flash",
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "openai/gpt-oss-120b",
    "free/north-mini-code",
    "free/nemotron-3-nano-omni-30b-a3b-reasoning",
    "free/nemotron-3-super-120b-a12b",
    "free/nemotron-3-ultra-550b-a55b",
    "free/gemma-4-31b-it",
    "free/gpt-oss-20b"
  ];

  const modelsData = actualModels.map(id => ({
    id,
    object: 'model',
    created: 1710000000,
    owned_by: 'openadapter'
  }));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ object: 'list', data: modelsData }));
}

async function handleResponses(req, res, config) {
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(bodyStr || '{}');
      const messages = convertResponsesInputToMessages(payload);
      const targetModel = payload.model || config.default_model || 'oa-robin-mini-preview';

      const requestBody = {
        model: targetModel,
        messages,
        stream: true,
        temperature: payload.temperature !== undefined ? payload.temperature : 0.2
      };

      if (payload.tools && Array.isArray(payload.tools) && payload.tools.length > 0) {
        requestBody.tools = payload.tools;
      }

      const responseId = `resp_${crypto.randomUUID()}`;
      const itemId = `item_${crypto.randomUUID()}`;

      // Open SSE connection to Codex CLI
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });

      sendSSE(res, 'response.created', {
        response: {
          id: responseId,
          object: 'response',
          created_at: Math.floor(Date.now() / 1000),
          status: 'in_progress',
          model: targetModel,
          output: []
        }
      });

      sendSSE(res, 'response.output_item.added', {
        response_id: responseId,
        output_index: 0,
        item: {
          id: itemId,
          type: 'message',
          status: 'in_progress',
          role: 'assistant',
          content: []
        }
      });

      // Stream from OpenAdapter
      const apiKey = config.openadapter_api_key || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
      await streamFromOpenAdapter(config.openadapter_base_url, apiKey, requestBody, {
        onReasoning: (text) => {
          sendSSE(res, 'response.reasoning_text.delta', {
            response_id: responseId,
            item_id: itemId,
            output_index: 0,
            content_index: 0,
            delta: text
          });
        },
        onContent: (text) => {
          sendSSE(res, 'response.text.delta', {
            response_id: responseId,
            item_id: itemId,
            output_index: 0,
            content_index: 0,
            delta: text
          });
        },
        onToolCall: (toolCall) => {
          sendSSE(res, 'response.function_call_arguments.delta', {
            response_id: responseId,
            item_id: itemId,
            output_index: 0,
            call_id: toolCall.id,
            name: toolCall.function?.name,
            arguments: toolCall.function?.arguments
          });
        },
        onComplete: (totalTokens = 0) => {
          sendSSE(res, 'response.output_item.done', {
            response_id: responseId,
            output_index: 0,
            item: {
              id: itemId,
              type: 'message',
              status: 'completed',
              role: 'assistant'
            }
          });

          sendSSE(res, 'response.completed', {
            response: {
              id: responseId,
              status: 'completed',
              model: targetModel,
              usage: {
                total_tokens: totalTokens,
                input_tokens: Math.floor(totalTokens * 0.4),
                output_tokens: Math.floor(totalTokens * 0.6)
              }
            }
          });
          res.end();
        },
        onError: (err) => {
          sendSSE(res, 'error', {
            message: err.message || 'Error from OpenAdapter upstream',
            code: 500
          });
          res.end();
        }
      });

    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message } }));
      }
    }
  });
}

function handleChatCompletions(req, res, config) {
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', async () => {
    try {
      const apiKey = config.openadapter_api_key || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
      const targetUrl = new URL(`${config.openadapter_base_url.replace(/\/+$/, '')}/chat/completions`);
      
      const isHttps = targetUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const proxyReq = transport.request(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'OpenAdapter-Codex-Gateway/1.0'
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: `Proxy error: ${err.message}` } }));
      });

      proxyReq.write(bodyStr);
      proxyReq.end();
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: err.message } }));
    }
  });
}

function convertResponsesInputToMessages(payload) {
  const messages = [];

  // Base instructions / System prompt
  if (payload.instructions) {
    messages.push({ role: 'system', content: payload.instructions });
  }

  // Input history
  if (Array.isArray(payload.input)) {
    for (const item of payload.input) {
      if (item.type === 'message' || item.role) {
        let content = '';
        if (typeof item.content === 'string') {
          content = item.content;
        } else if (Array.isArray(item.content)) {
          content = item.content
            .map(c => typeof c === 'string' ? c : (c.text || c.input_text || ''))
            .join('\n');
        }
        messages.push({
          role: item.role || 'user',
          content: content || ''
        });
      }
    }
  }

  if (messages.length === 0) {
    messages.push({ role: 'user', content: 'Hello' });
  }

  return messages;
}

function streamFromOpenAdapter(baseUrl, apiKey, requestBody, callbacks) {
  return new Promise((resolve, reject) => {
    try {
      const targetUrl = new URL(`${baseUrl.replace(/\/+$/, '')}/chat/completions`);
      const isHttps = targetUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const req = transport.request(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'OpenAdapter-Codex-Gateway/1.0'
        }
      }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          let errBody = '';
          res.on('data', d => { errBody += d; });
          res.on('end', () => {
            const err = new Error(`OpenAdapter returned HTTP ${res.statusCode}: ${errBody}`);
            callbacks.onError(err);
            resolve();
          });
          return;
        }

        let buffer = '';
        let totalTokens = 0;
        let inReasoningBlock = false;

        res.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const choice = data.choices?.[0];
                if (!choice) continue;

                const delta = choice.delta || {};
                
                // Reasoning Delta (DeepSeek / Claude thinking)
                if (delta.reasoning_content || delta.reasoning) {
                  const reasoningText = delta.reasoning_content || delta.reasoning;
                  callbacks.onReasoning(reasoningText);
                  totalTokens += Math.ceil(reasoningText.length / 4);
                }

                // Text Content
                if (delta.content) {
                  let text = delta.content;
                  
                  // Extract <think> tags if model embeds inline reasoning
                  if (text.includes('<think>')) {
                    inReasoningBlock = true;
                    text = text.replace('<think>', '');
                  }
                  if (text.includes('</think>')) {
                    inReasoningBlock = false;
                    const parts = text.split('</think>');
                    if (parts[0]) callbacks.onReasoning(parts[0]);
                    if (parts[1]) callbacks.onContent(parts[1]);
                    continue;
                  }

                  if (inReasoningBlock) {
                    callbacks.onReasoning(text);
                  } else {
                    callbacks.onContent(text);
                  }
                  totalTokens += Math.ceil(text.length / 4);
                }

                // Tool Calls
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    callbacks.onToolCall(tc);
                  }
                }
              } catch (e) {
                // Ignore parse errors on partial frames
              }
            }
          }
        });

        res.on('end', () => {
          callbacks.onComplete(totalTokens);
          resolve();
        });
      });

      req.on('error', (err) => {
        callbacks.onError(err);
        resolve();
      });

      req.write(JSON.stringify(requestBody));
      req.end();
    } catch (err) {
      callbacks.onError(err);
      resolve();
    }
  });
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

module.exports = {
  createServer
};
