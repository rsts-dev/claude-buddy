# Manifest API Contract

**Module**: `setup/lib/manifest.js`
**Type**: Internal module
**Related**: [data-model.md](../data-model.md), [environment-api.md](./environment-api.md)

---

## Overview

The Manifest module loads, validates, and provides access to the installation manifest that defines all components, dependencies, and platform-specific configurations.

---

## Module Exports

```javascript
module.exports = {
  loadManifest,
  validateManifest,
  getComponentsForPlatform,
  filterComponentsByDependencies,
  getManifestVersion
};
```

---

## API Functions

### 1. loadManifest()

**Description**: Loads the installation manifest from the package.

**Signature**:
```javascript
async function loadManifest(): Promise<InstallationManifest>
```

**Parameters**: None (uses built-in manifest)

**Returns**: `InstallationManifest` object (see data-model.md)

**Example**:
```javascript
const { loadManifest } = require('./lib/manifest');

const manifest = await loadManifest();
console.log(`Manifest version: ${manifest.version}`);
console.log(`Components: ${manifest.components.length}`);
```

**Manifest Location**: `setup/lib/manifest-definition.js`

**Error Conditions**:
- Throws `ManifestError` if manifest file not found
- Throws `ManifestError` if manifest is malformed JSON
- Throws `ManifestError` if validation fails

**Performance**:
- Typical execution: < 10ms
- Cached after first load
- File size: ~5KB

---

### 2. validateManifest()

**Description**: Validates manifest structure and content.

**Signature**:
```javascript
function validateManifest(manifest: InstallationManifest): ValidationResult
```

**Parameters**:
- `manifest`: Manifest object to validate

**Returns**: `ValidationResult` object
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ManifestValidationError[];
}

interface ManifestValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
```

**Example**:
```javascript
const { loadManifest, validateManifest } = require('./lib/manifest');

const manifest = await loadManifest();
const result = validateManifest(manifest);

if (!result.valid) {
  console.error('Manifest validation failed:');
  result.errors.forEach(err => {
    console.error(`  ${err.field}: ${err.message}`);
  });
  process.exit(1);
}
```

**Validation Rules**:

1. **Version**:
   - MUST be valid semver (e.g., "1.0.0")
   - MUST match package.json version

2. **Components**:
   - MUST have at least one component
   - Each component MUST have: name, displayName, type, source, target
   - Component names MUST be unique
   - Component types MUST be "required" or "optional"
   - Source paths MUST exist in package
   - File patterns MUST be valid glob patterns

3. **Dependencies**:
   - All component dependencies MUST be known dependencies (uv, python, git, node)
   - Circular dependencies are NOT allowed

4. **Directories**:
   - Paths MUST be relative (no absolute paths)
   - Paths MUST NOT escape project root (no `..`)
   - Permissions MUST be valid Unix format (e.g., "755")

5. **Platform Overrides**:
   - Platform keys MUST be: "windows", "darwin", or "linux"
   - Overrides MUST reference existing components

**Error Conditions**:
- Never throws errors
- Returns `valid: false` with detailed error list
- Severity determines if installation can proceed

---

### 3. getComponentsForPlatform()

**Description**: Returns components applicable to the current platform with platform-specific overrides applied.

**Signature**:
```javascript
function getComponentsForPlatform(
  manifest: InstallationManifest,
  platform: Platform
): Component[]
```

**Parameters**:
- `manifest`: Installation manifest
- `platform`: Platform information from environment detection

**Returns**: Array of `Component` objects with platform overrides applied

**Example**:
```javascript
const { loadManifest, getComponentsForPlatform } = require('./lib/manifest');
const { getPlatformInfo } = require('./lib/environment');

const manifest = await loadManifest();
const platform = getPlatformInfo();
const components = getComponentsForPlatform(manifest, platform);

console.log(`Components for ${platform.os}:`);
components.forEach(comp => {
  console.log(`  - ${comp.displayName}`);
});
```

**Override Logic**:
1. Start with base component definition
2. If platform-specific override exists, merge with base
3. Platform override takes precedence over base values
4. Return merged component

**Platform Override Example**:
```javascript
// Base component
{
  name: "hooks",
  filePatterns: ["*.py", "*.json"]
}

// Windows override
platformSpecific: {
  windows: {
    componentOverrides: {
      hooks: {
        filePatterns: ["*.py", "*.json", "*.bat"]
      }
    }
  }
}

// Result on Windows
{
  name: "hooks",
  filePatterns: ["*.py", "*.json", "*.bat"]  // Merged
}
```

**Error Conditions**:
- Never throws errors
- Returns base components if override parsing fails
- Logs warnings for invalid overrides

---

### 4. filterComponentsByDependencies()

**Description**: Filters components based on available dependencies, supporting graceful degradation.

**Signature**:
```javascript
function filterComponentsByDependencies(
  components: Component[],
  availableDependencies: DetectedDependency[]
): FilteredComponents
```

**Parameters**:
- `components`: Array of components to filter
- `availableDependencies`: Detected dependencies from environment

**Returns**: `FilteredComponents` object
```typescript
interface FilteredComponents {
  installable: Component[];      // Components with all dependencies met
  skipped: SkippedComponent[];    // Components with missing dependencies
}

interface SkippedComponent {
  component: Component;
  missingDependencies: string[];
  reason: string;
  installGuide?: string;
}
```

**Example**:
```javascript
const { filterComponentsByDependencies } = require('./lib/manifest');

const filtered = filterComponentsByDependencies(components, detectedDeps);

console.log(`Installing ${filtered.installable.length} components:`);
filtered.installable.forEach(comp => {
  console.log(`  ✓ ${comp.displayName}`);
});

if (filtered.skipped.length > 0) {
  console.warn(`Skipping ${filtered.skipped.length} components:`);
  filtered.skipped.forEach(skip => {
    console.warn(`  ⊘ ${skip.component.displayName}`);
    console.warn(`    Missing: ${skip.missingDependencies.join(', ')}`);
    if (skip.installGuide) {
      console.warn(`    Install: ${skip.installGuide}`);
    }
  });
}
```

**Filtering Logic**:

1. **Required Components**:
   - If all dependencies available → Include in `installable`
   - If any dependency missing → ERROR (installation cannot proceed)

2. **Optional Components**:
   - If all dependencies available → Include in `installable`
   - If any dependency missing → Include in `skipped` with reason

3. **No Dependencies**:
   - Always included in `installable`

**Dependency Check Algorithm**:
```javascript
function checkDependencies(component, availableDeps) {
  if (component.dependencies.length === 0) {
    return { satisfied: true, missing: [] };
  }

  const missing = component.dependencies.filter(depName => {
    const dep = availableDeps.find(d => d.name === depName);
    return !dep || !dep.available;
  });

  return {
    satisfied: missing.length === 0,
    missing: missing
  };
}
```

**Error Conditions**:
- Throws `DependencyError` if required component has missing dependencies
- Never throws for optional components
- Logs warnings for skipped optional components

---

### 5. getManifestVersion()

**Description**: Returns the manifest version.

**Signature**:
```javascript
function getManifestVersion(manifest: InstallationManifest): string
```

**Parameters**:
- `manifest`: Installation manifest

**Returns**: Semver version string

**Example**:
```javascript
const { loadManifest, getManifestVersion } = require('./lib/manifest');

const manifest = await loadManifest();
const version = getManifestVersion(manifest);
console.log(`Manifest version: ${version}`);
```

**Error Conditions**:
- Throws `ManifestError` if version is missing
- Throws `ManifestError` if version is invalid semver

---

## Utility Functions

### getComponentByName()
```javascript
function getComponentByName(manifest: InstallationManifest, name: string): Component | null
```
Returns component by name, or `null` if not found.

### getRequiredComponents()
```javascript
function getRequiredComponents(manifest: InstallationManifest): Component[]
```
Returns only components with `type: "required"`.

### getOptionalComponents()
```javascript
function getOptionalComponents(manifest: InstallationManifest): Component[]
```
Returns only components with `type: "optional"`.

### getDirectoriesForPlatform()
```javascript
function getDirectoriesForPlatform(manifest: InstallationManifest, platform: Platform): DirectorySpec[]
```
Returns directory specifications with platform overrides applied.

### estimateInstallSize()
```javascript
async function estimateInstallSize(components: Component[]): Promise<number>
```
Returns estimated installation size in bytes.

---

## Error Classes

### ManifestError
```javascript
class ManifestError extends Error {
  constructor(message, code, details)
}
```

**Error Codes**:
- `MANIFEST_NOT_FOUND`: Manifest file not found
- `MANIFEST_INVALID`: Manifest JSON is malformed
- `MANIFEST_VALIDATION_FAILED`: Manifest validation errors
- `VERSION_MISMATCH`: Manifest version doesn't match package version

### DependencyError
```javascript
class DependencyError extends Error {
  constructor(component, missingDependencies)
}
```

**Properties**:
- `component`: Component that failed dependency check
- `missingDependencies`: Array of missing dependency names

---

## Manifest Schema

The manifest follows a strict JSON schema. See full schema in [data-model.md](../data-model.md).

**Key Constraints**:
- Version: Required, semver format
- Components: Required, non-empty array
- Directories: Required, non-empty array
- Platform-specific: Optional object

---

## Component Dependency Graph

The manifest supports dependency checking between components and system dependencies.

**Supported System Dependencies**:
- `node`: Node.js (always required)
- `uv`: UV package manager (optional)
- `python`: Python 3.8+ (optional)
- `git`: Git version control (optional)

**Example Dependency Declaration**:
```json
{
  "name": "hooks",
  "dependencies": ["uv", "python"]
}
```

**Dependency Resolution**:
1. Check if all dependencies are in available dependency list
2. If any dependency missing and component is required → ERROR
3. If any dependency missing and component is optional → SKIP with warning
4. If all dependencies available → INCLUDE

---

## Platform Override Mechanism

Platform overrides allow customization per operating system without duplicating manifest content.

**Override Structure**:
```json
{
  "platformSpecific": {
    "windows": {
      "componentOverrides": {
        "hooks": {
          "filePatterns": ["*.py", "*.json", "*.bat"]
        }
      },
      "directoryOverrides": {
        ".claude/hooks": {
          "permissions": null
        }
      }
    }
  }
}
```

**Merge Strategy**:
- Shallow merge for simple values (strings, numbers, booleans)
- Array replacement (platform array replaces base array)
- Object merge for nested objects

---

## Performance Considerations

1. **Manifest Loading**: Cached after first load
2. **Validation**: Performed once on load
3. **Platform Filtering**: Computed on-demand, not cached
4. **Size Estimation**: Async to avoid blocking

---

## Testing Support

### Mock Manifest
```javascript
function setMockManifest(mockManifest: Partial<InstallationManifest>): void
```
Used in tests to override manifest.

### Validate Custom Manifest
```javascript
async function loadCustomManifest(filePath: string): Promise<InstallationManifest>
```
Loads and validates a custom manifest file (for testing).

---

*This manifest API provides declarative component definition with platform-aware installation logic.*
