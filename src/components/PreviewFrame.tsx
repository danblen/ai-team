import { useEffect, useRef } from 'react';

interface Props {
  code: string;
  reloadKey: number;
  streaming: boolean;
}

/**
 * Renders generated HTML inside a sandboxed iframe.
 *
 * While streaming we deliberately DON'T remount the iframe on every keystroke
 * (that would flash). Instead we push the latest code via srcdoc only when it
 * changes, and fully reload when the user hits the refresh button.
 */
export default function PreviewFrame({ code, reloadKey, streaming }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame && code) frame.srcdoc = code;
  }, [code, reloadKey]);

  if (!code) {
    return (
      <div className="preview-empty">
        <div className="preview-empty-inner">
          <div className="preview-glyph">▦</div>
          <p>预览区</p>
          <span>生成的应用会在这里实时运行，就像真实产品一样可交互。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-wrap">
      <iframe
        ref={frameRef}
        className="preview-frame"
        title="生成的应用预览"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-pointer-lock"
      />
      {streaming && (
        <div className="preview-live-tag">
          <span className="spinner" /> 实时构建中
        </div>
      )}
    </div>
  );
}
