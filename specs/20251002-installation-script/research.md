# Phase 0 Research: Installation Script for Claude Buddy

**Created**: 2025-10-02
**Status**: Complete
**Related Documents**: [spec.md](./spec.md), [plan.md](./plan.md)

---

## Research Overview

This document consolidates research findings for the six key topics identified in Phase 0 of the installation script implementation plan. Each section provides a decision, rationale, alternatives considered, and implementation notes aligned with the project's foundation principles.

---

## 1. Transactional Installation Patterns

### Decision
Implement a **checkpoint-based transaction system** using in-memory state tracking with file-system snapshots for rollback capability.

### Rationale
- **Principle 2 (Safety-First Automation)**: Ensures that failed installations don't leave the system in a broken state
- **Simplicity**: Node.js native `fs` module provides sufficient atomicity for our use case without external dependencies
- **Performance**: In-memory tracking avoids disk I/O overhead during normal execution
- **Recovery**: File system snapshots enable complete rollback to pre-installation state

### Alternatives Considered

1. **Database-backed transactions** (e.g., SQLite)
   - **Rejected**: Adds unnecessary dependency and complexity for a file-based installation process
   - Would require additional setup and increase package size

2. **Write-ahead logging (WAL)**
   - **Rejected**: Overkill for installation scenarios; adds complexity without significant benefit
   - More suitable for database systems than file operations

3. **Two-phase commit protocol**
   - **Rejected**: Designed for distributed systems; unnecessary for single-machine installations
   - Would complicate error handling without providing value

### Implementation Notes

**Transaction Structure**:
```javascript
{
  transactionId: "uuid-v4",
  startTime: ISO8601,
  status: "pending" | "in_progress" | "completed" | "failed" | "rolled_back",
  operation: "install" | "update" | "uninstall",
  checkpoints: [
    {
      phase: "pre-install" | "install" | "post-install",
      snapshot: { /* file paths and contents */ },
      timestamp: ISO8601
    }
  ],
  plannedActions: [...],
  executedActions: [...],
  errors: [...]
}
```

**Key Patterns**:
1. **Pre-execution checkpoint**: Capture file system state before any modifications
2. **Action logging**: Record each operation with success/failure status
3. **Automatic rollback**: Restore from checkpoint on any critical failure
4. **Manual recovery**: Provide CLI flag to resume/rollback incomplete transactions

**Safety Mechanisms**:
- Use `fs.promises` for async operations with proper error handling
- Implement timeout protection (max 5 minutes per phase)
- Store transaction log in `.claude-buddy/install-transaction.json`
- Clean up successful transaction logs after 7 days

---

## 2. NPM Package Distribution & Installation Lifecycle

### Decision
Use **NPM bin script** as the primary entry point, with the installation script executed post-install via explicit user command.

### Rationale
- **User Control**: Avoids automatic installation on `npm install`, giving users explicit control
- **Principle 4 (Developer Experience)**: Clear, predictable installation process
- **Cross-platform**: `bin` scripts work consistently across Windows, macOS, and Linux
- **Package Distribution**: Framework files bundled in package, installed to target location on execution

### Alternatives Considered

1. **NPM postinstall hooks**
   - **Rejected**: Runs automatically after `npm install`, which could modify user directories unexpectedly
   - Violates Principle 2 (Safety-First) by performing actions without explicit consent
   - Causes issues in CI/CD environments where automatic modifications are undesirable

2. **Separate CLI package + framework package**
   - **Rejected**: Adds complexity to versioning and distribution
   - Users would need to manage two packages instead of one
   - Increases maintenance burden

3. **npx-based installation**
   - **Partially Adopted**: Support `npx claude-buddy` for one-off installations
   - Complements but doesn't replace the bin script approach

### Implementation Notes

**Package Structure**:
```
claude-buddy/
├── setup/                        # Installation script package
│   ├── package.json             # bin: { "claude-buddy": "./install.js" }
│   ├── install.js               # CLI entry point
│   └── lib/                     # Installation modules
├── .claude-buddy/               # Framework files to install (existing)
├── .claude/                     # Hooks and commands to install (existing)
└── directive/                   # Foundation templates (existing)
```

**Installation Flow**:
1. User installs: `npm install -g claude-buddy` or `npm install --save-dev claude-buddy`
2. User executes: `claude-buddy install` (or `npx claude-buddy install`)
3. Script detects working directory and installs framework files

**Path Handling**:
- Use `process.cwd()` for target directory detection
- Use `__dirname` for source file location
- Normalize paths with `path.join()` and `path.resolve()`
- Handle Windows backslashes with `path.sep` and `path.normalize()`

**Working Directory Strategy**:
- Default target: `process.cwd()` (current directory)
- Support `--target` flag for explicit directory specification
- Validate target directory exists and is writable before proceeding

---

## 3. Cross-Platform Compatibility

### Decision
Use **Node.js native modules** (`os`, `path`, `child_process`) with platform-specific adaptations for shell commands and file permissions.

### Rationale
- **Zero External Dependencies**: Relies only on Node.js stdlib for platform detection
- **Principle 1 (Modular Extensibility)**: Platform-specific logic isolated in `lib/environment.js`
- **Proven Pattern**: Reference implementation demonstrates successful cross-platform operation
- **Maintenance**: Fewer dependencies reduce security vulnerabilities and update overhead

### Alternatives Considered

1. **cross-spawn library**
   - **Rejected**: Adds dependency for functionality already available in Node.js
   - `child_process.spawn` with proper options handles cross-platform execution

2. **shelljs library**
   - **Rejected**: Heavy-weight solution that abstracts too much
   - Prefer explicit platform handling for better error messages

3. **Platform-specific installers** (separate scripts for Windows/Unix)
   - **Rejected**: Violates DRY principle and increases maintenance
   - Shared logic base with platform-specific branches is more maintainable

### Implementation Notes

**Platform Detection**:
```javascript
const platform = os.platform(); // 'darwin', 'linux', 'win32'
const isWindows = platform === 'win32';
const isUnix = ['darwin', 'linux'].includes(platform);
```

**Path Normalization**:
```javascript
// Always use path.join() for cross-platform compatibility
const targetPath = path.join(baseDir, '.claude-buddy', 'config.json');

// Use path.normalize() for user-provided paths
const normalizedPath = path.normalize(userProvidedPath);
```

**File Permissions**:
```javascript
// Unix: Set executable permissions on hook scripts
if (isUnix) {
  await fs.chmod(hookPath, '755');
}
// Windows: Permissions handled by NTFS; no action needed
```

**Shell Command Execution**:
```javascript
// Detect UV installation (cross-platform)
const uvPaths = isWindows
  ? ['uv', path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'uv', 'uv.exe')]
  : ['uv', path.join(os.homedir(), '.local', 'bin', 'uv'), '/usr/local/bin/uv'];

for (const uvPath of uvPaths) {
  try {
    execSync(`${uvPath} --version`, { stdio: 'pipe' });
    return uvPath;
  } catch (e) {
    continue;
  }
}
```

**Terminal Color Support**:
```javascript
// Use chalk for cross-platform color support
// chalk automatically detects terminal capabilities
const chalk = require('chalk');
console.log(chalk.green('✓ Success'));
```

**Line Endings**:
- Use `os.EOL` for platform-specific line endings in generated files
- Write files with `fs.writeFile()` which handles line ending conversion

---

## 4. Dependency Detection & Graceful Degradation

### Decision
Implement **tiered dependency checking** with required vs. optional dependencies, providing clear warnings and reduced functionality when optional dependencies are missing.

### Rationale
- **Principle 2 (Safety-First)**: Installation continues with core functionality even when optional features unavailable
- **Principle 4 (Developer Experience)**: Clear messaging about what works and what doesn't
- **User Empowerment**: Users can install core functionality immediately, add optional features later
- **FR-010 through FR-013**: Directly satisfies graceful degradation requirements from specification

### Alternatives Considered

1. **Hard Requirements** (fail installation if any dependency missing)
   - **Rejected**: Prevents users from getting value from core features
   - Too restrictive for environments where some dependencies are unavailable

2. **Silent Degradation** (continue without warnings)
   - **Rejected**: Violates Principle 5 (Transparent Collaboration)
   - Users wouldn't understand why certain features don't work

3. **Auto-Installation of Dependencies**
   - **Rejected**: Could modify system without user consent
   - Complex to implement reliably across platforms
   - Security risk if installation sources are compromised

### Implementation Notes

**Dependency Categories**:

**Required Dependencies**:
- Node.js >= 18.0.0
- Write permissions to target directory
- Basic file system operations

**Optional Dependencies**:
- UV (Python package manager) - enables hook functionality
- Python 3.8+ - enables hook functionality
- Git - enables version control integration

**Detection Strategy**:
```javascript
const dependencies = {
  required: [
    {
      name: 'Node.js',
      check: () => {
        const version = process.version.match(/v(\d+)/)[1];
        return parseInt(version) >= 18;
      },
      errorMessage: 'Node.js >= 18.0.0 is required. Please upgrade.'
    }
  ],
  optional: [
    {
      name: 'UV',
      check: () => detectUV(),
      warningMessage: 'UV not found. Hook functionality will be disabled.',
      installGuide: 'Install UV: curl -LsSf https://astral.sh/uv/install.sh | sh',
      affectedFeatures: ['Python hooks', 'Pre-commit validation']
    },
    {
      name: 'Python',
      check: () => detectPython(),
      warningMessage: 'Python 3.8+ not found. Hook functionality will be disabled.',
      installGuide: 'Install Python from python.org',
      affectedFeatures: ['Python hooks']
    }
  ]
};
```

**User Communication**:
```
🔧 Checking system requirements...
✓ Node.js 18.0.0
✗ UV not found
  ⚠ Hook functionality will be disabled
  📝 To enable hooks: curl -LsSf https://astral.sh/uv/install.sh | sh
✓ Git 2.30.0

⚙️ Installing Claude Buddy with reduced functionality...
✓ Core framework installed
✓ Templates installed
✓ Personas installed
⊘ Hooks skipped (UV unavailable)

✅ Installation complete with partial functionality
   Run 'claude-buddy verify' after installing UV to enable hooks
```

**Component Enablement Logic**:
```javascript
const componentInstallation = {
  core: { required: true, dependencies: [] },
  templates: { required: true, dependencies: [] },
  personas: { required: true, dependencies: [] },
  hooks: { required: false, dependencies: ['uv', 'python'] },
  commands: { required: true, dependencies: [] }
};

// Install only components whose dependencies are satisfied
for (const [name, config] of Object.entries(componentInstallation)) {
  const depsAvailable = config.dependencies.every(dep => dependencies[dep].available);

  if (config.required || depsAvailable) {
    await installComponent(name);
  } else {
    console.log(chalk.yellow(`⊘ ${name} skipped (missing: ${config.dependencies.join(', ')})`));
  }
}
```

**Post-Installation Verification Command**:
```bash
# Allow users to verify and enable features after installing dependencies
claude-buddy verify
```

---

## 5. Configuration Preservation & Migration

### Decision
Use **timestamp-based change detection** with **shallow merge strategy** for configuration updates, preserving user modifications by default.

### Rationale
- **Principle 2 (Safety-First)**: User customizations are never overwritten without explicit consent
- **Simplicity**: Timestamp comparison is straightforward and doesn't require content hashing
- **Transparency**: Users can see what was preserved and why
- **Performance**: Fast comparison without cryptographic overhead

### Alternatives Considered

1. **Content Hash-based Detection** (MD5/SHA256)
   - **Rejected**: More complex implementation without significant benefit
   - Timestamps are sufficient for installation scenario
   - Hashing adds computational overhead

2. **Deep Merge Strategy**
   - **Rejected**: Can cause unexpected behavior when array structures differ
   - Shallow merge with user confirmation is safer and more predictable

3. **Git-based Diffing**
   - **Rejected**: Requires Git as hard dependency
   - Not all installations are in Git repositories
   - Adds complexity for minimal benefit

4. **User Markers/Comments** (e.g., `# CUSTOM:`)
   - **Rejected**: Requires users to manually mark customizations
   - Error-prone and not discoverable

### Implementation Notes

**File Classification**:

**Framework Files** (always update):
- `.claude-buddy/templates/**/*.md` (official templates)
- `.claude-buddy/buddy-config.json` (base configuration)
- `.claude/commands/**/*.md` (slash commands)
- `.claude/hooks/*.py` (hook scripts)

**User Customization Files** (preserve by default):
- `.claude-buddy/personas/custom-*.md` (custom personas)
- Any file modified after initial installation timestamp
- Files in user-designated directories

**Detection Logic**:
```javascript
const installMetadata = {
  version: "1.0.0",
  installDate: "2025-10-02T12:00:00Z",
  lastUpdateDate: null,
  trackedFiles: [
    {
      path: ".claude-buddy/buddy-config.json",
      installDate: "2025-10-02T12:00:00Z",
      lastModified: "2025-10-02T12:00:00Z",
      isCustomization: false
    }
  ]
};

async function isUserModified(filePath, metadata) {
  const stats = await fs.stat(filePath);
  const tracked = metadata.trackedFiles.find(f => f.path === filePath);

  if (!tracked) return false; // New file, not a customization

  const fileModifiedTime = stats.mtime;
  const installTime = new Date(tracked.installDate);

  // If modified after installation, it's a user customization
  return fileModifiedTime > installTime;
}
```

**Configuration Merge Strategy**:
```javascript
async function mergeConfiguration(existingConfig, newConfig, filePath) {
  const isModified = await isUserModified(filePath, metadata);

  if (!isModified) {
    // File unchanged since install, safe to replace
    return newConfig;
  }

  // File modified by user, preserve with shallow merge
  const merged = { ...newConfig, ...existingConfig };

  console.log(chalk.yellow(`⚠ ${filePath} was customized, preserving user changes`));
  console.log(chalk.gray(`  New fields from update will be added`));
  console.log(chalk.gray(`  Existing fields will be preserved`));

  return merged;
}
```

**Schema Migration**:
```javascript
const migrations = {
  '1.0.0-to-1.1.0': (config) => {
    // Add new fields with defaults
    if (!config.newFeature) {
      config.newFeature = { enabled: false };
    }
    return config;
  },
  '1.1.0-to-1.2.0': (config) => {
    // Rename fields
    if (config.oldName) {
      config.newName = config.oldName;
      delete config.oldName;
    }
    return config;
  }
};

async function migrateConfiguration(config, fromVersion, toVersion) {
  const migrationPath = `${fromVersion}-to-${toVersion}`;

  if (migrations[migrationPath]) {
    console.log(chalk.blue(`📦 Migrating configuration from ${fromVersion} to ${toVersion}`));
    return migrations[migrationPath](config);
  }

  return config;
}
```

**User Prompting** (for conflicts):
```javascript
if (isUserModified && hasConflict) {
  const { resolution } = await inquirer.prompt([
    {
      type: 'list',
      name: 'resolution',
      message: `Configuration conflict in ${filePath}:`,
      choices: [
        { name: 'Keep my changes', value: 'keep' },
        { name: 'Use new defaults', value: 'replace' },
        { name: 'Merge (keep my changes, add new fields)', value: 'merge' },
        { name: 'Show diff', value: 'diff' }
      ]
    }
  ]);

  if (resolution === 'diff') {
    showDiff(existingConfig, newConfig);
    // Re-prompt after showing diff
  }
}
```

**Backup Strategy**:
- Always create timestamped backup before modifications
- Format: `.claude-buddy/backup-{ISO8601}/`
- Keep last 3 backups, delete older ones
- Provide `claude-buddy restore` command to revert

---

## 6. Version Management

### Decision
Store version metadata in **`.claude-buddy/install-metadata.json`** with semantic version comparison for update logic.

### Rationale
- **Separation of Concerns**: Installation metadata separate from framework configuration
- **Principle 3 (Contextual Intelligence)**: Version context informs intelligent update decisions
- **Persistence**: Metadata survives configuration resets and migrations
- **Simplicity**: Single source of truth for installation state

### Alternatives Considered

1. **package.json reference** (use installed package version)
   - **Rejected**: Doesn't track actual installation state
   - npm package version != installed framework version in project mode
   - Can't differentiate between npm update and framework update

2. **Git tags**
   - **Rejected**: Not all projects use Git
   - Requires Git as hard dependency
   - Tags don't represent installation state accurately

3. **Multiple metadata files** (one per component)
   - **Rejected**: Fragmented state management
   - Harder to maintain consistency
   - Increases complexity without benefit

4. **Database storage** (SQLite)
   - **Rejected**: Unnecessary complexity and dependency
   - JSON files are sufficient for version tracking

### Implementation Notes

**Metadata Structure**:
```json
{
  "version": "1.0.0",
  "installDate": "2025-10-02T12:00:00Z",
  "lastUpdateDate": null,
  "installMode": "project",
  "installedComponents": {
    "core": { "version": "1.0.0", "enabled": true },
    "hooks": { "version": "1.0.0", "enabled": false, "reason": "UV unavailable" },
    "templates": { "version": "1.0.0", "enabled": true },
    "personas": { "version": "1.0.0", "enabled": true },
    "commands": { "version": "1.0.0", "enabled": true }
  },
  "userCustomizations": [
    {
      "file": ".claude-buddy/personas/custom-reviewer.md",
      "createdDate": "2025-10-02T13:00:00Z",
      "description": "Custom code review persona"
    }
  ],
  "dependencies": {
    "node": { "version": "18.0.0", "required": true, "available": true },
    "uv": { "version": null, "required": false, "available": false },
    "python": { "version": "3.11.0", "required": false, "available": true }
  },
  "transactionHistory": [
    {
      "operation": "install",
      "version": "1.0.0",
      "timestamp": "2025-10-02T12:00:00Z",
      "status": "completed"
    }
  ]
}
```

**Version Comparison Logic**:
```javascript
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0; // Equal
}

function isUpdateRequired(installedVersion, packageVersion) {
  return compareVersions(packageVersion, installedVersion) > 0;
}

function isDowngrade(installedVersion, packageVersion) {
  return compareVersions(packageVersion, installedVersion) < 0;
}
```

**Installation Detection**:
```javascript
async function detectInstallationType() {
  const metadataPath = path.join(process.cwd(), '.claude-buddy', 'install-metadata.json');

  if (!await fs.pathExists(metadataPath)) {
    return { type: 'fresh', version: null };
  }

  const metadata = await fs.readJson(metadataPath);
  const packageVersion = require('./package.json').version;

  if (metadata.version === packageVersion) {
    return { type: 'reinstall', version: metadata.version };
  }

  if (isUpdateRequired(metadata.version, packageVersion)) {
    return { type: 'update', from: metadata.version, to: packageVersion };
  }

  if (isDowngrade(metadata.version, packageVersion)) {
    return {
      type: 'downgrade',
      from: metadata.version,
      to: packageVersion,
      warning: 'Downgrading may cause compatibility issues'
    };
  }
}
```

**Update Flow**:
```javascript
async function performUpdate(fromVersion, toVersion) {
  console.log(chalk.blue(`🔄 Updating Claude Buddy from ${fromVersion} to ${toVersion}`));

  // 1. Load current metadata
  const metadata = await loadMetadata();

  // 2. Identify user customizations
  const customizations = await identifyCustomizations(metadata);

  // 3. Create backup
  await createBackup(metadata);

  // 4. Run migration scripts
  await runMigrations(fromVersion, toVersion);

  // 5. Update framework files (preserve customizations)
  await updateFrameworkFiles(customizations);

  // 6. Update metadata
  metadata.version = toVersion;
  metadata.lastUpdateDate = new Date().toISOString();
  metadata.transactionHistory.push({
    operation: 'update',
    version: toVersion,
    timestamp: new Date().toISOString(),
    status: 'completed'
  });

  await saveMetadata(metadata);

  console.log(chalk.green(`✅ Updated to version ${toVersion}`));
  console.log(chalk.gray(`  ${customizations.length} customizations preserved`));
}
```

**Downgrade Protection**:
```javascript
async function handleDowngrade(fromVersion, toVersion) {
  console.log(chalk.yellow(`⚠ Warning: Downgrading from ${fromVersion} to ${toVersion}`));
  console.log(chalk.yellow('   This may cause compatibility issues or data loss'));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to downgrade?',
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.gray('Downgrade cancelled'));
    process.exit(0);
  }

  // Proceed with caution
  await createBackup(await loadMetadata());
  await performUpdate(fromVersion, toVersion);
}
```

---

## Summary & Recommendations

### Key Decisions Summary

| Research Topic | Decision | Primary Benefit |
|---------------|----------|-----------------|
| Transactional Patterns | Checkpoint-based with in-memory tracking | Safety without complexity |
| NPM Distribution | Bin script entry point (no postinstall) | User control and transparency |
| Cross-Platform | Node.js native modules with platform detection | Zero external dependencies |
| Dependency Detection | Tiered checking with graceful degradation | Partial functionality over hard failures |
| Configuration Preservation | Timestamp-based with shallow merge | User customizations protected |
| Version Management | Dedicated metadata file with semver comparison | Single source of truth |

### Implementation Priority

**Phase 1 (Foundation)**:
1. Environment detection module (`lib/environment.js`)
2. Version management module (`lib/version.js`)
3. Metadata structure and persistence

**Phase 2 (Core Logic)**:
4. Transaction system (`lib/transaction.js`)
5. Dependency detection with graceful degradation
6. Configuration preservation logic

**Phase 3 (Integration)**:
7. Cross-platform compatibility testing
8. CLI entry point with all flags
9. Documentation and user guides

### Testing Recommendations

**Unit Tests**:
- Version comparison logic
- Path normalization across platforms
- Configuration merge strategies
- Dependency detection functions

**Integration Tests**:
- Fresh installation on clean project
- Update with user customizations
- Graceful degradation scenarios
- Rollback after failed transaction
- Cross-platform installation (macOS, Linux, Windows)

**Manual Testing**:
- Non-interactive mode (CI/CD simulation)
- Dry-run mode verification
- Uninstallation with/without preservation
- Version downgrade handling

### Risk Mitigation

**High Priority Risks**:
1. **Data Loss**: Mitigated by transactional rollback and automatic backups
2. **Permission Issues**: Mitigated by pre-flight permission checks
3. **Platform Incompatibility**: Mitigated by extensive platform detection and testing

**Medium Priority Risks**:
1. **Dependency Conflicts**: Mitigated by graceful degradation
2. **Version Conflicts**: Mitigated by metadata tracking and user prompts
3. **Configuration Corruption**: Mitigated by backup strategy

### Alignment with Foundation Principles

✅ **Principle 1 (Modular Extensibility)**: All research decisions support modular architecture
✅ **Principle 2 (Safety-First Automation)**: Transactions, rollbacks, and validation ensure safety
✅ **Principle 3 (Contextual Intelligence)**: Version and metadata tracking enable intelligent updates
✅ **Principle 4 (Developer Experience)**: Clear messaging, graceful degradation, user control
✅ **Principle 5 (Transparent Collaboration)**: Detailed logging, user prompts, visible decision-making

---

## Next Steps

1. ✅ Phase 0 Research Complete
2. ⏭️ Proceed to Phase 1: Design & Contracts
   - Create `data-model.md` based on research findings
   - Define API contracts for modules (`lib/environment.js`, `lib/transaction.js`, etc.)
   - Generate quickstart guide with installation examples
   - Document test scenarios

---

*Research conducted: 2025-10-02*
*Foundation alignment verified: ✅*
*Ready for Phase 1 execution*
