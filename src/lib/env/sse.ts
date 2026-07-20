import type { AgentEvent } from './types';
import type { ProjectFile } from '../types';

/**
 * Shared SSE stream consumer for execution environments.
 * Parses a fetch Response body as an SSE stream and yields AgentEvents.
 */
export async function* consumeSSE(res: Response): AsyncIterable<AgentEvent> {
  if (!res.ok || !res.body) {
    const msg =
      res.status === 500
        ? (await res.json().catch(() => ({ error: '服务器错误' }))).error
        : `请求失败 (${res.status})`;
    yield { type: 'error', text: msg };
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

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(dataLine);
        } catch {
          continue;
        }

        if (event === 'delta' && typeof payload.text === 'string') {
          yield { type: 'delta', text: payload.text };
        } else if (event === 'status' && typeof payload.text === 'string') {
          yield { type: 'status', text: payload.text };
        } else if (event === 'done') {
          const files = (payload.files || []) as ProjectFile[];
          const previewUrl = typeof payload.previewUrl === 'string' ? payload.previewUrl : null;
          yield { type: 'done', text: 'CLI 执行完成', files, previewUrl };
          return;
        } else if (event === 'error') {
          yield { type: 'error', text: (payload.text as string) || '执行失败' };
          return;
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      yield { type: 'status', text: '已中止' };
    } else {
      yield { type: 'error', text: (err as Error).message || '读取流失败' };
    }
  }
}
