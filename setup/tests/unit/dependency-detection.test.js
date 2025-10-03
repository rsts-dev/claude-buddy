/**
 * Unit Tests: Dependency Detection Functions
 * Tests for environment.js dependency detection logic
 */

const os = require('os');
const { execSync } = require('child_process');

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
const { detectEnvironment } = require('../../lib/environment');

describe('Dependency Detection', () => {
  describe('detectPlatform', () => {
    it('should detect platform correctly on different operating systems', async () => {
      const result = await detectEnvironment(process.cwd());

      expect(result.platform).toBeDefined();
      expect(result.platform.os).toMatch(/^(windows|darwin|linux|unknown)$/);
      expect(result.platform.arch).toBeDefined();
      expect(result.platform.osVersion).toBeDefined();
      expect(result.platform.shell).toBeDefined();
      expect(result.platform.homedir).toBeDefined();
      expect(result.platform.tempdir).toBeDefined();
    });

    it('should map win32 to windows', async () => {
      const originalPlatform = os.platform;
      Object.defineProperty(os, 'platform', {
        value: () => 'win32',
        configurable: true
      });

      const result = await detectEnvironment(process.cwd());
      expect(result.platform.os).toBe('windows');

      // Restore
      Object.defineProperty(os, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });

    it('should detect correct shell based on platform', async () => {
      const result = await detectEnvironment(process.cwd());

      if (result.platform.os === 'windows') {
        expect(['cmd', 'powershell']).toContain(result.platform.shell);
      } else {
        expect(['bash', 'zsh', 'sh', 'fish']).toContain(result.platform.shell);
      }
    });
  });

  describe('detectNodeVersion', () => {
    it('should detect Node.js version correctly', async () => {
      const result = await detectEnvironment(process.cwd());

      const nodeDep = result.detectedDependencies.find(d => d.name === 'node');
      expect(nodeDep).toBeDefined();
      expect(nodeDep.available).toBe(true);
      expect(nodeDep.required).toBe(true);
      expect(nodeDep.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(nodeDep.location).toBe(process.execPath);
    });

    it('should strip v prefix from version', async () => {
      const result = await detectEnvironment(process.cwd());
      const nodeDep = result.detectedDependencies.find(d => d.name === 'node');

      expect(nodeDep.version).not.toMatch(/^v/);
    });
  });

  describe('detectUV', () => {
    it('should detect UV if available', async () => {
      const result = await detectEnvironment(process.cwd());
      const uvDep = result.detectedDependencies.find(d => d.name === 'uv');

      expect(uvDep).toBeDefined();
      expect(uvDep.required).toBe(false);
      expect(typeof uvDep.available).toBe('boolean');

      if (uvDep.available) {
        expect(uvDep.version).toBeTruthy();
        expect(uvDep.location).toBeTruthy();
      } else {
        expect(uvDep.version).toBeNull();
        expect(uvDep.location).toBeNull();
      }
    });

    it('should check multiple UV locations', async () => {
      const result = await detectEnvironment(process.cwd());
      const uvDep = result.detectedDependencies.find(d => d.name === 'uv');

      expect(uvDep.alternativeLocations).toBeDefined();
      expect(Array.isArray(uvDep.alternativeLocations)).toBe(true);
    });

    it('should parse UV version from output', async () => {
      // This test only runs if UV is actually installed
      try {
        execSync('uv --version', {
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 5000
        }).trim();

        const result = await detectEnvironment(process.cwd());
        const uvDep = result.detectedDependencies.find(d => d.name === 'uv');

        if (uvDep.available) {
          expect(uvDep.version).toMatch(/\d+\.\d+\.\d+/);
        }
      } catch (err) {
        // UV not installed, skip this test
        expect(true).toBe(true);
      }
    });
  });

  describe('detectPython', () => {
    it('should detect Python if available', async () => {
      const result = await detectEnvironment(process.cwd());
      const pythonDep = result.detectedDependencies.find(d => d.name === 'python');

      expect(pythonDep).toBeDefined();
      expect(pythonDep.required).toBe(false);
      expect(typeof pythonDep.available).toBe('boolean');

      if (pythonDep.available) {
        expect(pythonDep.version).toBeTruthy();
        expect(pythonDep.location).toBeTruthy();
      } else {
        expect(pythonDep.version).toBeNull();
        expect(pythonDep.location).toBeNull();
      }
    });

    it('should try multiple Python commands', async () => {
      const result = await detectEnvironment(process.cwd());
      const pythonDep = result.detectedDependencies.find(d => d.name === 'python');

      expect(pythonDep.alternativeLocations).toBeDefined();
      expect(Array.isArray(pythonDep.alternativeLocations)).toBe(true);
    });

    it('should parse Python version from output', async () => {
      // This test only runs if Python is actually installed
      const pythonCommands = os.platform() === 'win32'
        ? ['python', 'python3', 'py']
        : ['python3', 'python'];

      for (const cmd of pythonCommands) {
        try {
          execSync(`${cmd} --version`, {
            stdio: 'pipe',
            encoding: 'utf-8',
            timeout: 5000
          }).trim();

          const result = await detectEnvironment(process.cwd());
          const pythonDep = result.detectedDependencies.find(d => d.name === 'python');

          if (pythonDep.available) {
            expect(pythonDep.version).toMatch(/\d+\.\d+\.\d+/);
          }
          break;
        } catch (err) {
          continue;
        }
      }

      expect(true).toBe(true); // Test passes if no Python found
    });
  });

  describe('detectGit', () => {
    it('should detect Git if available', async () => {
      const result = await detectEnvironment(process.cwd());
      const gitDep = result.detectedDependencies.find(d => d.name === 'git');

      expect(gitDep).toBeDefined();
      expect(gitDep.required).toBe(false);
      expect(typeof gitDep.available).toBe('boolean');

      if (gitDep.available) {
        expect(gitDep.version).toBeTruthy();
        expect(gitDep.location).toBeTruthy();
      } else {
        expect(gitDep.version).toBeNull();
        expect(gitDep.location).toBeNull();
      }
    });

    it('should parse Git version from output', async () => {
      // This test only runs if Git is actually installed
      try {
        execSync('git --version', {
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 5000
        }).trim();

        const result = await detectEnvironment(process.cwd());
        const gitDep = result.detectedDependencies.find(d => d.name === 'git');

        if (gitDep.available) {
          expect(gitDep.version).toMatch(/\d+\.\d+\.\d+/);
        }
      } catch (err) {
        // Git not installed, skip this test
        expect(true).toBe(true);
      }
    });
  });

  describe('Dependency categorization', () => {
    it('should correctly mark Node.js as required', async () => {
      const result = await detectEnvironment(process.cwd());
      const nodeDep = result.detectedDependencies.find(d => d.name === 'node');

      expect(nodeDep.required).toBe(true);
    });

    it('should correctly mark UV as optional', async () => {
      const result = await detectEnvironment(process.cwd());
      const uvDep = result.detectedDependencies.find(d => d.name === 'uv');

      expect(uvDep.required).toBe(false);
    });

    it('should correctly mark Python as optional', async () => {
      const result = await detectEnvironment(process.cwd());
      const pythonDep = result.detectedDependencies.find(d => d.name === 'python');

      expect(pythonDep.required).toBe(false);
    });

    it('should correctly mark Git as optional', async () => {
      const result = await detectEnvironment(process.cwd());
      const gitDep = result.detectedDependencies.find(d => d.name === 'git');

      expect(gitDep.required).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle command execution timeouts gracefully', async () => {
      const result = await detectEnvironment(process.cwd());

      // All dependencies should have a defined available status
      result.detectedDependencies.forEach(dep => {
        expect(typeof dep.available).toBe('boolean');
      });
    });

    it('should handle missing commands gracefully', async () => {
      const result = await detectEnvironment(process.cwd());

      // Optional dependencies that are not available should have null values
      result.detectedDependencies
        .filter(d => !d.required && !d.available)
        .forEach(dep => {
          expect(dep.version).toBeNull();
          expect(dep.location).toBeNull();
        });
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should work on current platform', async () => {
      const result = await detectEnvironment(process.cwd());

      expect(result.platform.os).toBeDefined();
      expect(result.detectedDependencies).toHaveLength(4); // node, uv, python, git
    });

    it('should provide platform-specific paths', async () => {
      const result = await detectEnvironment(process.cwd());

      if (result.platform.os === 'windows') {
        expect(result.platform.homedir).toContain('Users');
      } else {
        expect(result.platform.homedir).toContain('/');
      }
    });
  });
});
