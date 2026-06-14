import fs from 'fs';
import path from 'path';

function findEnv(dir: string): string | null {
  const envPath = path.join(dir, '.env');
  if (fs.existsSync(envPath)) {
    return envPath;
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    return null;
  }
  return findEnv(parent);
}

const found = findEnv(__dirname);
console.log('Found .env at:', found);
if (found) {
  console.log('Content preview:');
  console.log(fs.readFileSync(found, 'utf8').substring(0, 100));
}
