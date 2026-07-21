import type { AgentEvent, ExecutionEnvironment, EnvHealth, SSHEnvConfig } from './types';
import type { ProjectFile } from '../types';
import { detectAgents, BASE_PREFIX } from '../api';
import { consumeSSE } from './sse';

/**
 * SSH mode: connect to a remote server (e.g. Alibaba Cloud ECS) and run
 * CLI agents there. Files are synced back to the local backend for preview.
 */
export class SSHEnvironment implements ExecutionEnvironment {
  readonly mode = 'ssh' as const;
  private config: SSHEnvConfig;
  private sid: string;

  constructor(config: SSHEnvConfig, sid: string) {
    this.config = config;
    this.sid = sid;
  }

  async listAgents() {
    return detectAgents('local');
  }

  async *run(task: string, agentId: string, signal: AbortSignal): AsyncIterable<AgentEvent> {
    const res = await fetch(`${BASE_PREFIX}/api/env/ssh/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ssh: this.config,
        task,
        cliId: agentId,
        sid: this.sid,
        remoteWorkDir: this.config.remoteWorkDir,
      }),
      signal,
    });
    yield* consumeSSE(res);
  }

  async readFiles(): Promise<ProjectFile[]> {
    const res = await fetch(`${BASE_PREFIX}/api/env/local/files?sid=${encodeURIComponent(this.sid)}`);
    const data = await res.json().catch(() => ({ files: [] }));
    return (data.files || []) as ProjectFile[];
  }

  async getPreviewUrl(): Promise<string | null> {
    return null; // URL is returned in the done event
  }

  async healthCheck(): Promise<EnvHealth> {
    try {
      const res = await fetch(`${BASE_PREFIX}/api/env/ssh/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config),
      });
      const data = await res.json();
      return { ok: data.ok, detail: data.detail };
    } catch {
      return { ok: false, detail: '后端未连接' };
    }
  }
}
