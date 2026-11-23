import { DiscordMessage } from './types.js';

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string | null;
}

export class DiscordClient {
  private botToken: string;
  private baseUrl = 'https://discord.com/api/v10';

  constructor(token: string) {
    this.botToken = token.trim();
  }

  private async fetchDiscord(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.botToken) {
      throw new Error('Discord bot token is missing. Please set DISCORD_BOT_TOKEN in .env or provide it.');
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bot ${this.botToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Discord API error [${res.status} ${res.statusText}]: ${errBody}`);
    }

    return res.json();
  }

  async listChannels(guildId: string): Promise<DiscordChannel[]> {
    const channels = await this.fetchDiscord(`/guilds/${guildId}/channels`);
    return channels.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parent_id: c.parent_id
    }));
  }

  async getMessages(params: {
    channelId: string;
    limit?: number;
    after?: string;
    before?: string;
  }): Promise<DiscordMessage[]> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', Math.min(params.limit, 100).toString());
    if (params.after) query.set('after', params.after);
    if (params.before) query.set('before', params.before);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const rawMessages = await this.fetchDiscord(`/channels/${params.channelId}/messages${qs}`);

    return rawMessages.map((m: any) => ({
      id: m.id,
      content: m.content,
      timestamp: m.timestamp,
      author: {
        id: m.author.id,
        username: m.author.username,
        globalName: m.author.global_name
      },
      attachments: (m.attachments || []).map((a: any) => ({
        id: a.id,
        url: a.url,
        filename: a.filename,
        contentType: a.content_type,
        size: a.size
      })),
      reactions: (m.reactions || []).map((r: any) => ({
        emoji: r.emoji.name,
        count: r.count
      }))
    }));
  }

  async downloadAttachment(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download attachment from ${url}: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
