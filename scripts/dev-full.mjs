import { spawnSync } from 'node:child_process';

const hasDocker = spawnSync('docker', ['--version'], { stdio: 'ignore' }).status === 0;

if (hasDocker) {
  console.log('Docker detectado: executando fluxo completo com banco local (dev:full com db).');
  process.exit(spawnSync('npm', ['run', 'dev:db'], { stdio: 'inherit' }).status ?? 1);
} else {
  console.warn('Docker não detectado: executando fluxo sem subir banco local (dev:full:nodb).');
  console.warn('Garanta que DATABASE_URL em backend/.env aponte para um Postgres acessível.');
}

const setupStatus = spawnSync('npm', ['run', 'dev:setup:backend'], { stdio: 'inherit' }).status ?? 1;
if (setupStatus !== 0) process.exit(setupStatus);

process.exit(spawnSync('npm', ['run', 'dev'], { stdio: 'inherit' }).status ?? 1);
