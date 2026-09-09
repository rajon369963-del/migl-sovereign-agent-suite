# ⚡ MIGL Sovereign Agent Suite — 100 Superpower Open-Source Wheels Monorepo

> **Autonomous Sovereign Developer Architecture**: A production-grade fusion of the world's 100 most powerful open-source AI developer tools, headless coding engines, AST intelligence kernels, and mobile runtimes into a unified hexagonal ecosystem.

---

## 🌟 Architectural Overview: The 7 Sovereign Pillars

```
+-----------------------------------------------------------------------------------+
|                           CLIENT LAYER (FRONTENDS)                                |
|  - Android Native App (Jetpack Compose + Termux PRoot + ACP SSE)                  |
|  - Web Console (Cinematic Glassmorphism UI + ttyd Linux PTY Terminal)             |
|  - Terminal CLI (agy / opencode / aider / tmux)                                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                    HEXAGONAL PORTS & ADAPTERS CORE SPINE                          |
|  - Central IPC Daemon (Port 8080: ACP SSE, Event Bus, Intent Router)              |
|  - Multi-LLM Router (LiteLLM: Anthropic, Gemini, OpenAI, Ollama, Local VLLM)      |
|  - Distributed Saga Orchestrator (Temporal.io workflow durability & rollbacks)    |
+-----------------------------------------------------------------------------------+
            |                               |                              |
            v                               v                              v
+-----------------------+       +-----------------------+      +--------------------+
|  PILLAR 1: AGENT RUN  |       |  PILLAR 2: CODE INTEL |      |  PILLAR 3: STORAGE |
| - OpenCode (port 4096)|       | - Tree-sitter AST     |      | - DuckDB Columnar  |
| - Aider (git & diff)  |       | - ast-grep structural |      | - SQLite FTS5 BM25 |
| - OpenHands Docker    |       | - Universal Ctags     |      | - USearch Vectors  |
| - PyperCode REPL      |       | - Semgrep Security    |      | - LanceDB Embeds   |
+-----------------------+       +-----------------------+      +--------------------+
```

---

## 📱 Mobile Architecture: Standalone Antigravity on Android

The system ports Google Antigravity and open-source headless coding agents directly onto unmodified Android devices (Android 12–15, ARM64-v8a):
1. **Unprivileged PRoot Isolation**: Runs standard Debian/Ubuntu rootfs inside Termux without requiring root permissions.
2. **TCMalloc 39-bit Virtual Address Fix**: Bypasses the ARM64 virtual address space mismatch (`PROOT_LOADER_32BIT=0`, `PROOT_NO_SECCOMP=1`).
3. **big.LITTLE Thermal Scheduling**: Restricts heavy compiler runs to cores 0–5 (`taskset -c 0-5`) to eliminate Android thermal throttling.
4. **Agent Client Protocol (ACP)**: Direct SSE streaming from the local daemon into a native Jetpack Compose mobile interface with expandable tool cards.

---

## 🚀 Quick Start

### 1. Run on Android (Termux)
```bash
pkg install -y git curl
git clone https://github.com/rajon369963-del/migl-sovereign-agent-suite.git
cd migl-sovereign-agent-suite
bash scripts/setup-android-termux.sh
~/start-sovereign-suite.sh
```

### 2. Run on macOS / Linux
```bash
node core-spine/daemon.js
# Open http://localhost:8080/health in browser
```

---

## 📂 Repository Structure

- `core-spine/`: Hexagonal router, ACP event stream, and multi-model dispatchers.
- `scripts/`: Automated installation scripts for Android Termux, macOS, and Linux.
- `100_SUPERPOWER_WHEELS_BLUEPRINT.md`: Full catalog of 100 integrated open-source tools.
- `ANDROID_STANDALONE_SPEC.md`: Reverse engineering analysis and mobile virtualization blueprint.
- `.github/workflows/`: Automated CI workflows for building Android APKs and testing daemon pipelines.

---

## 📜 Provenance & Canonical Synchronization
- **Author**: Antigravity Autonomous Pair Programmer for Rajon Das (`lakhidas168@gmail.com`).
- **Canonical Drive Target**: `gdrive:MIGL_CANONICAL_SHARED_BRAIN/01_PROJECT_SEEDS/STANDALONE_ANTIGRAVITY_ANDROID`.
- **License**: Apache 2.0 / MIT Open Source.
