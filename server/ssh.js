import { Client } from 'ssh2';
import path from 'node:path';
import fs from 'node:fs';

// Strip ANSI escape codes from CLI output
function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1B\][0-9;]*\x07/g, '');
}

/**
 * Connect to a remote host via SSH2.
 * @returns {Promise<Client>}
 */
function connectSSH(sshConfig) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const { host, port, username, authMethod, privateKeyPath, password } = sshConfig;

    const opts = {
      host,
      port: port || 22,
      username,
      readyTimeout: 15000,
      keepaliveInterval: 10000,
    };

    if (authMethod === 'key' && privateKeyPath) {
      const resolved = privateKeyPath.replace(/^~(?=$|\/)/, process.env.HOME || process.env.USERPROFILE || '');
      if (fs.existsSync(resolved)) {
        opts.privateKey = fs.readFileSync(resolved, 'utf8');
      } else if (privateKeyPath.startsWith('-----BEGIN')) {
        opts.privateKey = privateKeyPath; // raw PEM content
      } else {
        return reject(new Error(`私钥文件不存在: ${privateKeyPath}`));
      }
    } else if (authMethod === 'password') {
      opts.password = password ?? '';
    }

    conn.on('ready', () => resolve(conn));
    conn.on('error', (err) => reject(err));
    conn.connect(opts);
  });
}

/**
 * Execute a command on the remote host, streaming stdout/stderr via callbacks.
 * @returns {Promise<number>} exit code
 */
function execStream(conn, command, callbacks) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);

      stream.on('data', (data) => {
        const text = stripAnsi(data.toString());
        if (text && callbacks.onDelta) callbacks.onDelta(text);
      });

      stream.stderr.on('data', (data) => {
        const text = stripAnsi(data.toString());
        if (text && callbacks.onStatus) callbacks.onStatus(text);
      });

      stream.on('close', (exitCode) => {
        resolve(exitCode ?? 0);
      });
    });
  });
}

/**
 * Recursively download files from a remote directory via SFTP.
 * Also writes files to localDir on disk.
 * @returns {Promise<Array<{path:string, content:string}>>}
 */
async function syncRemoteFiles(conn, remoteDir, localDir) {
  const sftp = await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) reject(err);
      else resolve(sftp);
    });
  });
  fs.mkdirSync(localDir, { recursive: true });

  const files = [];

  async function walk(dir) {
    let list;
    try {
      list = await new Promise((resolve, reject) => {
        sftp.readdir(dir, (err, list) => {
          if (err) reject(err);
          else resolve(list);
        });
      });
    } catch {
      return; // directory doesn't exist or is inaccessible
    }

    for (const item of list) {
      if (item.filename === '.' || item.filename === '..') continue;
      if (item.filename === 'node_modules' || item.filename === 'dist' || item.filename === '.git') continue;

      const fullPath = path.posix.join(dir, item.filename);

      if (item.attrs.isDirectory()) {
        await walk(fullPath);
      } else if (item.attrs.isFile()) {
        try {
          const content = await new Promise((resolve, reject) => {
            sftp.readFile(fullPath, { encoding: 'utf8' }, (err, data) => {
              if (err) reject(err);
              else resolve(data);
            });
          });
          const relPath = path.posix.relative(remoteDir, fullPath);
          files.push({ path: relPath, content: String(content) });

          // Write to local disk for preview build
          const localPath = path.join(localDir, relPath);
          fs.mkdirSync(path.dirname(localPath), { recursive: true });
          fs.writeFileSync(localPath, String(content), 'utf8');
        } catch {
          // skip unreadable/binary files
        }
      }
    }
  }

  await walk(remoteDir);
  sftp.end();
  return files;
}

// Commands for each CLI type (shell-escaped)
const CLI_COMMANDS = {
  claude: (workDir, task) =>
    `mkdir -p ${shellEscape(workDir)} && cd ${shellEscape(workDir)} && claude -p ${shellEscape(task)} --print`,
  opencode: (workDir, task) =>
    `mkdir -p ${shellEscape(workDir)} && cd ${shellEscape(workDir)} && opencode -p ${shellEscape(task)}`,
  aider: (workDir, task) =>
    `mkdir -p ${shellEscape(workDir)} && cd ${shellEscape(workDir)} && aider --message ${shellEscape(task)} --yes`,
};

/** Simple shell escaping: wrap in single quotes and handle inner single quotes. */
function shellEscape(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

/**
 * Full SSH run lifecycle: connect → exec CLI → sync files → disconnect.
 *
 * @param {object} sshConfig — host / port / username / authMethod / privateKeyPath / password
 * @param {string} cliId — 'claude' | 'opencode' | 'aider'
 * @param {string} task — task prompt
 * @param {string} remoteWorkDir — absolute or ~ path on the remote host
 * @param {string} localWorkDir — absolute path on the local server to sync files into
 * @param {object} callbacks — { onDelta?, onStatus?, signal? }
 * @returns {Promise<Array<{path:string, content:string}>>} synced files
 */
export async function runSSHAndSync(sshConfig, cliId, task, remoteWorkDir, localWorkDir, callbacks) {
  let conn;

  try {
    if (callbacks.onStatus) callbacks.onStatus(`正在连接 ${sshConfig.host}:${sshConfig.port || 22}…`);

    conn = await connectSSH(sshConfig);

    if (callbacks.signal?.aborted) throw new Error('用户中止');
    if (callbacks.onStatus) callbacks.onStatus(`已连接，正在执行 ${cliId}…`);

    const cmdBuilder = CLI_COMMANDS[cliId];
    if (!cmdBuilder) throw new Error(`不支持的 CLI Agent: ${cliId}`);

    const exitCode = await execStream(conn, cmdBuilder(remoteWorkDir, task), callbacks);

    if (callbacks.signal?.aborted) throw new Error('用户中止');
    if (exitCode !== 0) throw new Error(`远程 CLI 退出，代码: ${exitCode}`);

    if (callbacks.onStatus) callbacks.onStatus('CLI 执行完成，正在同步文件…');

    const files = await syncRemoteFiles(conn, remoteWorkDir, localWorkDir);
    return files;
  } finally {
    try { conn?.end(); } catch {}
  }
}

/**
 * Test SSH connection to remote host.
 */
export async function testSSH(sshConfig) {
  let conn;
  try {
    conn = await connectSSH(sshConfig);
    return { ok: true, detail: `已连接到 ${sshConfig.host}:${sshConfig.port || 22}` };
  } catch (err) {
    return { ok: false, detail: err.message || '连接失败' };
  } finally {
    try { conn?.end(); } catch {}
  }
}
