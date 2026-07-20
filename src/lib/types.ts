export type Role = 'user' | 'assistant';

/** A lightweight, user-customizable agent role (CrewAI-style). */
export interface AgentRole {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** One-line responsibility shown in the UI. */
  goal: string;
  /** The system prompt that defines this agent's behavior. */
  systemPrompt: string;
  /** Whether this agent outputs the runnable HTML app (the "engineer"). */
  producesCode: boolean;
  enabled: boolean;
}

export type MessageKind = 'user' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  kind: MessageKind;
  /** Raw text content (for a code agent this includes the ```html block). */
  content: string;
  /** Populated when kind === 'agent'. */
  agentId?: string;
  agentName?: string;
  emoji?: string;
  color?: string;
  /** True if this agent message produced runnable code. */
  hasCode?: boolean;
}

/** A real project source file (multi-file React project or single HTML). */
export interface ProjectFile {
  path: string;
  content: string;
}

export type Framework = 'react' | 'html';

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  /** The latest runnable HTML produced in this session (legacy html mode). */
  code: string;
  /** The generated project files (source of truth for react mode). */
  files: ProjectFile[];
  /** Which kind of project the engineer produced. */
  framework: Framework;
  /** URL of the last successful backend build preview. */
  previewUrl?: string;
  /** Product description captured for the Overview dashboard. */
  summary?: string;
  /** Terminal log lines accumulated during agent runs. */
  logs: LogEntry[];
}

export type LogLevel = 'info' | 'agent' | 'ok' | 'error' | 'cmd';

export interface LogEntry {
  id: string;
  time: number;
  level: LogLevel;
  text: string;
}

export type FileLanguage = 'html' | 'css' | 'js' | 'jsx' | 'ts' | 'tsx' | 'json' | 'text';

/** A virtual source file derived from the generated single-file app. */
export interface VFile {
  path: string;
  language: FileLanguage;
  content: string;
}

/** A node in the hierarchical project file tree. */
export interface TreeNode {
  name: string;
  path: string;
  /** Present on folders. */
  children?: TreeNode[];
  /** Present on files. */
  file?: ProjectFile;
}

export interface HealthInfo {
  ok: boolean;
  configured: boolean;
  model: string;
  baseUrl: string;
  /** 后端是否强制登录（有用户/配置了令牌时为 true）。 */
  authRequired?: boolean;
}

/** Result of parsing a (possibly partial) agent output. */
export interface ParsedStream {
  plan: string;
  code: string;
  codeStarted: boolean;
}

/** The currently streaming agent turn (not yet committed to the session). */
export interface LiveTurn {
  agent: AgentRole;
  content: string;
  /** 'thinking' before first token, then 'writing'. */
  phase: 'thinking' | 'writing';
}
