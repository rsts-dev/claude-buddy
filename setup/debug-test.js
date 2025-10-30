const { performInstallation } = require('./lib/installer');
const { getManifest } = require('./lib/manifest');
const { detectEnvironment } = require('./lib/environment');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

async function test() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));

  const manifest = getManifest();
  const environment = await detectEnvironment(tempDir);
  const components = manifest.components.filter(c => c.name !== 'hooks');

  console.log('Installing components:', components.map(c => c.name).join(', '));

  try {
    const result = await performInstallation({
      targetDirectory: tempDir,
      manifest,
      components,
      environment,
      verbose: false
    });

    console.log('\nInstallation success:', result.success);
    console.log('Error:', result.error);

    if (result.error && result.error.details && result.error.details.issues) {
      console.log('\nVerification issues:');
      result.error.details.issues.forEach(issue => {
        console.log(`  - [${issue.severity}] ${issue.message}`);
      });
    }
  } catch (err) {
    console.log('\nCaught error:', err.message);
    if (err.details && err.details.issues) {
      console.log('\nVerification issues:');
      err.details.issues.forEach(issue => {
        console.log(`  - [${issue.severity}] ${issue.message}`);
      });
    }
  }

  // Now manually check what files exist
  console.log('\nChecking files manually BEFORE cleanup:');
  console.log('.claude exists:', await fs.pathExists(path.join(tempDir, '.claude')));
  console.log('hooks.json exists:', await fs.pathExists(path.join(tempDir, '.claude', 'hooks.json')));
  console.log('metadata exists:', await fs.pathExists(path.join(tempDir, '.claude', 'install-metadata.json')));
  console.log('.claude/hooks dir exists:', await fs.pathExists(path.join(tempDir, '.claude', 'hooks')));

  // List all files in .claude
  if (await fs.pathExists(path.join(tempDir, '.claude'))) {
    console.log('\nFiles in .claude/:');
    const files = await fs.readdir(path.join(tempDir, '.claude'));
    for (const file of files) {
      const stat = await fs.stat(path.join(tempDir, '.claude', file));
      console.log(`  ${file} (${stat.isDirectory() ? 'dir' : 'file'})`);
    }
  }

  await fs.remove(tempDir);
}

test().catch(console.error);
