# CodeGraph Integration

## Tổng quan

Project SSO tích hợp [CodeGraph](https://github.com/colbymchenry/codegraph) - công cụ tạo pre-indexed knowledge graph cục bộ giúp AI agent (Cursor) trả lời câu hỏi về codebase hiệu quả hơn.

**Benchmark:** ~16% giảm chi phí, ~58% ít tool calls, ~22% nhanh hơn.

## Trạng thái hiện tại

- **CLI:** v0.9.9 đã cài đặt global (`npm i -g @colbymchenry/codegraph`)
- **Cursor MCP:** đã cấu hình trong `~/.cursor/mcp.json`
- **Index:** 201 files, 1,094 nodes, 1,983 edges, 1.96 MB
- **Languages:** TypeScript (150 files), YAML (45), JavaScript (6)

## Cách dùng

### Khi nào nên dùng

Dùng CodeGraph tools khi hỏi về:
- "File/function/class này hoạt động như thế nào?"
- "Ai gọi function X?"
- "Function X gọi những gì?"
- "Thay đổi X sẽ ảnh hưởng những gì?"
- "Tìm tất cả file liên quan đến Y"

### Tools có sẵn

| Tool | Mục đích |
|------|-----------|
| `codegraph_explore` | Trả lời hầu hết câu hỏi về code structure |
| `codegraph_search` | Tìm symbol theo tên |
| `codegraph_callers` | Tìm những gì gọi một function |
| `codegraph_callees` | Tìm những gì một function gọi |
| `codegraph_impact` | Phân tích impact radius trước khi sửa |
| `codegraph_node` | Chi tiết một symbol cụ thể |
| `codegraph_files` | Cấu trúc file (nhanh hơn ls/glob) |
| `codegraph_status` | Kiểm tra index health |

### Commands

```bash
# Sync thủ công (thường không cần)
codegraph sync

# Xem trạng thái index
codegraph status

# Re-index hoàn toàn
codegraph index --force

# Xem cấu trúc project
codegraph files
```

## Cài đặt lại

```bash
# Uninstall khỏi Cursor
codegraph uninstall --target=cursor

# Reinstall
codegraph install --target=cursor --yes
```

## Notes

- CodeGraph hoàn toàn local - không gửi data ra ngoài
- Index auto-sync khi file thay đổi (2 giây debounce)
- Mỗi máy có index riêng, không sync qua git (`.codegraph/` đã trong `.gitignore`)
- Không index: `node_modules/`, `dist/`, `coverage/`, files trong `.gitignore`
