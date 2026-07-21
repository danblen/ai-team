import type { Framework, HealthInfo, ProjectFile } from './types';
import type { AvailableAgent, EnvironmentMode } from './env/types';

// ---------- Remote / configurable base URL ----------

let _apiPrefix = '';
let _apiToken = '';

const K_AUTH_TOKEN = 'atoms.auth.token.v1';

// 会话令牌（邮箱登录后获得）。持久化到 localStorage 以保持登录态，
// 注入到所有 /api 请求的 Authorization 头（优先于旧的 remote token）。
let _authToken = (() => {
  try {
    return localStorage.getItem(K_AUTH_TOKEN) || '';
  } catch {
    return '';
  }
})();

/** 设置（并持久化）登录会话令牌。传空串等同于清除。 */
export function setAuthToken(token: string) {
  _authToken = token || '';
  try {
    if (_authToken) localStorage.setItem(K_AUTH_TOKEN, _authToken);
    else localStorage.removeItem(K_AUTH_TOKEN);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function getAuthToken(): string {
  return _authToken;
}

export function clearAuthToken() {
  setAuthToken('');
}

/**
 * Set a remote API target. When set, all /api/* fetch calls will be
 * redirected to {prefix}/api/* with an Authorization header.
 * Call clearApiConfig() to revert to local backend.
 */
export function setApiConfig(prefix: string, token: string) {
  _apiPrefix = prefix.replace(/\/+$/, '');
  _apiToken = token;
}

export function clearApiConfig() {
  _apiPrefix = '';
  _apiToken = '';
}

/** 当前生效的远端前缀（未配置时为空串，即本地）。 */
export function getApiPrefix(): string {
  return _apiPrefix;
}

// 应用部署的基路径（vite `base`，如 /ai-team）。生产环境后端挂在该子路径下，
// 所有 /api、/preview 请求都必须带上它，否则会绕过反向代理导致 404。
export const BASE_PREFIX = import.meta.env.BASE_URL.replace(/\/+$/, '');

function apiUrl(path: string): string {
  return `${_apiPrefix}${BASE_PREFIX}${path}`;
}

function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  const h = { ...extra };
  // 登录会话令牌优先；其次才是旧的静态 remote token。
  const bearer = _authToken || _apiToken;
  if (bearer) h['Authorization'] = `Bearer ${bearer}`;
  return h;
}

// ---------- Auth ----------

export interface AuthResult {
  email: string;
  token: string;
}

/** 邮箱+密码登录（远程模式下自动打到远端实例）。 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data.error || `登录失败 (${res.status})`);
  return { email: data.email, token: data.token };
}

/** 注册新邮箱账号，成功后直接返回令牌。 */
export async function register(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data.error || `注册失败 (${res.status})`);
  return { email: data.email, token: data.token };
}

/** 校验当前令牌并返回登录邮箱；未登录则抛错。 */
export async function fetchMe(): Promise<{ email: string }> {
  const res = await fetch(apiUrl('/api/auth/me'), { headers: apiHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '未登录');
  return { email: data.email };
}


// ---------- API functions ----------

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(apiUrl('/api/health'), { headers: apiHeaders() });
  if (!res.ok) throw new Error('健康检查失败');
  return res.json();
}

/** Update LLM config on the server (apiKey, baseUrl, model). */
export async function updateConfig(config: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<HealthInfo> {
  const res = await fetch(apiUrl('/api/config'), {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `保存配置失败 (${res.status})`);
  return data as HealthInfo;
}

/** 检测某个执行环境下可用的 Agent（内置团队 / 已安装 CLI）。 */
export async function detectAgents(mode: EnvironmentMode): Promise<AvailableAgent[]> {
  const res = await fetch(
    apiUrl(`/api/env/agents?mode=${encodeURIComponent(mode)}`),
    { headers: apiHeaders() },
  );
  const data = await res.json().catch(() => ({ agents: [] }));
  if (!res.ok) throw new Error(data.error || `Agent 检测失败 (${res.status})`);
  return (data.agents || []) as AvailableAgent[];
}

/** 写入生成的项目文件到指定磁盘目录。 */
export async function writeProjectFiles(files: ProjectFile[], projectDir: string): Promise<void> {
  await fetch(apiUrl('/api/write-project-files'), {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ files, projectDir }),
  });
}


/**
 * Ask the backend to build the given project files with Vite and serve them.
 * Returns the preview URL (e.g. /preview/<sid>/) on success.
 */
export async function buildPreview(
  sid: string,
  files: ProjectFile[],
  framework: Framework,
): Promise<string> {
  const res = await fetch(apiUrl(`/api/preview/${encodeURIComponent(sid)}`), {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ files, framework }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || `构建失败 (${res.status})`);
  // 后端返回的是根相对路径（/preview/<sid>/），iframe 需带上基路径才能加载。
  const url = data.url as string;
  return url.startsWith('/') ? `${BASE_PREFIX}${url}` : url;
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
  signal?: AbortSignal;
}

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Stream one agent turn from the backend generic chat endpoint.
 * The caller fully controls the system prompt and message list, so every
 * agent can act with its own role.
 */
export async function streamChat(
  system: string,
  messages: ChatTurn[],
  handlers: StreamHandlers,
): Promise<void> {
  const { onDelta, onDone, onError, signal } = handlers;

  let res: Response;
  try {
    res = await fetch(apiUrl('/api/chat'), {
      method: 'POST',
      headers: apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ system, messages }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    onError((err as Error).message || '网络请求失败');
    return;
  }

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({ error: `请求失败 (${res.status})` }));
    onError(data.error || `请求失败 (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        let event = 'message';
        let dataLine = '';
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
        }
        if (!dataLine) continue;

        let payload: { text?: string; message?: string };
        try {
          payload = JSON.parse(dataLine);
        } catch {
          continue;
        }

        if (event === 'delta' && payload.text) onDelta(payload.text);
        else if (event === 'error') return onError(payload.message || '生成失败');
        else if (event === 'done') return onDone();
      }
    }
    onDone();
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    onError((err as Error).message || '读取流失败');
  }
}
