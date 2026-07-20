import { useEffect, useMemo, useRef } from 'react';

interface Props {
  code: string;
  streaming: boolean;
}

export default function CodeViewer({ code, streaming }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Follow the tail of the code while it streams in.
  useEffect(() => {
    if (streaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [code, streaming]);

  const lines = useMemo(() => (code ? code.split('\n') : []), [code]);

  if (!code) {
    return (
      <div className="preview-empty">
        <div className="preview-empty-inner">
          <div className="preview-glyph">{'</>'}</div>
          <p>代码区</p>
          <span>AI 生成的应用源码会在这里逐行显示。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="code-view" ref={scrollRef}>
      <pre className="code-pre">
        <div className="gutter" aria-hidden>
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <code className="code-text">
          {lines.map((line, i) => (
            <span key={i} className="code-line">
              {line || ' '}
              {'\n'}
            </span>
          ))}
          {streaming && <span className="caret" />}
        </code>
      </pre>
    </div>
  );
}
