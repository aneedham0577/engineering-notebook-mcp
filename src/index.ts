#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { NotebookManager } from './notebook.js';
import { DiscordClient } from './discord.js';

dotenv.config();

const notebookDataDir = process.env.NOTEBOOK_DATA_DIR 
  || path.resolve(process.cwd(), '../engineering-notebook-editor/notebook/data');
const discordToken = process.env.DISCORD_BOT_TOKEN || '';
const defaultGuildId = process.env.DISCORD_GUILD_ID || '';

const notebookManager = new NotebookManager(notebookDataDir);
const discordClient = new DiscordClient(discordToken);

const server = new Server(
  {
    name: 'engineering-notebook-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'discord_list_channels',
        description: 'List channels and threads in the Discord server (guild).',
        inputSchema: {
          type: 'object',
          properties: {
            guildId: {
              type: 'string',
              description: 'Discord Guild/Server ID. Uses DISCORD_GUILD_ID from .env if omitted.',
            },
          },
        },
      },
      {
        name: 'discord_get_messages',
        description: 'Fetch recent messages from a specific Discord channel or thread.',
        inputSchema: {
          type: 'object',
          properties: {
            channelId: {
              type: 'string',
              description: 'The channel or thread ID to read messages from.',
            },
            limit: {
              type: 'number',
              description: 'Number of messages to fetch (max 100, default 50).',
            },
            after: {
              type: 'string',
              description: 'Fetch messages after this snowflake message ID or ISO timestamp.',
            },
            filterReaction: {
              type: 'string',
              description: 'Optional emoji string to filter messages by (e.g. "📝").',
            },
          },
          required: ['channelId'],
        },
      },
      {
        name: 'notebook_get_team_members',
        description: 'List registered team members from notebook.json.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'notebook_resolve_authors',
        description: 'Match Discord usernames or IDs against registered team members in notebook.json.',
        inputSchema: {
          type: 'object',
          properties: {
            discordAuthors: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of Discord usernames, nicknames, or IDs extracted from messages.',
            },
          },
          required: ['discordAuthors'],
        },
      },
      {
        name: 'notebook_find_similar_entries',
        description: 'Search for existing entries by date, phase, or keywords in title to prevent duplicate entries.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date string (e.g. YYYY-MM-DD).',
            },
            phase: {
              type: 'string',
              description: 'Phase key (e.g. define-problem, generate-concepts, develop-solution, construct-test, evaluate-solution).',
            },
            titleKeywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords to check in entry titles (e.g. ["chassis", "intake"]).',
            },
          },
        },
      },
      {
        name: 'notebook_save_discord_attachment',
        description: 'Download an image or file attachment from Discord and save it directly into the notebook data/assets directory.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Attachment URL from Discord message.',
            },
            filename: {
              type: 'string',
              description: 'Original or target filename for the asset.',
            },
          },
          required: ['url', 'filename'],
        },
      },
      {
        name: 'notebook_create_entry',
        description: 'Create a new engineering notebook entry and update notebook.json.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Entry title.',
            },
            authors: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of resolved team member names or IDs.',
            },
            phase: {
              type: 'string',
              description: 'Phase ID (e.g. define-problem, generate-concepts, develop-solution, construct-test, evaluate-solution).',
            },
            date: {
              type: 'string',
              description: 'Date string (e.g. YYYY-MM-DD).',
            },
            contentNodes: {
              type: 'array',
              description: 'TipTap ProseMirror nodes (paragraphs, headings, bullet lists). If omitted, a template body will be created.',
            },
            assets: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of asset file paths saved in data/assets.',
            },
          },
          required: ['title', 'authors', 'phase', 'date'],
        },
      },
    ],
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'discord_list_channels': {
        const guildId = (args?.guildId as string) || defaultGuildId;
        if (!guildId) {
          throw new Error('guildId must be provided or set in DISCORD_GUILD_ID');
        }
        const channels = await discordClient.listChannels(guildId);
        return {
          content: [{ type: 'text', text: JSON.stringify(channels, null, 2) }],
        };
      }

      case 'discord_get_messages': {
        const channelId = args?.channelId as string;
        const limit = typeof args?.limit === 'number' ? args.limit : 50;
        const after = args?.after as string | undefined;
        const filterReaction = args?.filterReaction as string | undefined;

        let messages = await discordClient.getMessages({ channelId, limit, after });

        if (filterReaction) {
          messages = messages.filter((m) =>
            m.reactions?.some((r) => r.emoji === filterReaction)
          );
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }],
        };
      }

      case 'notebook_get_team_members': {
        const members = await notebookManager.getTeamMembers();
        return {
          content: [{ type: 'text', text: JSON.stringify(members, null, 2) }],
        };
      }

      case 'notebook_resolve_authors': {
        const authors = (args?.discordAuthors as string[]) || [];
        const resolved = await notebookManager.resolveAuthors(authors);
        return {
          content: [{ type: 'text', text: JSON.stringify(resolved, null, 2) }],
        };
      }

      case 'notebook_find_similar_entries': {
        const matches = await notebookManager.findSimilarEntries({
          date: args?.date as string | undefined,
          phase: args?.phase as string | undefined,
          titleKeywords: args?.titleKeywords as string[] | undefined,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
        };
      }

      case 'notebook_save_discord_attachment': {
        const url = args?.url as string;
        const filename = args?.filename as string;
        const buffer = await discordClient.downloadAttachment(url);
        const saved = await notebookManager.saveAsset(filename, buffer);
        return {
          content: [{ type: 'text', text: JSON.stringify(saved, null, 2) }],
        };
      }

      case 'notebook_create_entry': {
        const created = await notebookManager.createEntry({
          title: args?.title as string,
          authors: (args?.authors as string[]) || [],
          phase: (args?.phase as string) || 'develop-solution',
          date: (args?.date as string) || new Date().toISOString().split('T')[0],
          contentNodes: args?.contentNodes as any[],
          assets: (args?.assets as string[]) || [],
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(created, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error executing ${name}: ${err?.message || err}` }],
    };
  }
});

// Run server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Engineering Notebook Discord MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal server error:', error);
  process.exit(1);
});
