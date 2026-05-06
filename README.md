# testmo-mcp-server

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-purple)](https://modelcontextprotocol.io)

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that exposes the [Testmo REST API](https://support.testmo.com/hc/en-us/categories/37813841496333-REST-API) as tools for Claude Code and Cursor.

> **Disclaimer:** This is an unofficial community project and is not affiliated with or endorsed by Testmo.

## Requirements

- Node.js 18+
- A Testmo account with API access enabled

## Installation

```bash
git clone https://github.com/MateoSocha/testmo-mcp-server
cd testmo-mcp-server
npm install
npm run build
```

## Configuration

### 1. Get a Testmo API token

1. Log in to your Testmo instance
2. Go to **User Profile → API access**
3. Generate a new API key and copy it — it is shown only once

### 2. Register with Claude Code

Open `~/.claude.json` and locate your project entry under `projects`. Add the `testmo` block to its `mcpServers` object:

```json
"testmo": {
  "type": "stdio",
  "command": "node",
  "args": ["/absolute/path/to/testmo-mcp-server/dist/server.js"],
  "env": {
    "TESTMO_BASE_URL": "https://<your-instance>.testmo.net",
    "TESTMO_ACCESS_TOKEN": "<your-api-token>"
  }
}
```

Replace `/absolute/path/to/testmo-mcp-server` with the actual path where you cloned this repo.

Restart Claude Code — the server will appear as `testmo • connected` in `/mcp`.

### 3. Register with Cursor

Cursor reads MCP configuration from `~/.cursor/mcp.json` (global, available in all projects) or `.cursor/mcp.json` in the root of a specific project.

Create or edit the file and add the `testmo` entry:

```json
{
  "mcpServers": {
    "testmo": {
      "command": "node",
      "args": ["/absolute/path/to/testmo-mcp-server/dist/server.js"],
      "env": {
        "TESTMO_BASE_URL": "https://<your-instance>.testmo.net",
        "TESTMO_ACCESS_TOKEN": "<your-api-token>"
      }
    }
  }
}
```

Then in Cursor: open **Settings → MCP** and verify the server shows a green status indicator. If it does not appear, click **Refresh** or restart Cursor.

> If you use the project-level `.cursor/mcp.json`, add `.cursor/mcp.json` to your `.gitignore` to avoid committing tokens.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TESTMO_BASE_URL` | Yes | Base URL of your Testmo instance, e.g. `https://mycompany.testmo.net` |
| `TESTMO_ACCESS_TOKEN` | Yes | Bearer token from your Testmo user profile |

> **Never commit your API token.** Pass it only through `env` in the MCP config or a local `.env` file (which is git-ignored).

## Available tools

### Projects
| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `get_project` | Get project details by ID |

### Folders
| Tool | Description |
|------|-------------|
| `list_folders` | List folders in a project |
| `create_folders` | Create one or more folders (up to 100) |
| `update_folders` | Update folders in bulk (up to 100) |
| `delete_folders` | Delete folders in bulk (up to 100) |

### Test Cases
| Tool | Description |
|------|-------------|
| `list_cases` | List test cases (supports pagination and folder filtering) |
| `get_case` | Get details of a specific test case |
| `create_case` | Create a new test case |
| `update_cases` | Update test cases in bulk (up to 100) |
| `delete_cases` | Delete test cases in bulk (up to 100) |

### Attachments
| Tool | Description |
|------|-------------|
| `list_attachments` | List attachments for a test case |
| `delete_attachments` | Delete attachments in bulk (up to 100) |

### Automation Runs
| Tool | Description |
|------|-------------|
| `list_runs` | List automation runs (supports status filter) |
| `create_run` | Create a new automation run |
| `complete_run` | Mark a run as complete |
| `create_run_thread` | Create a thread inside a run |
| `append_to_run` | Append artifacts or links to a run |

### Run Results
| Tool | Description |
|------|-------------|
| `get_run_results` | Get test results for a specific run |

### Manual Test Runs
| Tool | Description |
|------|-------------|
| `list_test_runs` | List manual test runs in a project |

### Sessions
| Tool | Description |
|------|-------------|
| `list_sessions` | List exploratory test sessions in a project |

### Automation Sources
| Tool | Description |
|------|-------------|
| `list_automation_sources` | List automation sources in a project |
| `get_automation_source` | Get details of a specific automation source |

### Milestones
| Tool | Description |
|------|-------------|
| `list_milestones` | List milestones in a project |
| `get_milestone` | Get details of a specific milestone |

### Users
| Tool | Description |
|------|-------------|
| `get_current_user` | Get the currently authenticated user |
| `list_users` | List all workspace users |
| `get_user` | Get details of a specific user |

### Groups *(admin only)*
| Tool | Description |
|------|-------------|
| `list_groups` | List all user groups |
| `get_group` | Get details of a specific group |

### Roles *(admin only)*
| Tool | Description |
|------|-------------|
| `list_roles` | List all user roles |
| `get_role` | Get details of a specific role |

## Project structure

```
src/
├── server.ts   — MCP server entry point, tool registration
├── client.ts   — HTTP wrapper for the Testmo REST API
└── types.ts    — TypeScript interfaces for API responses
```

## Development

```bash
# Rebuild after changes to src/
npm run build

# Verify the server starts correctly
TESTMO_BASE_URL=https://your-instance.testmo.net \
TESTMO_ACCESS_TOKEN=your-token \
node dist/server.js
# Server waits silently on stdin — that is expected (STDIO transport)
# Press Ctrl+C to exit
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## Troubleshooting

**Tools not visible in Claude Code** — restart Claude Code after editing `~/.claude.json`; MCP servers are loaded at startup. Run `/mcp` to see connection status.

**Tools not visible in Cursor** — open **Settings → MCP**, click **Refresh**. If the server shows red, check the path in `mcp.json` and verify `node dist/server.js` runs without errors manually.

**401 Unauthorized** — check that `TESTMO_ACCESS_TOKEN` is correct and has not been revoked.

**Connection errors** — verify `TESTMO_BASE_URL` matches your instance URL (no trailing slash needed).

## License

[MIT](LICENSE)
