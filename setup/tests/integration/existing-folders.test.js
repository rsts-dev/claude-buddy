/**
 * Test: Installation to Existing Project with Pre-existing Folders
 *
 * Verifies that installation works correctly when .claude folder
 * already exists (even if empty or partially populated).
 * v3.0.0: Only tests .claude directory (no more .claude-buddy)
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

    test('should install skills when .claude folder exists but is empty', async () => {
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

      // Verify skills were actually copied (v3.0.0)
      const skillsDir = path.join(tempDir, '.claude', 'skills');
      expect(await fs.pathExists(skillsDir)).toBe(true);

      const personasDir = path.join(skillsDir, 'personas');
      expect(await fs.pathExists(personasDir)).toBe(true);
      const personaFiles = await fs.readdir(personasDir);
      expect(personaFiles.length).toBeGreaterThan(0);

      const domainsDir = path.join(skillsDir, 'domains');
      expect(await fs.pathExists(domainsDir)).toBe(true);

      const generatorsDir = path.join(skillsDir, 'generators');
      expect(await fs.pathExists(generatorsDir)).toBe(true);
    });

    test('should install all components when .claude folder with subdirectories exists', async () => {
      // Create empty folders with subdirectories (v3.0.0: only .claude)
      await fs.mkdir(path.join(tempDir, '.claude', 'skills'), { recursive: true });

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
      // Create folder structure with some subdirectories (v3.0.0)
      await fs.mkdir(path.join(tempDir, '.claude', 'agents'), { recursive: true });
      await fs.mkdir(path.join(tempDir, '.claude', 'commands'), { recursive: true });
      await fs.mkdir(path.join(tempDir, '.claude', 'skills', 'personas'), { recursive: true });

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

      const personasDir = path.join(tempDir, '.claude', 'skills', 'personas');
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

      // Verify ALL .claude/skills components were also installed (v3.0.0)
      const skillsComponentDirs = [
        '.claude/skills/personas',
        '.claude/skills/domains',
        '.claude/skills/generators'
      ];

      for (const dir of skillsComponentDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
        const fileCount = entries.filter(e => e.isFile()).length;
        expect(fileCount).toBeGreaterThan(0);
      }

      // Verify configuration files (v3.0.0: in .claude)
      expect(await fs.pathExists(path.join(tempDir, '.claude', 'hooks.json'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.claude', 'install-metadata.json'))).toBe(true);
    });

    // v3.0.0: Removed test for .claude-buddy folder (deprecated structure)

    // v3.0.0: Simplified - only .claude folder exists
    test('should install all .claude components including skills', async () => {
      // Create .claude folder (v3.0.0: no more .claude-buddy)
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

      // Verify ALL .claude components were installed (v3.0.0)
      const allComponentDirs = [
        '.claude/agents',
        '.claude/commands/buddy',
        '.claude/hooks',
        '.claude/skills/personas',
        '.claude/skills/domains',
        '.claude/skills/generators'
      ];

      for (const dir of allComponentDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
        const fileCount = entries.filter(e => e.isFile()).length;
        expect(fileCount).toBeGreaterThan(0);
      }

      // Verify configuration files (v3.0.0: in .claude)
      expect(await fs.pathExists(path.join(tempDir, '.claude', 'hooks.json'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.claude', 'install-metadata.json'))).toBe(true);
    });
  });

  describe('Pre-existing Files Overwrite', () => {
    test('should overwrite existing files during installation', async () => {
      // Create folder with a file that has the same name as a real skill file (v3.0.0)
      await fs.mkdir(path.join(tempDir, '.claude', 'skills', 'personas', 'architect'), { recursive: true });

      // Create a dummy file with same name as a real persona skill file
      const dummyFilePath = path.join(tempDir, '.claude', 'skills', 'personas', 'architect', 'SKILL.md');
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
      // Should contain actual persona skill content
      expect(content.length).toBeGreaterThan(50); // Real skill files are much longer

      // Verify all persona skill directories were installed (v3.0.0)
      const personasDir = path.join(tempDir, '.claude', 'skills', 'personas');
      const personaDirs = await fs.readdir(personasDir);
      expect(personaDirs.length).toBeGreaterThan(5); // Should have many personas
    });
  });
});
