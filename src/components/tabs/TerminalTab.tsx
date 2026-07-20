import { useEffect, useRef } from 'react';
import { useApp } from '../../store/AppProvider';
import type { LogLevel } from '../../lib/types';

const PREFIX: Record<LogLevel, string> = {
  cmd: '$',
  info: '›',
  agent: '▶',
  ok: '✔',
  error: '✖',
};

function fmtTime(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function TerminalTab() {
  const app = useApp();
  const logs = app.current.logs;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [logs, app.running]);

  return (
    <div className="tab-pane">
      <div className="pane-toolbar term-toolbar">
        <span className="pane-title">
          <span className="term-dot" /> 终端 · agent-runtime
        </span>
        <span className="term-status">{app.running ? '运行中…' : '空闲'}</span>
      </div>
      <div className="term-body">
        {logs.length === 0 && !app.running ? (
          <div className="term-line muted">$ 等待任务开始。在左侧输入需求，智能体运行日志会实时输出到这里。</div>
        ) : (
          logs.map((l) => (
            <div key={l.id} className={`term-line lvl-${l.level}`}>
              <span className="term-time">{fmtTime(l.time)}</span>
              <span className="term-prefix">{PREFIX[l.level]}</span>
              <span className="term-text">{l.text}</span>
            </div>
          ))
        )}
        {app.running && (
          <div className="term-line running">
            <span className="term-cursor" /> 正在执行…
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
