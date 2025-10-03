/**
 * Unit Tests: Version Comparison Logic
 * Tests the semantic version comparison functions used by updater and environment modules
 */

const { compareVersions } = require('../../lib/updater');
const { compareVersions: envCompareVersions } = require('../../lib/environment');

describe('Version Comparison Logic', () => {
  describe('compareVersions (updater module)', () => {
    test('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.5.3', '2.5.3')).toBe(0);
      expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
    });

    test('should return 1 when v1 > v2 (major version)', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('10.0.0', '9.0.0')).toBe(1);
    });

    test('should return -1 when v1 < v2 (major version)', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('5.0.0', '10.0.0')).toBe(-1);
    });

    test('should return 1 when v1 > v2 (minor version)', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
      expect(compareVersions('3.10.0', '3.5.0')).toBe(1);
    });

    test('should return -1 when v1 < v2 (minor version)', () => {
      expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
      expect(compareVersions('2.3.0', '2.8.0')).toBe(-1);
    });

    test('should return 1 when v1 > v2 (patch version)', () => {
      expect(compareVersions('1.0.5', '1.0.3')).toBe(1);
      expect(compareVersions('2.1.10', '2.1.8')).toBe(1);
    });

    test('should return -1 when v1 < v2 (patch version)', () => {
      expect(compareVersions('1.0.3', '1.0.5')).toBe(-1);
      expect(compareVersions('3.2.1', '3.2.9')).toBe(-1);
    });

    test('should handle complex version comparisons', () => {
      expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
      expect(compareVersions('1.2.4', '1.2.3')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
    });

    test('should handle version 0.x.x correctly', () => {
      expect(compareVersions('0.1.0', '0.0.9')).toBe(1);
      expect(compareVersions('0.0.1', '0.0.2')).toBe(-1);
      expect(compareVersions('0.5.0', '0.5.0')).toBe(0);
    });

    test('should handle multi-digit version numbers', () => {
      expect(compareVersions('10.20.30', '9.19.29')).toBe(1);
      expect(compareVersions('1.99.0', '1.100.0')).toBe(-1);
      expect(compareVersions('100.0.0', '99.999.999')).toBe(1);
    });

    test('should prioritize major over minor and patch', () => {
      expect(compareVersions('2.0.0', '1.99.99')).toBe(1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    test('should prioritize minor over patch', () => {
      expect(compareVersions('1.2.0', '1.1.99')).toBe(1);
      expect(compareVersions('1.5.0', '1.6.0')).toBe(-1);
    });
  });

  describe('compareVersions (environment module)', () => {
    test('should return 0 for equal versions', () => {
      expect(envCompareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(envCompareVersions('2.5.3', '2.5.3')).toBe(0);
    });

    test('should handle missing parts as 0', () => {
      // Environment module fills missing parts with 0
      expect(envCompareVersions('1.0', '1.0.0')).toBe(0);
      expect(envCompareVersions('1', '1.0.0')).toBe(0);
      expect(envCompareVersions('1.2', '1.2.0')).toBe(0);
    });

    test('should compare versions with missing parts correctly', () => {
      expect(envCompareVersions('1.1', '1.0.5')).toBe(1);
      expect(envCompareVersions('2', '1.9.9')).toBe(1);
      expect(envCompareVersions('1.0', '1.0.1')).toBe(-1);
    });

    test('should return 1 when v1 > v2', () => {
      expect(envCompareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(envCompareVersions('1.2.0', '1.1.0')).toBe(1);
      expect(envCompareVersions('1.0.5', '1.0.3')).toBe(1);
    });

    test('should return -1 when v1 < v2', () => {
      expect(envCompareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(envCompareVersions('1.1.0', '1.2.0')).toBe(-1);
      expect(envCompareVersions('1.0.3', '1.0.5')).toBe(-1);
    });

    test('should handle multi-digit version numbers', () => {
      expect(envCompareVersions('10.0.0', '9.0.0')).toBe(1);
      expect(envCompareVersions('1.100.0', '1.99.0')).toBe(1);
    });
  });

  describe('isDowngrade (updater module)', () => {
    const { isDowngrade } = require('../../lib/updater');

    test('should return true for downgrades', () => {
      expect(isDowngrade('2.0.0', '1.0.0')).toBe(true);
      expect(isDowngrade('1.5.0', '1.4.0')).toBe(true);
      expect(isDowngrade('1.0.5', '1.0.3')).toBe(true);
    });

    test('should return false for upgrades', () => {
      expect(isDowngrade('1.0.0', '2.0.0')).toBe(false);
      expect(isDowngrade('1.4.0', '1.5.0')).toBe(false);
      expect(isDowngrade('1.0.3', '1.0.5')).toBe(false);
    });

    test('should return false for same version', () => {
      expect(isDowngrade('1.0.0', '1.0.0')).toBe(false);
      expect(isDowngrade('2.5.3', '2.5.3')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isDowngrade('10.0.0', '9.9.9')).toBe(true);
      expect(isDowngrade('0.1.0', '0.0.9')).toBe(true);
      expect(isDowngrade('1.0.0', '1.0.1')).toBe(false);
    });
  });

  describe('Version Comparison Consistency', () => {
    test('both modules should produce consistent results for basic comparisons', () => {
      const testCases = [
        ['1.0.0', '1.0.0'],
        ['2.0.0', '1.0.0'],
        ['1.0.0', '2.0.0'],
        ['1.2.3', '1.2.4'],
        ['10.5.3', '9.8.7']
      ];

      testCases.forEach(([v1, v2]) => {
        const updaterResult = compareVersions(v1, v2);
        const envResult = envCompareVersions(v1, v2);
        expect(updaterResult).toBe(envResult);
      });
    });

    test('transitive property: if A > B and B > C, then A > C', () => {
      expect(compareVersions('3.0.0', '2.0.0')).toBe(1);
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('3.0.0', '1.0.0')).toBe(1);
    });

    test('reflexive property: A should equal A', () => {
      const versions = ['1.0.0', '2.5.3', '0.1.0', '10.20.30'];
      versions.forEach(version => {
        expect(compareVersions(version, version)).toBe(0);
        expect(envCompareVersions(version, version)).toBe(0);
      });
    });

    test('symmetric property: if A < B, then B > A', () => {
      const pairs = [
        ['1.0.0', '2.0.0'],
        ['1.5.0', '1.6.0'],
        ['1.0.5', '1.0.10']
      ];

      pairs.forEach(([v1, v2]) => {
        const result1 = compareVersions(v1, v2);
        const result2 = compareVersions(v2, v1);
        expect(result1).toBe(-result2);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle versions with leading zeros', () => {
      // Note: These may parse as expected with Number()
      expect(compareVersions('1.0.0', '1.00.00')).toBe(0);
      expect(compareVersions('01.02.03', '1.2.3')).toBe(0);
    });

    test('should handle very large version numbers', () => {
      expect(compareVersions('999.999.999', '1000.0.0')).toBe(-1);
      expect(compareVersions('1000.0.0', '999.999.999')).toBe(1);
    });
  });
});
