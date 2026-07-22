import { useCallback, useEffect, useState } from 'react';
import ChatPanel from './components/ChatPanel';
import WorkspacePanel from './components/WorkspacePanel';
import SessionSidebar from './components/SessionSidebar';
import ConfigModal from './components/ConfigModal';
import AuthModal from './components/AuthModal';
import { fetchHealth } from './lib/api';
import { projectDirName } from './lib/storage';
import { useApp } from './store/AppProvider';
import type { HealthInfo } from './lib/types';

export default function App() {
  const app = useApp();
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const refreshHealth = useCallback(() => {
    fetchHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const handleConfigClose = useCallback(() => {
    setConfigOpen(false);
    refreshHealth();
  }, [refreshHealth]);

  const displayFiles =
    app.running && app.liveFiles.length ? app.liveFiles : app.current.files;

  // 会话选定目录时直接用它；否则沿用「工作根目录/项目名」。
  const projectDir = app.current.workDir
    ? app.current.workDir
    : app.envConfig?.local?.workDir
      ? `${app.envConfig.local.workDir}/${projectDirName(app.current.title, app.current.id)}`
      : undefined;

  return (
    <div className={`app ${sidebarOpen ? '' : 'no-sidebar'}`}>
      <main className="workbench">
        {sidebarOpen ? (
          <SessionSidebar
            health={health}
            onToggleSidebar={() => setSidebarOpen(false)}
            onOpenConfig={() => setConfigOpen(true)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        ) : (
          <button
            className="sidebar-expand"
            title="展开侧栏"
            onClick={() => setSidebarOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18L15 12L9 6" />
            </svg>
          </button>
        )}
        <ChatPanel />
        <WorkspacePanel
          files={displayFiles}
          activeTab={app.activeTab}
          onTabChange={app.setActiveTab}
          streaming={app.running}
          projectDir={projectDir}
        />
      </main>
      {configOpen && (
        <ConfigModal
          health={health}
          onClose={handleConfigClose}
        />
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
