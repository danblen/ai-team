import { useState } from 'react';
import { useApp } from '../store/AppProvider';
import { newAgentTemplate, EMOJI_CHOICES, COLOR_CHOICES } from '../lib/agents';
import type { AgentRole } from '../lib/types';

interface Props {
  onClose: () => void;
}

export default function AgentManager({ onClose }: Props) {
  const app = useApp();
  const [draft, setDraft] = useState<AgentRole[]>(() => app.agents.map((a) => ({ ...a })));
  const [selectedId, setSelectedId] = useState<string>(app.agents[0]?.id ?? '');

  const selected = draft.find((a) => a.id === selectedId) || draft[0];

  const patch = (id: string, changes: Partial<AgentRole>) =>
    setDraft((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));

  const addAgent = () => {
    const a = newAgentTemplate();
    setDraft((prev) => [...prev, a]);
    setSelectedId(a.id);
  };

  const removeAgent = (id: string) => {
    setDraft((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (id === selectedId && next.length) setSelectedId(next[0].id);
      return next;
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    setDraft((prev) => {
      const i = prev.findIndex((a) => a.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = () => {
    app.updateAgents(draft);
    onClose();
  };

  const reset = () => {
    app.resetAgents();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal agents-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>智能体团队</h2>
            <p className="modal-sub">
              自定义精简角色，按顺序协作（CrewAI 顺序流程 · AutoGen 编排 · Swarm 轻量角色）。
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>

        <div className="agents-body">
          <div className="agents-list">
            {draft.map((a, i) => (
              <div
                key={a.id}
                className={`agent-row ${a.id === selectedId ? 'active' : ''} ${a.enabled ? '' : 'off'}`}
                onClick={() => setSelectedId(a.id)}
              >
                <span className="agent-emoji" style={{ background: a.color + '22', color: a.color }}>
                  {a.emoji}
                </span>
                <div className="agent-row-text">
                  <span className="agent-row-name">
                    {a.name}
                    {a.producesCode && <span className="code-tag">代码</span>}
                  </span>
                  <span className="agent-row-goal">{a.goal}</span>
                </div>
                <div className="agent-row-ctl" onClick={(e) => e.stopPropagation()}>
                  <button className="mini" title="上移" onClick={() => move(a.id, -1)} disabled={i === 0}>↑</button>
                  <button className="mini" title="下移" onClick={() => move(a.id, 1)} disabled={i === draft.length - 1}>↓</button>
                  <label className="switch" title="启用/停用">
                    <input
                      type="checkbox"
                      checked={a.enabled}
                      onChange={(e) => patch(a.id, { enabled: e.target.checked })}
                    />
                    <span />
                  </label>
                </div>
              </div>
            ))}
            <button className="add-agent" onClick={addAgent}>＋ 添加智能体</button>
          </div>

          {selected && (
            <div className="agent-editor">
              <div className="field-row">
                <div className="field">
                  <label>名称</label>
                  <input value={selected.name} onChange={(e) => patch(selected.id, { name: e.target.value })} />
                </div>
                <div className="field grow">
                  <label>职责（一句话）</label>
                  <input value={selected.goal} onChange={(e) => patch(selected.id, { goal: e.target.value })} />
                </div>
              </div>

              <div className="field">
                <label>图标</label>
                <div className="emoji-picker">
                  {EMOJI_CHOICES.map((e) => (
                    <button
                      key={e}
                      className={selected.emoji === e ? 'sel' : ''}
                      onClick={() => patch(selected.id, { emoji: e })}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>主题色</label>
                <div className="color-picker">
                  {COLOR_CHOICES.map((col) => (
                    <button
                      key={col}
                      className={selected.color === col ? 'sel' : ''}
                      style={{ background: col }}
                      onClick={() => patch(selected.id, { color: col })}
                    />
                  ))}
                </div>
              </div>

              <div className="field">
                <label>系统提示词（定义该角色的行为）</label>
                <textarea
                  rows={6}
                  value={selected.systemPrompt}
                  onChange={(e) => patch(selected.id, { systemPrompt: e.target.value })}
                />
              </div>

              <label className="check-line">
                <input
                  type="checkbox"
                  checked={selected.producesCode}
                  onChange={(e) => patch(selected.id, { producesCode: e.target.checked })}
                />
                该角色负责产出最终可运行代码（工程师）
              </label>

              <button className="del-agent" onClick={() => removeAgent(selected.id)} disabled={draft.length <= 1}>
                删除该智能体
              </button>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={reset}>恢复默认团队</button>
          <div className="foot-right">
            <button className="btn ghost" onClick={onClose}>取消</button>
            <button className="btn send solid" onClick={save}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
