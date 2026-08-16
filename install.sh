#!/usr/bin/env bash

# ==============================================================================
#  OpenAdapter for Codex - 1-Line Installer
#  Supports: Linux, macOS, Windows WSL
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ___                   _       _             _             "
echo " / _ \ _ __   ___ _ __ / \   __| | __ _ _ __ | |_ ___ _ __  "
echo "| | | | '_ \ / _ \ '_ // _ \ / _\` |/ _\` | '_ \| __/ _ \ '__| "
echo "| |_| | |_) |  __/ | // ___ \ (_| | (_| | |_) | ||  __/ |    "
echo " \___/| .__/ \___|_|//_/   \_\__,_|\__,_| .__/ \__\___|_|    "
echo "      |_|                               |_|   for OpenAI Codex"
echo -e "${NC}"
echo -e "${GREEN}Connecting OpenAdapter.ai models to OpenAI Codex CLI seamlessly!${NC}\n"

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Node.js is not installed.${NC} Installing Node.js via NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 22
    nvm use 22
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${YELLOW}Warning: Node.js version is < 18. Recommended version is Node 18+.${NC}"
fi

# 2. Target Directory
INSTALL_DIR="$HOME/.openadapter-codex/app"
mkdir -p "$INSTALL_DIR"

echo -e "${CYAN}→ Downloading latest OpenAdapter for Codex...${NC}"
if command -v git >/dev/null 2>&1; then
    if [ -d "$INSTALL_DIR/.git" ]; then
        cd "$INSTALL_DIR" && git pull --quiet origin main || true
    else
        rm -rf "$INSTALL_DIR"
        git clone --quiet https://github.com/romangalaxys10-spec/openadapter-for-codex.git "$INSTALL_DIR"
    fi
else
    curl -fsSL https://github.com/romangalaxys10-spec/openadapter-for-codex/archive/refs/heads/main.tar.gz | tar -xz -C "$INSTALL_DIR" --strip-components=1
fi

chmod +x "$INSTALL_DIR/bin/cli.js"

# 3. Create Symlinks in PATH
BIN_TARGET="$HOME/.local/bin"
mkdir -p "$BIN_TARGET"
ln -sf "$INSTALL_DIR/bin/cli.js" "$BIN_TARGET/openadapter-codex"
ln -sf "$INSTALL_DIR/bin/cli.js" "$BIN_TARGET/oa-codex"

# Try /usr/local/bin if writable or with sudo if available
if [ -w "/usr/local/bin" ]; then
    ln -sf "$INSTALL_DIR/bin/cli.js" "/usr/local/bin/openadapter-codex" || true
    ln -sf "$INSTALL_DIR/bin/cli.js" "/usr/local/bin/oa-codex" || true
fi

# Ensure ~/.local/bin is in PATH for current shell
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    export PATH="$HOME/.local/bin:$PATH"
    # Append to bashrc / zshrc
    if [ -n "$BASH_VERSION" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    if [ -f "$HOME/.zshrc" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
    fi
fi

# 4. Check API Key
if [ -n "$OPENADAPTER_API_KEY" ]; then
    "$INSTALL_DIR/bin/cli.js" set-key "$OPENADAPTER_API_KEY"
fi

# 5. Start Background Daemon
"$INSTALL_DIR/bin/cli.js" start

echo -e "\n${GREEN}✔ Installation successful!${NC}"
echo -e "You can now run:"
echo -e "  ${CYAN}openadapter-codex status${NC}  - Check gateway status"
echo -e "  ${CYAN}openadapter-codex setup${NC}   - Configure your API key & default model"
echo -e "  ${CYAN}codex${NC}                     - Launch OpenAI Codex CLI\n"
