# Installer API Contract

**Module**: `setup/lib/installer.js`
**Type**: Internal module
**Related**: [data-model.md](../data-model.md), [transaction-api.md](./transaction-api.md)

---

## Overview

The Installer module performs fresh installation of Claude Buddy components. It orchestrates file operations, directory creation, and configuration setup using transactional execution with rollback capability.

---

## Module Exports

```javascript
module.exports = {
  performInstallation,
  createDirectoryStructure,
  installComponent,
  createDefaultConfiguration,
  verifyInstallation
};
```

---

## API Functions

### 1. performInstallation()

**Description**: Executes complete fresh installation process.

**Signature**:
```javascript
async function performInstallation(options: InstallationOptions): Promise<InstallationResult>
```

**Parameters**:
```typescript
interface InstallationOptions {
  targetDirectory: string;
  manifest: InstallationManifest;
  components: Component[];        // Filtered components to install
  environment: EnvironmentDetection;
  dryRun?: boolean;               // Default: false
  verbose?: boolean;              // Default: false
}
```

**Returns**:
```typescript
interface InstallationResult {
  success: boolean;
  version: string;
  installedComponents: string[];  // Component names
  skippedComponents: string[];
  duration: number;               // Milliseconds
  metadata: InstallationMetadata;
  warnings: InstallationWarning[];
  errors: InstallationError[];
}

interface InstallationWarning {
  type: 'optional_dependency' | 'permission' | 'platform_specific';
  message: string;
  component?: string;
}

interface InstallationError {
  type: 'file_error' | 'permission_denied' | 'disk_space' | 'unknown';
  message: string;
  component?: string;
  path?: string;
  recoverable: boolean;
}
```

**Example**:
```javascript
const { performInstallation } = require('./lib/installer');

const result = await performInstallation({
  targetDirectory: '/path/to/project',
  manifest,
  components: filteredComponents.installable,
  environment: env,
  dryRun: false,
  verbose: true
});

if (result.success) {
  console.log(`✅ Installation complete in ${result.duration}ms`);
  console.log(`📦 Version: ${result.version}`);
  console.log(`✓ Installed: ${result.installedComponents.join(', ')}`);
} else {
  console.error('❌ Installation failed');
  result.errors.forEach(err => console.error(`  ${err.message}`));
}
```

**Execution Flow**:
1. Create transaction (pre-install checkpoint)
2. Validate target directory and permissions
3. Create directory structure
4. Install components in dependency order
5. Create default configuration
6. Create installation metadata
7. Verify installation integrity
8. Commit transaction or rollback on failure

**Error Conditions**:
- Throws `InstallationError` if critical failure occurs
- Automatically rolls back on failure
- Returns partial results if some components fail (optional components only)

**Performance**:
- Typical execution: 2-5 seconds (fresh install)
- Timeout: 5 minutes total
- Progress reporting every 500ms

---

### 2. createDirectoryStructure()

**Description**: Creates all required directories with proper permissions.

**Signature**:
```javascript
async function createDirectoryStructure(
  targetDirectory: string,
  directories: DirectorySpec[],
  transaction: InstallationTransaction
): Promise<CreatedDirectories>
```

**Parameters**:
- `targetDirectory`: Base directory for installation
- `directories`: Array of directory specifications
- `transaction`: Active transaction for rollback

**Returns**:
```typescript
interface CreatedDirectories {
  created: string[];       // Newly created directories
  existing: string[];      // Already existing directories
  failed: string[];        // Directories that failed to create
}
```

**Example**:
```javascript
const { createDirectoryStructure } = require('./lib/installer');

const result = await createDirectoryStructure(
  '/path/to/project',
  manifest.directories,
  transaction
);

console.log(`Created ${result.created.length} directories`);
console.log(`Skipped ${result.existing.length} existing directories`);
```

**Directory Creation Logic**:
1. Check if directory already exists
2. If exists: Add to `existing` list, skip creation
3. If not exists: Create with `fs.mkdir()` recursive
4. Set permissions (Unix only)
5. Log action to transaction
6. Add to `created` list

**Error Conditions**:
- Permission denied: Add to `failed` list, trigger rollback
- Disk space full: Add to `failed` list, trigger rollback
- Invalid path: Add to `failed` list, trigger rollback

**Platform Behavior**:
- **Unix**: Creates directories with specified permissions
- **Windows**: Creates directories (ignores permission spec)

---

### 3. installComponent()

**Description**: Installs a single component by copying files from source to target.

**Signature**:
```javascript
async function installComponent(
  component: Component,
  targetDirectory: string,
  transaction: InstallationTransaction
): Promise<ComponentInstallResult>
```

**Parameters**:
- `component`: Component to install
- `targetDirectory`: Base directory for installation
- `transaction`: Active transaction for rollback

**Returns**:
```typescript
interface ComponentInstallResult {
  component: string;           // Component name
  filesInstalled: number;
  filesCopied: string[];       // List of installed file paths
  errors: string[];            // Error messages if any
  duration: number;            // Milliseconds
}
```

**Example**:
```javascript
const { installComponent } = require('./lib/installer');

const result = await installComponent(
  hookComponent,
  '/path/to/project',
  transaction
);

console.log(`Installed ${result.filesInstalled} files for ${result.component}`);
```

**Installation Logic**:
1. Resolve source directory (in package)
2. Resolve target directory (in project)
3. Find files matching glob patterns
4. For each file:
   - Read file content from source
   - Write file content to target
   - Set permissions (if specified)
   - Log action to transaction
5. Return summary

**File Copy Strategy**:
- Use `fs.copyFile()` for simple files
- Preserve file permissions on Unix
- Create parent directories if needed
- Skip existing files in target (fresh install assumes clean state)

**Error Conditions**:
- Source file not found: Log error, continue with other files
- Target write failed: Log error, trigger rollback
- Permission denied: Log error, trigger rollback

**Performance**:
- Parallel file operations (max 10 concurrent)
- Progress reporting for large components (> 20 files)
- Typical: 100-500ms per component

---

### 4. createDefaultConfiguration()

**Description**: Creates default configuration files for the installation.

**Signature**:
```javascript
async function createDefaultConfiguration(
  targetDirectory: string,
  manifest: InstallationManifest,
  installedComponents: string[],
  transaction: InstallationTransaction
): Promise<void>
```

**Parameters**:
- `targetDirectory`: Base directory for installation
- `manifest`: Installation manifest
- `installedComponents`: List of successfully installed component names
- `transaction`: Active transaction for rollback

**Returns**: Promise<void>

**Example**:
```javascript
const { createDefaultConfiguration } = require('./lib/installer');

await createDefaultConfiguration(
  '/path/to/project',
  manifest,
  ['hooks', 'templates', 'personas'],
  transaction
);
```

**Created Configuration Files**:

1. **`.claude-buddy/install-metadata.json`**:
   - Installation metadata (see data-model.md)
   - Component status
   - Dependency information
   - Transaction history

2. **`.claude-buddy/buddy-config.json`** (if not exists):
   - Framework configuration
   - Persona auto-activation settings
   - Hook configuration defaults

3. **`.claude/hooks.json`** (if hooks installed):
   - Hook registration
   - Enabled hooks
   - Timeout settings

**Error Conditions**:
- File write failed: Trigger rollback
- JSON serialization failed: Trigger rollback

---

### 5. verifyInstallation()

**Description**: Verifies installation integrity after completion.

**Signature**:
```javascript
async function verifyInstallation(
  targetDirectory: string,
  manifest: InstallationManifest,
  installedComponents: string[]
): Promise<VerificationResult>
```

**Parameters**:
- `targetDirectory`: Base directory to verify
- `manifest`: Installation manifest
- `installedComponents`: List of installed component names

**Returns**:
```typescript
interface VerificationResult {
  valid: boolean;
  issues: VerificationIssue[];
  summary: string;
}

interface VerificationIssue {
  severity: 'error' | 'warning';
  type: 'missing_file' | 'missing_directory' | 'invalid_config' | 'permission_issue';
  message: string;
  path?: string;
}
```

**Example**:
```javascript
const { verifyInstallation } = require('./lib/installer');

const verification = await verifyInstallation(
  '/path/to/project',
  manifest,
  installedComponents
);

if (!verification.valid) {
  console.error('❌ Installation verification failed');
  verification.issues.forEach(issue => {
    console.error(`  ${issue.severity}: ${issue.message}`);
  });
}
```

**Verification Checks**:

1. **Directory Structure**:
   - All required directories exist
   - Directories have correct permissions

2. **Component Files**:
   - All expected files are present
   - Files are readable
   - Configuration files are valid JSON

3. **Metadata**:
   - `install-metadata.json` exists and is valid
   - Version matches manifest version
   - Component status is consistent

4. **Dependencies**:
   - Dependency information is accurate
   - Optional dependencies correctly marked

**Error Conditions**:
- Never throws errors
- Returns `valid: false` with detailed issues
- Severity determines if repair is needed

---

## Utility Functions

### calculateInstallationPaths()
```javascript
function calculateInstallationPaths(
  component: Component,
  targetDirectory: string
): InstallationPaths
```
Returns source and target paths for a component.

### validateTargetDirectory()
```javascript
async function validateTargetDirectory(targetDirectory: string): Promise<boolean>
```
Validates that target directory is suitable for installation.

### estimateInstallDuration()
```javascript
function estimateInstallDuration(components: Component[]): number
```
Returns estimated installation duration in milliseconds.

---

## Error Classes

### InstallationError
```javascript
class InstallationError extends Error {
  constructor(message, code, details)
}
```

**Error Codes**:
- `DIRECTORY_CREATION_FAILED`: Cannot create directory
- `FILE_COPY_FAILED`: Cannot copy file
- `PERMISSION_DENIED`: Insufficient permissions
- `DISK_SPACE_INSUFFICIENT`: Not enough disk space
- `VERIFICATION_FAILED`: Post-install verification failed

---

## Installation Phases

The installation process is divided into phases for better progress tracking and rollback:

1. **Pre-Install**: Validation and transaction creation
2. **Directory Creation**: Create directory structure
3. **Component Installation**: Install each component
4. **Configuration**: Create configuration files
5. **Verification**: Verify installation integrity
6. **Completion**: Commit transaction and cleanup

Each phase creates a checkpoint for rollback.

---

## Progress Reporting

The installer emits progress events for UI updates:

```javascript
installer.on('progress', (event) => {
  console.log(`[${event.phase}] ${event.message} (${event.percentage}%)`);
});
```

**Progress Events**:
```typescript
interface ProgressEvent {
  phase: 'pre-install' | 'directories' | 'components' | 'configuration' | 'verification';
  message: string;
  percentage: number;     // 0-100
  component?: string;
  filesProcessed?: number;
  filesTotal?: number;
}
```

---

## Dry-Run Mode

When `dryRun: true`, the installer:
- Performs all validation checks
- Calculates what would be installed
- Reports file operations without executing
- Does not create any files or directories
- Does not create transactions

**Dry-Run Output**:
```
Dry-run mode: No files will be modified

Would create directories:
  ✓ .claude-buddy
  ✓ .claude-buddy/personas
  ✓ .claude-buddy/templates
  ✓ .claude
  ✓ .claude/hooks

Would install components:
  ✓ templates (45 files)
  ✓ personas (12 files)
  ✓ commands (8 files)
  ⊘ hooks (skipped: UV unavailable)

Would create configuration:
  ✓ .claude-buddy/install-metadata.json
  ✓ .claude-buddy/buddy-config.json

Installation would complete successfully.
```

---

*This installer API provides safe, transactional fresh installation with comprehensive verification.*
