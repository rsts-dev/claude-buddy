/**
 * Unit Tests: Configuration Merge Strategies
 * Tests configuration merging logic used during updates
 */

const { mergeConfigurations, deepMerge } = require('../../lib/updater');

describe('Configuration Merge Strategies', () => {
  // Sample configurations for testing
  const newConfig = {
    version: '2.0.0',
    timeout: 30,
    features: {
      hooks: true,
      templates: true,
      verbose: false
    },
    newField: 'new-value'
  };

  const existingConfig = {
    version: '1.0.0',
    timeout: 60,
    features: {
      hooks: false,
      templates: true,
      customField: 'user-value'
    },
    userField: 'custom-value'
  };

  describe('mergeConfigurations() - Main Merge Function', () => {
    test('should merge with keep_user strategy', async () => {
      const result = await mergeConfigurations(
        'config.json',
        newConfig,
        existingConfig,
        'keep_user',
        false
      );

      expect(result.strategy).toBe('keep_user');
      expect(result.mergedContent).toEqual(existingConfig);
      expect(result.mergedContent.timeout).toBe(60); // User value
      expect(result.mergedContent.version).toBe('1.0.0'); // User value
    });

    test('should merge with use_new strategy', async () => {
      const result = await mergeConfigurations(
        'config.json',
        newConfig,
        existingConfig,
        'use_new',
        false
      );

      expect(result.strategy).toBe('use_new');
      expect(result.mergedContent).toEqual(newConfig);
      expect(result.mergedContent.timeout).toBe(30); // New value
      expect(result.mergedContent.version).toBe('2.0.0'); // New value
      expect(result.mergedContent.userField).toBeUndefined(); // User field lost
    });

    test('should merge with shallow_merge strategy', async () => {
      const result = await mergeConfigurations(
        'config.json',
        newConfig,
        existingConfig,
        'shallow_merge',
        false
      );

      expect(result.strategy).toBe('shallow_merge');
      // User values override new values at top level
      expect(result.mergedContent.timeout).toBe(60); // User value wins
      expect(result.mergedContent.version).toBe('1.0.0'); // User value wins
      expect(result.mergedContent.newField).toBe('new-value'); // New field added
      expect(result.mergedContent.userField).toBe('custom-value'); // User field preserved
    });

    test('should merge with deep_merge strategy', async () => {
      const result = await mergeConfigurations(
        'config.json',
        newConfig,
        existingConfig,
        'deep_merge',
        false
      );

      expect(result.strategy).toBe('deep_merge');
      // Top-level user values win
      expect(result.mergedContent.timeout).toBe(60);
      expect(result.mergedContent.version).toBe('1.0.0');

      // Nested objects are deeply merged
      expect(result.mergedContent.features.hooks).toBe(false); // User value wins
      expect(result.mergedContent.features.templates).toBe(true); // Same in both
      expect(result.mergedContent.features.verbose).toBe(false); // From new config
      expect(result.mergedContent.features.customField).toBe('user-value'); // User field preserved
    });

    test('should detect conflicts between configurations', async () => {
      const result = await mergeConfigurations(
        'config.json',
        newConfig,
        existingConfig,
        'shallow_merge',
        false
      );

      expect(result.conflicts.length).toBeGreaterThan(0);

      // Should detect version conflict
      const versionConflict = result.conflicts.find(c => c.path === 'version');
      expect(versionConflict).toBeDefined();
      expect(versionConflict.userValue).toBe('1.0.0');
      expect(versionConflict.newValue).toBe('2.0.0');

      // Should detect timeout conflict
      const timeoutConflict = result.conflicts.find(c => c.path === 'timeout');
      expect(timeoutConflict).toBeDefined();
      expect(timeoutConflict.userValue).toBe(60);
      expect(timeoutConflict.newValue).toBe(30);
    });

    test('should throw error for unknown merge strategy', async () => {
      await expect(
        mergeConfigurations(
          'config.json',
          newConfig,
          existingConfig,
          'invalid_strategy',
          false
        )
      ).rejects.toThrow('Unknown merge strategy: invalid_strategy');
    });

    test('should return correct result structure', async () => {
      const result = await mergeConfigurations(
        'config.json',
        newConfig,
        existingConfig,
        'shallow_merge',
        false
      );

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('strategy');
      expect(result).toHaveProperty('isUserModified');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('mergedContent');
      expect(result).toHaveProperty('backupPath');
      expect(result).toHaveProperty('requiresUserInput');

      expect(result.filePath).toBe('config.json');
      expect(result.isUserModified).toBe(true);
      expect(Array.isArray(result.conflicts)).toBe(true);
    });
  });

  describe('deepMerge() - Deep Merge Utility', () => {
    test('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should deeply merge nested objects', () => {
      const target = {
        level1: {
          level2: {
            a: 1,
            b: 2
          }
        }
      };

      const source = {
        level1: {
          level2: {
            b: 3,
            c: 4
          }
        }
      };

      const result = deepMerge(target, source);

      expect(result.level1.level2).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should preserve target values not in source', () => {
      const target = { a: 1, b: 2, c: 3 };
      const source = { b: 99 };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 99, c: 3 });
    });

    test('should add source values not in target', () => {
      const target = { a: 1 };
      const source = { b: 2, c: 3 };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    test('should handle arrays as values (no deep merge of arrays)', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5] };
      const result = deepMerge(target, source);

      // Arrays are replaced, not merged
      expect(result.arr).toEqual([4, 5]);
    });

    test('should handle null values', () => {
      const target = { a: 1, b: null };
      const source = { b: 2, c: null };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2, c: null });
    });

    test('should handle undefined values', () => {
      const target = { a: 1, b: undefined };
      const source = { b: 2, c: undefined };
      const result = deepMerge(target, source);

      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
      expect(result.c).toBeUndefined();
    });

    test('should not mutate original objects', () => {
      const target = { a: 1, nested: { b: 2 } };
      const source = { nested: { c: 3 } };

      const targetCopy = JSON.parse(JSON.stringify(target));
      const sourceCopy = JSON.parse(JSON.stringify(source));

      deepMerge(target, source);

      expect(target).toEqual(targetCopy);
      expect(source).toEqual(sourceCopy);
    });

    test('should handle deeply nested structures', () => {
      const target = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'old'
              }
            }
          }
        }
      };

      const source = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'new',
                extra: 'added'
              }
            }
          }
        }
      };

      const result = deepMerge(target, source);

      expect(result.level1.level2.level3.level4.value).toBe('new');
      expect(result.level1.level2.level3.level4.extra).toBe('added');
    });

    test('should handle mixed nested structures', () => {
      const target = {
        primitives: {
          string: 'old',
          number: 1,
          boolean: false
        },
        nested: {
          deep: {
            value: 'target-value'
          }
        }
      };

      const source = {
        primitives: {
          string: 'new',
          number: 2
        },
        nested: {
          deep: {
            newField: 'source-value'
          }
        }
      };

      const result = deepMerge(target, source);

      expect(result.primitives.string).toBe('new');
      expect(result.primitives.number).toBe(2);
      expect(result.primitives.boolean).toBe(false);
      expect(result.nested.deep.value).toBe('target-value');
      expect(result.nested.deep.newField).toBe('source-value');
    });

    test('should replace object with non-object', () => {
      const target = { a: { nested: 'object' } };
      const source = { a: 'string-value' };
      const result = deepMerge(target, source);

      expect(result.a).toBe('string-value');
    });

    test('should replace non-object with object', () => {
      const target = { a: 'string-value' };
      const source = { a: { nested: 'object' } };
      const result = deepMerge(target, source);

      expect(result.a).toEqual({ nested: 'object' });
    });
  });

  describe('Shallow Merge Behavior', () => {
    test('should preserve all user top-level fields', () => {
      const newCfg = {
        framework: { version: '2.0.0' },
        timeout: 30
      };

      const userCfg = {
        framework: { version: '1.0.0', custom: true },
        timeout: 60,
        userField: 'preserved'
      };

      // Shallow merge: { ...newCfg, ...userCfg }
      const merged = { ...newCfg, ...userCfg };

      expect(merged.framework).toEqual({ version: '1.0.0', custom: true }); // User object wins entirely
      expect(merged.timeout).toBe(60); // User value wins
      expect(merged.userField).toBe('preserved'); // User field preserved
    });

    test('should add new top-level fields from new config', () => {
      const newCfg = {
        existingField: 'value1',
        newField: 'value2'
      };

      const userCfg = {
        existingField: 'user-value'
      };

      const merged = { ...newCfg, ...userCfg };

      expect(merged.existingField).toBe('user-value'); // User value wins
      expect(merged.newField).toBe('value2'); // New field added
    });

    test('should not deeply merge nested objects in shallow merge', () => {
      const newCfg = {
        features: {
          feature1: true,
          feature2: false
        }
      };

      const userCfg = {
        features: {
          feature1: false
        }
      };

      const merged = { ...newCfg, ...userCfg };

      // In shallow merge, user's features object replaces entirely
      expect(merged.features).toEqual({ feature1: false });
      expect(merged.features.feature2).toBeUndefined(); // Lost in shallow merge
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    test('should handle empty configurations', async () => {
      const result = await mergeConfigurations(
        'config.json',
        {},
        {},
        'shallow_merge',
        false
      );

      expect(result.mergedContent).toEqual({});
      expect(result.conflicts).toEqual([]);
    });

    test('should handle configuration with only new fields', async () => {
      const onlyNew = { newField1: 'value1', newField2: 'value2' };
      const empty = {};

      const result = await mergeConfigurations(
        'config.json',
        onlyNew,
        empty,
        'shallow_merge',
        false
      );

      expect(result.mergedContent).toEqual(onlyNew);
      expect(result.conflicts).toEqual([]);
    });

    test('should handle configuration with only user fields', async () => {
      const empty = {};
      const onlyUser = { userField1: 'value1', userField2: 'value2' };

      const result = await mergeConfigurations(
        'config.json',
        empty,
        onlyUser,
        'shallow_merge',
        false
      );

      expect(result.mergedContent).toEqual(onlyUser);
      expect(result.conflicts).toEqual([]);
    });

    test('should handle boolean value conflicts', async () => {
      const newCfg = { enabled: true };
      const userCfg = { enabled: false };

      const result = await mergeConfigurations(
        'config.json',
        newCfg,
        userCfg,
        'shallow_merge',
        false
      );

      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].path).toBe('enabled');
      expect(result.conflicts[0].userValue).toBe(false);
      expect(result.conflicts[0].newValue).toBe(true);
      expect(result.mergedContent.enabled).toBe(false); // User wins
    });

    test('should handle number value conflicts', async () => {
      const newCfg = { timeout: 30, retries: 3 };
      const userCfg = { timeout: 60, retries: 5 };

      const result = await mergeConfigurations(
        'config.json',
        newCfg,
        userCfg,
        'shallow_merge',
        false
      );

      expect(result.conflicts.length).toBe(2);
      expect(result.mergedContent.timeout).toBe(60);
      expect(result.mergedContent.retries).toBe(5);
    });

    test('should handle array value conflicts', async () => {
      const newCfg = { features: ['feature1', 'feature2'] };
      const userCfg = { features: ['feature1', 'custom'] };

      const result = await mergeConfigurations(
        'config.json',
        newCfg,
        userCfg,
        'shallow_merge',
        false
      );

      expect(result.conflicts.length).toBe(1);
      expect(result.mergedContent.features).toEqual(['feature1', 'custom']); // User array wins
    });

    test('should handle deeply nested conflicts with deep_merge', () => {
      const target = {
        level1: {
          level2: {
            level3: {
              value: 'old'
            }
          }
        }
      };

      const source = {
        level1: {
          level2: {
            level3: {
              value: 'new'
            }
          }
        }
      };

      const result = deepMerge(target, source);

      // In deep merge, source value wins at leaf level
      expect(result.level1.level2.level3.value).toBe('new');
    });
  });

  describe('Real-World Configuration Scenarios', () => {
    test('should merge typical Claude Buddy configuration', async () => {
      const defaultConfig = {
        version: '2.0.0',
        autoActivation: {
          enabled: true,
          threshold: 0.7
        },
        hooks: {
          timeout: 10000,
          enabled: true
        },
        logging: {
          level: 'info',
          fileLogging: false
        }
      };

      const userConfig = {
        version: '1.0.0',
        autoActivation: {
          enabled: false,
          customPersonas: ['architect', 'reviewer']
        },
        hooks: {
          timeout: 30000
        },
        customSettings: {
          myField: 'myValue'
        }
      };

      const result = await mergeConfigurations(
        'buddy-config.json',
        defaultConfig,
        userConfig,
        'deep_merge',
        false
      );

      // Top-level user values should win
      expect(result.mergedContent.version).toBe('1.0.0');
      expect(result.mergedContent.customSettings).toEqual({ myField: 'myValue' });

      // Deep merge: autoActivation should have all fields
      expect(result.mergedContent.autoActivation.enabled).toBe(false); // User value
      expect(result.mergedContent.autoActivation.threshold).toBe(0.7); // Default value
      expect(result.mergedContent.autoActivation.customPersonas).toEqual(['architect', 'reviewer']); // User value

      // Deep merge: hooks should have merged fields
      expect(result.mergedContent.hooks.timeout).toBe(30000); // User value
      expect(result.mergedContent.hooks.enabled).toBe(true); // Default value

      // Deep merge: logging should have default values (not in user config)
      expect(result.mergedContent.logging).toEqual({
        level: 'info',
        fileLogging: false
      });
    });
  });
});
