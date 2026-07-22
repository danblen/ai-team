import { useState } from 'react';
import EnvironmentPicker from './EnvironmentPicker';
import { LogoIcon } from './LogoIcon';
import { useApp } from '../store/AppProvider';
import type { HealthInfo } from '../lib/types';

interface Props {
  health: HealthInfo | null;
  onToggleSidebar: () => void;
  onOpenConfig: () => void;
  onOpenAuth: () => void;
}

export default function SessionSidebar({ health, onToggleSidebar, onOpenConfig, onOpenAuth }: Props) {
  const app = useApp();
  const { envConfig, setEnvConfig, authEmail, logout } = app;
  const configured = health?.configured;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setDraft(title);
  };

  const commitRename = () => {
    if (editingId) app.renameSession(editingId, draft);
    setEditingId(null);
  };

  return (
    <aside className="sidebar">
      {/* 顶部：Logo */}
      <div className="sidebar-brand">
        <LogoIcon size={30} className="brand-logo" />
        <span className="brand-name">AI Team</span>
      </div>

      {/* Logo 下方：模式切换 + 收起按钮 */}
      <div className="sidebar-modebar">
        <EnvironmentPicker config={envConfig} onChange={setEnvConfig} />
        <button className="icon-btn sidebar-toggle" title="收起侧栏" onClick={onToggleSidebar}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18L9 12L15 6" />
          </svg>
        </button>
      </div>

      <button className="new-session" onClick={app.newSession}>
        <span className="plus">＋</span> 新建会话
      </button>

      <div className="session-list">
        {app.sessions.map((s) => {
          const active = s.id === app.current.id;
          const running = app.isRunning(s.id);
          const icon = running ? '' : s.files.length > 0 ? '🟢' : '💬';
          return (
            <div
              key={s.id}
              className={`session-item ${active ? 'active' : ''}`}
              onClick={() => app.switchSession(s.id)}
            >
              <span className="session-icon">
                {running ? <span className="session-spinner" /> : icon}
              </span>
              {editingId === s.id ? (
                <input
                  className="session-rename"
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="session-info">
                  {s.projectName && (
                    <span className="session-project">{s.projectName}</span>
                  )}
                  <span
                    className="session-title"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(s.id, s.title);
                    }}
                  >
                    {s.title}
                  </span>
                </div>
              )}
              <button
                className="session-del"
                title="删除会话"
                onClick={(e) => {
                  e.stopPropagation();
                  app.deleteSession(s.id);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* 底部：连接状态 + 用户区域 */}
      <div className="sidebar-foot-area">
        <button
          type="button"
          className={`status-pill ${configured ? 'ok' : 'warn'}`}
          title={health ? `模型: ${health.model}\n服务: ${health.baseUrl}` : '无法连接后端服务'}
          onClick={onOpenConfig}
        >
          <span className="status-dot" />
          {health
            ? configured
              ? `已连接 · ${health.model}`
              : '未配置 API Key'
            : '后端未连接'}
        </button>
        {authEmail ? (
          <button className="btn ghost user-btn" onClick={logout} title="点击退出登录">
            👤 {authEmail} · 退出
          </button>
        ) : (
          <button className="btn ghost user-btn" onClick={onOpenAuth} title="登录 / 注册">
            登录 / 注册
          </button>
        )}
      </div>
    </aside>
  );
}
