import type { FileLanguage, ProjectFile, TreeNode } from './types';

/** Infer a source language from a file path's extension. */
export function languageOf(path: string): FileLanguage {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  switch (ext) {
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'ts':
      return 'ts';
    case 'json':
      return 'json';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'js';
    default:
      return 'text';
  }
}

export function fileIcon(path: string): string {
  switch (languageOf(path)) {
    case 'html':
      return '🌐';
    case 'css':
      return '🎨';
    case 'jsx':
    case 'tsx':
      return '⚛️';
    case 'ts':
      return '🔷';
    case 'js':
      return '⚡';
    case 'json':
      return '🧩';
    default:
      return '📄';
  }
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Build a hierarchical folder/file tree from a flat project file list.
 * Folders are sorted before files, both alphabetically.
 */
export function buildFileTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', children: [] };

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let node = root;
    let acc = '';
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isLeaf = i === parts.length - 1;
      if (isLeaf) {
        node.children!.push({ name: part, path: acc, file });
      } else {
        let child = node.children!.find((c) => c.path === acc && c.children);
        if (!child) {
          child = { name: part, path: acc, children: [] };
          node.children!.push(child);
        }
        node = child;
      }
    });
  }

  const sort = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      const af = a.children ? 0 : 1;
      const bf = b.children ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) if (n.children) sort(n.children);
    return nodes;
  };

  return sort(root.children!);
}

/** Flatten to the list of file leaves (depth-first) for default selection. */
export function firstFilePath(files: ProjectFile[]): string {
  const preferred = files.find((f) => /main\.(jsx|tsx|js|ts)$/.test(f.path));
  if (preferred) return preferred.path;
  const app = files.find((f) => /App\.(jsx|tsx)$/.test(f.path));
  if (app) return app.path;
  return files[0]?.path || '';
}
