import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AvailableAgent, EnvironmentConfig, EnvironmentMode } from '../lib/env/types';
import { detectAgents } from '../lib/api';
import LocalForm from './env/LocalForm';
import SSHForm from './env/SSHForm';
import RemoteForm from './env/RemoteForm';

interface Props {
  config: EnvironmentConfig;
  onSave: (config: EnvironmentConfig) => void;
  onClose: () => void;
}

const MODES: { id: EnvironmentMode; label: string; desc: string }[] = [
  { id: 'local', label: '本地', desc: '在你的电脑上运行，直接访问本地文件' },
  { id: 'ssh', label: 'SSH', desc: '连接到你自己的服务器（云主机 / 虚拟机 / 容器）' },
  { id: 'remote', label: '云端', desc: '登录你部署的实例（如 siplgo.xyz），直接在服务器上跑 CLI 改代码' },
];

export default function EnvironmentConfigModal({ config, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<EnvironmentConfig>(config);
  const [agents, setAgents] = useState<AvailableAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // ESC key closes the modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 检测本机 CLI（仅 local 模式需要）。
  useEffect(() => {
    if (draft.mode !== 'local') return;
    let cancelled = false;
    setLoadingAgents(true);
    detectAgents('local')
      .then((list) => {
        if (!cancelled) setAgents(list);
      })
      .catch(() => {
        if (!cancelled) setAgents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAgents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draft.mode]);

  const patch = (p: Partial<EnvironmentConfig>) => setDraft((d) => ({ ...d, ...p }));

  const dialog = (
    <div className="env-modal-wrap" onClick={onClose}>
      <div className="modal env-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>执行环境</h2>
          <button className="icon-btn" title="关闭" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="env-mode-tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`env-mode-tab ${draft.mode === m.id ? 'on' : ''}`}
              onClick={() => patch({ mode: m.id })}
            >
              <span className="env-mode-label">{m.label}</span>
              <span className="env-mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>

        <div className="modal-body">
          {draft.mode === 'local' && (
            <LocalForm
              config={draft.local}
              agents={agents}
              loading={loadingAgents}
              onChange={(p) => patch({ local: { ...draft.local, ...p } })}
            />
          )}
          {draft.mode === 'ssh' && (
            <SSHForm config={draft.ssh} onChange={(p) => patch({ ssh: { ...draft.ssh, ...p } })} />
          )}
          {draft.mode === 'remote' && (
            <RemoteForm
              config={draft.remote}
              onChange={(p) => patch({ remote: { ...draft.remote, ...p } })}
            />
          )}
        </div>

        <div className="modal-foot">
          <span className="env-foot-hint">密钥类信息仅存后端，不会写入浏览器</span>
          <div className="foot-right">
            <button className="btn-ghost" onClick={onClose}>
              取消
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
