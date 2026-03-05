import { existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve('backend/.env');
const envExamplePath = resolve('backend/.env.example');

if (!existsSync(envPath)) {
  copyFileSync(envExamplePath, envPath);
  console.log('Arquivo backend/.env não encontrado. Criado a partir de backend/.env.example.');
} else {
  console.log('Arquivo backend/.env já existe.');
}
