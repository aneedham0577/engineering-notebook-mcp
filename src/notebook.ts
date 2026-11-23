import fs from 'fs/promises';
import path from 'path';
import { uuidv7 } from 'uuidv7';
import { 
  NotebookData, 
  NotebookEntryMeta, 
  ResolvedAuthor, 
  SimilarEntryMatch, 
  TipTapDoc, 
  TipTapNode 
} from './types.js';

export class NotebookManager {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = path.resolve(dataDir);
  }

  get notebookJsonPath(): string {
    return path.join(this.dataDir, 'notebook.json');
  }

  get entriesDir(): string {
    return path.join(this.dataDir, 'entries');
  }

  get assetsDir(): string {
    return path.join(this.dataDir, 'assets');
  }

  async loadNotebook(): Promise<NotebookData> {
    const raw = await fs.readFile(this.notebookJsonPath, 'utf-8');
    return JSON.parse(raw);
  }

  async saveNotebook(data: NotebookData): Promise<void> {
    await fs.writeFile(this.notebookJsonPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async getTeamMembers(): Promise<Record<string, any>> {
    const data = await this.loadNotebook();
    return data.team?.members || {};
  }

  async listEntries(limit = 20): Promise<Array<{ id: string; title: string; date: string; phase: string; authors: string[]; isTemplate?: boolean }>> {
    const data = await this.loadNotebook();
    const entries = data.entries || {};
    return Object.entries(entries)
      .map(([id, e]) => ({
        id,
        title: e.title,
        date: e.date,
        phase: e.phase,
        authors: e.authors || [],
        isTemplate: e.isTemplate
      }))
      .slice(0, limit);
  }

  async getEntryContent(entryId: string): Promise<{ meta: NotebookEntryMeta; content: TipTapDoc }> {
    const data = await this.loadNotebook();
    const meta = data.entries?.[entryId];
    if (!meta) {
      throw new Error(`Entry ${entryId} not found in notebook.json`);
    }

    const filePath = path.resolve(this.dataDir, meta.filename.replace(/^data\//, ''));
    const raw = await fs.readFile(filePath, 'utf-8');
    const content = JSON.parse(raw);

    return { meta, content };
  }


  async resolveAuthors(discordNamesOrIds: string[]): Promise<ResolvedAuthor[]> {
    const notebook = await this.loadNotebook();
    const members = notebook.team?.members || {};
    const memberEntries = Object.entries(members);

    return discordNamesOrIds.map((input) => {
      const cleanInput = input.trim().toLowerCase();

      // 1. Direct Discord ID match if stored
      for (const [id, member] of memberEntries) {
        if (member.discordId && member.discordId.toLowerCase() === cleanInput) {
          return { inputName: input, matchedId: id, matchedName: member.name || id, confidence: 'exact' };
        }
      }

      // 2. Direct Discord username match
      for (const [id, member] of memberEntries) {
        if (member.discordUsername && member.discordUsername.toLowerCase() === cleanInput) {
          return { inputName: input, matchedId: id, matchedName: member.name || id, confidence: 'exact' };
        }
      }

      // 3. Member name exact match
      for (const [id, member] of memberEntries) {
        const memName = (member.name || id).toLowerCase();
        if (memName === cleanInput) {
          return { inputName: input, matchedId: id, matchedName: member.name || id, confidence: 'exact' };
        }
      }

      // 4. Check aliases
      for (const [id, member] of memberEntries) {
        if (Array.isArray(member.aliases)) {
          if (member.aliases.some((a: string) => a.toLowerCase() === cleanInput)) {
            return { inputName: input, matchedId: id, matchedName: member.name || id, confidence: 'alias' };
          }
        }
      }

      // 5. Fuzzy / Substring match (e.g. "alex" in "Alex Needham")
      for (const [id, member] of memberEntries) {
        const memName = (member.name || id).toLowerCase();
        if (memName.includes(cleanInput) || cleanInput.includes(memName)) {
          return { inputName: input, matchedId: id, matchedName: member.name || id, confidence: 'fuzzy' };
        }
      }

      return {
        inputName: input,
        confidence: 'unresolved'
      };
    });
  }

  async findSimilarEntries(params: {
    date?: string;
    titleKeywords?: string[];
    phase?: string;
  }): Promise<SimilarEntryMatch[]> {
    const notebook = await this.loadNotebook();
    const entries = notebook.entries || {};
    const matches: SimilarEntryMatch[] = [];

    const targetKeywords = (params.titleKeywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean);
    const targetDate = params.date ? params.date.split('T')[0] : null;

    for (const [id, entry] of Object.entries(entries)) {
      if (entry.isTemplate) continue;

      let score = 0;
      const reasons: string[] = [];

      // Check date
      if (targetDate && entry.date) {
        const entryDate = entry.date.split('T')[0];
        if (entryDate === targetDate) {
          score += 50;
          reasons.push(`Same date (${entryDate})`);
        }
      }

      // Check phase
      if (params.phase && entry.phase === params.phase) {
        score += 20;
        reasons.push(`Same phase (${entry.phase})`);
      }

      // Check title keywords
      if (targetKeywords.length > 0 && entry.title) {
        const titleLower = entry.title.toLowerCase();
        const matchedWords = targetKeywords.filter((kw) => titleLower.includes(kw));
        if (matchedWords.length > 0) {
          score += matchedWords.length * 15;
          reasons.push(`Matched keywords in title: ${matchedWords.join(', ')}`);
        }
      }

      if (score > 0) {
        matches.push({
          id,
          title: entry.title,
          date: entry.date,
          phase: entry.phase,
          score,
          matchReasons: reasons
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  async saveAsset(filename: string, buffer: Buffer): Promise<{ relativePath: string; fullPath: string }> {
    await fs.mkdir(this.assetsDir, { recursive: true });
    // Keep clean filename with unique prefix if collision
    const base = path.basename(filename);
    const safeName = `${Date.now()}-${base.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destPath = path.join(this.assetsDir, safeName);
    await fs.writeFile(destPath, buffer);

    return {
      relativePath: `data/assets/${safeName}`,
      fullPath: destPath
    };
  }

  async createEntry(params: {
    title: string;
    authors: string[];
    phase: string;
    date: string;
    contentNodes?: TipTapNode[];
    assets?: string[];
  }): Promise<{ id: string; filename: string; entry: NotebookEntryMeta }> {
    const notebook = await this.loadNotebook();
    const entryId = uuidv7();
    const nowIso = new Date().toISOString();
    const relativeFilename = `data/entries/${entryId}.json`;
    const fullEntryPath = path.join(this.entriesDir, `${entryId}.json`);

    await fs.mkdir(this.entriesDir, { recursive: true });

    // Determine order (last + 1)
    const existingOrders = Object.values(notebook.entries || {}).map((e) => e.order || 0);
    const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;

    let parsedNodes: TipTapNode[] = [];
    if (params.contentNodes) {
      if (typeof params.contentNodes === 'string') {
        try {
          parsedNodes = JSON.parse(params.contentNodes);
        } catch {
          parsedNodes = [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: params.contentNodes }]
            }
          ];
        }
      } else if (Array.isArray(params.contentNodes)) {
        parsedNodes = params.contentNodes;
      }
    }

    // Ensure all headings have an id attribute required by the editor
    for (const node of parsedNodes) {
      if (node.type === 'heading') {
        if (!node.attrs) node.attrs = { level: 2 };
        if (!node.attrs.id) node.attrs.id = uuidv7();
      }
    }

    // Build TipTap Document structure
    const doc: TipTapDoc = {
      version: 3,
      content: {
        type: 'doc',
        content: parsedNodes.length > 0
          ? parsedNodes
          : [
              {
                type: 'heading',
                attrs: { level: 1, id: uuidv7() },
                content: [{ type: 'text', text: params.title }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Imported from Discord chat summary.' }]
              }
            ]
      }
    };

    await fs.writeFile(fullEntryPath, JSON.stringify(doc, null, 2), 'utf-8');

    const entryMeta: NotebookEntryMeta = {
      title: params.title,
      authors: params.authors || [],
      phase: params.phase || 'develop-solution',
      createdAt: nowIso,
      updatedAt: nowIso,
      date: params.date || nowIso.split('T')[0],
      filename: relativeFilename,
      order: nextOrder,
      isTemplate: false,
      resources: {},
      references: [],
      assets: params.assets || [],
      isValid: true,
      validationErrors: []
    };

    notebook.entries[entryId] = entryMeta;
    await this.saveNotebook(notebook);

    return {
      id: entryId,
      filename: relativeFilename,
      entry: entryMeta
    };
  }
}
