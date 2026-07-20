import { useState } from 'react';
import { useApp } from '../../store/AppProvider';
import { humanSize } from '../../lib/files';

type Phase = 'idle' | 'building' | 'done';

export default function PublishTab() {
  const app = useApp();
  const files = app.current.files;
  const hasFiles = files.length > 0;
  const [phase, setPhase] = useState<Phase>('idle');
  const [url, setUrl] = useState('');

  const totalBytes = files.reduce((sum, f) => sum + f.content.length, 0);

  const publish = () => {
    if (!hasFiles) return;
    setPhase('building');
    setTimeout(() => {
      const slug =
        (app.current.title || 'ai-team')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 24) || 'app';
      setUrl(`https://${slug}-${Math.random().toString(36).slice(2, 6)}.atoms.app`);
      setPhase('done');
    }, 1600);
  };

  const downloadProject = () => {
    // Bundle the project as a single readable text manifest.
    const manifest = files
      .map((f) => `/* ==== ${f.path} ==== */\n${f.content}`)
      .join('\n\n');
    const blob = new Blob([manifest], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${app.current.title || 'ai-team-project'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="tab-pane">
      <div className="pane-toolbar">
        <span className="pane-title">发布网站</span>
      </div>
      <div className="pane-body publish-body">
        {!hasFiles ? (
          <div className="pane-empty">
            <div className="pane-empty-glyph">🚀</div>
            <p>还没有可发布的应用</p>
            <span>先在左侧描述需求，让智能体生成应用后即可一键发布。</span>
          </div>
        ) : (
          <div className="publish-card">
            <div className="publish-preview">
              <span className="publish-glyph">🚀</span>
              <strong>{app.current.title || 'AI Team App'}</strong>
              <span className="publish-hint">
                {app.current.framework === 'react' ? 'React 项目' : '单页应用'} · {files.length} 个文件 ·{' '}
                {humanSize(totalBytes)}
              </span>
            </div>

            {phase === 'done' ? (
              <div className="publish-result">
                <span className="publish-live">● 已上线</span>
                <a className="publish-url" href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
                <div className="publish-actions">
                  <button className="btn-primary" onClick={() => navigator.clipboard.writeText(url)}>
                    复制链接
                  </button>
                  <button className="btn-ghost" onClick={() => setPhase('idle')}>
                    重新发布
                  </button>
                </div>
              </div>
            ) : (
              <div className="publish-actions">
                <button className="btn-primary" disabled={phase === 'building'} onClick={publish}>
                  {phase === 'building' ? '正在构建并发布…' : '一键发布'}
                </button>
                <button className="btn-ghost" onClick={downloadProject}>
                  下载源码
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
