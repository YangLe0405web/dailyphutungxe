const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testsDir = path.resolve(__dirname);
const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.cjs'));

console.log(`Found ${testFiles.length} test files to run:`);
let passed = 0;
let failed = 0;

for (const file of testFiles) {
  const fullPath = path.join(testsDir, file);
  try {
    const out = execSync(`node "${fullPath}"`, { stdio: 'pipe' }).toString();
    console.log(`✅ PASS: ${file}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${file}`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    failed++;
  }
}

console.log(`\n========================================`);
console.log(`RESULT: ${passed} PASSED, ${failed} FAILED / ${testFiles.length} TOTAL`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
