/**
 * OpenAdapter for Codex - Configuration Manager
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME_DIR = os.homedir();
const CONFIG_DIR = path.join(HOME_DIR, '.openadapter-codex');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const CODEX_CONFIG_FILE = path.join(HOME_DIR, '.codex', 'config.toml');

const DEFAULT_CONFIG = {
  port: 29998,
  host: '127.0.0.1',
  openadapter_base_url: 'https://api.openadapter.in/v1',
  openadapter_api_key: process.env.OPENADAPTER_API_KEY || '',
  default_model: 'OA-Robin-Mini-Preview',
  timeout_ms: 120000,
  max_retries: 3,
  retry_delay_ms: 1000
};

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadConfig() {
  ensureDirSync(CONFIG_DIR);
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(cfg) {
  ensureDirSync(CONFIG_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

/**
 * Automatically configures ~/.codex/config.toml to register OpenAdapter provider
 */
function syncCodexConfig(port = 29998, defaultModel = 'oa-robin-mini-preview') {
  const codexDir = path.dirname(CODEX_CONFIG_FILE);
  ensureDirSync(codexDir);

  let content = '';
  if (fs.existsSync(CODEX_CONFIG_FILE)) {
    content = fs.readFileSync(CODEX_CONFIG_FILE, 'utf8');
  }

  const providerBlock = `
[model_providers.OpenAdapter]
name = "OpenAdapter"
base_url = "http://127.0.0.1:${port}/v1"
wire_api = "responses"
requires_openai_auth = false
`;

  // Check if OpenAdapter block already exists
  if (content.includes('[model_providers.OpenAdapter]')) {
    // Update base_url if port changed
    content = content.replace(
      /\[model_providers\.OpenAdapter\][\s\S]*?(?=\n\[|$)/,
      providerBlock.trim()
    );
  } else if (content.includes('[model_providers]')) {
    content = content.replace('[model_providers]', `[model_providers]\n${providerBlock.trim()}`);
  } else {
    content = `${content.trim()}\n\n${providerBlock.trim()}\n`;
  }

  fs.writeFileSync(CODEX_CONFIG_FILE, content, 'utf8');
  return CODEX_CONFIG_FILE;
}

module.exports = {
  CONFIG_DIR,
  CONFIG_FILE,
  CODEX_CONFIG_FILE,
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  syncCodexConfig
};
