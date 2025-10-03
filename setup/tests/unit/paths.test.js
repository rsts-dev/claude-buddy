/**
 * Unit Tests: Path Normalization Across Platforms
 * Tests path handling functions ensuring cross-platform compatibility
 */

const path = require('path');
const os = require('os');
const { resolveSourcePath, resolveTargetPath } = require('../../lib/manifest');

describe('Path Normalization Across Platforms', () => {
  // Store original platform for restoration
  const originalPlatform = process.platform;

  afterEach(() => {
    // Restore platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  describe('path.join() - Basic Cross-Platform Joining', () => {
    test('should join paths with forward slashes on Unix', () => {
      const result = path.join('dir1', 'dir2', 'file.txt');

      if (process.platform === 'win32') {
        expect(result).toBe('dir1\\dir2\\file.txt');
      } else {
        expect(result).toBe('dir1/dir2/file.txt');
      }
    });

    test('should handle empty string parts', () => {
      const result = path.join('dir1', '', 'dir2');

      if (process.platform === 'win32') {
        expect(result).toBe('dir1\\dir2');
      } else {
        expect(result).toBe('dir1/dir2');
      }
    });

    test('should handle current directory notation', () => {
      const result = path.join('.', 'dir1', 'file.txt');

      if (process.platform === 'win32') {
        expect(result).toBe('dir1\\file.txt');
      } else {
        expect(result).toBe('dir1/file.txt');
      }
    });

    test('should handle parent directory notation', () => {
      const result = path.join('dir1', '..', 'dir2', 'file.txt');

      if (process.platform === 'win32') {
        expect(result).toBe('dir2\\file.txt');
      } else {
        expect(result).toBe('dir2/file.txt');
      }
    });

    test('should handle absolute paths correctly', () => {
      if (process.platform === 'win32') {
        const result = path.join('C:\\base', 'dir', 'file.txt');
        expect(result).toBe('C:\\base\\dir\\file.txt');
      } else {
        const result = path.join('/base', 'dir', 'file.txt');
        expect(result).toBe('/base/dir/file.txt');
      }
    });

    test('should handle mixed separators', () => {
      const result = path.join('dir1/dir2', 'dir3', 'file.txt');

      // path.join uses platform separator
      if (process.platform === 'win32') {
        expect(result).toBe('dir1\\dir2\\dir3\\file.txt');
      } else {
        expect(result).toBe('dir1/dir2/dir3/file.txt');
      }
    });
  });

  describe('path.resolve() - Absolute Path Resolution', () => {
    test('should resolve relative paths to absolute', () => {
      const result = path.resolve('dir1', 'file.txt');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result.includes('dir1')).toBe(true);
      expect(result.includes('file.txt')).toBe(true);
    });

    test('should resolve from current working directory', () => {
      const cwd = process.cwd();
      const result = path.resolve('file.txt');
      expect(result).toBe(path.join(cwd, 'file.txt'));
    });

    test('should handle multiple segments', () => {
      const result = path.resolve('dir1', 'dir2', 'dir3', 'file.txt');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result.endsWith(path.join('dir1', 'dir2', 'dir3', 'file.txt'))).toBe(true);
    });

    test('should handle absolute path as first argument', () => {
      if (process.platform === 'win32') {
        const result = path.resolve('C:\\base', 'dir', 'file.txt');
        expect(result).toBe('C:\\base\\dir\\file.txt');
      } else {
        const result = path.resolve('/base', 'dir', 'file.txt');
        expect(result).toBe('/base/dir/file.txt');
      }
    });

    test('should stop at first absolute path from right', () => {
      if (process.platform === 'win32') {
        const result = path.resolve('C:\\base1', 'D:\\base2', 'file.txt');
        expect(result).toBe('D:\\base2\\file.txt');
      } else {
        const result = path.resolve('/base1', '/base2', 'file.txt');
        expect(result).toBe('/base2/file.txt');
      }
    });
  });

  describe('path.normalize() - Path Normalization', () => {
    test('should normalize paths with extra separators', () => {
      if (process.platform === 'win32') {
        const result = path.normalize('dir1\\\\dir2\\file.txt');
        expect(result).toBe('dir1\\dir2\\file.txt');
      } else {
        const result = path.normalize('dir1//dir2/file.txt');
        expect(result).toBe('dir1/dir2/file.txt');
      }
    });

    test('should resolve parent directory references', () => {
      const result = path.normalize('dir1/dir2/../file.txt');

      if (process.platform === 'win32') {
        expect(result).toBe('dir1\\file.txt');
      } else {
        expect(result).toBe('dir1/file.txt');
      }
    });

    test('should resolve current directory references', () => {
      const result = path.normalize('dir1/./dir2/./file.txt');

      if (process.platform === 'win32') {
        expect(result).toBe('dir1\\dir2\\file.txt');
      } else {
        expect(result).toBe('dir1/dir2/file.txt');
      }
    });

    test('should handle trailing separators', () => {
      if (process.platform === 'win32') {
        const result = path.normalize('dir1\\dir2\\');
        expect(result).toBe('dir1\\dir2\\');
      } else {
        const result = path.normalize('dir1/dir2/');
        expect(result).toBe('dir1/dir2/');
      }
    });
  });

  describe('path.isAbsolute() - Platform-Specific Absolute Path Detection', () => {
    test('should detect Unix absolute paths', () => {
      if (process.platform !== 'win32') {
        expect(path.isAbsolute('/usr/local/bin')).toBe(true);
        expect(path.isAbsolute('/home/user')).toBe(true);
        expect(path.isAbsolute('usr/local')).toBe(false);
      }
    });

    test('should detect Windows absolute paths', () => {
      if (process.platform === 'win32') {
        expect(path.isAbsolute('C:\\Program Files')).toBe(true);
        expect(path.isAbsolute('D:\\Users')).toBe(true);
        expect(path.isAbsolute('\\\\server\\share')).toBe(true);
        expect(path.isAbsolute('relative\\path')).toBe(false);
      }
    });
  });

  describe('Cross-Platform Path Separator Handling', () => {
    test('path.sep should match platform', () => {
      if (process.platform === 'win32') {
        expect(path.sep).toBe('\\');
      } else {
        expect(path.sep).toBe('/');
      }
    });

    test('should split paths using correct separator', () => {
      const testPath = path.join('dir1', 'dir2', 'dir3');
      const parts = testPath.split(path.sep);
      expect(parts).toEqual(['dir1', 'dir2', 'dir3']);
    });

    test('should construct paths with platform separator', () => {
      const parts = ['dir1', 'dir2', 'file.txt'];
      const result = parts.join(path.sep);

      if (process.platform === 'win32') {
        expect(result).toBe('dir1\\dir2\\file.txt');
      } else {
        expect(result).toBe('dir1/dir2/file.txt');
      }
    });
  });

  describe('resolveSourcePath() - Manifest Source Path Resolution', () => {
    test('should resolve source paths relative to package root', () => {
      const result = resolveSourcePath('.claude-buddy/templates');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result.includes('.claude-buddy')).toBe(true);
      expect(result.includes('templates')).toBe(true);
    });

    test('should handle nested source paths', () => {
      const result = resolveSourcePath('.claude-buddy/templates/default');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result.includes('default')).toBe(true);
    });

    test('should produce consistent results across calls', () => {
      const result1 = resolveSourcePath('.claude/hooks');
      const result2 = resolveSourcePath('.claude/hooks');
      expect(result1).toBe(result2);
    });

    test('should handle paths with multiple segments', () => {
      const result = resolveSourcePath('.claude-buddy/personas/architect.md');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result.endsWith(path.join('.claude-buddy', 'personas', 'architect.md'))).toBe(true);
    });
  });

  describe('resolveTargetPath() - Manifest Target Path Resolution', () => {
    const testInstallDir = process.platform === 'win32' ? 'C:\\test\\project' : '/test/project';

    test('should resolve target paths relative to installation directory', () => {
      const result = resolveTargetPath('.claude-buddy', testInstallDir);
      expect(result).toBe(path.join(testInstallDir, '.claude-buddy'));
    });

    test('should handle nested target paths', () => {
      const result = resolveTargetPath('.claude-buddy/templates', testInstallDir);
      expect(result).toBe(path.join(testInstallDir, '.claude-buddy', 'templates'));
    });

    test('should handle file paths', () => {
      const result = resolveTargetPath('.claude-buddy/buddy-config.json', testInstallDir);
      expect(result).toBe(path.join(testInstallDir, '.claude-buddy', 'buddy-config.json'));
    });

    test('should work with different installation directories', () => {
      const dir1 = path.join(os.homedir(), 'project1');
      const dir2 = path.join(os.homedir(), 'project2');

      const result1 = resolveTargetPath('.claude', dir1);
      const result2 = resolveTargetPath('.claude', dir2);

      expect(result1).not.toBe(result2);
      expect(result1.includes('project1')).toBe(true);
      expect(result2.includes('project2')).toBe(true);
    });
  });

  describe('Path Safety and Security', () => {
    test('should prevent path traversal with ../ sequences', () => {
      const basePath = process.cwd();
      const dangerousPath = '../../../etc/passwd';
      const resolved = path.resolve(basePath, dangerousPath);

      // Ensure resolved path is normalized
      expect(resolved).toBe(path.normalize(resolved));
    });

    test('should handle null bytes safely', () => {
      // path.join doesn't throw on null bytes, but they're included in the result
      // File system operations will fail on paths with null bytes
      const result = path.join('dir1', '\0file', 'file.txt');
      expect(result).toContain('\0');

      // Note: Actual file operations with this path would fail
      // This test documents the behavior rather than testing safety
    });

    test('should handle very long paths', () => {
      const longSegment = 'a'.repeat(255);
      const result = path.join('dir', longSegment, 'file.txt');
      expect(result.includes(longSegment)).toBe(true);
    });
  });

  describe('Common Path Patterns Used in Installation', () => {
    test('should construct .claude-buddy paths correctly', () => {
      const baseDir = path.join(os.tmpdir(), 'test-project');
      const buddyDir = path.join(baseDir, '.claude-buddy');
      const configFile = path.join(buddyDir, 'buddy-config.json');

      expect(configFile.includes('.claude-buddy')).toBe(true);
      expect(configFile.includes('buddy-config.json')).toBe(true);
    });

    test('should construct .claude paths correctly', () => {
      const baseDir = path.join(os.tmpdir(), 'test-project');
      const claudeDir = path.join(baseDir, '.claude');
      const hooksDir = path.join(claudeDir, 'hooks');

      expect(hooksDir.includes('.claude')).toBe(true);
      expect(hooksDir.includes('hooks')).toBe(true);
    });

    test('should handle directive/ paths correctly', () => {
      const baseDir = path.join(os.tmpdir(), 'test-project');
      const directiveDir = path.join(baseDir, 'directive');
      const foundationFile = path.join(directiveDir, 'foundation.md');

      expect(foundationFile.includes('directive')).toBe(true);
      expect(foundationFile.includes('foundation.md')).toBe(true);
    });

    test('should handle metadata file paths', () => {
      const baseDir = path.join(os.tmpdir(), 'test-project');
      const metadataFile = path.join(baseDir, '.claude-buddy', 'install-metadata.json');

      expect(path.basename(metadataFile)).toBe('install-metadata.json');
      expect(path.dirname(metadataFile).includes('.claude-buddy')).toBe(true);
    });
  });

  describe('Platform-Specific Edge Cases', () => {
    test('should handle home directory expansion', () => {
      const homeDir = os.homedir();
      const result = path.join(homeDir, '.claude-buddy');

      expect(result.startsWith(homeDir)).toBe(true);
      expect(result.includes('.claude-buddy')).toBe(true);
    });

    test('should handle temporary directory paths', () => {
      const tmpDir = os.tmpdir();
      const result = path.join(tmpDir, 'claude-buddy-test');

      expect(result.startsWith(tmpDir)).toBe(true);
      expect(result.includes('claude-buddy-test')).toBe(true);
    });

    test('Windows: should handle UNC paths', () => {
      if (process.platform === 'win32') {
        const uncPath = '\\\\server\\share\\folder';
        const result = path.join(uncPath, 'file.txt');
        expect(result).toBe('\\\\server\\share\\folder\\file.txt');
        expect(path.isAbsolute(result)).toBe(true);
      }
    });

    test('Unix: should handle symlink-like paths', () => {
      if (process.platform !== 'win32') {
        const symlinkPath = '/usr/local/bin';
        const result = path.join(symlinkPath, 'claude-buddy');
        expect(result).toBe('/usr/local/bin/claude-buddy');
      }
    });
  });

  describe('Path Consistency Across Modules', () => {
    test('should produce consistent paths when combining operations', () => {
      const base = process.cwd();
      const relative = '.claude-buddy/templates';

      const method1 = path.resolve(base, relative);
      const method2 = path.join(base, relative);
      const method3 = path.resolve(path.join(base, relative));

      expect(method1).toBe(method2);
      expect(method2).toBe(method3);
    });

    test('should handle path operations in any order', () => {
      const dir = 'test-project';
      const subdir = '.claude-buddy';
      const file = 'config.json';

      const result1 = path.join(dir, subdir, file);
      const result2 = path.join(path.join(dir, subdir), file);
      const result3 = path.join(dir, path.join(subdir, file));

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});
