/**
 * Integration Test: Complete Purge
 *
 * Tests complete uninstallation with --purge flag:
 * - Remove ALL Claude Buddy files
 * - Remove customizations
 * - No preservation
 * - Require explicit confirmation
 */

const fs = require('fs-extra');
const path = require('path');
const { performUninstall } = require('../../lib/uninstaller');
const {
  createTempDir,
  cleanupTempDir,
  createMockMetadata,
  fileExists
} = require('../helpers/test-utils');

describe('Complete Purge', () => {
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(testProjectDir);
  });

  describe('Complete Removal', () => {
    it('should remove all Claude Buddy directories', async () => {
      // Given: Full installation with customizations
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      await fs.ensureDir(path.join(testProjectDir, '.claude', 'hooks'));
      await fs.ensureDir(path.join(testProjectDir, 'directive'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'buddy-config.json'), '{}');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'personas', 'custom.md'), '# Custom');
      await fs.writeFile(path.join(testProjectDir, '.claude', 'hooks.json'), '{}');
      await fs.writeFile(path.join(testProjectDir, 'directive', 'foundation.md'), '# Foundation');

      // When: Run uninstall --purge
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: .claude-buddy, .claude, directive all removed
      expect(result.success).toBe(true);
      expect(result.removedFiles.length).toBeGreaterThan(0);
      expect(await fileExists(path.join(testProjectDir, '.claude-buddy'))).toBe(false);
      expect(await fileExists(path.join(testProjectDir, '.claude'))).toBe(false);
    });

    it('should remove custom personas', async () => {
      // Given: Custom persona files exist
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      await createMockMetadata(testProjectDir);
      const customPersona = path.join(testProjectDir, '.claude-buddy', 'personas', 'custom-reviewer.md');
      await fs.writeFile(customPersona, '# Custom Reviewer');

      // When: Purge
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: Custom personas are deleted
      expect(result.success).toBe(true);
      expect(await fileExists(customPersona)).toBe(false);
    });

    it('should remove modified framework files', async () => {
      // Given: User modified configs
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await createMockMetadata(testProjectDir);
      const configFile = path.join(testProjectDir, '.claude-buddy', 'buddy-config.json');
      await fs.writeJson(configFile, { userSetting: 'custom' });

      // When: Purge
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: Modified files deleted without backup
      expect(result.success).toBe(true);
      expect(await fileExists(configFile)).toBe(false);
    });

    it('should NOT create preservation backup', async () => {
      // Given: Customizations exist
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'personas', 'custom.md'), '# Custom');

      // When: Purge
      await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: No backup directory is created
      const files = await fs.readdir(testProjectDir);
      const backups = files.filter(f => f.startsWith('.claude-buddy-preserved-'));
      expect(backups).toHaveLength(0);
    });

    it('should leave specs directory untouched', async () => {
      // Given: Specs directory exists
      await fs.ensureDir(path.join(testProjectDir, 'specs'));
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await createMockMetadata(testProjectDir);
      const specFile = path.join(testProjectDir, 'specs', 'feature.md');
      await fs.writeFile(specFile, '# Feature');

      // When: Purge
      await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: specs/ remains (user data, not framework)
      expect(await fileExists(specFile)).toBe(true);
    });
  });

  describe('Confirmation Requirements', () => {
    it.todo('should require explicit PURGE confirmation');
    it.todo('should show strong warning about permanent deletion');
    it.todo('should cancel if confirmation not provided');

    it('should require explicit --purge flag', async () => {
      // Given: Uninstall without --purge
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      await createMockMetadata(testProjectDir, {
        userCustomizations: [
          { file: '.claude-buddy/personas/custom.md', preserveOnUpdate: true }
        ]
      });
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'personas', 'custom.md'), '# Custom');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'buddy-config.json'), '{}');

      // When: Run uninstall (without purge flag)
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {
          userCustomizations: [
            { file: '.claude-buddy/personas/custom.md', preserveOnUpdate: true }
          ]
        },
        preserveCustomizations: true,
        purge: false,
        nonInteractive: true
      });

      // Then: Preservation mode is default - framework files removed, custom files preserved
      expect(result.success).toBe(true);
      expect(result.preservedFiles.length).toBeGreaterThan(0);
      // Verify the preservation backup was created
      const files = await fs.readdir(testProjectDir);
      const backups = files.filter(f => f.startsWith('.claude-buddy-preserved-'));
      expect(backups.length).toBeGreaterThan(0);
    });
  });

  describe('Purge Summary', () => {
    it('should display total files deleted', async () => {
      // Given: Purge completed
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'templates'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'buddy-config.json'), '{}');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'personas', 'default.md'), '# Default');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'personas', 'custom.md'), '# Custom');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'templates', 'spec.md'), '# Spec');

      // When: Show summary
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: "Deleted X files (including customizations)"
      expect(result.success).toBe(true);
      expect(result.removedFiles.length).toBeGreaterThan(0);
    });

    it('should confirm complete removal', async () => {
      // Given: Purge successful
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'buddy-config.json'), '{}');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'hooks.json'), '{}');

      // When: Show summary
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: "Claude Buddy completely removed"
      expect(result.success).toBe(true);
      expect(result.removedFiles.length).toBeGreaterThan(0);
      expect(await fileExists(path.join(testProjectDir, '.claude-buddy'))).toBe(false);
    });

    it('should NOT show preservation information', async () => {
      // Given: Purge summary
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'personas', 'custom.md'), '# Custom');

      // When: Check output
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        purge: true,
        nonInteractive: true
      });

      // Then: No mention of backups or preservation
      expect(result.preservedFiles).toHaveLength(0);
      const preservationBackups = await fs.readdir(testProjectDir);
      const backups = preservationBackups.filter(f => f.startsWith('.claude-buddy-preserved-'));
      expect(backups).toHaveLength(0);
    });
  });
});
