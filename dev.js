import net from 'node:net';
import { spawn } from 'node:child_process';

function portAvailable(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.on('error', () => resolve(false));
    s.listen({ port, host: '0.0.0.0', reuseAddr: true }, () => {
      s.close();
      resolve(true);
    });
  });
}

async function findPortPair(baseFe) {
  let fe = baseFe;
  while (!(await portAvailable(fe) && await portAvailable(fe + 10))) {
    fe++;
  }
  return { fe, be: fe + 10 };
}

async function main() {
  const { fe, be } = await findPortPair(5100);

  console.log(`\n  [dev] FE → ${fe}, BE → ${be}\n`);

  const server = spawn('node', ['server/index.js'], {
    env: { ...process.env, SERVER_PORT: String(be) },
    stdio: 'inherit',
  });

  const web = spawn('npx', ['vite'], {
    env: { ...process.env, FE_PORT: String(fe), SERVER_PORT: String(be) },
    stdio: 'inherit',
  });

  const cleanup = () => {
    server.kill();
    web.kill();
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  server.on('close', (code) => {
    if (code) web.kill();
    process.exit(code ?? 0);
  });
  web.on('close', (code) => {
    server.kill();
    process.exit(code ?? 0);
  });
}

main();
