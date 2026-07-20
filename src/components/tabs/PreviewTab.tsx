import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/AppProvider';


export default function PreviewTab() {
  const app = useApp();
  const url = app.current.previewUrl || '';
  const building = app.building;
  const [reloadKey, setReloadKey] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Reload the iframe when a new build finishes.
  useEffect(() => {
    if (url) setReloadKey((k) => k + 1);
  }, [url]);

  const openInBrowser = () => {
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="tab-pane">
      <div className="pane-toolbar">
        <span className="pane-title">
          预览
          {url && <span className="preview-url-chip">{url}</span>}
        </span>
        <div className="pane-actions">
          <button className="icon-btn" title="刷新" disabled={!url} onClick={() => setReloadKey((k) => k + 1)}>
            ⟳
          </button>
          <button className="icon-btn" title="在浏览器打开" disabled={!url} onClick={openInBrowser}>
            ↗
          </button>
        </div>
      </div>
      <div className="pane-body preview-body">
        {url ? (
          <div className="preview-wrap">
            <iframe
              key={reloadKey}
              ref={frameRef}
              className="preview-frame"
              title="项目预览"
              src={url}
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
            />
          </div>
        ) : (
          <div className="pane-empty">暂无预览</div>
        )}
        {building && (
          <div className="preview-live-tag">
            <span className="spinner" /> Vite 构建中…
          </div>
        )}
      </div>
    </div>
  );
}
