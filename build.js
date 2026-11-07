import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

console.log('Building game-data.js...');
const manifestPath = path.join(ROOT, 'data', 'stages', 'index.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const learningPath = path.join(ROOT, 'data', 'learning-content.json');
const learningContent = JSON.parse(fs.readFileSync(learningPath, 'utf8'));

const stagesDir = path.join(ROOT, 'data', 'stages');
const stageFiles = fs.readdirSync(stagesDir).filter((f) => f.startsWith('stage-') && f.endsWith('.json'));

const stages = {};
for (const file of stageFiles) {
  const filePath = path.join(stagesDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  stages[file] = content;
  if (content.stageId) {
    stages[content.stageId] = content;
  }
}

const gameData = `// Auto-generated game data to enable playing without a local HTTP server (file:// compatible)
window.__EMERGENCY_DATA__ = ${JSON.stringify({ manifest, stages, learningContent }, null, 2)};
`;

fs.writeFileSync(path.join(ROOT, 'data', 'game-data.js'), gameData, 'utf8');
console.log('data/game-data.js written successfully.');

console.log('Bundling JavaScript with esbuild...');
execSync(
  'npx esbuild js/main.js --bundle --format=iife --outfile=bundle.js --platform=browser --external:node:fs --external:node:path',
  { stdio: 'inherit' }
);
console.log('bundle.js built successfully.');
