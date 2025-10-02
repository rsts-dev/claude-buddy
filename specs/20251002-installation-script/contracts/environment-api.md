# Environment Detection API Contract

**Module**: `setup/lib/environment.js`
**Type**: Internal module
**Related**: [data-model.md](../data-model.md), [research.md](../research.md)

---

## Overview

The Environment Detection module identifies platform capabilities, validates system requirements, and detects available dependencies. This module is the first to execute and provides critical information for all subsequent installation steps.

---

## Module Exports

```javascript
module.exports = {
  detectEnvironment,
  checkPermissions,
  detectDependencies,
  validateRequirements,
  getPlatformInfo
};
```

---

## API Functions

### 1. detectEnvironment()

**Description**: Performs comprehensive environment detection including platform, dependencies, and existing installation.

**Signature**:
```javascript
async function detectEnvironment(targetDirectory?: string): Promise<EnvironmentDetection>
```

**Parameters**:
- `targetDirectory` (optional): Directory to analyze. Default: `process.cwd()`

**Returns**: `EnvironmentDetection` object (see data-model.md)

**Example**:
```javascript
const { detectEnvironment } = require('./lib/environment');

const env = await detectEnvironment('/path/to/project');
console.log(`Platform: ${env.platform.os}`);
console.log(`Node version: ${env.nodeVersion}`);
console.log(`Dependencies available: ${env.detectedDependencies.filter(d => d.available).length}`);
```

**Error Conditions**:
- Throws `EnvironmentError` if Node.js version < 18.0.0
- Throws `EnvironmentError` if platform is unsupported
- Throws `EnvironmentError` if target directory is inaccessible

**Performance**:
- Typical execution: 200-500ms
- Timeout: 5 seconds
- Cached for 60 seconds (configurable)

---

### 2. checkPermissions()

**Description**: Verifies read/write/execute permissions for the target directory.

**Signature**:
```javascript
async function checkPermissions(targetDirectory: string): Promise<PermissionCheck>
```

**Parameters**:
- `targetDirectory` (required): Directory to check

**Returns**: `PermissionCheck` object
```typescript
interface PermissionCheck {
  targetDirectory: string;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  isGitRepo: boolean;
  gitConfigurable: boolean;
}
```

**Example**:
```javascript
const { checkPermissions } = require('./lib/environment');

const perms = await checkPermissions('/path/to/project');
if (!perms.canWrite) {
  console.error('Cannot write to target directory');
  process.exit(3);
}
```

**Error Conditions**:
- Throws `PermissionError` if directory doesn't exist
- Throws `PermissionError` if access is completely denied
- Returns partial permissions if some checks fail

**Platform Differences**:
- **Unix**: Uses `fs.access()` with R_OK, W_OK, X_OK flags
- **Windows**: Checks NTFS permissions via `fs.stat()` and ACL inspection

---

### 3. detectDependencies()

**Description**: Detects available system dependencies (UV, Python, Git).

**Signature**:
```javascript
async function detectDependencies(): Promise<DetectedDependency[]>
```

**Parameters**: None

**Returns**: Array of `DetectedDependency` objects
```typescript
interface DetectedDependency {
  name: string;
  available: boolean;
  version: string | null;
  location: string | null;
  alternativeLocations: string[];
}
```

**Example**:
```javascript
const { detectDependencies } = require('./lib/environment');

const deps = await detectDependencies();
const uv = deps.find(d => d.name === 'uv');

if (!uv.available) {
  console.warn('UV not found. Hooks will be disabled.');
  console.log(`Install UV: curl -LsSf https://astral.sh/uv/install.sh | sh`);
}
```

**Detection Strategy**:

#### UV Detection
**Locations checked** (in order):
1. `uv` in PATH
2. `~/.local/bin/uv` (Unix)
3. `/usr/local/bin/uv` (Unix)
4. `%LOCALAPPDATA%\Programs\uv\uv.exe` (Windows)

**Version extraction**: `uv --version` → parse output

#### Python Detection
**Locations checked** (in order):
1. `python3` in PATH
2. `python` in PATH
3. `/usr/bin/python3` (Unix)
4. `C:\Python3*\python.exe` (Windows)

**Version extraction**: `python --version` → parse output
**Minimum version**: 3.8.0

#### Git Detection
**Locations checked** (in order):
1. `git` in PATH
2. `/usr/bin/git` (Unix)
3. `C:\Program Files\Git\bin\git.exe` (Windows)

**Version extraction**: `git --version` → parse output
**Minimum version**: 2.0.0

**Error Conditions**:
- Never throws errors (graceful degradation)
- Returns `available: false` if detection fails
- Logs warnings for unexpected errors

**Performance**:
- Typical execution: 100-300ms
- Timeout per dependency: 2 seconds
- Parallel detection for all dependencies

---

### 4. validateRequirements()

**Description**: Validates that all required dependencies are available and versions are sufficient.

**Signature**:
```javascript
async function validateRequirements(
  env: EnvironmentDetection,
  manifest: InstallationManifest
): Promise<ValidationResult>
```

**Parameters**:
- `env`: Environment detection result
- `manifest`: Installation manifest with component dependencies

**Returns**: `ValidationResult` object
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface ValidationError {
  type: 'missing_dependency' | 'version_mismatch' | 'permission_denied' | 'disk_space';
  message: string;
  resolution: string;
  blocking: boolean;
}

interface ValidationWarning {
  type: 'optional_dependency' | 'platform_specific' | 'performance';
  message: string;
  impact: string;
}
```

**Example**:
```javascript
const { validateRequirements } = require('./lib/environment');

const result = await validateRequirements(env, manifest);

if (!result.valid) {
  console.error('Validation failed:');
  result.errors.forEach(err => {
    console.error(`  ✗ ${err.message}`);
    console.error(`    Resolution: ${err.resolution}`);
  });
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn('Warnings:');
  result.warnings.forEach(warn => {
    console.warn(`  ⚠ ${warn.message}`);
    console.warn(`    Impact: ${warn.impact}`);
  });
}
```

**Validation Rules**:

1. **Required Dependencies**:
   - Node.js >= 18.0.0 (BLOCKING)
   - Write permissions to target directory (BLOCKING)
   - Minimum disk space: 50MB (BLOCKING)

2. **Optional Dependencies**:
   - UV package manager (WARNING if missing)
   - Python 3.8+ (WARNING if missing)
   - Git 2.0+ (WARNING if missing)

3. **Platform-Specific**:
   - Windows: PowerShell 5.1+ (WARNING if missing)
   - Unix: Bash 4.0+ (WARNING if missing)

**Error Conditions**:
- Never throws errors
- Returns `valid: false` with detailed error list
- Blocking errors prevent installation
- Warnings allow installation with reduced functionality

---

### 5. getPlatformInfo()

**Description**: Returns detailed platform information.

**Signature**:
```javascript
function getPlatformInfo(): Platform
```

**Parameters**: None

**Returns**: `Platform` object
```typescript
interface Platform {
  os: 'windows' | 'darwin' | 'linux';
  arch: string;           // 'x64', 'arm64', etc.
  osVersion: string;
  shell: string;          // 'bash', 'zsh', 'powershell'
  homedir: string;
  tempdir: string;
}
```

**Example**:
```javascript
const { getPlatformInfo } = require('./lib/environment');

const platform = getPlatformInfo();
console.log(`OS: ${platform.os}`);
console.log(`Shell: ${platform.shell}`);

if (platform.os === 'windows') {
  console.log('Using Windows-specific installation paths');
}
```

**Platform Detection Logic**:

**OS Detection**:
- `process.platform === 'win32'` → `'windows'`
- `process.platform === 'darwin'` → `'darwin'`
- `process.platform === 'linux'` → `'linux'`
- Other → Throw `UnsupportedPlatformError`

**Shell Detection**:
- Check `process.env.SHELL` (Unix)
- Check `process.env.ComSpec` (Windows)
- Fallback: `'bash'` (Unix), `'powershell'` (Windows)

**Error Conditions**:
- Throws `UnsupportedPlatformError` if platform is not windows/darwin/linux
- Never fails for other fields (uses fallback values)

**Performance**:
- Synchronous operation
- Typical execution: < 1ms
- Result is cached globally

---

## Utility Functions

### isWindows()
```javascript
function isWindows(): boolean
```
Returns `true` if platform is Windows.

### isUnix()
```javascript
function isUnix(): boolean
```
Returns `true` if platform is macOS or Linux.

### normalizePathForPlatform()
```javascript
function normalizePathForPlatform(path: string): string
```
Normalizes file path for current platform (handles backslash/forward slash).

### checkDiskSpace()
```javascript
async function checkDiskSpace(directory: string): Promise<DiskSpaceInfo>
```
Returns available disk space information.

---

## Error Classes

### EnvironmentError
```javascript
class EnvironmentError extends Error {
  constructor(message, code, details)
}
```

**Error Codes**:
- `NODE_VERSION_TOO_LOW`: Node.js version is below minimum
- `UNSUPPORTED_PLATFORM`: Platform is not supported
- `DIRECTORY_INACCESSIBLE`: Target directory cannot be accessed
- `PERMISSION_DENIED`: Insufficient permissions

### PermissionError
```javascript
class PermissionError extends Error {
  constructor(message, directory, requiredPermissions)
}
```

**Properties**:
- `message`: Human-readable error message
- `directory`: Path that failed permission check
- `requiredPermissions`: Array of required permissions (e.g., `['read', 'write']`)

---

## Configuration

### Environment Variables

**CLAUDE_BUDDY_SKIP_VERSION_CHECK**
- Type: Boolean
- Default: `false`
- Description: Skip Node.js version validation (use with caution)

**CLAUDE_BUDDY_DEPENDENCY_TIMEOUT**
- Type: Number (milliseconds)
- Default: `2000`
- Description: Timeout for dependency detection per dependency

**CLAUDE_BUDDY_CACHE_TTL**
- Type: Number (seconds)
- Default: `60`
- Description: Cache duration for environment detection results

---

## Testing Hooks

### Mock Environment
```javascript
function setMockEnvironment(mockEnv: Partial<EnvironmentDetection>): void
```
Used in tests to override environment detection.

### Reset Cache
```javascript
function resetEnvironmentCache(): void
```
Clears cached environment detection results.

---

## Performance Optimizations

1. **Parallel Dependency Detection**: All dependencies detected concurrently
2. **Result Caching**: Environment detection cached for 60 seconds
3. **Lazy Evaluation**: Detailed checks only when required
4. **Early Exit**: Fast-fail on blocking errors

---

## Platform-Specific Behavior

### macOS (darwin)
- Uses `fs.access()` for permission checks
- Checks `/usr/local/bin` for dependencies
- Shell detection: Prefers `zsh`, falls back to `bash`
- File permissions: Full Unix permission support

### Linux
- Uses `fs.access()` for permission checks
- Checks `/usr/bin`, `/usr/local/bin`, `~/.local/bin` for dependencies
- Shell detection: Checks `$SHELL` environment variable
- File permissions: Full Unix permission support

### Windows
- Uses NTFS ACL inspection for permission checks
- Checks `%LOCALAPPDATA%\Programs` and `%APPDATA%` for dependencies
- Shell detection: PowerShell preferred, falls back to `cmd`
- File permissions: Limited to read/write (no execute bit)

---

*This environment detection API provides the foundation for safe, cross-platform installation.*
