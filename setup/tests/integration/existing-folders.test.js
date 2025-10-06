/**
 * Test: Installation to Existing Project with Pre-existing Folders
 *
 * Verifies that installation works correctly when .claude and .claude-buddy
 * folders already exist (even if empty or partially populated).
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { performInstallation } = require('../../lib/installer');
const { getManifest } = require('../../lib/manifest');
const { detectEnvironment } = require('../../lib/environment');
const { createLogger } = require('../../lib/logger');

const logger = createLogger('quiet');

describe('Installation to Existing Project', () => {
  let tempDir;

  beforeEach(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-buddy-test-'));
  });

  afterEach(async () => {
    // Clean up
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });

  describe('Pre-existing Empty Folders', () => {
    test('should install all files when .claude folder exists but is empty', async () => {
      // Create empty .claude folder
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir);

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);
      expect(result.installedComponents.length).toBeGreaterThan(0);

      // Verify files were actually copied
      const agentsDir = path.join(tempDir, '.claude', 'agents');
      const agentFiles = await fs.readdir(agentsDir);
      expect(agentFiles.length).toBeGreaterThan(0);

      const commandsDir = path.join(tempDir, '.claude', 'commands');
      const commandFiles = await fs.readdir(commandsDir);
      expect(commandFiles.length).toBeGreaterThan(0);
    });

    test('should install all files when .claude-buddy folder exists but is empty', async () => {
      // Create empty .claude-buddy folder
      const buddyDir = path.join(tempDir, '.claude-buddy');
      await fs.mkdir(buddyDir);

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);
      expect(result.installedComponents.length).toBeGreaterThan(0);

      // Verify files were actually copied
      const personasDir = path.join(tempDir, '.claude-buddy', 'personas');
      const personaFiles = await fs.readdir(personasDir);
      expect(personaFiles.length).toBeGreaterThan(0);

      const templatesDir = path.join(tempDir, '.claude-buddy', 'templates');
      const templateFiles = await fs.readdir(templatesDir);
      expect(templateFiles.length).toBeGreaterThan(0);

      const contextDir = path.join(tempDir, '.claude-buddy', 'context');
      const contextFiles = await fs.readdir(contextDir);
      expect(contextFiles.length).toBeGreaterThan(0);
    });

    test('should install all files when both folders exist but are empty', async () => {
      // Create empty folders
      await fs.mkdir(path.join(tempDir, '.claude'));
      await fs.mkdir(path.join(tempDir, '.claude-buddy'));

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);
      expect(result.installedComponents.length).toBeGreaterThan(0);

      // Count total files installed
      let totalFiles = 0;
      for (const component of result.installedComponents) {
        const componentManifest = manifest.components.find(c => c.name === component);
        if (componentManifest) {
          const targetPath = path.join(tempDir, componentManifest.target);
          const files = await fs.readdir(targetPath, { recursive: true });
          totalFiles += files.filter(f => fs.statSync(path.join(targetPath, f)).isFile()).length;
        }
      }

      expect(totalFiles).toBeGreaterThan(50); // Should have many files installed
    });
  });

  describe('Pre-existing Folders with Subdirectories', () => {
    test('should install files even when subdirectories exist', async () => {
      // Create folder structure with some subdirectories
      await fs.mkdir(path.join(tempDir, '.claude', 'agents'), { recursive: true });
      await fs.mkdir(path.join(tempDir, '.claude', 'commands'), { recursive: true });
      await fs.mkdir(path.join(tempDir, '.claude-buddy', 'personas'), { recursive: true });

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);

      // Verify files were actually copied into existing subdirectories
      const agentsDir = path.join(tempDir, '.claude', 'agents');
      const agentFiles = await fs.readdir(agentsDir);
      expect(agentFiles.length).toBeGreaterThan(0);

      const personasDir = path.join(tempDir, '.claude-buddy', 'personas');
      const personaFiles = await fs.readdir(personasDir);
      expect(personaFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Comprehensive Component Installation', () => {
    test('should install ALL components when only .claude folder exists', async () => {
      // Create only .claude folder
      await fs.mkdir(path.join(tempDir, '.claude'));

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);

      // Verify ALL .claude components were installed
      const claudeComponentDirs = [
        '.claude/agents',
        '.claude/commands/buddy',
        '.claude/hooks'
      ];

      for (const dir of claudeComponentDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
        const fileCount = entries.filter(e => e.isFile()).length;
        expect(fileCount).toBeGreaterThan(0);
      }

      // Verify ALL .claude-buddy components were also installed
      const buddyComponentDirs = [
        '.claude-buddy/personas',
        '.claude-buddy/templates',
        '.claude-buddy/context'
      ];

      for (const dir of buddyComponentDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
        const fileCount = entries.filter(e => e.isFile()).length;
        expect(fileCount).toBeGreaterThan(0);
      }

      // Verify configuration files
      expect(await fs.pathExists(path.join(tempDir, '.claude-buddy', 'buddy-config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.claude-buddy', 'install-metadata.json'))).toBe(true);
    });

    test('should install ALL components when only .claude-buddy folder exists', async () => {
      // Create only .claude-buddy folder
      await fs.mkdir(path.join(tempDir, '.claude-buddy'));

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);

      // Verify ALL .claude-buddy components were installed
      const buddyComponentDirs = [
        '.claude-buddy/personas',
        '.claude-buddy/templates',
        '.claude-buddy/context'
      ];

      for (const dir of buddyComponentDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
        const fileCount = entries.filter(e => e.isFile()).length;
        expect(fileCount).toBeGreaterThan(0);
      }

      // Verify ALL .claude components were also installed
      const claudeComponentDirs = [
        '.claude/agents',
        '.claude/commands/buddy',
        '.claude/hooks'
      ];

      for (const dir of claudeComponentDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
        const fileCount = entries.filter(e => e.isFile()).length;
        expect(fileCount).toBeGreaterThan(0);
      }

      // Verify configuration files
      expect(await fs.pathExists(path.join(tempDir, '.claude-buddy', 'buddy-config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.claude-buddy', 'install-metadata.json'))).toBe(true);
    });

    test('should install ALL components when both folders exist', async () => {
      // Create both folders
      await fs.mkdir(path.join(tempDir, '.claude'));
      await fs.mkdir(path.join(tempDir, '.claude-buddy'));

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);

      // Verify ALL components were installed
      const allComponentDirs = [
        '.claude/agents',
        '.claude/commands/buddy',
        '.claude/hooks',
        '.claude-buddy/personas',
        '.claude-buddy/templates',
        '.claude-buddy/context'
      ];

      for (const dir of allComponentDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
        const fileCount = entries.filter(e => e.isFile()).length;
        expect(fileCount).toBeGreaterThan(0);
      }

      // Verify configuration files
      expect(await fs.pathExists(path.join(tempDir, '.claude-buddy', 'buddy-config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.claude-buddy', 'install-metadata.json'))).toBe(true);
    });
  });

  describe('Pre-existing Files Overwrite', () => {
    test('should overwrite existing files during installation', async () => {
      // Create folder with a file that has the same name as a real agent file
      await fs.mkdir(path.join(tempDir, '.claude-buddy', 'personas'), { recursive: true });

      // Create a dummy file with same name as a real persona file
      const dummyFilePath = path.join(tempDir, '.claude-buddy', 'personas', 'architect.md');
      await fs.writeFile(dummyFilePath, 'DUMMY CONTENT - SHOULD BE OVERWRITTEN');

      // Run installation
      const manifest = getManifest();
      const environment = await detectEnvironment(tempDir);
      const result = await performInstallation({
        targetDirectory: tempDir,
        manifest,
        components: manifest.components,
        environment,
        dryRun: false,
        verbose: false,
        logger
      });

      // Verify installation succeeded
      expect(result.success).toBe(true);

      // Verify the dummy file was overwritten
      const content = await fs.readFile(dummyFilePath, 'utf-8');
      // Should NOT contain our dummy content
      expect(content).not.toContain('DUMMY CONTENT - SHOULD BE OVERWRITTEN');
      // Should contain actual persona content
      expect(content.length).toBeGreaterThan(50); // Real persona files are much longer

      // Verify all persona files were installed
      const personasDir = path.join(tempDir, '.claude-buddy', 'personas');
      const personaFiles = await fs.readdir(personasDir);
      expect(personaFiles.length).toBeGreaterThan(5); // Should have many personas
    });
  });
});
