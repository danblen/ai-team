import { useState } from 'react';
import { useApp } from '../store/AppProvider';
import DirBrowserModal from './DirBrowserModal';

/**
 * 每轮对话可选择的本地工作目录入口。仅本地模式显示。
 * 选定目录后直接作为项目根，代码区即打开该目录。
 */
export default function WorkspaceBar() {
  const app = useApp();
  const [open, setOpen] = useState(false);

  // 仅本地模式暴露（避免远程 / SSH 泄露服务器文件系统）。
  if (app.envConfig.mode !== 'local') return null;

  const workDir = app.current.workDir;
  const sid = app.current.id;

  return (
    <div className="workspace-bar-pick">
      <span className="wsp-ico">📂</span>
      {workDir ? (
        <span className="wsp-path" title={workDir}>
          {workDir}
        </span>
      ) : (
        <span className="wsp-path muted">未选目录 · 默认自动创建项目目录</span>
      )}
      <div className="wsp-actions">
        <button className="icon-btn text" onClick={() => setOpen(true)} disabled={app.running}>
          选择目录
        </button>
        {workDir && (
          <button
            className="icon-btn text"
            onClick={() => app.setSessionWorkDir(sid, null)}
            disabled={app.running}
          >
            清除
          </button>
        )}
      </div>

      {open && (
        <DirBrowserModal
          initialPath={workDir}
          onPick={(dir) => {
            setOpen(false);
            app.setSessionWorkDir(sid, dir);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
