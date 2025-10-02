# Data Model Design: Installation Script for Claude Buddy

**Created**: 2025-10-02
**Status**: Complete
**Related Documents**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md)

---

## Overview

This document defines the concrete data structures used by the Claude Buddy installation script. All structures are designed to support the transactional installation pattern with rollback capability, configuration preservation, and graceful degradation as documented in the research findings.

---

## Core Data Structures

### 1. Installation Manifest

The manifest defines all components that can be installed, their dependencies, and platform-specific variations.

**File Location**: `setup/lib/manifest-definition.js`

**TypeScript-Style Type Definition**:
```typescript
interface InstallationManifest {
  version: string;                    // Semver version of the manifest schema
  components: Component[];            // List of installable components
  directories: DirectorySpec[];       // Required directory structures
  platformSpecific: PlatformConfig;   // Platform-specific overrides
}

interface Component {
  name: string;                       // Component identifier (e.g., "hooks", "templates")
  displayName: string;                // Human-readable name for UI
  type: "required" | "optional";      // Installation requirement level
  source: string;                     // Source path relative to setup/ directory
  target: string;                     // Target path relative to project root
  dependencies: string[];             // Required system dependencies (e.g., ["uv", "python3"])
  filePatterns: string[];             // Glob patterns for files to install
  description: string;                // User-facing description of functionality
  affectedFeatures: string[];         // Features enabled by this component
}

interface DirectorySpec {
  path: string;                       // Directory path relative to project root
  permissions?: string;               // Unix permissions (e.g., "755")
  createIfMissing: boolean;           // Whether to create if doesn't exist
}

interface PlatformConfig {
  windows?: PlatformOverrides;
  darwin?: PlatformOverrides;
  linux?: PlatformOverrides;
}

interface PlatformOverrides {
  componentOverrides?: Record<string, Partial<Component>>;
  directoryOverrides?: Record<string, Partial<DirectorySpec>>;
  environmentVariables?: Record<string, string>;
}
```

**JSON Schema Example**:
```json
{
  "version": "1.0.0",
  "components": [
    {
      "name": "hooks",
      "displayName": "Python Safety Hooks",
      "type": "optional",
      "source": ".claude/hooks/",
      "target": ".claude/hooks/",
      "dependencies": ["uv", "python3"],
      "filePatterns": ["*.py", "*.json"],
      "description": "Pre-execution validation hooks for safe AI automation",
      "affectedFeatures": [
        "Command validation",
        "File protection",
        "Git operation safety"
      ]
    },
    {
      "name": "templates",
      "displayName": "Document Templates",
      "type": "required",
      "source": ".claude-buddy/templates/",
      "target": ".claude-buddy/templates/",
      "dependencies": [],
      "filePatterns": ["**/*.md"],
      "description": "Foundation-specific document generation templates",
      "affectedFeatures": [
        "Specification generation",
        "Implementation planning",
        "Task breakdown",
        "Documentation generation"
      ]
    },
    {
      "name": "personas",
      "displayName": "AI Personas",
      "type": "required",
      "source": ".claude-buddy/personas/",
      "target": ".claude-buddy/personas/",
      "dependencies": [],
      "filePatterns": ["*.md"],
      "description": "Specialized AI expert personas for domain-specific assistance",
      "affectedFeatures": [
        "Auto-activation based on context",
        "Manual persona selection",
        "Session memory and context retention"
      ]
    },
    {
      "name": "configs",
      "displayName": "Framework Configuration",
      "type": "required",
      "source": ".claude-buddy/",
      "target": ".claude-buddy/",
      "dependencies": [],
      "filePatterns": ["buddy-config.json"],
      "description": "Core framework configuration and settings",
      "affectedFeatures": [
        "Persona auto-activation settings",
        "Hook configuration",
        "Template selection"
      ]
    },
    {
      "name": "commands",
      "displayName": "Slash Commands",
      "type": "required",
      "source": ".claude/commands/",
      "target": ".claude/commands/",
      "dependencies": [],
      "filePatterns": ["**/*.md"],
      "description": "Slash command definitions for /buddy:* commands",
      "affectedFeatures": [
        "/buddy:commit",
        "/buddy:spec",
        "/buddy:plan",
        "/buddy:tasks",
        "/buddy:docs",
        "/buddy:foundation",
        "/buddy:persona"
      ]
    },
    {
      "name": "agents",
      "displayName": "Specialized Agents",
      "type": "required",
      "source": ".claude/agents/",
      "target": ".claude/agents/",
      "dependencies": [],
      "filePatterns": ["**/*.md"],
      "description": "Agent protocols for complex workflows",
      "affectedFeatures": [
        "Feature specification agent",
        "Implementation planning agent",
        "Task generation agent",
        "Documentation agent"
      ]
    },
    {
      "name": "foundation",
      "displayName": "Foundation Template",
      "type": "required",
      "source": "directive/",
      "target": "directive/",
      "dependencies": [],
      "filePatterns": ["foundation.md"],
      "description": "Project foundation document template",
      "affectedFeatures": [
        "Foundation-driven development",
        "Principle compliance tracking"
      ]
    }
  ],
  "directories": [
    {
      "path": ".claude-buddy",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": ".claude-buddy/personas",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": ".claude-buddy/templates",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": ".claude",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": ".claude/hooks",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": ".claude/commands",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": ".claude/agents",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": "directive",
      "permissions": "755",
      "createIfMissing": true
    },
    {
      "path": "specs",
      "permissions": "755",
      "createIfMissing": true
    }
  ],
  "platformSpecific": {
    "windows": {
      "componentOverrides": {
        "hooks": {
          "filePatterns": ["*.py", "*.json", "*.bat"]
        }
      }
    },
    "darwin": {
      "environmentVariables": {
        "CLAUDE_BUDDY_SHELL": "bash"
      }
    },
    "linux": {
      "environmentVariables": {
        "CLAUDE_BUDDY_SHELL": "bash"
      }
    }
  }
}
```

---

### 2. Installation Metadata

Tracks the current state of Claude Buddy installation in the target project.

**File Location**: `.claude-buddy/install-metadata.json`

**TypeScript-Style Type Definition**:
```typescript
interface InstallationMetadata {
  version: string;                    // Installed Claude Buddy version
  installDate: string;                // ISO8601 timestamp of initial installation
  lastUpdateDate: string | null;      // ISO8601 timestamp of last update
  installMode: InstallMode;           // Installation mode used
  installedComponents: ComponentStatus;
  userCustomizations: UserCustomization[];
  dependencies: DependencyStatus;
  transactionHistory: TransactionRecord[];
}

type InstallMode = "project" | "global" | "dev";

interface ComponentStatus {
  [componentName: string]: {
    version: string;                  // Component version
    enabled: boolean;                 // Whether component is active
    reason?: string;                  // Reason if disabled (e.g., "UV unavailable")
    lastModified?: string;            // ISO8601 timestamp
  };
}

interface UserCustomization {
  file: string;                       // File path relative to project root
  createdDate: string;                // ISO8601 timestamp of creation
  lastModified: string;               // ISO8601 timestamp of last modification
  description?: string;               // User-provided description
  preserveOnUpdate: boolean;          // Whether to protect during updates
}

interface DependencyStatus {
  [dependencyName: string]: {
    version: string | null;           // Version if available
    required: boolean;                // Whether it's required
    available: boolean;               // Whether it's detected
    location?: string;                // Path to executable
  };
}

interface TransactionRecord {
  transactionId: string;              // UUID v4
  operation: TransactionOperation;
  version: string;                    // Version being installed/updated
  timestamp: string;                  // ISO8601 timestamp
  status: TransactionStatus;
  errorMessage?: string;              // Error details if failed
}

type TransactionOperation = "install" | "update" | "uninstall" | "repair";
type TransactionStatus = "completed" | "failed" | "rolled_back";
```

**JSON Schema Example**:
```json
{
  "version": "1.0.0",
  "installDate": "2025-10-02T12:00:00Z",
  "lastUpdateDate": null,
  "installMode": "project",
  "installedComponents": {
    "core": {
      "version": "1.0.0",
      "enabled": true
    },
    "hooks": {
      "version": "1.0.0",
      "enabled": false,
      "reason": "UV package manager not available"
    },
    "templates": {
      "version": "1.0.0",
      "enabled": true
    },
    "personas": {
      "version": "1.0.0",
      "enabled": true
    },
    "commands": {
      "version": "1.0.0",
      "enabled": true
    },
    "agents": {
      "version": "1.0.0",
      "enabled": true
    },
    "foundation": {
      "version": "1.0.0",
      "enabled": true
    }
  },
  "userCustomizations": [
    {
      "file": ".claude-buddy/personas/custom-reviewer.md",
      "createdDate": "2025-10-02T13:00:00Z",
      "lastModified": "2025-10-02T13:00:00Z",
      "description": "Custom code review persona",
      "preserveOnUpdate": true
    }
  ],
  "dependencies": {
    "node": {
      "version": "18.0.0",
      "required": true,
      "available": true,
      "location": "/usr/local/bin/node"
    },
    "uv": {
      "version": null,
      "required": false,
      "available": false
    },
    "python": {
      "version": "3.11.0",
      "required": false,
      "available": true,
      "location": "/usr/local/bin/python3"
    }
  },
  "transactionHistory": [
    {
      "transactionId": "550e8400-e29b-41d4-a716-446655440000",
      "operation": "install",
      "version": "1.0.0",
      "timestamp": "2025-10-02T12:00:00Z",
      "status": "completed"
    }
  ]
}
```

---

### 3. Installation Transaction

Represents a single installation/update/uninstall operation with rollback capability.

**File Location**: `.claude-buddy/install-transaction.json` (temporary, deleted on success)

**TypeScript-Style Type Definition**:
```typescript
interface InstallationTransaction {
  transactionId: string;              // UUID v4
  startTime: string;                  // ISO8601 timestamp
  endTime: string | null;             // ISO8601 timestamp when completed
  status: TransactionStatus;
  operation: TransactionOperation;
  fromVersion?: string;               // Source version for updates
  toVersion: string;                  // Target version
  checkpoints: Checkpoint[];          // Rollback points
  plannedActions: PlannedAction[];    // All actions to be executed
  executedActions: ExecutedAction[];  // Completed actions
  errors: TransactionError[];         // Errors encountered
  rollbackPoint: Snapshot | null;     // Pre-installation snapshot
}

type TransactionStatus = "pending" | "in_progress" | "completed" | "failed" | "rolled_back";
type TransactionOperation = "install" | "update" | "uninstall" | "repair";

interface Checkpoint {
  phase: CheckpointPhase;
  snapshot: Snapshot;
  timestamp: string;                  // ISO8601 timestamp
}

type CheckpointPhase = "pre-install" | "dependencies-checked" | "directories-created" | "files-copied" | "post-install";

interface Snapshot {
  files: FileSnapshot[];
  metadata: Partial<InstallationMetadata>;
  timestamp: string;                  // ISO8601 timestamp
}

interface FileSnapshot {
  path: string;                       // File path relative to project root
  exists: boolean;                    // Whether file exists
  content?: string;                   // File content (if exists)
  permissions?: string;               // Unix permissions
  lastModified?: string;              // ISO8601 timestamp
}

interface PlannedAction {
  actionId: string;                   // UUID v4
  type: ActionType;
  path: string;                       // Target file/directory path
  component?: string;                 // Component name if applicable
  reason: string;                     // Why this action is needed
  status: ActionStatus;
  sourceContent?: string;             // Content to write (for create/update)
  targetPermissions?: string;         // Permissions to set
}

type ActionType = "create" | "update" | "delete" | "skip" | "backup";
type ActionStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

interface ExecutedAction extends PlannedAction {
  executionTime: string;              // ISO8601 timestamp
  duration: number;                   // Milliseconds
  previousContent?: string;           // Original content before modification
  result: ActionResult;
}

interface ActionResult {
  success: boolean;
  message?: string;                   // Success/error message
  warning?: string;                   // Warning if action succeeded with issues
}

interface TransactionError {
  errorId: string;                    // UUID v4
  actionId?: string;                  // Related action if applicable
  timestamp: string;                  // ISO8601 timestamp
  phase: CheckpointPhase;
  errorType: ErrorType;
  message: string;                    // User-friendly error message
  technicalDetails: string;           // Stack trace or detailed error
  recoverable: boolean;               // Whether rollback is possible
}

type ErrorType =
  | "permission_denied"
  | "dependency_missing"
  | "file_conflict"
  | "network_error"
  | "disk_space"
  | "corruption"
  | "timeout"
  | "unknown";
```

**JSON Schema Example**:
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2025-10-02T12:00:00Z",
  "endTime": null,
  "status": "in_progress",
  "operation": "install",
  "toVersion": "1.0.0",
  "checkpoints": [
    {
      "phase": "pre-install",
      "snapshot": {
        "files": [],
        "metadata": {},
        "timestamp": "2025-10-02T12:00:00Z"
      },
      "timestamp": "2025-10-02T12:00:00Z"
    }
  ],
  "plannedActions": [
    {
      "actionId": "660e8400-e29b-41d4-a716-446655440001",
      "type": "create",
      "path": ".claude-buddy",
      "reason": "Create framework root directory",
      "status": "pending"
    },
    {
      "actionId": "660e8400-e29b-41d4-a716-446655440002",
      "type": "create",
      "path": ".claude-buddy/buddy-config.json",
      "component": "configs",
      "reason": "Install framework configuration",
      "status": "pending",
      "sourceContent": "{\"version\": \"1.0.0\", ...}"
    },
    {
      "actionId": "660e8400-e29b-41d4-a716-446655440003",
      "type": "skip",
      "path": ".claude/hooks",
      "component": "hooks",
      "reason": "UV dependency unavailable",
      "status": "pending"
    }
  ],
  "executedActions": [],
  "errors": [],
  "rollbackPoint": {
    "files": [],
    "metadata": {},
    "timestamp": "2025-10-02T12:00:00Z"
  }
}
```

---

### 4. Environment Detection Result

Represents the detected environment capabilities and constraints.

**TypeScript-Style Type Definition**:
```typescript
interface EnvironmentDetection {
  platform: Platform;
  nodeVersion: string;                // Semver version
  detectedDependencies: DetectedDependency[];
  permissions: PermissionCheck;
  diskSpace: DiskSpaceInfo;
  existingInstallation: ExistingInstallationInfo | null;
}

interface Platform {
  os: "windows" | "darwin" | "linux";
  arch: string;                       // e.g., "x64", "arm64"
  osVersion: string;
  shell: string;                      // e.g., "bash", "powershell", "zsh"
  homedir: string;                    // User home directory
  tempdir: string;                    // Temporary directory
}

interface DetectedDependency {
  name: string;
  available: boolean;
  version: string | null;
  location: string | null;            // Path to executable
  alternativeLocations: string[];     // Other potential paths checked
}

interface PermissionCheck {
  targetDirectory: string;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  isGitRepo: boolean;
  gitConfigurable: boolean;           // Can write to .git/config
}

interface DiskSpaceInfo {
  available: number;                  // Bytes available
  required: number;                   // Bytes needed for installation
  sufficient: boolean;
}

interface ExistingInstallationInfo {
  isInstalled: boolean;
  version: string;
  installDate: string;                // ISO8601 timestamp
  componentsStatus: ComponentStatus;
  isCorrupted: boolean;               // Missing expected files
  corruptionDetails?: string[];       // List of corruption issues
}
```

---

### 5. Configuration Merge Result

Represents the result of merging configurations during updates.

**TypeScript-Style Type Definition**:
```typescript
interface ConfigurationMergeResult {
  filePath: string;                   // Configuration file being merged
  strategy: MergeStrategy;
  isUserModified: boolean;
  conflicts: ConfigConflict[];
  mergedContent: any;                 // Final merged configuration
  backupPath: string;                 // Path to backup of original
  requiresUserInput: boolean;         // Whether manual resolution needed
}

type MergeStrategy = "keep_user" | "use_new" | "shallow_merge" | "deep_merge" | "prompt_user";

interface ConfigConflict {
  path: string;                       // JSON path to conflicting field (e.g., "hooks.timeout")
  userValue: any;                     // User's current value
  newValue: any;                      // New default value
  resolution: ConflictResolution;
}

type ConflictResolution = "keep_user" | "use_new" | "merge" | "pending";
```

---

## Validation Rules

### Installation Manifest Validation
- `version` MUST be valid semver
- All `component.dependencies` MUST reference known dependencies
- `component.source` paths MUST exist in the package
- `component.filePatterns` MUST be valid glob patterns
- `directories` MUST NOT contain absolute paths

### Installation Metadata Validation
- `version` MUST match installed manifest version
- `installDate` MUST be valid ISO8601 timestamp
- All `installedComponents` keys MUST exist in manifest
- `transactionHistory` MUST be ordered by timestamp
- `dependencies` MUST include all manifest dependencies

### Transaction Validation
- `transactionId` MUST be unique UUID v4
- `plannedActions` MUST cover all required components
- `checkpoints` MUST include "pre-install" phase
- `rollbackPoint` MUST be captured before first modification
- Transaction MUST timeout after 5 minutes of no progress

### Environment Validation
- Node.js version MUST be >= 18.0.0
- Target directory MUST have write permissions
- Disk space MUST meet minimum requirements (50MB)
- Platform MUST be supported (windows, darwin, linux)

---

## Error Handling

### Data Structure Error Handling
All data structures include error states and recovery mechanisms:

1. **Invalid JSON**: Attempt repair, fallback to defaults, log corruption
2. **Schema Mismatch**: Run migration, preserve unknown fields
3. **Missing Required Fields**: Use sensible defaults, warn user
4. **Type Mismatches**: Coerce when safe, error when unsafe
5. **Circular References**: Detect and break cycles, log warning

### Transaction Recovery
- **Incomplete Transaction**: Resume from last checkpoint or rollback
- **Corrupted Transaction Log**: Attempt reconstruction from snapshots
- **Missing Rollback Point**: Warn user, offer repair installation
- **Failed Rollback**: Create emergency backup, manual intervention required

---

## File Format Standards

### JSON Formatting
- **Indentation**: 2 spaces
- **Line Endings**: LF (Unix) for all platforms
- **Encoding**: UTF-8 without BOM
- **Max File Size**: 1MB per JSON file
- **Backup Retention**: Keep last 3 backups, max 7 days old

### Timestamp Format
- **Standard**: ISO 8601 (e.g., "2025-10-02T12:00:00Z")
- **Timezone**: Always UTC (Z suffix)
- **Precision**: Seconds (no milliseconds)

### Version Format
- **Standard**: Semantic Versioning 2.0.0
- **Pattern**: `MAJOR.MINOR.PATCH`
- **Pre-release**: Support for `-alpha`, `-beta`, `-rc` suffixes
- **Comparison**: Strict semver comparison rules

---

## Performance Considerations

### Memory Usage
- Transaction snapshots limited to 100 files max
- Large files (>1MB) referenced by path, not content
- Checkpoint pruning after successful completion
- Metadata file size capped at 1MB

### Disk I/O Optimization
- Batch file operations when possible
- Async file operations throughout
- Stream large files instead of loading into memory
- Lazy-load transaction history (only recent 10 transactions)

### Concurrency Handling
- File-based locking for concurrent installations
- Lock file: `.claude-buddy/install.lock`
- Lock timeout: 30 seconds
- Stale lock detection and cleanup

---

## Security Considerations

### Sensitive Data
- NEVER store credentials in metadata
- NEVER log file contents in transaction logs
- Sanitize error messages for public logging
- Obfuscate user paths in error reports

### File Permissions
- Configuration files: 644 (rw-r--r--)
- Executable hooks: 755 (rwxr-xr-x)
- Metadata files: 644 (rw-r--r--)
- Directories: 755 (rwxr-xr-x)

### Input Validation
- Validate all user inputs against schemas
- Sanitize file paths to prevent traversal attacks
- Reject absolute paths in manifest definitions
- Limit string lengths to prevent DoS

---

*This data model design is complete and ready for implementation in Phase 2.*
