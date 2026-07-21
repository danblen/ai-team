import type { AgentEvent, ExecutionEnvironment, EnvHealth, RemoteEnvConfig } from './types';
import type { ProjectFile } from '../types';
import { fetchHealth, detectAgents } from '../api';
import { clearApiConfig, setApiConfig, getAuthToken, BASE_PREFIX } from '../api';
import { consumeSSE } from './sse';

/**
 * Remote mode: connect to a deployed instance of the same AI Team app
 * (e.g. https://siplgo.xyz). The task is sent to that instance's backend,
 * which spawns the CLI **on that server** to modify code there, builds the
 * preview and streams results back. All /api/* calls are redirected to the
 * remote instance via setApiConfig().
 */
export class RemoteEnvironment implements ExecutionEnvironment {
  readonly mode = 'remote';
  private config: RemoteEnvConfig;
  private sid: string;
  private projectName: string;

  constructor(config: RemoteEnvConfig, sid: string, projectName?: string) {
    this.config = config;
    this.sid = sid;
    this.projectName = projectName || '';
  }

  async listAgents() {
    return detectAgents('local');
  }

  /**
   * Activate the remote target — all subsequent API calls go to the
   * remote instance.
   */
  prepare() {
    if (this.config.url) {
      setApiConfig(this.config.url, this.config.token);
    }
  }

  /** Revert API calls back to the local backend. */
  cleanup() {
    clearApiConfig();
  }

  /**
   * Run the task on the remote server: POST to the remote instance's
   * /api/env/local/run, which spawns the CLI there and streams SSE events.
   */
  async *run(task: string, agentId: string, signal: AbortSignal): AsyncIterable<AgentEvent> {
    const base = this.config.url.replace(/\/+$/, '');
    const token = this.config.token || getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${base}${BASE_PREFIX}/api/env/local/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        task,
        cliId: agentId,
        sid: this.sid,
        workDir: this.config.workDir || '',
        projectName: this.projectName,
      }),
      signal,
    });

    // 远端 done 事件里的 previewUrl 是根相对路径（/preview/<sid>/），
    // 需拼上远端源与基路径，前端 iframe 才能从远端加载预览。
    for await (const event of consumeSSE(res)) {
      if (event.type === 'done' && event.previewUrl && event.previewUrl.startsWith('/')) {
        yield { ...event, previewUrl: `${base}${BASE_PREFIX}${event.previewUrl}` };
      } else {
        yield event;
      }
    }
  }

  async readFiles(): Promise<ProjectFile[]> {
    // Files live on the remote instance, accessible via its preview URL.
    return [];
  }

  async getPreviewUrl(): Promise<string | null> {
    const base = this.config.url.replace(/\/+$/, '');
    return `${base}${BASE_PREFIX}/preview/${this.sid}/`;
  }

  async healthCheck(): Promise<EnvHealth> {
    try {
      const health = await fetchHealth();
      return { ok: true, detail: `远程实例 · ${health.model}` };
    } catch (err) {
      return { ok: false, detail: (err as Error).message || '无法连接远程实例' };
    }
  }
}
