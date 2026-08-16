# ⚡ OpenAdapter for Codex

> **Run OpenAdapter.ai models inside OpenAI Codex CLI with zero setup.**  
> Seamless `/v1/responses` SSE wire protocol translation, reasoning token streaming, and automatic Codex configuration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js: >=18](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![Platform: Linux | macOS | WSL](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20WSL-purple.svg)](https://openadapter.ai)
[![OpenAdapter](https://img.shields.io/badge/Provider-OpenAdapter.ai-orange.svg)](https://openadapter.ai)
[![20% OFF OpenAdapter](https://img.shields.io/badge/Promo-20%25%20OFF%20Coding%20Plans%20(from%20%246.99)-FF5722?style=for-the-badge&logo=openai&logoColor=white)](https://dashboard.openadapter.in/?ref=BDPBCR3R)

> [!TIP]
> ### 🎁 Exclusive Community Promo: 20% OFF OpenAdapter Coding Plans!
> OpenAdapter delivers top-tier coding models (*Claude 3.7 Sonnet, DeepSeek-R1, GPT-5.5, Gemini 2.5 Pro*) starting at just **$6.99/month**.  
> 👉 **[Claim 20% OFF with Invite Link `https://dashboard.openadapter.in/?ref=BDPBCR3R`](https://dashboard.openadapter.in/?ref=BDPBCR3R)** *(Referral Code: `BDPBCR3R`)*

---

## 🌟 Key Highlights

- **⚡ Zero Configuration**: 1-line installer automatically registers `[model_providers.OpenAdapter]` in `~/.codex/config.toml`.
- **🔄 Full Responses API Protocol**: Intercepts Codex CLI's internal `/v1/responses` SSE stream and maps it to OpenAdapter's chat completions.
- **🧠 Native Reasoning Stream**: Full support for `<think>` reasoning deltas (DeepSeek-R1, Claude 3.7 Sonnet thinking mode).
- **🪶 Ultra-Lightweight**: Built with pure native Node.js stdlib (Zero npm runtime dependencies, ~15MB RAM footprint).
- **🛠️ Cross-Platform**: Runs on Linux (systemd / background daemon), macOS (launchd / background), and Windows WSL.

---

## 🚀 Quick Start (1-Line Install)

Run the installer in your terminal (Linux, macOS, or Windows WSL):

```bash
curl -fsSL https://raw.githubusercontent.com/romangalaxys10-spec/openadapter-for-codex/main/install.sh | bash
```

### Or Manual Setup

```bash
# 1. Clone repository
git clone https://github.com/romangalaxys10-spec/openadapter-for-codex.git ~/.openadapter-codex/app

# 2. Run setup wizard
~/.openadapter-codex/app/bin/cli.js setup

# 3. Launch Codex CLI
codex
```

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A[OpenAI Codex CLI] -->|POST /v1/responses SSE| B[OpenAdapter Gateway<br/>127.0.0.1:29998]
    B -->|POST /v1/chat/completions| C[OpenAdapter.ai Cloud<br/>api.openadapter.ai]
    C -->|SSE Streaming Chunks| B
    B -->|response.text.delta<br/>response.reasoning_text.delta| A
```

---

## 💻 CLI Commands

Manage the OpenAdapter gateway easily with the included CLI:

| Command | Description |
| :--- | :--- |
| `openadapter-codex setup` | Interactive setup wizard (sets API key, model, port) |
| `openadapter-codex start` | Start the gateway in the background |
| `openadapter-codex stop` | Stop the background gateway |
| `openadapter-codex status` | Check gateway health, listening port, and API key |
| `openadapter-codex set-key <KEY>` | Update your OpenAdapter API key (`sk-oa-...`) |
| `openadapter-codex set-model <NAME>` | Change default model (e.g. `oa-robin-mini-preview`) |
| `openadapter-codex test` | Run local self-test and connectivity check |

---

## 🤖 Supported OpenAdapter Models

You can use any model available on your OpenAdapter.ai account:

- `oa-robin-mini-preview` (Fast coding assistant)
- `claude-3-7-sonnet` (Hybrid reasoning)
- `claude-3-5-sonnet`
- `deepseek-v3` / `deepseek-r1`
- `gemini-2.5-pro` / `gemini-2.5-flash`
- `gpt-5.5` / `gpt-5` / `gpt-4o`
- `qwen-2.5-coder-32b`

Switch models at any time inside Codex CLI using `/model` or via:
```bash
openadapter-codex set-model claude-3-7-sonnet
```

---

## ⚙️ Codex Configuration (`~/.codex/config.toml`)

The installer automatically configures your `~/.codex/config.toml`:

```toml
model_provider = "OpenAdapter"
model = "oa-robin-mini-preview"

[model_providers.OpenAdapter]
name = "OpenAdapter"
base_url = "http://127.0.0.1:29998/v1"
wire_api = "responses"
requires_openai_auth = false
```

---

## 📄 License

MIT License. Designed and maintained for the [OpenAdapter.ai](https://openadapter.ai) community.
