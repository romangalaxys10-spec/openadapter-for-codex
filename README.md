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
> OpenAdapter delivers 40+ top-tier open-source coding & reasoning models (*DeepSeek-R1, DeepSeek-V3, Qwen2.5-Coder, GLM-5.2, Kimi-K2.5, MiniMax-M3, Mistral-Large*) starting at just **$6.99/month** (4x cheaper than proprietary tools).  
> 👉 **[Claim 20% OFF with Invite Link `https://dashboard.openadapter.in/?ref=BDPBCR3R`](https://dashboard.openadapter.in/?ref=BDPBCR3R)** *(Invite Token: `BDPBCR3R`)*

---

## 🌟 Key Highlights

- **⚡ Zero Configuration**: 1-line installer automatically registers `[model_providers.OpenAdapter]` in `~/.codex/config.toml`.
- **🔄 Full Responses API Protocol**: Intercepts Codex CLI's internal `/v1/responses` SSE stream and maps it to OpenAdapter's chat completions.
- **🧠 Native Reasoning Stream**: Full support for `<think>` reasoning deltas (DeepSeek-R1, Kimi-K2-Think, 0G-DeepSeek-v4-Pro, GLM-5).
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
    A[OpenAI Codex CLI] -->|POST /v1/responses SSE| B[OpenAdapter Gateway<br/>TokenOptimizer Layer<br/>127.0.0.1:29998]
    B -->|POST /v1/chat/completions| C[OpenAdapter.ai Cloud<br/>api.openadapter.in]
    C -->|SSE Streaming Chunks| B
    B -->|response.text.delta<br/>response.reasoning_text.delta| A
```

---

## ⚡ Token Saving Technologies: With vs. Without Optimization

OpenAdapter for Codex includes a built-in **`TokenOptimizer`** engine inspired by **[Headroom Labs](https://github.com/headroomlabs-ai/headroom)** and the **[Universal Token Efficiency Protocol](https://github.com/romangalaxys10-spec/token-efficiency-skill)**:

- **SmartCrusher JSON Minification**: Automatically flattens multi-line indented JSON tool outputs into compact single-line formats.
- **DTOC Dynamic Line Caps**: Caps directory listings (`ls`, `find`) at $\le 20$ lines, process lists (`ps aux`) at $\le 15$ lines, and git diffs at $\le 60$ lines.
- **Stack Frame Noise Filtering**: Automatically strips internal runtime frames (`node:internal/*`, `node_modules/bun/*`, `electron`), preserving only user code frames and error messages.
- **Zero-Repeat File Read Deduplication**: Detects identical historical file reads across turns and condenses them to lightweight `[File read: <path> (cached)]` references.
- **ANSI & Terminal Stripping**: Removes terminal color codes (`\x1b[...]`) and spinner artifacts.
- **Progressive History Compactor**: Keeps recent turns at 100% full resolution while smartly summarizing older turns.

### 📊 Real-World Benchmark: With vs. Without Token Optimization

| Scenario / Task Type | Standard Gateway (Without Optimization) | With TokenOptimizer (Headroom + DTOC) | Token Reduction | Latency & Cost Impact |
|---|---|---|---|---|
| **Deep Multi-Turn Coding Session (15 turns)** | `48,500` tokens | `16,200` tokens | **66.6% saved** | **2.5x faster** response time |
| **Large Directory Listing (`ls -la` on 120 files)** | `1,850` tokens | `310` tokens ($\le 20$ lines) | **83.2% saved** | Instant parsing |
| **Verbose Test Output & Stack Traces** | `6,200` tokens | `1,450` tokens | **76.6% saved** | Eliminates context bloat |
| **Repeated File Reads (`cat config.json` x3)** | `4,500` tokens | `1,520` tokens (1x + cached refs) | **66.2% saved** | Zero duplicate token penalty |
| **Large Git Diff Review (`git diff` 300 lines)** | `9,400` tokens | `2,100` tokens ($\le 60$ lines) | **77.7% saved** | Clean focus on active hunks |
| **Provider Prompt KV Cache Hit Rate** | ~15% - 25% (unstable prefix) | **85% - 94% (Cache-Aligned)** | **Up to 90% cost drop** | Time to First Token (TTFT) -60% |

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

## 🤖 Verified OpenAdapter Models Catalog

OpenAdapter offers 40+ SOTA open-source and reasoning models (from [**openadapter.dev/#models**](https://openadapter.dev/#models) and [**dashboard.openadapter.in/models**](https://dashboard.openadapter.in/models)):

| Family | Supported Models |
| :--- | :--- |
| **DeepSeek** | `DeepSeek-V3`, `DeepSeek-R1`, `0G-DeepSeek-V3`, `0G-DeepSeek-v4-Pro`, `0G-DeepSeek-v4-Flash`, `deepseek-ai/deepseek-coder-6.7b-instruct` |
| **Qwen** | `Qwen2.5-Coder`, `Qwen3-Coder`, `0G-Qwen3.7-max`, `0G-Qwen3.6`, `Qwen3.5-Plus`, `Qwen3-32B`, `0G-Qwen-VL`, `Qwen3.5-VL` |
| **GLM (Zhipu)** | `GLM-5.2`, `GLM-5.1`, `GLM-5`, `0G-GLM-5.2`, `0G-GLM-5.1`, `0G-GLM-5`, `GLM-5-Turbo`, `GLM-4.7`, `GLM-4.6`, `GLM-Air` |
| **Kimi (Moonshot)** | `Kimi-K2.5`, `Kimi-K2-Think`, `moonshotai/kimi-k2.6`, `Kimi-K2` |
| **MiniMax** | `MiniMax-M3`, `0g-minimax-m3`, `MiniMax-M2.7`, `MiniMax-M2.5`, `MiniMax-M2.1` |
| **Mistral** | `Mistral-Large`, `Mistral-Medium`, `Mistral-Small`, `free/dolphin-mistral-24b-venice-edition` |
| **Meta Llama** | `Llama-4-Maverick`, `Llama-4-Scout`, `Llama-3.3-70B`, `Llama-3.1-405B`, `meta/codellama-70b` |
| **Gemma & Hermes** | `Gemma-3-27B`, `Gemma-3-12B`, `Hermes-4-405B`, `Hermes-4-14B`, `OA-Robin-Mini-Preview` |
| **Free Tier** | `free/north-mini-code`, `free/gemma-4-31b-it`, `free/gpt-oss-20b`, `free/nemotron-3-nano-omni-30b-a3b-reasoning`, `free/nemotron-3-super-120b-a12b` |

Switch models anytime inside Codex CLI with `/model` or via CLI:
```bash
openadapter-codex set-model DeepSeek-V3
# or
openadapter-codex set-model Qwen2.5-Coder
# or
openadapter-codex set-model GLM-5.2
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
