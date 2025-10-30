/**
 * Performance Test: Fresh Installation Speed
 * Ensures fresh installation completes in under 30 seconds
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Fresh Installation Performance', () => {
  let testDir;
  const PERFORMANCE_THRESHOLD_MS = 30000; // 30 seconds

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `claude-buddy-perf-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should complete fresh installation in under 30 seconds', async () => {
    const startTime = Date.now();

    try {
      // Run the installation script
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
      console.log(`\nFresh installation completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`Performance threshold: ${PERFORMANCE_THRESHOLD_MS}ms (30s)`);
      console.log(`Margin: ${PERFORMANCE_THRESHOLD_MS - duration}ms`);
    } catch (err) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Installation timed out after ${duration}ms (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000); // Jest timeout with buffer

  it('should install all required components within time limit', async () => {
    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      const duration = Date.now() - startTime;

      // Verify all required directories were created (v3.0.0: skills-only)
      const requiredDirs = [
        '.claude',
        '.claude/commands',
        '.claude/agents',
        '.claude/skills',
        '.claude/skills/personas',
        '.claude/skills/domains',
        '.claude/skills/generators'
      ];

      for (const dir of requiredDirs) {
        const dirPath = path.join(testDir, dir);
        const exists = await fs.access(dirPath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }

      // Verify metadata was created (v3.0.0: in .claude directory)
      const metadataPath = path.join(testDir, '.claude', 'install-metadata.json');
      const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
      expect(metadataExists).toBe(true);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Installation with verification timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);

  it('should perform efficiently with verbose logging disabled', async () => {
    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive --quiet`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      const duration = Date.now() - startTime;

      // Quiet mode should be faster or same speed
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

      console.log(`\nQuiet mode installation: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Quiet mode installation timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);

  it('should measure file copy performance', async () => {
    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      const duration = Date.now() - startTime;

      // Count number of files installed
      let fileCount = 0;
      const countFiles = async (dir) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await countFiles(fullPath);
            } else {
              fileCount++;
            }
          }
        } catch (err) {
          // Skip inaccessible directories
        }
      };

      await countFiles(testDir);

      const filesPerSecond = fileCount / (duration / 1000);

      console.log(`\nFiles installed: ${fileCount}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Performance: ${filesPerSecond.toFixed(2)} files/second`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`File copy performance test timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);

  it('should handle dry-run mode efficiently', async () => {
    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --dry-run`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 10000 // Dry-run should be very fast
      });

      const duration = Date.now() - startTime;

      // Dry-run should be much faster since it doesn't actually install
      expect(duration).toBeLessThan(10000); // 10 seconds max for dry-run

      console.log(`\nDry-run mode: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error('Dry-run mode timed out (exceeded 10s threshold)');
      } else {
        throw err;
      }
    }
  }, 15000);

  it('should report performance metrics', async () => {
    const metrics = {
      installDuration: 0,
      fileCount: 0,
      avgFileTime: 0
    };

    const startTime = Date.now();

    try {
      const installScript = path.join(__dirname, '..', '..', 'install.js');
      execSync(`node "${installScript}" --target "${testDir}" --non-interactive`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: PERFORMANCE_THRESHOLD_MS + 5000
      });

      metrics.installDuration = Date.now() - startTime;

      // Count files
      const countFiles = async (dir) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await countFiles(fullPath);
            } else {
              metrics.fileCount++;
            }
          }
        } catch (err) {
          // Skip errors
        }
      };

      await countFiles(testDir);
      metrics.avgFileTime = metrics.fileCount > 0 ? metrics.installDuration / metrics.fileCount : 0;

      console.log(`\n${'='.repeat(60)}`);
      console.log('PERFORMANCE METRICS:');
      console.log(`${'='.repeat(60)}`);
      console.log(`Total Duration: ${metrics.installDuration}ms (${(metrics.installDuration / 1000).toFixed(2)}s)`);
      console.log(`Files Installed: ${metrics.fileCount}`);
      console.log(`Avg Time per File: ${metrics.avgFileTime.toFixed(2)}ms`);
      console.log(`Performance Grade: ${metrics.installDuration < 20000 ? 'A' : metrics.installDuration < 30000 ? 'B' : 'C'}`);
      console.log(`${'='.repeat(60)}\n`);

      expect(metrics.installDuration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    } catch (err) {
      if (err.code === 'ETIMEDOUT') {
        throw new Error(`Performance metrics test timed out (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
      } else {
        throw err;
      }
    }
  }, PERFORMANCE_THRESHOLD_MS + 10000);
});
