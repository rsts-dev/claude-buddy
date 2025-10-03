/**
 * Test Utilities for Integration Tests
 *
 * Provides helper functions for setting up test environments,
 * creating fixtures, and cleaning up after tests.
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Create a temporary test directory
 * @returns {Promise<string>} Path to temporary directory
 */
async function createTempDir() {
  const tempDir = path.join(os.tmpdir(), `claude-buddy-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  await fs.ensureDir(tempDir);
  return tempDir;
}

/**
 * Clean up a temporary test directory
 * @param {string} dirPath - Path to directory to remove
 * @returns {Promise<void>}
 */
async function cleanupTempDir(dirPath) {
  try {
    await fs.remove(dirPath);
  } catch (error) {
    // Ignore cleanup errors
    console.warn(`Failed to cleanup ${dirPath}:`, error.message);
  }
}

/**
 * Copy fixture files to a test directory
 * @param {string} targetDir - Target directory
 * @returns {Promise<void>}
 */
async function setupFixtures(targetDir) {
  const fixturesDir = path.join(__dirname, '../fixtures');

  // Copy all fixture files to target directory
  await fs.copy(fixturesDir, targetDir, {
    overwrite: true,
    errorOnExist: false
  });
}

/**
 * Create a mock installation metadata file
 * @param {string} targetDir - Installation directory
 * @param {Object} options - Metadata options
 * @returns {Promise<void>}
 */
async function createMockMetadata(targetDir, options = {}) {
  const metadata = {
    version: options.version || '2.0.0',
    installDate: options.installDate || new Date().toISOString(),
    installedComponents: options.installedComponents || {
      core: { version: '2.0.0', enabled: true },
      templates: { version: '2.0.0', enabled: true },
      personas: { version: '2.0.0', enabled: true },
      commands: { version: '2.0.0', enabled: true },
      agents: { version: '2.0.0', enabled: true },
      foundation: { version: '2.0.0', enabled: true },
      hooks: { version: '2.0.0', enabled: false, reason: 'Optional dependency unavailable' }
    },
    dependencies: options.dependencies || {
      node: { available: true, version: process.version },
      uv: { available: false },
      python: { available: false },
      git: { available: true, version: '2.0.0' }
    },
    transactionHistory: options.transactionHistory || [
      {
        id: 'test-transaction-1',
        operation: 'install',
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    ]
  };

  const metadataPath = path.join(targetDir, '.claude-buddy', 'install-metadata.json');
  await fs.ensureDir(path.dirname(metadataPath));
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<void>}
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>}
 */
async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Get list of files in directory recursively
 * @param {string} dirPath - Directory path
 * @param {Array<string>} fileList - Accumulated file list
 * @returns {Promise<Array<string>>}
 */
async function getFileList(dirPath, fileList = []) {
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await getFileList(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Mock logger for testing (suppresses output)
 */
class MockLogger {
  log() {}
  info() {}
  warn() {}
  error() {}
  success() {}
  debug() {}
  verbose() {}
  section() {}
  progress() {}
  startSpinner() { return { stop: () => {} }; }
  stopSpinner() {}
  logInstallationSummary() {}
  logUpdateSummary() {}
  logUninstallSummary() {}
  logErrorWithSuggestions() {}
}

module.exports = {
  createTempDir,
  cleanupTempDir,
  setupFixtures,
  createMockMetadata,
  waitFor,
  fileExists,
  readJson,
  getFileList,
  MockLogger
};
