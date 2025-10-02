# Uninstaller API Contract

**Module**: `setup/lib/uninstaller.js`
**Type**: Internal module
**Related**: [data-model.md](../data-model.md), [transaction-api.md](./transaction-api.md)

---

## Overview

The Uninstaller module safely removes Claude Buddy from a project while optionally preserving user customizations. It implements confirmation prompts, selective removal, and complete cleanup.

---

## Module Exports

```javascript
module.exports = {
  performUninstall,
  confirmUninstall,
  removeComponents,
  cleanupDirectories,
  preserveUserData
};
```

---

## API Functions

### 1. performUninstall()

**Description**: Executes complete uninstallation process.

**Signature**:
```javascript
async function performUninstall(options: UninstallOptions): Promise<UninstallResult>
```

**Parameters**:
```typescript
interface UninstallOptions {
  targetDirectory: string;
  metadata: InstallationMetadata;
  preserveCustomizations?: boolean;   // Default: true
  purge?: boolean;                    // Default: false
  nonInteractive?: boolean;           // Default: false
  dryRun?: boolean;                   // Default: false
}
```

**Returns**:
```typescript
interface UninstallResult {
  success: boolean;
  removedFiles: string[];
  preservedFiles: string[];
  removedDirectories: string[];
  preservedDirectories: string[];
  duration: number;
  warnings: string[];
}
```

**Example**:
```javascript
const { performUninstall } = require('./lib/uninstaller');

const result = await performUninstall({
  targetDirectory: '/path/to/project',
  metadata,
  preserveCustomizations: true,
  nonInteractive: false
});

if (result.success) {
  console.log(`✅ Uninstallation complete`);
  console.log(`🗑️  Removed: ${result.removedFiles.length} files`);
  console.log(`🔒 Preserved: ${result.preservedFiles.length} files`);
}
```

**Uninstallation Flow**:
1. Confirm uninstallation (unless non-interactive)
2. Create final backup (for safety)
3. Identify files to remove vs preserve
4. Remove framework files
5. Remove empty directories
6. Clean up metadata
7. Display summary

**Error Conditions**:
- Throws `UninstallError` if critical failure occurs
- Prompts for confirmation before destructive operations
- Creates backup before any removal

---

### 2. confirmUninstall()

**Description**: Prompts user to confirm uninstallation.

**Signature**:
```javascript
async function confirmUninstall(options: UninstallOptions): Promise<boolean>
```

**Parameters**:
- `options`: Uninstall options including purge flag

**Returns**: Boolean (true if confirmed, false if cancelled)

**Example**:
```javascript
const { confirmUninstall } = require('./lib/uninstaller');

const confirmed = await confirmUninstall({
  targetDirectory: '/path/to/project',
  metadata,
  purge: true
});

if (!confirmed) {
  console.log('Uninstallation cancelled');
  process.exit(10);
}
```

**Confirmation Prompts**:

**Standard Uninstall**:
```
⚠️  Claude Buddy Uninstallation

This will remove Claude Buddy from: /path/to/project

The following will be removed:
  • Framework files (.claude-buddy, .claude)
  • Slash commands and agents
  • Hook scripts

The following will be preserved:
  • User customizations (3 files)
  • Custom personas (2 files)
  • Project specifications (specs/)

Are you sure you want to uninstall? (y/N):
```

**Purge Mode**:
```
⚠️  WARNING: Complete Purge

This will PERMANENTLY remove ALL Claude Buddy files including:
  • Framework files
  • User customizations
  • Custom personas
  • All configurations

This action CANNOT be undone (even with backup).

Type 'PURGE' to confirm complete removal:
```

**Non-Interactive Mode**:
- Skips confirmation
- Uses defaults (preserve customizations)
- Purge requires explicit `--purge` flag + `--non-interactive`

**Error Conditions**:
- Returns `false` if user cancels
- Never throws errors

---

### 3. removeComponents()

**Description**: Removes specified components from the installation.

**Signature**:
```javascript
async function removeComponents(
  targetDirectory: string,
  components: Component[],
  preserveCustomizations: boolean
): Promise<RemovalResult>
```

**Parameters**:
- `targetDirectory`: Base directory
- `components`: Components to remove
- `preserveCustomizations`: Whether to preserve user files

**Returns**:
```typescript
interface RemovalResult {
  removed: string[];
  preserved: string[];
  errors: RemovalError[];
}

interface RemovalError {
  path: string;
  error: string;
  recoverable: boolean;
}
```

**Example**:
```javascript
const { removeComponents } = require('./lib/uninstaller');

const result = await removeComponents(
  '/path/to/project',
  manifest.components,
  true  // preserve customizations
);

console.log(`Removed ${result.removed.length} files`);
console.log(`Preserved ${result.preserved.length} customizations`);
```

**Removal Logic**:

1. **Identify Files to Remove**:
   ```javascript
   for (const component of components) {
     const files = await glob(component.filePatterns, {
       cwd: path.join(targetDirectory, component.target)
     });

     for (const file of files) {
       if (preserveCustomizations && isUserCustomization(file)) {
         preserved.push(file);
       } else {
         toRemove.push(file);
       }
     }
   }
   ```

2. **Remove Files**:
   ```javascript
   for (const file of toRemove) {
     try {
       await fs.unlink(file);
       removed.push(file);
     } catch (err) {
       errors.push({ path: file, error: err.message, recoverable: true });
     }
   }
   ```

**User Customization Detection**:
- Custom personas: `custom-*.md` files
- Modified configs: Files with mtime > install time
- User specs: All files in `specs/` directory
- User templates: Non-framework templates

**Error Conditions**:
- Never throws errors
- Logs errors to result.errors array
- Continues removal even if some files fail

---

### 4. cleanupDirectories()

**Description**: Removes empty directories after file removal.

**Signature**:
```javascript
async function cleanupDirectories(
  targetDirectory: string,
  directories: string[]
): Promise<CleanupResult>
```

**Parameters**:
- `targetDirectory`: Base directory
- `directories`: Directories to check and remove if empty

**Returns**:
```typescript
interface CleanupResult {
  removed: string[];
  preserved: string[];  // Not empty, preserved
}
```

**Example**:
```javascript
const { cleanupDirectories } = require('./lib/uninstaller');

const result = await cleanupDirectories(
  '/path/to/project',
  ['.claude-buddy', '.claude', 'directive']
);

console.log(`Removed ${result.removed.length} empty directories`);
```

**Cleanup Logic**:
1. Check if directory is empty
2. If empty: Remove directory
3. If not empty: Preserve directory
4. Recurse up to parent directories
5. Stop at target directory root

**Directory Removal Order** (bottom-up):
```
.claude-buddy/personas/
.claude-buddy/templates/
.claude-buddy/
.claude/hooks/
.claude/commands/
.claude/
directive/
```

**Error Conditions**:
- Never throws errors
- Logs warnings for permission denied
- Preserves non-empty directories

---

### 5. preserveUserData()

**Description**: Creates backup of user customizations before uninstall.

**Signature**:
```javascript
async function preserveUserData(
  targetDirectory: string,
  metadata: InstallationMetadata
): Promise<string>
```

**Parameters**:
- `targetDirectory`: Base directory
- `metadata`: Installation metadata

**Returns**: String (preservation backup path)

**Example**:
```javascript
const { preserveUserData } = require('./lib/uninstaller');

const backupPath = await preserveUserData('/path/to/project', metadata);
console.log(`User data preserved at: ${backupPath}`);
```

**Preserved Data**:
- Custom personas
- User-modified configurations
- User-created templates
- Project specifications
- User documentation

**Backup Location**: `.claude-buddy-preserved-{timestamp}/`

**Error Conditions**:
- Throws `PreservationError` if backup fails
- Validates backup integrity after creation

---

## Utility Functions

### isUserCustomization()
```javascript
function isUserCustomization(filePath: string, metadata: InstallationMetadata): boolean
```
Returns true if file is a user customization.

### getRemovalPlan()
```javascript
function getRemovalPlan(
  targetDirectory: string,
  metadata: InstallationMetadata,
  preserveCustomizations: boolean
): RemovalPlan
```
Returns detailed plan of what will be removed/preserved.

### validateUninstall()
```javascript
async function validateUninstall(targetDirectory: string): Promise<boolean>
```
Validates that directory has Claude Buddy installation.

---

## Error Classes

### UninstallError
```javascript
class UninstallError extends Error {
  constructor(message, code, details)
}
```

**Error Codes**:
- `NOT_INSTALLED`: No installation found
- `PERMISSION_DENIED`: Cannot remove files
- `BACKUP_FAILED`: Backup creation failed
- `PARTIAL_REMOVAL`: Some files couldn't be removed

### PreservationError
```javascript
class PreservationError extends Error {
  constructor(message, files, details)
}
```

---

## Uninstall Modes

### 1. Standard Uninstall
**Flags**: (none)
- Removes framework files
- Preserves user customizations
- Requires confirmation
- Creates backup

**Command**:
```bash
claude-buddy uninstall
```

### 2. Preserve All
**Flags**: `--preserve-customizations`
- Removes only core framework files
- Preserves everything else
- Safest option

**Command**:
```bash
claude-buddy uninstall --preserve-customizations
```

### 3. Complete Purge
**Flags**: `--purge`
- Removes everything
- No preservation
- Requires explicit confirmation ("PURGE")
- Creates backup for safety

**Command**:
```bash
claude-buddy uninstall --purge
```

### 4. Non-Interactive
**Flags**: `--non-interactive`
- No user prompts
- Uses default preservation
- Suitable for CI/CD

**Command**:
```bash
claude-buddy uninstall --non-interactive
```

---

## Removal Plan

Before uninstallation, a detailed plan is displayed:

```typescript
interface RemovalPlan {
  filesToRemove: string[];
  filesToPreserve: string[];
  directoriesToRemove: string[];
  directoriesToPreserve: string[];
  estimatedDuration: number;
  backupRequired: boolean;
}
```

**Display Format**:
```
Uninstallation Plan:

Files to remove (67):
  • .claude-buddy/buddy-config.json
  • .claude-buddy/templates/default/spec.md
  • .claude-buddy/templates/default/plan.md
  ... (64 more)

Files to preserve (5):
  • .claude-buddy/personas/custom-reviewer.md
  • .claude-buddy/personas/custom-architect.md
  • .claude-buddy/buddy-config.json (user modified)
  ... (2 more)

Directories to remove (7):
  • .claude-buddy/templates/default/
  • .claude/hooks/
  • .claude/commands/
  ... (4 more)

Estimated duration: 2 seconds
Backup will be created: .claude-buddy-preserved-2025-10-02/
```

---

## Post-Uninstall Cleanup

After successful uninstallation:

1. **Remove Metadata**:
   - Delete `.claude-buddy/install-metadata.json`
   - Remove transaction logs

2. **Clean Git Config** (if applicable):
   - Remove Claude Buddy git hooks
   - Clean git config entries

3. **Display Summary**:
   ```
   ✅ Claude Buddy successfully uninstalled

   Removed:
     • 67 framework files
     • 7 directories
     • Git integration

   Preserved:
     • 5 user customizations
     • Backup: .claude-buddy-preserved-2025-10-02/

   Duration: 2.3s
   ```

4. **Suggest Next Steps**:
   ```
   To restore preserved files:
     cp -r .claude-buddy-preserved-2025-10-02/* .

   To completely remove backup:
     rm -rf .claude-buddy-preserved-2025-10-02/

   To reinstall Claude Buddy:
     claude-buddy install
   ```

---

## Dry-Run Mode

When `dryRun: true`:
```
Dry-run mode: No files will be removed

Would remove:
  ✗ .claude-buddy/buddy-config.json
  ✗ .claude/hooks/command-validator.py
  ... (65 more)

Would preserve:
  ✓ .claude-buddy/personas/custom-reviewer.md
  ... (4 more)

Would remove directories:
  ✗ .claude-buddy/templates/
  ... (6 more)

Uninstallation would complete successfully.
```

---

*This uninstaller API provides safe, reversible removal with user control over customizations.*
