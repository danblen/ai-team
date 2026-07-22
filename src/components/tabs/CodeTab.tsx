import { useEffect, useMemo, useState } from 'react';
import CodeViewer from '../CodeViewer';
import { buildFileTree, fileIcon, firstFilePath, humanSize, languageOf } from '../../lib/files';
import type { ProjectFile, TreeNode } from '../../lib/types';

interface Props {
  files: ProjectFile[];
  streaming: boolean;
  projectDir?: string;
}

export default function CodeTab({ files, streaming, projectDir }: Props) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  const [selected, setSelected] = useState('');
  const [copied, setCopied] = useState(false);

  const active = files.find((f) => f.path === selected) || null;

  // Keep a valid selection as files change (first render / new generation).
  useEffect(() => {
    if (files.length === 0) {
      if (selected) setSelected('');
      return;
    }
    if (!files.some((f) => f.path === selected)) setSelected(firstFilePath(files));
  }, [files, selected]);

  if (files.length === 0) {
    return (
      <div className="tab-pane">
        <div className="pane-empty">
          <div className="pane-empty-glyph">{'</>'}</div>
          <p>代码编辑器</p>
          <span>智能体生成应用后，项目源码会以文件树结构展示在这里，可点击查看每个文件。</span>
        </div>
      </div>
    );
  }

  const copy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const download = () => {
    if (!active) return;
    const blob = new Blob([active.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = active.path.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tab-pane code-tab">
      <div className="file-tree">
        <div className="tree-head">项目文件 · {files.length}</div>
        <div className="tree-root">
          {tree.map((node) => (
            <TreeItem key={node.path} node={node} depth={0} selected={selected} onSelect={setSelected} />
          ))}
        </div>
      </div>

      <div className="code-main">
        <div className="pane-toolbar">
          <span className="code-path">{active ? active.path : '选择一个文件'}</span>
          {projectDir && <span className="code-project-dir" title="项目磁盘路径">{projectDir}</span>}
          <div className="pane-actions">
            <button className="icon-btn text" onClick={copy} disabled={!active}>
              {copied ? '已复制 ✓' : '复制'}
            </button>
            <button className="icon-btn text" onClick={download} disabled={!active}>
              下载
            </button>
          </div>
        </div>
        <div className="code-scroll-wrap">
          <CodeViewer code={active?.content || ''} streaming={streaming} />
        </div>
      </div>
    </div>
  );
}

function TreeItem({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: string;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const pad = { paddingLeft: 10 + depth * 14 };

  if (node.children) {
    return (
      <div className="tree-node">
        <button className="tree-folder" style={pad} onClick={() => setOpen((v) => !v)}>
          <span className={`folder-caret${open ? ' open' : ''}`}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l5 4-5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span className="folder-name">{node.name}</span>
        </button>
        {open && (
          <div className="tree-children">
            {node.children.map((c) => (
              <TreeItem key={c.path} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const active = node.path === selected;
  return (
    <button
      className={`tree-file ${active ? 'active' : ''}`}
      style={pad}
      onClick={() => onSelect(node.path)}
      title={node.path}
    >
      <span className="file-ico">{fileIcon(node.path)}</span>
      <span className="file-name">{node.name}</span>
      <span className="file-size">{node.file ? humanSize(node.file.content.length) : ''}</span>
      <span className="file-lang">{node.file ? languageOf(node.file.path) : ''}</span>
    </button>
  );
}
