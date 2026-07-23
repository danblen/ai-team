import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// Strip ANSI escape codes from CLI output (colors, cursor movement, etc.)
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1B\][0-9;]*\x07/g, '');
}

/** Known CLI agent definitions. */
const CLI_DEFS = {
  claude: {
    bin: 'claude',
    args: (task) => ['-p', task, '--print'],
    readyCheck: () => _which('claude'),
  },
  opencode: {
    bin: 'opencode',
    fallbackBins: ['/Volumes/z/app/opencode/opencode.sh'],
    // --dir 把项目根锁定在隔离工作目录，避免向上探测到宿主仓库。
    // --auto 自动批准权限请求（headless 无 TTY 时，external_directory / doom_loop
    //   等默认为 "ask" 的请求会被自动拒绝，导致 mkdir 等操作失败）；
    //   显式 deny 规则仍然生效。
    args: (task, workDir) =>
      workDir ? ['run', '--auto', '--dir', workDir, task] : ['run', '--auto', task],
    readyCheck: () => _which('opencode'),
  },
  aider: {
    bin: 'aider',
    args: (task) => ['--message', task, '--yes'],
    readyCheck: () => _which('aider'),
  },
};

function _which(bin) {
  return new Promise((resolve) => {
    import('node:child_process').then((cp) => {
      cp.execFile('which', [bin], { timeout: 5000 }, (err, stdout) => {
        resolve(err ? null : (stdout.trim().split('\n')[0] || null));
      });
    });
  });
}

/**
 * Scan a directory recursively for project files, excluding node_modules and dist.
 */
export function scanWorkspace(dir) {
  const files = [];
  function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return; // permission issues, skip
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git'
        || entry.name === '.published' || entry.name === '.previews'
        || entry.name === '.workspaces' || entry.name === '.loop-data') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        try {
          const rel = path.relative(dir, full);
          files.push({ path: rel, content: fs.readFileSync(full, 'utf8') });
        } catch {
          // skip unreadable files
        }
      }
    }
  }
  walk(dir);
  return files;
}

/**
 * Resolve the binary path for a CLI definition: prefer the main bin, fall back
 * to fallbackBins if the primary bin is not on PATH (handle shell aliases).
 */
function _resolveBin(def) {
  // _which returns null when not found; we use it here synchronously via fs.access
  const { bin, fallbackBins } = def;
  // First try: is the bin name itself an absolute path?
  if (bin.startsWith('/') || bin.startsWith('.')) {
    try { fs.accessSync(bin, fs.constants.X_OK); return bin; } catch {}
  }
  // Second try: resolve via fs.access on fallbackBins
  if (fallbackBins) {
    for (const fb of fallbackBins) {
      try { fs.accessSync(fb, fs.constants.X_OK); return fb; } catch {}
    }
  }
  // Last resort: return the bin name and let spawn fail with a clear error
  return bin;
}

/**
 * Run a CLI agent with the given task.
 *
 * @param {string} cliId - 'claude' | 'opencode' | 'aider'
 * @param {string} task - the task prompt
 * @param {string} workDir - working directory (absolute path)
 * @param {object} callbacks
 * @param {(text: string) => void} callbacks.onDelta - stdout text chunk
 * @param {(text: string) => void} callbacks.onStatus - stderr / status info
 * @param {AbortSignal} [callbacks.signal] - optional abort signal
 * @returns {Promise<number>} exit code
 */
export function runCLI(cliId, task, workDir, callbacks) {
  const def = CLI_DEFS[cliId];
  if (!def) return Promise.reject(new Error(`不支持的 CLI Agent: ${cliId}`));

  // 确定可执行文件路径：主 bin 或 fallbackBins 中第一个存在的
  const binPath = _resolveBin(def);
  if (!binPath) return Promise.reject(new Error(`找不到 ${cliId} 的可执行文件`));

  const args = def.args(task, workDir);

  const child = spawn(binPath, args, {
    cwd: workDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    shell: false,
  });

  let aborted = false;
  if (callbacks.signal) {
    const onAbort = () => {
      aborted = true;
      child.kill('SIGTERM');
      // Force kill after 5s if SIGTERM didn't work
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000);
    };
    if (callbacks.signal.aborted) {
      onAbort();
    } else {
      callbacks.signal.addEventListener('abort', onAbort, { once: true });
    }
  }

  child.stdout.on('data', (chunk) => {
    const cleaned = stripAnsi(chunk.toString());
    if (cleaned && callbacks.onDelta) callbacks.onDelta(cleaned);
  });

  child.stderr.on('data', (chunk) => {
    const cleaned = stripAnsi(chunk.toString());
    if (cleaned && callbacks.onStatus) callbacks.onStatus(cleaned);
  });

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (aborted) return reject(new Error('CLI 执行被中止'));
      resolve(code ?? -1);
    });
    child.on('error', (err) => {
      if (aborted) return;
      reject(new Error(`启动 CLI ${def.bin} 失败: ${err.message}`));
    });
  });
}
