import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store/AppProvider';

interface Props {
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

/**
 * 公共登录/注册弹窗。与执行环境无关，登录态在全局共享，
 * 请求始终打到当前应用部署所在的站点。
 */
export default function AuthModal({ onClose }: Props) {
  const { login, register } = useApp();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (authMode === 'register') {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || '操作失败');
    } finally {
      setBusy(false);
    }
  };

  const dialog = (
    <div className="env-modal-wrap" onClick={onClose}>
      <div className="modal env-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{authMode === 'register' ? '注册账号' : '登录'}</h2>
          <button className="icon-btn" title="关闭" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="env-form">
            <div className="env-field">
              <div className="env-seg">
                <button
                  type="button"
                  className={`env-seg-btn ${authMode === 'login' ? 'on' : ''}`}
                  onClick={() => setAuthMode('login')}
                >
                  登录
                </button>
                <button
                  type="button"
                  className={`env-seg-btn ${authMode === 'register' ? 'on' : ''}`}
                  onClick={() => setAuthMode('register')}
                >
                  注册
                </button>
              </div>
            </div>

            <div className="env-field">
              <label className="env-label">邮箱</label>
              <input
                className="env-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="env-field">
              <label className="env-label">密码</label>
              <input
                className="env-input"
                type="password"
                placeholder={authMode === 'register' ? '至少 6 位' : '你的密码'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
            </div>

            {error && <p className="env-hint warn">{error}</p>}
          </div>
        </div>

        <div className="modal-foot">
          <span className="env-foot-hint">账号信息仅保存在服务端</span>
          <div className="foot-right">
            <button className="btn-ghost" onClick={onClose}>
              取消
            </button>
            <button className="btn-primary" disabled={busy} onClick={submit}>
              {busy ? '处理中…' : authMode === 'register' ? '注册并登录' : '登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
