# Privacy Policy for Engineering Notebook MCP & Discord Integration

**Last Updated:** November 23, 2026

This Privacy Policy explains how the **Engineering Notebook MCP Server** ("the Service", "we", "our", or "us") collects, uses, stores, and protects information when interacting with Discord servers, robotics/engineering club members, and the local engineering notebook repository.

---

## 1. Information We Collect

When you configure and run the Engineering Notebook MCP Server with a Discord Bot, the following categories of data may be accessed:

* **Discord Message Content**: Text, timestamps, and thread names from channels or threads where the bot has explicit read permissions.
* **Discord User Data**: Usernames, global display names, nicknames, and Discord user IDs associated with messages in designated channels.
* **Media & Attachments**: Images, diagrams, sketches, or document attachments uploaded to designated Discord channels.
* **Notebook Metadata**: Team member rosters, phase names, entry dates, and existing engineering notebook entries stored in your local `notebook/data/` directory.

---

## 2. How Information Is Used

Data collected through Discord and local notebook storage is used exclusively to:
* Synthesize, summarize, and format engineering design entries for robotics and engineering teams (e.g., FIRST Robotics Competition, VEX, or school club notebooks).
* Resolve author attribution by matching Discord handles to registered student/mentor team members.
* Detect duplicate or overlapping documentation entries for the same build session or design phase.
* Download relevant build images or media attachments directly to the local repository assets directory (`notebook/data/assets/`).

---

## 3. Data Storage & Local Processing

* **Local-First Architecture**: All generated entries, downloaded assets, and updated notebook files are stored **locally on your machine** or in your private git repository.
* **No Third-Party Analytics / Telemetry**: The MCP server itself does not collect analytics, telemetry, or store user messages on external servers.
* **Discord API**: Message requests interact directly with the official Discord API using your club's own bot token. No third-party proxy or intermediary database is used.
* **LLM Providers**: When an AI client (such as Claude Desktop or Antigravity) uses this MCP server, messages retrieved by the tools are sent to the user's selected LLM provider subject to that provider's privacy policy.

---

## 4. Student & Youth Privacy

As this tool is frequently used by school clubs, youth robotics teams, and academic organizations:
* We recommend using first names or team member handles rather than full legal names or sensitive personal identifiable information (PII).
* The bot should only be granted access to designated channels (e.g., `#build-logs`, `#cad-design`, or `#notebook`) rather than general conversation or direct message channels.
* Channel messages should not contain private student information, phone numbers, or residential addresses.

---

## 5. Data Retention & Deletion

* **Local Data**: You have complete control over local notebook data. To remove any entry or downloaded image, simply delete the file from `data/entries/` or `data/assets/` and update `notebook.json`.
* **Discord Data**: The MCP server does not maintain a persistent database of past messages. Messages are read on-demand via the Discord API. Deleting a message on Discord ensures it will not be fetched in future queries.

---

## 6. Security

* **Bot Credentials**: Your `DISCORD_BOT_TOKEN` must be stored securely in your private `.env` file and **never** committed to version control.
* **Access Control**: Restrict bot channel access using Discord server roles and channel permissions so the bot cannot read unauthorized or private administrative channels.

---

## 7. Changes to This Policy

We may update this Privacy Policy from time to time as new features are added. Any updates will be reflected with a revised "Last Updated" date at the top of this document.

---

## 8. Contact

If you have questions about this Privacy Policy or your data handling in the Engineering Notebook MCP, please open an issue in the project's repository.
