import { useApp } from '../../store/AppProvider';
import { fileIcon, humanSize, languageOf } from '../../lib/files';

interface Props {
  onOpenInEditor: () => void;
}

export default function FilesTab({ onOpenInEditor }: Props) {
  const app = useApp();
  const files = app.current.files;

  if (files.length === 0) {
    return (
      <div className="tab-pane">
        <div className="pane-empty">
          <div className="pane-empty-glyph">🗂</div>
          <p>暂无生成文件</p>
          <span>智能体生成应用后，项目的源码、组件与样式文件会归档展示在这里。</span>
        </div>
      </div>
    );
  }

  const total = files.reduce((n, f) => n + f.content.length, 0);

  return (
    <div className="tab-pane">
      <div className="pane-toolbar">
        <span className="pane-title">生成文件 · {files.length} 个</span>
        <span className="pane-sub">{humanSize(total)}</span>
      </div>
      <div className="pane-body files-body">
        <div className="files-grid">
          {files.map((f) => (
            <button key={f.path} className="file-card" onClick={onOpenInEditor} title={`在代码编辑器中打开 ${f.path}`}>
              <span className="file-card-ico">{fileIcon(f.path)}</span>
              <span className="file-card-name">{f.path.split('/').pop()}</span>
              <span className="file-card-path">{f.path}</span>
              <span className="file-card-meta">
                {languageOf(f.path).toUpperCase()} · {humanSize(f.content.length)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
