/**
 * Integration Test: Fresh Installation
 *
 * Tests the complete fresh installation flow including:
 * - Directory creation
 * - Component installation
 * - Metadata creation
 * - Version tracking
 * - Success verification
 */

const fs = require('fs-extra');
const path = require('path');
const { performInstallation } = require('../../lib/installer');
const { getManifest } = require('../../lib/manifest');
const { detectEnvironment } = require('../../lib/environment');
const {
  createTempDir,
  cleanupTempDir,
  fileExists,
  readJson
} = require('../helpers/test-utils');

describe('Fresh Installation', () => {
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(testProjectDir);
  });

  describe('Fresh Installation Flow', () => {
    it('should create all necessary directories', async () => {
      // Given: Empty project directory
      const dirList = await fs.readdir(testProjectDir);
      expect(dirList).toHaveLength(0);

      // When: Run installation script
      const manifest = getManifest();
      const environment = await detectEnvironment(testProjectDir);
      const components = manifest.components.filter(c => c.name !== 'hooks'); // Skip hooks for test

      const result = await performInstallation({
        targetDirectory: testProjectDir,
        manifest,
        components,
        environment,
        verbose: false
      });

      // Then: All framework directories exist (v3.0.0: only .claude, no .claude-buddy)
      expect(result.success).toBe(true);
      expect(await fileExists(path.join(testProjectDir, '.claude'))).toBe(true);
    });

    it('should install all framework files', async () => {
      // Given: Empty project directory
      const manifest = getManifest();
      const environment = await detectEnvironment(testProjectDir);
      const components = manifest.components.filter(c => c.name !== 'hooks');

      // When: Run installation script
      const result = await performInstallation({
        targetDirectory: testProjectDir,
        manifest,
        components,
        environment
      });

      // Then: All framework files are present (v3.0.0: metadata in .claude)
      expect(result.success).toBe(true);
      expect(await fileExists(path.join(testProjectDir, '.claude', 'install-metadata.json'))).toBe(true);
      expect(result.installedComponents.length).toBeGreaterThan(0);
    });

    it('should create version metadata with correct structure', async () => {
      // Given: Empty project directory
      const manifest = getManifest();
      const environment = await detectEnvironment(testProjectDir);
      const components = manifest.components.filter(c => c.name !== 'hooks');

      // When: Run installation script
      await performInstallation({
        targetDirectory: testProjectDir,
        manifest,
        components,
        environment
      });

      // Then: Version metadata is created (v3.0.0: in .claude directory)
      const metadataPath = path.join(testProjectDir, '.claude', 'install-metadata.json');
      expect(await fileExists(metadataPath)).toBe(true);

      // Then: Metadata has correct structure
      const metadata = await readJson(metadataPath);
      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('installDate');
      expect(metadata).toHaveProperty('installedComponents');
    });

    it.todo('should display success message with version information');

    it('should install all required components by default', async () => {
      // Given: Empty project directory with all dependencies available
      const manifest = getManifest();
      const environment = await detectEnvironment(testProjectDir);
      const components = manifest.components.filter(c => c.name !== 'hooks');

      // When: Run installation script
      await performInstallation({
        targetDirectory: testProjectDir,
        manifest,
        components,
        environment
      });

      // Then: All required components are installed
      const metadataPath = path.join(testProjectDir, '.claude', 'install-metadata.json');
      const metadata = await readJson(metadataPath);

      expect(metadata.installedComponents).toBeTruthy();
      expect(Object.keys(metadata.installedComponents).length).toBeGreaterThan(0);
    });

    it('should complete installation in under 30 seconds', async () => {
      // Given: Empty project directory
      const manifest = getManifest();
      const environment = await detectEnvironment(testProjectDir);
      const components = manifest.components.filter(c => c.name !== 'hooks');

      // When: Run installation script with timing
      const startTime = Date.now();
      await performInstallation({
        targetDirectory: testProjectDir,
        manifest,
        components,
        environment
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Then: Installation completes in under 30 seconds
      expect(duration).toBeLessThan(30000);
    });

    it('should create transaction log during installation', async () => {
      // Given: Empty project directory
      const manifest = getManifest();
      const environment = await detectEnvironment(testProjectDir);
      const components = manifest.components.filter(c => c.name !== 'hooks');

      // When: Run installation script
      await performInstallation({
        targetDirectory: testProjectDir,
        manifest,
        components,
        environment
      });

      // Then: Transaction history is recorded in metadata
      const metadataPath = path.join(testProjectDir, '.claude', 'install-metadata.json');
      const metadata = await readJson(metadataPath);

      expect(metadata.transactionHistory).toBeTruthy();
      expect(Array.isArray(metadata.transactionHistory)).toBe(true);
      expect(metadata.transactionHistory.length).toBeGreaterThan(0);
    });

    it.todo('should set correct file permissions on Unix systems');

    it('should record all dependency statuses in metadata', async () => {
      // Given: Empty project directory
      const manifest = getManifest();
      const environment = await detectEnvironment(testProjectDir);
      const components = manifest.components.filter(c => c.name !== 'hooks');

      // When: Run installation script
      await performInstallation({
        targetDirectory: testProjectDir,
        manifest,
        components,
        environment
      });

      // Then: Dependency status is recorded
      const metadataPath = path.join(testProjectDir, '.claude', 'install-metadata.json');
      const metadata = await readJson(metadataPath);

      expect(metadata.dependencies).toHaveProperty('node');
      expect(metadata.dependencies.node.available).toBe(true);
      expect(metadata.dependencies.node.version).toBeTruthy();
    });
  });

  describe('Installation Validation', () => {
    it.todo('should validate installation succeeded via verify check');
    it.todo('should display usage examples after installation');
  });
});
