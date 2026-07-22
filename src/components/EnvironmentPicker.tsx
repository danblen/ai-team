import { useState } from 'react';
import type { EnvironmentConfig } from '../lib/env/types';
import EnvironmentConfigModal from './EnvironmentConfigModal';

interface Props {
  config: EnvironmentConfig;
  onChange: (config: EnvironmentConfig) => void;
}

const MODE_META: Record<EnvironmentConfig['mode'], { icon: string; label: string }> = {
  local: { icon: '🖥', label: '本地' },
  ssh: { icon: '🔒', label: 'SSH' },
  remote: { icon: '☁️', label: '云端' },
};

/** 当前环境摘要（picker 按钮上显示的一行小字）。 */
function summary(config: EnvironmentConfig): string {
  if (config.mode === 'local') {
    return config.local.engine === 'builtin' ? '内置团队' : `CLI · ${config.local.cliId}`;
  }
  if (config.mode === 'ssh') {
    return config.ssh.host ? `${config.ssh.username}@${config.ssh.host}` : '未配置主机';
  }
  return config.remote.url ? new URL(safeUrl(config.remote.url)).host : '未配置实例';
}

function safeUrl(url: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    return 'https://invalid';
  }
}

export default function EnvironmentPicker({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const meta = MODE_META[config.mode];

  return (
    <>
      <button
        className="env-picker"
        type="button"
        title="切换执行环境（本地 / SSH / 云端）"
        onClick={() => setOpen(true)}
      >
        <span className="env-picker-icon">{meta.icon}</span>
        <span className="env-picker-text">
          <span className="env-picker-mode">{meta.label}</span>
          <span className="env-picker-summary">{summary(config)}</span>
        </span>
        <span className="env-picker-caret">▾</span>
      </button>

      {open && (
        <EnvironmentConfigModal config={config} onSave={onChange} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

// 命名导出便于测试
export { summary as envSummary };
