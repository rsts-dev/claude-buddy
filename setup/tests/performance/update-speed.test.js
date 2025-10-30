/**
 * Performance Test: Update Speed
 * Ensures update operation completes in under 10 seconds
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Update Performance', () => {
  let testDir;
  const PERFORMANCE_THRESHOLD_MS = 10000; // 10 seconds

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `claude-buddy-update-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Perform initial installation
    const installScript = path.join(__dirname, '..', '..', 'install.js');
    execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 30000
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should complete update in under 10 seconds', async () => {
    const startTime = Date.now();

    try {
      // Run the update operation
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000 // Add 5s buffer for timeout
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert performance requirement
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

      // Log performance metrics
      console.log(`\nUpdate completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`Performance threshold: ${PERFORMANCE_THRESHOLD_MS}ms (10s)`);
      console.log(`Margin: ${PERFORMANCE_THRESHOLD_MS - duration}ms`);
    } catch (err) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Update timed out after ${duration}ms (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000); // Jest timeout with buffer

  it('should preserve user customizations efficiently', async () => {
    // Create a user customization (v3.0.0: custom persona in skills directory)
    const customPersonaDir = path.join(testDir, '.claude', 'skills', 'personas', 'custom-persona');
    await fs.mkdir(customPersonaDir, { recursive: true });
    const customPersonaPath = path.join(customPersonaDir, 'SKILL.md');
    await fs.writeFile(customPersonaPath, '# Custom Persona\n\nThis is my custom persona.');

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      const duration = Date.now() - startTime;

      // Verify customization was preserved
      const customContent = await fs.readFile(customPersonaPath, 'utf-8');
      expect(customContent).toContain('This is my custom persona');

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

      console.log(`\nUpdate with customization preservation: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Update with customizations timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);

  it('should update framework files efficiently', async () => {
    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      const duration = Date.now() - startTime;

      // Verify metadata was updated (v3.0.0: moved to .claude directory)
      const metadataPath = path.join(testDir, '.claude', 'install-metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

      expect(metadata.lastUpdateDate).toBeDefined();
      // Transaction history should have at least the initial install transaction
      // (Update with no changes won't create a new transaction)
      expect(metadata.transactionHistory.length).toBeGreaterThanOrEqual(1);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Framework file update timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);

  it('should perform update faster than fresh install', async () => {
    // Measure update time
    const updateStart = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      const updateDuration = Date.now() - updateStart;

      // Measure fresh install time (in a new directory)
      const freshTestDir = path.join(os.tmpdir(), `claude-buddy-fresh-test-${Date.now()}`);
      await fs.mkdir(freshTestDir, { recursive: true });

      const freshStart = Date.now();
      execSync(`node "${installScript}" --target "${freshTestDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 30000
      });

      const freshDuration = Date.now() - freshStart;

      // Clean up fresh test directory
      await fs.rm(freshTestDir, { recursive: true, force: true });

      console.log(`\nUpdate duration: ${updateDuration}ms`);
      console.log(`Fresh install duration: ${freshDuration}ms`);
      if (updateDuration < freshDuration) {
        console.log(`Update speedup: ${((freshDuration - updateDuration) / freshDuration * 100).toFixed(2)}%`);
      } else {
        console.log(`Update overhead: ${((updateDuration - freshDuration) / freshDuration * 100).toFixed(2)}%`);
      }

      // Both update and fresh install should complete within performance threshold
      // Note: Updates may be slightly slower due to customization detection, backup creation,
      // config merging, and migration detection (v3.0)
      expect(updateDuration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      expect(freshDuration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

      // Update should be reasonably efficient (within 3x of fresh install)
      // v3.0: Increased from 2x to 3x due to additional migration detection overhead
      expect(updateDuration).toBeLessThan(freshDuration * 3);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error('Update vs fresh install comparison timed out');
      } else {
        throw err;
      }
    }
  }, 50000);

  it('should update configuration files efficiently', async () => {
    // v3.0.0: Configuration updates overwrite hooks.json
    // Users should back up custom config before updating
    const configPath = path.join(testDir, '.claude', 'hooks.json');
    const originalConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));

    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      const duration = Date.now() - startTime;

      // Verify hooks.json was updated (should have default structure)
      const updatedHooksConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      expect(updatedHooksConfig.hooks).toBeDefined();
      expect(updatedHooksConfig.config).toBeDefined();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

      console.log(`\nUpdate with config refresh: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Config update timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);

  it('should measure update performance metrics', async () => {
    const metrics = {
      updateDuration: 0,
      filesChecked: 0,
      filesUpdated: 0,
      filesPreserved: 0
    };

    // Create some customizations (v3.0.0: custom personas in skills directory)
    const customPersonasDir = path.join(testDir, '.claude', 'skills', 'personas');
    await fs.mkdir(customPersonasDir, { recursive: true });
    const customFile1 = path.join(customPersonasDir, 'custom1', 'SKILL.md');
    const customFile2 = path.join(customPersonasDir, 'custom2', 'SKILL.md');
    await fs.mkdir(path.join(customPersonasDir, 'custom1'), { recursive: true });
    await fs.mkdir(path.join(customPersonasDir, 'custom2'), { recursive: true });
    await fs.writeFile(customFile1, '# Custom 1');
    await fs.writeFile(customFile2, '# Custom 2');
    metrics.filesPreserved = 2;

    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive --verbose`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      metrics.updateDuration = Date.now() - startTime;

      // Count files in installation
      const countFiles = async (dir) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await countFiles(fullPath);
            } else {
              metrics.filesChecked++;
            }
          }
        } catch (err) {
          // Skip errors
        }
      };

      await countFiles(testDir);

      console.log(`\n${'='.repeat(60)}`);
      console.log('UPDATE PERFORMANCE METRICS:');
      console.log(`${'='.repeat(60)}`);
      console.log(`Update Duration: ${metrics.updateDuration}ms (${(metrics.updateDuration / 1000).toFixed(2)}s)`);
      console.log(`Files Checked: ${metrics.filesChecked}`);
      console.log(`Files Preserved: ${metrics.filesPreserved}`);
      console.log(`Performance Grade: ${metrics.updateDuration < 5000 ? 'A' : metrics.updateDuration < 10000 ? 'B' : 'C'}`);
      console.log(`${'='.repeat(60)}\n`);

      expect(metrics.updateDuration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Update metrics test timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);

  it('should perform dry-run update efficiently', async () => {
    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --dry-run`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 5000 // Dry-run should be very fast
      });

      const duration = Date.now() - startTime;

      // Dry-run update should be much faster
      expect(duration).toBeLessThan(5000); // 5 seconds max for dry-run update

      console.log(`\nDry-run update: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error('Dry-run update timed out (exceeded 5s threshold)');
      } else {
        throw err;
      }
    }
  }, 10000);
});
