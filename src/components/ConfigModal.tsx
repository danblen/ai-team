import { useState } from 'react';
import { getLlmConfig, saveLlmConfig } from '../lib/llm-config';
import type { HealthInfo } from '../lib/types';

interface Props {
  health: HealthInfo | null;
  onClose: () => void;
}

export default function ConfigModal({ health, onClose }: Props) {
  const saved = getLlmConfig();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl);
  const [model, setModel] = useState(saved.model);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !saving;

  const handleSave = () => {
    setError(null);
    setSaving(true);
    try {
      const body: { apiKey?: string; baseUrl?: string; model?: string } = {};
      if (apiKey) body.apiKey = apiKey;
      if (baseUrl) body.baseUrl = baseUrl;
      if (model) body.model = model;
      saveLlmConfig(body);
      onClose();
    } catch (err) {
      setError((err as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const configured = Boolean(saved.apiKey);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="config-head">
          <div className="config-head-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div className="config-head-text">
            <h2>LLM 配置</h2>
            <p className="config-sub">API Key 仅保存在浏览器本地，不会上传到服务端</p>
          </div>
          <button className="config-close" onClick={onClose}>×</button>
        </div>

        <div className="config-body">
          {!health && (
            <div className="config-error">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>无法连接后端服务，请确认已启动。</span>
            </div>
          )}

          <div className="cfg-group cfg-group-key">
            <div className="cfg-row">
              <label htmlFor="cfg-apikey">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                API Key
              </label>
              <span className={`cfg-badge ${configured ? 'on' : 'off'}`}>
                <span className="cfg-dot" />
                {configured ? '已配置' : '未配置'}
              </span>
            </div>
            <input
              id="cfg-apikey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={configured ? '留空则不修改' : 'sk-...'}
              autoComplete="off"
              className="cfg-input"
            />
          </div>

          <div className="cfg-group">
            <label htmlFor="cfg-baseurl" className="cfg-label">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Base URL
            </label>
            <input id="cfg-baseurl" type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" className="cfg-input" />
          </div>

          <div className="cfg-group">
            <label htmlFor="cfg-model" className="cfg-label">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Model
            </label>
            <input id="cfg-model" type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" className="cfg-input" />
          </div>

          {error && (
            <div className="config-error">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="config-foot">
          <button className="cfg-btn cfg-btn-ghost" onClick={onClose} disabled={saving}>
            取消
          </button>
          <button className="cfg-btn cfg-btn-primary" onClick={handleSave} disabled={!canSave}>
            {saving ? <><span className="spinner" /> 保存中…</> : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
