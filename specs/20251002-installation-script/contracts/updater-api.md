# Updater API Contract

**Module**: `setup/lib/updater.js`
**Type**: Internal module
**Related**: [data-model.md](../data-model.md), [transaction-api.md](./transaction-api.md)

---

## Overview

The Updater module handles updating existing Claude Buddy installations while preserving user customizations. It implements intelligent file merging, configuration migration, and safe upgrade paths.

---

## Module Exports

```javascript
module.exports = {
  performUpdate,
  detectUserCustomizations,
  mergeConfigurations,
  runMigrations,
  createBackup
};
```

---

## API Functions

### 1. performUpdate()

**Description**: Executes complete update process from one version to another.

**Signature**:
```javascript
async function performUpdate(options: UpdateOptions): Promise<UpdateResult>
```

**Parameters**:
```typescript
interface UpdateOptions {
  targetDirectory: string;
  fromVersion: string;
  toVersion: string;
  manifest: InstallationManifest;
  components: Component[];
  existingMetadata: InstallationMetadata;
  preserveAll?: boolean;        // Default: false
  mergeConfig?: boolean;        // Default: true (shallow merge)
  dryRun?: boolean;
}
```

**Returns**:
```typescript
interface UpdateResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  updatedFiles: string[];
  preservedFiles: string[];
  migratedConfigs: string[];
  backupPath: string;
  duration: number;
  warnings: UpdateWarning[];
  errors: UpdateError[];
}
```

**Example**:
```javascript
const { performUpdate } = require('./lib/updater');

const result = await performUpdate({
  targetDirectory: '/path/to/project',
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  manifest,
  components: filteredComponents.installable,
  existingMetadata: metadata
});

if (result.success) {
  console.log(`✅ Updated from ${result.fromVersion} to ${result.toVersion}`);
  console.log(`📁 Updated: ${result.updatedFiles.length} files`);
  console.log(`🔒 Preserved: ${result.preservedFiles.length} files`);
  console.log(`💾 Backup: ${result.backupPath}`);
}
```

**Update Flow**:
1. Create transaction with pre-update checkpoint
2. Create timestamped backup of existing installation
3. Detect user customizations
4. Run version migrations
5. Update framework files (skip customizations)
6. Merge configuration files
7. Update metadata
8. Verify update integrity
9. Commit transaction or rollback on failure

**Error Conditions**:
- Throws `UpdateError` if critical failure occurs
- Automatically rolls back to backup on failure
- Returns partial results if optional components fail

---

### 2. detectUserCustomizations()

**Description**: Identifies files that have been modified by users since installation.

**Signature**:
```javascript
async function detectUserCustomizations(
  targetDirectory: string,
  metadata: InstallationMetadata
): Promise<UserCustomization[]>
```

**Parameters**:
- `targetDirectory`: Base directory to scan
- `metadata`: Existing installation metadata

**Returns**: Array of `UserCustomization` objects (see data-model.md)

**Example**:
```javascript
const { detectUserCustomizations } = require('./lib/updater');

const customizations = await detectUserCustomizations(
  '/path/to/project',
  metadata
);

console.log(`Found ${customizations.length} user customizations:`);
customizations.forEach(custom => {
  console.log(`  📝 ${custom.file} (modified ${custom.lastModified})`);
});
```

**Detection Strategy**:

1. **Timestamp Comparison**:
   ```javascript
   const fileModTime = (await fs.stat(filePath)).mtime;
   const installTime = new Date(metadata.installDate);

   if (fileModTime > installTime) {
     // File modified after installation = user customization
   }
   ```

2. **Known Framework Files**:
   - Framework files from manifest are tracked
   - User files outside framework paths are identified
   - Custom personas (not in manifest) are detected

3. **File Classification**:
   ```javascript
   const classification = {
     frameworkFiles: [/* framework files to update */],
     userFiles: [/* user-created files to preserve */],
     modifiedFrameworkFiles: [/* framework files modified by user */]
   };
   ```

**Customization Types**:
- **Custom Personas**: Files in `.claude-buddy/personas/` not in manifest
- **Modified Configs**: Config files with timestamp > install time
- **User Templates**: Templates added to `.claude-buddy/templates/`
- **Custom Commands**: Command files not in manifest

**Error Conditions**:
- Never throws errors
- Returns empty array if metadata missing
- Logs warnings for inaccessible files

---

### 3. mergeConfigurations()

**Description**: Merges new configuration defaults with existing user configurations.

**Signature**:
```javascript
async function mergeConfigurations(
  configFile: string,
  newConfig: any,
  existingConfig: any,
  strategy: MergeStrategy
): Promise<ConfigurationMergeResult>
```

**Parameters**:
- `configFile`: Configuration file path
- `newConfig`: New configuration from updated version
- `existingConfig`: Current user configuration
- `strategy`: Merge strategy ("keep_user", "use_new", "shallow_merge", "deep_merge")

**Returns**: `ConfigurationMergeResult` (see data-model.md)

**Example**:
```javascript
const { mergeConfigurations } = require('./lib/updater');

const result = await mergeConfigurations(
  '.claude-buddy/buddy-config.json',
  newConfig,
  existingConfig,
  'shallow_merge'
);

if (result.conflicts.length > 0) {
  console.warn('Configuration conflicts detected:');
  result.conflicts.forEach(conflict => {
    console.warn(`  ${conflict.path}: user=${conflict.userValue}, new=${conflict.newValue}`);
  });
}

await fs.writeJson(configFile, result.mergedContent, { spaces: 2 });
```

**Merge Strategies**:

1. **keep_user**: Keep all existing values, ignore new defaults
   ```javascript
   mergedConfig = { ...existingConfig };
   ```

2. **use_new**: Replace with new defaults, discard user changes
   ```javascript
   mergedConfig = { ...newConfig };
   ```

3. **shallow_merge**: Merge top-level keys, user values take precedence
   ```javascript
   mergedConfig = { ...newConfig, ...existingConfig };
   ```

4. **deep_merge**: Recursively merge nested objects
   ```javascript
   mergedConfig = deepMerge(newConfig, existingConfig);
   ```

**Conflict Detection**:
```javascript
function detectConflicts(newConfig, existingConfig) {
  const conflicts = [];

  for (const [key, newValue] of Object.entries(newConfig)) {
    if (existingConfig.hasOwnProperty(key)) {
      const userValue = existingConfig[key];

      if (!isEqual(userValue, newValue)) {
        conflicts.push({
          path: key,
          userValue,
          newValue,
          resolution: 'pending'
        });
      }
    }
  }

  return conflicts;
}
```

**User Prompts** (non-interactive mode):
```javascript
const { resolution } = await inquirer.prompt([
  {
    type: 'list',
    name: 'resolution',
    message: `Conflict in ${configFile} at "${conflict.path}":`,
    choices: [
      { name: 'Keep my value', value: 'keep_user' },
      { name: 'Use new default', value: 'use_new' },
      { name: 'Merge both', value: 'merge' }
    ]
  }
]);
```

---

### 4. runMigrations()

**Description**: Executes version-specific migration scripts to transform configurations.

**Signature**:
```javascript
async function runMigrations(
  fromVersion: string,
  toVersion: string,
  targetDirectory: string
): Promise<MigrationResult>
```

**Parameters**:
- `fromVersion`: Source version (current installation)
- `toVersion`: Target version (new installation)
- `targetDirectory`: Base directory for migration

**Returns**:
```typescript
interface MigrationResult {
  applied: Migration[];
  skipped: Migration[];
  errors: MigrationError[];
}

interface Migration {
  id: string;              // e.g., "1.0.0-to-1.1.0"
  description: string;
  applied: boolean;
}
```

**Example**:
```javascript
const { runMigrations } = require('./lib/updater');

const result = await runMigrations('1.0.0', '1.2.0', '/path/to/project');

console.log(`Applied ${result.applied.length} migrations:`);
result.applied.forEach(migration => {
  console.log(`  ✓ ${migration.id}: ${migration.description}`);
});
```

**Migration Registry**:
```javascript
const migrations = {
  '1.0.0-to-1.1.0': {
    description: 'Add new persona auto-activation settings',
    migrate: async (config, targetDir) => {
      // Add new fields with defaults
      if (!config.personas) {
        config.personas = { autoActivation: { enabled: true, threshold: 0.7 } };
      }
      return config;
    }
  },

  '1.1.0-to-1.2.0': {
    description: 'Rename hook timeout fields',
    migrate: async (config, targetDir) => {
      // Rename fields
      if (config.hookTimeout) {
        config.hooks = { timeout: config.hookTimeout };
        delete config.hookTimeout;
      }
      return config;
    }
  }
};
```

**Migration Execution**:
1. Determine migration path (e.g., 1.0.0 → 1.1.0 → 1.2.0)
2. Execute migrations in sequence
3. Apply to all configuration files
4. Log migration actions
5. Rollback all if any migration fails

**Error Conditions**:
- Throws `MigrationError` if critical migration fails
- Includes rollback capability
- Logs detailed error information

---

### 5. createBackup()

**Description**: Creates timestamped backup of existing installation before update.

**Signature**:
```javascript
async function createBackup(
  targetDirectory: string,
  metadata: InstallationMetadata
): Promise<string>
```

**Parameters**:
- `targetDirectory`: Base directory to backup
- `metadata`: Installation metadata

**Returns**: String (backup directory path)

**Example**:
```javascript
const { createBackup } = require('./lib/updater');

const backupPath = await createBackup('/path/to/project', metadata);
console.log(`Backup created: ${backupPath}`);

// Backup location: .claude-buddy/backup-2025-10-02T12-00-00Z/
```

**Backup Strategy**:

1. **Backup Location**: `.claude-buddy/backup-{ISO8601}/`
   ```javascript
   const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
   const backupDir = path.join(targetDirectory, '.claude-buddy', `backup-${timestamp}`);
   ```

2. **Backup Contents**:
   - All `.claude-buddy/` files
   - All `.claude/` files
   - `directive/foundation.md`
   - `install-metadata.json`

3. **Backup Retention**:
   - Keep last 3 backups
   - Delete backups older than 7 days
   - Compressed format for storage efficiency (optional)

**Restore Function**:
```javascript
async function restoreFromBackup(backupPath: string, targetDirectory: string): Promise<void>
```

**Error Conditions**:
- Throws `BackupError` if backup creation fails
- Throws `DiskSpaceError` if insufficient space for backup
- Validates backup integrity after creation

---

## Utility Functions

### compareVersions()
```javascript
function compareVersions(v1: string, v2: string): number
```
Returns -1 (v1 < v2), 0 (v1 === v2), 1 (v1 > v2).

### isDowngrade()
```javascript
function isDowngrade(fromVersion: string, toVersion: string): boolean
```
Returns true if toVersion is older than fromVersion.

### shouldUpdateFile()
```javascript
function shouldUpdateFile(
  filePath: string,
  customizations: UserCustomization[]
): boolean
```
Returns true if file should be updated (not a user customization).

### getMigrationPath()
```javascript
function getMigrationPath(fromVersion: string, toVersion: string): string[]
```
Returns ordered list of migration IDs to apply.

---

## Error Classes

### UpdateError
```javascript
class UpdateError extends Error {
  constructor(message, fromVersion, toVersion, details)
}
```

### MigrationError
```javascript
class MigrationError extends Error {
  constructor(message, migrationId, details)
}
```

### BackupError
```javascript
class BackupError extends Error {
  constructor(message, backupPath, details)
}
```

---

## Update Scenarios

### 1. Patch Update (1.0.0 → 1.0.1)
- Update framework files only
- No migrations needed
- Preserve all user customizations
- Quick update (< 5 seconds)

### 2. Minor Update (1.0.0 → 1.1.0)
- Update framework files
- Run minor migrations (add new fields)
- Preserve user customizations
- Merge configurations (shallow)
- Moderate update (5-15 seconds)

### 3. Major Update (1.0.0 → 2.0.0)
- Update framework files
- Run major migrations (breaking changes)
- Prompt for conflict resolution
- Deep configuration merge
- Backup + verification required
- Long update (15-30 seconds)

### 4. Downgrade (1.1.0 → 1.0.0)
- Warn user about potential issues
- Create backup before proceeding
- Remove unsupported configurations
- May lose functionality
- Require explicit confirmation

---

## Preservation Rules

### Always Preserve
- Custom personas (`.claude-buddy/personas/custom-*.md`)
- User-created templates
- Modified configuration values (with merge)
- User-created specs in `specs/`

### Always Update
- Framework templates (`.claude-buddy/templates/`)
- Slash commands (`.claude/commands/`)
- Agent protocols (`.claude/agents/`)
- Hook scripts (`.claude/hooks/`)

### Conditional Update
- Configuration files (merge strategy)
- Foundation document (preserve if modified, offer merge)
- Metadata (always update with migration)

---

## Progress Reporting

```javascript
updater.on('progress', (event) => {
  console.log(`[${event.phase}] ${event.message} (${event.percentage}%)`);
});
```

**Update Phases**:
- **Backup**: Creating backup
- **Detection**: Detecting customizations
- **Migration**: Running migrations
- **Update**: Updating framework files
- **Merge**: Merging configurations
- **Verification**: Verifying update

---

*This updater API provides safe, customization-preserving updates with intelligent merging and migration.*
