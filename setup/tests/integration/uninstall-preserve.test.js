/**
 * Integration Test: Uninstallation with Preservation
 *
 * Tests uninstallation with customization preservation:
 * - Remove framework files
 * - Preserve user customizations
 * - Create preservation backup
 * - Display uninstall summary
 */

const fs = require('fs-extra');
const path = require('path');
const { performUninstall } = require('../../lib/uninstaller');
const {
  createTempDir,
  cleanupTempDir,
  createMockMetadata,
  fileExists
  // readJson // Reserved for future use
} = require('../helpers/test-utils');

describe('Uninstallation with Preservation', () => {
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(testProjectDir);
  });

  describe('Framework Removal', () => {
    it('should remove all framework directories', async () => {
      // Given: Installed Claude Buddy
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await fs.ensureDir(path.join(testProjectDir, '.claude'));
      await fs.ensureDir(path.join(testProjectDir, 'directive'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, 'directive', 'foundation.md'), '# Foundation');

      // When: Run uninstall with preservation
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: .claude-buddy, .claude, directive are removed
      expect(result.success).toBe(true);
      expect(await fileExists(path.join(testProjectDir, '.claude-buddy'))).toBe(false);
      expect(await fileExists(path.join(testProjectDir, '.claude'))).toBe(false);
    });

    it('should remove framework configuration files', async () => {
      // Given: Installed with configs
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'buddy-config.json'), '{}');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'hooks.json'), '{}');

      // When: Uninstall
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: buddy-config.json, hooks.json removed
      expect(result.success).toBe(true);
      expect(await fileExists(path.join(testProjectDir, '.claude-buddy', 'buddy-config.json'))).toBe(false);
      expect(await fileExists(path.join(testProjectDir, '.claude-buddy', 'hooks.json'))).toBe(false);
    });

    it('should remove metadata files', async () => {
      // Given: Installation metadata exists
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await createMockMetadata(testProjectDir);
      const metadataPath = path.join(testProjectDir, '.claude-buddy', 'install-metadata.json');
      expect(await fileExists(metadataPath)).toBe(true);

      // When: Uninstall
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: install-metadata.json is removed
      expect(result.success).toBe(true);
      expect(await fileExists(metadataPath)).toBe(false);
    });
  });

  describe('Customization Preservation', () => {
    it('should preserve custom persona files', async () => {
      // Given: Custom personas exist
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      const customPersona = '.claude-buddy/personas/custom-reviewer.md';
      await fs.writeFile(path.join(testProjectDir, customPersona), '# Custom Reviewer');

      await createMockMetadata(testProjectDir, {
        userCustomizations: [
          { file: customPersona, preserveOnUpdate: true }
        ]
      });

      // When: Uninstall with preservation
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {
          userCustomizations: [
            { file: customPersona, preserveOnUpdate: true }
          ]
        },
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: Custom personas backed up and preserved
      expect(result.success).toBe(true);
      expect(result.preservedFiles).toContain(customPersona);

      // Check for preservation backup
      const files = await fs.readdir(testProjectDir);
      const backups = files.filter(f => f.startsWith('.claude-buddy-preserved-'));
      expect(backups.length).toBeGreaterThan(0);
    });

    it('should preserve modified framework files', async () => {
      // Given: User modified buddy-config.json
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      const modifiedConfig = '.claude-buddy/buddy-config.json';
      await fs.writeFile(path.join(testProjectDir, modifiedConfig), '{"userSetting":"custom"}');

      await createMockMetadata(testProjectDir, {
        userCustomizations: [
          { file: modifiedConfig, preserveOnUpdate: true }
        ]
      });

      // When: Uninstall
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {
          userCustomizations: [
            { file: modifiedConfig, preserveOnUpdate: true }
          ]
        },
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: Modified file is backed up
      expect(result.success).toBe(true);
      expect(result.preservedFiles).toContain(modifiedConfig);
    });

    it('should create preservation backup directory', async () => {
      // Given: Customizations exist
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      const customFile = '.claude-buddy/personas/custom.md';
      await fs.writeFile(path.join(testProjectDir, customFile), '# Custom');

      await createMockMetadata(testProjectDir, {
        userCustomizations: [
          { file: customFile, preserveOnUpdate: true }
        ]
      });

      // When: Uninstall
      await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {
          userCustomizations: [
            { file: customFile, preserveOnUpdate: true }
          ]
        },
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: .claude-buddy-preserved-{timestamp} created
      const files = await fs.readdir(testProjectDir);
      const backups = files.filter(f => f.startsWith('.claude-buddy-preserved-'));
      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0]).toMatch(/^\.claude-buddy-preserved-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });

    it('should NOT preserve specs directory by default', async () => {
      // Given: Specs directory with user specifications
      await fs.ensureDir(path.join(testProjectDir, 'specs'));
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      const specFile = path.join(testProjectDir, 'specs', 'feature.md');
      await fs.writeFile(specFile, '# Feature Spec');
      await createMockMetadata(testProjectDir);

      // When: Uninstall
      await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: specs/ remains untouched (not part of framework)
      expect(await fileExists(specFile)).toBe(true);
    });
  });

  describe('User Prompts', () => {
    it.todo('should prompt for confirmation before uninstall');
    it.todo('should show what will be removed');
    it.todo('should show what will be preserved');

    it('should skip prompts in non-interactive mode', async () => {
      // Given: --non-interactive flag
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await createMockMetadata(testProjectDir);

      // When: Run uninstall
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: Proceeds without prompts
      expect(result.success).toBe(true);
    });
  });

  describe('Uninstall Summary', () => {
    it('should display count of removed files', async () => {
      // Given: Uninstall completed
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy'));
      await createMockMetadata(testProjectDir);
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'buddy-config.json'), '{}');
      await fs.writeFile(path.join(testProjectDir, '.claude-buddy', 'hooks.json'), '{}');

      // When: Show summary
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {},
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: Displays "Removed X files"
      expect(result.success).toBe(true);
      expect(result.removedFiles.length).toBeGreaterThan(0);
    });

    it('should display count of preserved customizations', async () => {
      // Given: Customizations preserved
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      const customFile = '.claude-buddy/personas/custom.md';
      await fs.writeFile(path.join(testProjectDir, customFile), '# Custom');

      await createMockMetadata(testProjectDir, {
        userCustomizations: [
          { file: customFile, preserveOnUpdate: true }
        ]
      });

      // When: Show summary
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {
          userCustomizations: [
            { file: customFile, preserveOnUpdate: true }
          ]
        },
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: Displays "Preserved X customizations"
      expect(result.success).toBe(true);
      expect(result.preservedFiles.length).toBeGreaterThan(0);
    });

    it('should show preservation backup location', async () => {
      // Given: Backup created
      await fs.ensureDir(path.join(testProjectDir, '.claude-buddy', 'personas'));
      const customFile = '.claude-buddy/personas/custom.md';
      await fs.writeFile(path.join(testProjectDir, customFile), '# Custom');

      await createMockMetadata(testProjectDir, {
        userCustomizations: [
          { file: customFile, preserveOnUpdate: true }
        ]
      });

      // When: Show summary
      const result = await performUninstall({
        targetDirectory: testProjectDir,
        metadata: {
          userCustomizations: [
            { file: customFile, preserveOnUpdate: true }
          ]
        },
        preserveCustomizations: true,
        nonInteractive: true
      });

      // Then: Displays backup directory path
      expect(result.success).toBe(true);
      const files = await fs.readdir(testProjectDir);
      const backups = files.filter(f => f.startsWith('.claude-buddy-preserved-'));
      expect(backups.length).toBeGreaterThan(0);
    });
  });
});
