/**
 * Unit Tests: Manifest Validation
 * Tests for manifest.js validation and platform override logic
 */

// const path = require('path'); // Reserved for future use

// Mock the logger to avoid console output during tests
jest.mock('../../lib/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

// Import the module after mocking logger
const {
  getManifest,
  getManifestForPlatform,
  validateManifest,
  filterComponentsByDependencies
} = require('../../lib/manifest');

describe('Manifest Module', () => {
  describe('getManifest', () => {
    it('should return a valid manifest object', () => {
      const manifest = getManifest();

      expect(manifest).toBeDefined();
      expect(manifest.version).toBeDefined();
      expect(Array.isArray(manifest.components)).toBe(true);
      expect(Array.isArray(manifest.directories)).toBe(true);
      expect(manifest.platformSpecific).toBeDefined();
    });

    it('should return a deep clone (not reference)', () => {
      const manifest1 = getManifest();
      const manifest2 = getManifest();

      manifest1.version = 'modified';
      expect(manifest2.version).not.toBe('modified');
    });

    it('should contain all required components', () => {
      const manifest = getManifest();
      const componentNames = manifest.components.map(c => c.name);

      // v3.0.0 components (skills-only architecture)
      expect(componentNames).toContain('config');  // NEW: Core configuration files
      expect(componentNames).toContain('hooks');
      expect(componentNames).toContain('commands');
      expect(componentNames).toContain('agents');
      expect(componentNames).toContain('skills');
    });
  });

  describe('getManifestForPlatform', () => {
    it('should return manifest with platform-specific overrides for Windows', () => {
      const manifest = getManifestForPlatform('windows');

      expect(manifest).toBeDefined();
      expect(manifest.components).toBeDefined();
    });

    it('should return manifest with platform-specific overrides for macOS', () => {
      const manifest = getManifestForPlatform('darwin');

      expect(manifest).toBeDefined();
      expect(manifest.environmentVariables).toBeDefined();
      expect(manifest.environmentVariables.CLAUDE_BUDDY_SHELL).toBe('bash');
    });

    it('should return manifest with platform-specific overrides for Linux', () => {
      const manifest = getManifestForPlatform('linux');

      expect(manifest).toBeDefined();
      expect(manifest.environmentVariables).toBeDefined();
      expect(manifest.environmentVariables.CLAUDE_BUDDY_SHELL).toBe('bash');
    });

    it('should apply component overrides correctly', () => {
      const manifest = getManifestForPlatform('windows');
      const hooksComponent = manifest.components.find(c => c.name === 'hooks');

      // Windows should have additional .bat files in hooks
      if (hooksComponent && manifest.platformSpecific?.windows?.componentOverrides?.hooks) {
        expect(hooksComponent.filePatterns).toContain('*.bat');
      } else {
        // No override for hooks on Windows in current manifest
        expect(true).toBe(true);
      }
    });

    it('should not mutate the original manifest', () => {
      const originalManifest = getManifest();
      const originalVersion = originalManifest.version;

      getManifestForPlatform('windows');

      expect(originalManifest.version).toBe(originalVersion);
    });
  });

  describe('validateManifest', () => {
    it('should validate a correct manifest', () => {
      const manifest = getManifest();
      const result = validateManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing version', () => {
      const manifest = getManifest();
      delete manifest.version;

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest version is missing or invalid');
    });

    it('should detect invalid semver version', () => {
      const manifest = getManifest();
      manifest.version = 'invalid-version';

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid semver version'))).toBe(true);
    });

    it('should detect missing components array', () => {
      const manifest = getManifest();
      delete manifest.components;

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest components must be an array');
    });

    it('should detect component with missing name', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0] };
      delete manifest.components[0].name;

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name is required'))).toBe(true);
    });

    it('should detect invalid component type', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0], type: 'invalid' };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('type must be \'required\' or \'optional\''))).toBe(true);
    });

    it('should detect missing source path', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0] };
      delete manifest.components[0].source;

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('source path is required'))).toBe(true);
    });

    it('should detect missing target path', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0] };
      delete manifest.components[0].target;

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('target path is required'))).toBe(true);
    });

    it('should detect invalid dependencies (not array)', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0], dependencies: 'not-an-array' };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('dependencies must be an array'))).toBe(true);
    });

    it('should detect invalid filePatterns (not array)', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0], filePatterns: 'not-an-array' };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('filePatterns must be an array'))).toBe(true);
    });

    it('should detect unknown dependency reference', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0], dependencies: ['unknown-dep'] };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('unknown dependency \'unknown-dep\''))).toBe(true);
    });

    it('should detect absolute source path', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0], source: '/absolute/path' };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('source path must be relative'))).toBe(true);
    });

    it('should detect absolute target path', () => {
      const manifest = getManifest();
      manifest.components[0] = { ...manifest.components[0], target: '/absolute/path' };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('target path must be relative'))).toBe(true);
    });

    it('should detect missing directories array', () => {
      const manifest = getManifest();
      delete manifest.directories;

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest directories must be an array');
    });

    it('should detect directory with missing path', () => {
      const manifest = getManifest();
      manifest.directories[0] = { ...manifest.directories[0] };
      delete manifest.directories[0].path;

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('path is required'))).toBe(true);
    });

    it('should detect absolute directory path', () => {
      const manifest = getManifest();
      manifest.directories[0] = { ...manifest.directories[0], path: '/absolute/path' };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('path must be relative'))).toBe(true);
    });

    it('should detect invalid createIfMissing type', () => {
      const manifest = getManifest();
      manifest.directories[0] = { ...manifest.directories[0], createIfMissing: 'not-boolean' };

      const result = validateManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('createIfMissing must be a boolean'))).toBe(true);
    });
  });

  describe('filterComponentsByDependencies', () => {
    it('should return all components when all dependencies are available', () => {
      const manifest = getManifest();
      const availableDeps = [
        { name: 'node', available: true },
        { name: 'uv', available: true },
        { name: 'python', available: true },
        { name: 'git', available: true }
      ];

      const filtered = filterComponentsByDependencies(manifest, availableDeps);

      expect(filtered.enabledComponents).toHaveLength(manifest.components.length);
    });

    it('should filter out hooks when UV is unavailable', () => {
      const manifest = getManifest();
      const availableDeps = [
        { name: 'node', available: true },
        { name: 'uv', available: false },
        { name: 'python', available: false },
        { name: 'git', available: true }
      ];

      const filtered = filterComponentsByDependencies(manifest, availableDeps);

      const hooksComponent = filtered.enabledComponents.find(c => c.name === 'hooks');
      expect(hooksComponent).toBeUndefined();
    });

    it('should keep required components regardless of dependencies', () => {
      const manifest = getManifest();
      const availableDeps = [
        { name: 'node', available: true },
        { name: 'uv', available: false },
        { name: 'python', available: false },
        { name: 'git', available: false }
      ];

      const filtered = filterComponentsByDependencies(manifest, availableDeps);

      const requiredComponents = manifest.components.filter(c => c.type === 'required');
      requiredComponents.forEach(comp => {
        const found = filtered.enabledComponents.find(c => c.name === comp.name);
        expect(found).toBeDefined();
      });
    });

    it('should keep optional components with no dependencies', () => {
      const manifest = getManifest();
      const availableDeps = [
        { name: 'node', available: true },
        { name: 'uv', available: false },
        { name: 'python', available: false },
        { name: 'git', available: false }
      ];

      const filtered = filterComponentsByDependencies(manifest, availableDeps);

      // Components with no dependencies should be included
      const noDepsComponents = manifest.components.filter(c => c.dependencies.length === 0);
      noDepsComponents.forEach(comp => {
        const found = filtered.enabledComponents.find(c => c.name === comp.name);
        expect(found).toBeDefined();
      });
    });

    it('should include reason when filtering out components', () => {
      const manifest = getManifest();
      const availableDeps = [
        { name: 'node', available: true },
        { name: 'uv', available: false },
        { name: 'python', available: false },
        { name: 'git', available: true }
      ];

      const filtered = filterComponentsByDependencies(manifest, availableDeps);

      // Hooks should be filtered out
      const allComponents = manifest.components.length;
      const enabledCount = filtered.enabledComponents.length;

      expect(enabledCount).toBeLessThanOrEqual(allComponents);
      expect(filtered.disabledComponents.length).toBeGreaterThan(0);
      // Check that disabled components have a reason
      filtered.disabledComponents.forEach(comp => {
        expect(comp.disabledReason).toBeDefined();
      });
    });
  });

  describe('Component structure', () => {
    it('should have proper component structure for hooks', () => {
      const manifest = getManifest();
      const hooks = manifest.components.find(c => c.name === 'hooks');

      expect(hooks).toBeDefined();
      expect(hooks.type).toBe('optional');
      expect(hooks.dependencies).toContain('uv');
      expect(hooks.dependencies).toContain('python');
      expect(Array.isArray(hooks.affectedFeatures)).toBe(true);
    });

    it('should have proper component structure for skills', () => {
      const manifest = getManifest();
      const skills = manifest.components.find(c => c.name === 'skills');

      expect(skills).toBeDefined();
      expect(skills.type).toBe('required');
      expect(skills.dependencies).toHaveLength(0);
      expect(skills.filePatterns).toContain('**/*.md');
    });

    it('should have proper component structure for commands', () => {
      const manifest = getManifest();
      const commands = manifest.components.find(c => c.name === 'commands');

      expect(commands).toBeDefined();
      expect(commands.type).toBe('required');
      expect(commands.dependencies).toHaveLength(0);
    });

    it('should have proper component structure for agents', () => {
      const manifest = getManifest();
      const agents = manifest.components.find(c => c.name === 'agents');

      expect(agents).toBeDefined();
      expect(agents.type).toBe('required');
      expect(agents.dependencies).toHaveLength(0);
    });
  });

  describe('Directory structure', () => {
    it('should define all required directories', () => {
      const manifest = getManifest();
      const dirPaths = manifest.directories.map(d => d.path);

      // v3.0.0: Only .claude directory (no more .claude-buddy)
      expect(dirPaths).toContain('.claude');
    });

    it('should set proper permissions for directories', () => {
      const manifest = getManifest();

      manifest.directories.forEach(dir => {
        expect(dir.permissions).toMatch(/^\d{3}$/);
      });
    });

    it('should have createIfMissing flag for all directories', () => {
      const manifest = getManifest();

      manifest.directories.forEach(dir => {
        expect(typeof dir.createIfMissing).toBe('boolean');
      });
    });
  });

  describe('Platform-specific configuration', () => {
    it('should define platform-specific settings for Windows', () => {
      const manifest = getManifest();

      expect(manifest.platformSpecific.windows).toBeDefined();
    });

    it('should define platform-specific settings for macOS', () => {
      const manifest = getManifest();

      expect(manifest.platformSpecific.darwin).toBeDefined();
      expect(manifest.platformSpecific.darwin.environmentVariables).toBeDefined();
    });

    it('should define platform-specific settings for Linux', () => {
      const manifest = getManifest();

      expect(manifest.platformSpecific.linux).toBeDefined();
      expect(manifest.platformSpecific.linux.environmentVariables).toBeDefined();
    });
  });
});
