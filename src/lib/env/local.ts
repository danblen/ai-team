import type { AgentEvent, ExecutionEnvironment, EnvHealth, LocalEnvConfig } from './types';
import type { ProjectFile } from '../types';
import { detectAgents, BASE_PREFIX } from '../api';
import { consumeSSE } from './sse';

/**
 * Local CLI mode: spawns a CLI agent subprocess on the local machine.
 * The agent writes files directly to disk; we scan and build preview from there.
 */
export class LocalEnvironment implements ExecutionEnvironment {
  readonly mode = 'local' as const;
  private sid: string;
  private workDir: string;
  private projectName: string;
  private direct: boolean;

  constructor(config: LocalEnvConfig, sid: string, projectName?: string, direct?: boolean) {
    this.sid = sid;
    this.workDir = config.workDir || '';
    this.projectName = projectName || '';
    this.direct = Boolean(direct);
  }

  async listAgents() {
    return detectAgents('local');
  }

  async *run(task: string, agentId: string, signal: AbortSignal): AsyncIterable<AgentEvent> {
    const res = await fetch(`${BASE_PREFIX}/api/env/local/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task,
        cliId: agentId,
        sid: this.sid,
        workDir: this.workDir,
        projectName: this.projectName,
        direct: this.direct,
      }),
      signal,
    });
    yield* consumeSSE(res);
  }

  async readFiles(): Promise<ProjectFile[]> {
    const params = new URLSearchParams({ sid: this.sid });
    if (this.workDir) params.set('workDir', this.workDir);
    if (this.projectName) params.set('projectName', this.projectName);
    if (this.direct) params.set('direct', '1');
    const res = await fetch(`${BASE_PREFIX}/api/env/local/files?${params}`);
    const data = await res.json().catch(() => ({ files: [] }));
    return (data.files || []) as ProjectFile[];
  }

  async getPreviewUrl(): Promise<string | null> {
    // In local CLI mode, preview URL was returned in the done event.
    // We can also check if the preview already exists.
    // For now, return null and let the done event carry the URL.
    return null;
  }

  async healthCheck(): Promise<EnvHealth> {
    try {
      const agents = await this.listAgents();
      const cli = agents.find((a) => a.kind === 'cli');
      if (!cli) return { ok: false, detail: '未检测到本机 CLI Agent' };
      return { ok: true, detail: `已就绪 · ${cli.name}` };
    } catch {
      return { ok: false, detail: '后端未连接' };
    }
  }
}
