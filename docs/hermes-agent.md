# Hermes Agent Integration

## Tổng quan

Project SSO tích hợp [Hermes Agent](https://github.com/NousResearch/hermes-agent) - self-improving AI agent với built-in learning loop. Kết hợp với CodeGraph MCP cho codebase intelligence.

## Cách khởi động

### Cách 1: Dùng launcher script (recommended)

```cmd
cd c:\VietProDev\sso-vietprodev
hermes-sso.bat
```

### Cách 2: Dùng Hermes trực tiếp

```cmd
"C:\Users\onoso\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" ^
  "C:\Users\onoso\AppData\Local\hermes\hermes-agent\cli.py"
```

### Cách 3: Sau khi Hermes được PATH

```cmd
hermes
```

## Configuration

- **Config file:** `~/.hermes/config.yaml`
- **Env file:** `~/.hermes/.env` (API keys)
- **Personality:** `~/.hermes/SOUL.md`

## MCP Servers

### CodeGraph (pre-configured)

Đã cấu hình trong `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  codegraph:
    command: "codegraph"
    args: ["serve", "--mcp", "--path", "C:\\VietProDev\\sso-vietprodev"]
```

CodeGraph tools khả dụng trong Hermes:
- `mcp_codegraph_codegraph_explore`
- `mcp_codegraph_codegraph_search`
- `mcp_codegraph_codegraph_callers`
- `mcp_codegraph_codegraph_callees`
- `mcp_codegraph_codegraph_impact`
- `mcp_codegraph_codegraph_node`
- `mcp_codegraph_codegraph_files`
- `mcp_codegraph_codegraph_status`

### Thêm MCP servers khác

```bash
hermes mcp catalog     # Xem danh sách approved MCPs
hermes mcp install <name>  # Cài đặt một MCP
```

## Context Files

Hermes tự động load các context files từ project root:

| File | Priority | Purpose |
|------|----------|---------|
| `AGENTS.md` | Highest | Project instructions, architecture, conventions |

`AGENTS.md` đã được tạo cho project này - chứa architecture overview, conventions, và important notes.

## Provider Setup

### Recommended: Nous Portal

```bash
hermes setup --portal
```

Đăng nhập OAuth, cấu hình tất cả providers trong 1 lần.

### Manual

Điền API keys vào `~/.hermes/.env`:

```bash
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# OPENROUTER_API_KEY=sk-or-...
# NOUS_PORTAL_API_KEY=...
```

Sau đó chạy:

```bash
hermes model
# Chọn provider và model
```

## CLI Commands

```bash
hermes              # Interactive CLI
hermes model        # Chọn model/provider
hermes tools        # Configure toolsets
hermes mcp          # Manage MCP servers
hermes config set   # Set config values
hermes setup        # Full setup wizard
hermes gateway      # Start messaging gateway (Telegram, Discord, etc.)
hermes doctor       # Diagnose issues
hermes update       # Update to latest
```

## Workspace

Hermes sẽ tự động discover `AGENTS.md` từ `C:\VietProDev\sso-vietprodev` khi khởi động.

## Tips

- Dùng `/compress` để giảm context size
- Dùng `/skills` để xem và tạo skills
- Dùng `/new` hoặc `/reset` để bắt đầu cuộc trò chuyện mới
- Dùng `/retry` hoặc `/undo` để retry hoặc undo last turn
- Dùng `Ctrl+C` để interrupt current work
