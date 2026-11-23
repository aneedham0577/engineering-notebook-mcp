# Engineering Notebook Discord MCP Server

An MCP (Model Context Protocol) server that enables AI agents to generate Engineering Notebook entries by pulling Discord messages from your club server, resolving student authors against registered team members, checking for duplicate or similar entries, downloading media attachments, and writing valid notebook entries.

## Features

- **Discord Message Extraction**: Read messages from specific channels or threads (with optional emoji reaction filtering, e.g. only summarizing messages reacted with 📝).
- **Author Resolution**: Fuzzy matches Discord usernames, handles, and IDs against team members defined in `notebook.json` (supports aliases).
- **Duplicate & Similarity Detection**: Searches existing entries by date, phase, and title keywords so agents can suggest updating existing entries instead of creating duplicates.
- **Attachment Ingestion**: Downloads Discord attachments directly into the notebook's `data/assets/` folder and links them.
- **Entry Creation**: Creates new entries with TipTap / ProseMirror JSON schema and updates `notebook.json` order, authors, and phase.

---

## Tools Exposed

| Tool | Description |
| :--- | :--- |
| `discord_list_channels` | Lists text and forum channels or threads in your club server. |
| `discord_get_messages` | Fetches messages from a channel/thread with optional date, limit, or reaction filter. |
| `notebook_get_team_members` | Lists team members registered in `notebook.json`. |
| `notebook_resolve_authors` | Maps Discord handles to official team member names. |
| `notebook_find_similar_entries` | Checks `notebook.json` for entries matching date, phase, or keywords. |
| `notebook_save_discord_attachment` | Downloads media from Discord into `notebook/data/assets/`. |
| `notebook_create_entry` | Creates an entry in `notebook/data/entries/{uuid}.json` and updates `notebook.json`. |

---

## Setup & Configuration

### 1. Discord Bot Setup
1. Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Under **Bot > Privileged Gateway Intents**, enable **Message Content Intent**.
3. Under **OAuth2 > URL Generator**, grant `bot` scope with permissions `Read Messages/View Channels` and `Read Message History`.
4. Invite the bot to your club's Discord server.

### 2. Environment Variables
Create a `.env` file in the root of this project:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_server_id_here
NOTEBOOK_DATA_DIR=../engineering-notebook-editor/notebook/data
```

### 3. Build
```bash
npm install
npm run build
```

---

## Antigravity / Claude Desktop MCP Configuration

Add this server to your MCP configuration (e.g. `mcpServers` settings):

```json
{
  "mcpServers": {
    "engineering-notebook": {
      "command": "node",
      "args": [
        "C:/Users/needhama/Local_Documents/GitHub/engineering-notebook-mcp/dist/index.js"
      ],
      "env": {
        "DISCORD_BOT_TOKEN": "your_bot_token_here",
        "DISCORD_GUILD_ID": "your_guild_id_here",
        "NOTEBOOK_DATA_DIR": "C:/Users/needhama/Local_Documents/GitHub/engineering-notebook-editor/notebook/data"
      }
    }
  }
}
```

---

## Legal & Policies

- [Privacy Policy](file:///C:/Users/needhama/Local_Documents/GitHub/engineering-notebook-mcp/PRIVACY.md)
- [Terms of Service](file:///C:/Users/needhama/Local_Documents/GitHub/engineering-notebook-mcp/TERMS.md)

