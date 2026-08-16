#!/usr/bin/env node

/**
 * OpenAdapter for Codex - CLI Utility
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const readline = require('readline');
const { spawn } = require('child_process');
const { loadConfig, saveConfig, syncCodexConfig, CONFIG_DIR } = require('../lib/config');
const { createServer } = require('../lib/server');

const PID_FILE = path.join(CONFIG_DIR, 'openadapter-codex.pid');
const LOG_FILE = path.join(CONFIG_DIR, 'openadapter-codex.log');

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command) {
    case 'start':
      await handleStart();
      break;
    case 'stop':
      await handleStop();
      break;
    case 'restart':
      await handleStop();
      await new Promise(r => setTimeout(r, 1000));
      await handleStart();
      break;
    case 'status':
      await handleStatus();
      break;
    case 'setup':
      await handleSetup();
      break;
    case 'set-key':
      handleSetKey(args[1]);
      break;
    case 'set-model':
      handleSetModel(args[1]);
      break;
    case 'test':
      await handleTest();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      printHelp();
      break;
  }
}

async function handleStart() {
  const config = loadConfig();
  const isForeground = args.includes('--foreground') || args.includes('-f');

  if (isForeground) {
    console.log(`\x1b[36m🚀 Starting OpenAdapter for Codex Gateway in foreground on port ${config.port}...\x1b[0m`);
    const app = createServer(config);
    await app.listen(config.port, config.host);
    syncCodexConfig(config.port, config.default_model);
    console.log(`\x1b[32m✔ OpenAdapter Gateway is listening at http://${config.host}:${config.port}\x1b[0m`);
    console.log(`\x1b[32m✔ Registered [model_providers.OpenAdapter] in ~/.codex/config.toml\x1b[0m`);
    console.log(`\x1b[90mPress Ctrl+C to stop\x1b[0m`);
    return;
  }

  // Check if already running
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    try {
      process.kill(pid, 0);
      console.log(`\x1b[33mℹ OpenAdapter for Codex is already running (PID: ${pid})\x1b[0m`);
      return;
    } catch (e) {
      // Process dead, remove stale pid
      fs.unlinkSync(PID_FILE);
    }
  }

  // Daemonize
  const out = fs.openSync(LOG_FILE, 'a');
  const err = fs.openSync(LOG_FILE, 'a');

  const child = spawn(process.execPath, [__filename, 'start', '--foreground'], {
    detached: true,
    stdio: ['ignore', out, err]
  });

  child.unref();
  fs.writeFileSync(PID_FILE, child.pid.toString(), 'utf8');

  console.log(`\x1b[32m✔ OpenAdapter for Codex started in background (PID: ${child.pid})\x1b[0m`);
  console.log(`\x1b[36m✔ Gateway URL: http://${config.host}:${config.port}\x1b[0m`);
  console.log(`\x1b[36m✔ Logs: ${LOG_FILE}\x1b[0m`);
}

async function handleStop() {
  if (!fs.existsSync(PID_FILE)) {
    console.log(`\x1b[33mℹ OpenAdapter for Codex is not running.\x1b[0m`);
    return;
  }

  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`\x1b[32m✔ Stopped OpenAdapter for Codex (PID: ${pid})\x1b[0m`);
  } catch (e) {
    console.log(`\x1b[33mℹ Process ${pid} was not running.\x1b[0m`);
  }

  try { fs.unlinkSync(PID_FILE); } catch (e) {}
}

async function handleStatus() {
  const config = loadConfig();
  let isRunning = false;
  let pid = null;

  if (fs.existsSync(PID_FILE)) {
    pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    try {
      process.kill(pid, 0);
      isRunning = true;
    } catch (e) {}
  }

  console.log(`\n\x1b[1m=== OpenAdapter for Codex Status ===\x1b[0m`);
  console.log(`Daemon State : ${isRunning ? '\x1b[32m● Running\x1b[0m (PID ' + pid + ')' : '\x1b[31m○ Stopped\x1b[0m'}`);
  console.log(`Port         : ${config.port}`);
  console.log(`Base URL     : ${config.openadapter_base_url}`);
  console.log(`API Key      : ${config.openadapter_api_key ? '\x1b[32mConfigured\x1b[0m (sk-oa-***' + config.openadapter_api_key.slice(-4) + ')' : '\x1b[33mMissing (run setup)\x1b[0m'}`);
  console.log(`Default Model: ${config.default_model}\n`);
}

async function handleSetup() {
  const config = loadConfig();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log(`\n\x1b[1;36m🌟 Welcome to OpenAdapter for Codex Setup 🌟\x1b[0m`);
  console.log(`\x1b[33m💡 Need an OpenAdapter key? Get 20% OFF coding plans (from $6.99/mo) at:\x1b[0m`);
  console.log(`\x1b[36m   https://dashboard.openadapter.in/?ref=BDPBCR3R (Code: BDPBCR3R)\x1b[0m\n`);
  
  const keyInput = await question(`Enter your OpenAdapter API Key [${config.openadapter_api_key ? 'Press Enter to keep current' : 'sk-oa-...' }]: `);
  if (keyInput.trim()) {
    config.openadapter_api_key = keyInput.trim();
  }

  const modelInput = await question(`Default Model [${config.default_model}]: `);
  if (modelInput.trim()) {
    config.default_model = modelInput.trim();
  }

  const portInput = await question(`Proxy Port [${config.port}]: `);
  if (portInput.trim()) {
    config.port = parseInt(portInput.trim(), 10) || config.port;
  }

  rl.close();

  saveConfig(config);
  syncCodexConfig(config.port, config.default_model);

  console.log(`\n\x1b[32m✔ Configuration saved to ~/.openadapter-codex/config.json\x1b[0m`);
  console.log(`\x1b[32m✔ Codex CLI configured in ~/.codex/config.toml\x1b[0m`);

  await handleStop();
  await handleStart();

  console.log(`\n\x1b[1;32m🎉 Setup complete! You can now launch Codex with OpenAdapter:\x1b[0m`);
  console.log(`\x1b[36m   codex\x1b[0m\n`);
}

function handleSetKey(key) {
  if (!key) {
    console.error(`\x1b[31mError: Please provide an API key: openadapter-codex set-key <KEY>\x1b[0m`);
    process.exit(1);
  }
  const config = loadConfig();
  config.openadapter_api_key = key.trim();
  saveConfig(config);
  console.log(`\x1b[32m✔ OpenAdapter API Key updated successfully.\x1b[0m`);
}

function handleSetModel(model) {
  if (!model) {
    console.error(`\x1b[31mError: Please provide a model name: openadapter-codex set-model <MODEL>\x1b[0m`);
    process.exit(1);
  }
  const config = loadConfig();
  config.default_model = model.trim();
  saveConfig(config);
  syncCodexConfig(config.port, config.default_model);
  console.log(`\x1b[32m✔ Default model set to '${model}'.\x1b[0m`);
}

async function handleTest() {
  const config = loadConfig();
  console.log(`\x1b[36m🧪 Testing OpenAdapter for Codex Gateway at http://${config.host}:${config.port}...\x1b[0m`);

  // 1. Health check
  try {
    const health = await httpGet(`http://${config.host}:${config.port}/health`);
    console.log(`\x1b[32m✔ Gateway Health Check Passed:\x1b[0m`, health);
  } catch (err) {
    console.log(`\x1b[31m✖ Gateway not reachable. Start it with 'openadapter-codex start'\x1b[0m`);
    return;
  }

  // 2. Models check
  try {
    const models = await httpGet(`http://${config.host}:${config.port}/v1/models`);
    console.log(`\x1b[32m✔ Models API Passed (Found ${models.data?.length || 0} models)\x1b[0m`);
  } catch (err) {
    console.log(`\x1b[31m✖ Models endpoint error:\x1b[0m`, err.message);
  }

  console.log(`\x1b[1;32m✔ End-to-end self-test completed!\x1b[0m`);
}

function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

function printHelp() {
  console.log(`
\x1b[1mOpenAdapter for Codex\x1b[0m - Run OpenAdapter.ai models inside OpenAI Codex CLI

\x1b[1mUsage:\x1b[0m
  openadapter-codex <command> [options]

\x1b[1mCommands:\x1b[0m
  setup               Interactive setup wizard for API key and models
  start               Start the background proxy daemon
  stop                Stop the running proxy daemon
  restart             Restart the proxy daemon
  status              Check daemon status, port, and key configuration
  set-key <KEY>       Update your OpenAdapter API key
  set-model <MODEL>   Change default model (e.g. oa-robin-mini-preview, claude-3-7-sonnet)
  test                Run self-test against the local gateway
  help                Show this help message

\x1b[1mExamples:\x1b[0m
  openadapter-codex setup
  openadapter-codex start
  openadapter-codex set-model claude-3-7-sonnet
  codex
`);
}

main().catch(err => {
  console.error('\x1b[31mFatal error:\x1b[0m', err.message);
  process.exit(1);
});
