export interface NotebookData {
  version: number;
  entries: Record<string, NotebookEntryMeta>;
  team: {
    teamName: string;
    teamNumber: string;
    startDate: string;
    endDate: string;
    autoCalculateDates: boolean;
    organization: string;
    members: Record<string, TeamMember>;
  };
  phases: Record<string, PhaseMeta>;
  assetRefs?: Record<string, any>;
  lastCompiled?: string;
}

export interface TeamMember {
  name: string;
  role?: string;
  discordId?: string;
  discordUsername?: string;
  aliases?: string[];
  [key: string]: any;
}

export interface PhaseMeta {
  name: string;
  description: string;
  iconName: string;
  color: string;
  order: number;
}

export interface NotebookEntryMeta {
  title: string;
  authors: string[];
  phase: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  filename: string;
  order: number;
  isTemplate?: boolean;
  resources?: Record<string, any>;
  references?: any[];
  assets?: string[];
  isValid?: boolean;
  validationErrors?: string[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TipTapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

export interface TipTapDoc {
  version?: number;
  content: {
    type: 'doc';
    content: TipTapNode[];
  };
}

export interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    globalName?: string | null;
  };
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    contentType?: string;
    size: number;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
  }>;
}

export interface ResolvedAuthor {
  inputName: string;
  matchedId?: string;
  matchedName?: string;
  confidence: 'exact' | 'alias' | 'fuzzy' | 'unresolved';
}

export interface SimilarEntryMatch {
  id: string;
  title: string;
  date: string;
  phase: string;
  score: number;
  matchReasons: string[];
}
