# Changelog

All notable changes to the Claude Buddy installation script will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-10-29

### 🚨 BREAKING CHANGES

#### Complete Removal of `.claude-buddy/` Directory

The `.claude-buddy/` directory and all its contents have been permanently removed. This completes the migration to Claude Code Skills.

### Removed

1. **Directory Structure**: personas/, templates/, context/, buddy-config.json
2. **Manifest Components**: All 4 deprecated components removed
3. **Backward Compatibility**: No fallback to legacy paths

### Changed

- **REQUIRED**: Configuration must be in `.claude/hooks.json`
- Skills-only system: `.claude/skills/{personas,domains,generators}`

### Benefits

- 40% smaller package size
- Single source of truth (skills only)
- No legacy path confusion
- 30-70% token savings with skills

### Migration Required

Users from v2.x MUST have:
1. Configuration in `.claude/hooks.json` (v2.2.0+)
2. Skills installed at `.claude/skills/` (v2.1.0+)
3. No custom `.claude-buddy/` content

See [DEPRECATION-NOTICE.md](../../.claude/DEPRECATION-NOTICE.md) for details.

## [2.3.0] - 2025-10-29

### Changed

#### Deprecated `.claude-buddy/` Directory
- **Agents**: All agents now use Claude Code Skills instead of manual loading from `.claude-buddy/`
  - [git-workflow.md](../../.claude/agents/git-workflow.md:125) - Persona skills auto-activate
  - [persona-dispatcher.md](../../.claude/agents/persona-dispatcher.md:312-320) - Skills integration
  - [docs-generator.md](../../.claude/agents/docs-generator.md) - Uses docs-generator skill
  - [foundation.md](../../.claude/agents/foundation.md) - Uses domain skills for context

- **Commands**: Updated to reference skills instead of `.claude-buddy/`
  - [commit.md](../../.claude/commands/buddy/commit.md:24) - Persona skills
  - [persona.md](../../.claude/commands/buddy/persona.md:108) - Persona skills
  - [docs.md](../../.claude/commands/buddy/docs.md:22-23) - docs-generator skill
  - [plan.md](../../.claude/commands/buddy/plan.md:30-31) - plan-generator skill
  - [tasks.md](../../.claude/commands/buddy/tasks.md:41-42) - tasks-generator skill

- **Setup Package**: Marked legacy components as optional/deprecated
  - Templates component: Now optional (replaced by generator skills)
  - Personas component: Now optional (replaced by persona skills)
  - Context component: Now optional (replaced by domain skills)
  - Configs component: Already deprecated in v2.2.0

#### Skills as Primary System
- All functionality now via Claude Code Skills at `.claude/skills/`
- Skills provide: Auto-activation, progressive disclosure, 30-70% token savings
- Legacy `.claude-buddy/` directory still installed for backward compatibility

### Migration Path

**v2.1.0**: Skills created, content duplicated in both locations
**v2.2.0**: Configuration migrated to hooks.json
**v2.3.0** (Current): Agents/commands use skills, `.claude-buddy/` deprecated
**v3.0.0** (Future): Complete removal of `.claude-buddy/` directory

### Backward Compatibility

- `.claude-buddy/` directory still exists and installed
- Marked as deprecated/optional in manifest
- Users on v2.0.x-2.2.x can still use it
- No breaking changes in v2.3.0

### Benefits

- **Single Source of Truth**: Skills provide all content
- **Auto-Activation**: No manual loading instructions needed
- **Token Efficiency**: Progressive disclosure reduces context by 30-70%
- **Better Composition**: Skills work together naturally
- **Simpler Maintenance**: Update skills, not scattered files

### Deprecation Notice

See [.claude/DEPRECATION-NOTICE.md](../../.claude/DEPRECATION-NOTICE.md) for details on:
- What's deprecated
- Migration timeline
- How to verify you're using skills
- Removal schedule (v3.0.0)

## [2.2.0] - 2025-10-29

### Changed

#### Configuration Architecture Cleanup
- **Commands**: Removed duplicate configuration documentation from commands
  - Commands now just reference agent documentation for config options
  - Eliminates duplication between command and agent layers
  - Follows single responsibility: commands invoke, agents configure
- **Agents**: Configuration documentation remains in agents (where it's actually used)
  - [git-workflow.md](.claude/agents/git-workflow.md:322-329) is the single source of truth for git config

#### Configuration Migration (Breaking Change)
- **Migrated Configuration**: Moved all configuration from `.claude-buddy/buddy-config.json` to `.claude/hooks.json` config section
- **Unified Configuration**: All hook settings (file protection, command validation, auto-formatting, git, features) now in single location
- **Native Claude Code Pattern**: Follows Claude Code's standard configuration approach
- **Backward Compatibility**: Hooks check legacy `.claude-buddy/buddy-config.json` location as fallback

#### Updated Components
- **Python Hooks** (3 files): Updated `load_config()` to prioritize `.claude/hooks.json`, fallback to legacy locations
  - `file-guard.py`: Updated config paths and error messages
  - `command-validator.py`: Updated config paths and error messages
  - `auto-formatter.py`: Updated config paths
- **Agents**: Updated [git-workflow.md](.claude/agents/git-workflow.md:322-329) to reference new config location
- **Commands**: Updated [commit.md](.claude/commands/buddy/commit.md:47-53) to reference new config location
- **Setup Installer**: Deprecated buddy-config.json creation, now uses hooks.json from dist/
- **Manifest**: Marked 'configs' component as optional/deprecated
- **Bundle Verification**: Updated to verify hooks.json instead of buddy-config.json

#### Configuration Structure

**New Location**: `.claude/hooks.json`
```json
{
  "hooks": { ... },
  "config": {
    "file_protection": { "enabled": true, "additional_patterns": [], "whitelist_patterns": [], "strict_mode": false },
    "command_validation": { "enabled": true, "block_dangerous": true, "warn_performance": true, "suggest_best_practices": true },
    "auto_formatting": { "enabled": true, "extensions": [".py", ".js", ".ts", ...], "tools": {}, "exclude_patterns": [...] },
    "git": { "auto_push": true, "branch_protection": ["main", "master"], "commit_validation": true, "conventional_commits": true },
    "features": { "auto_commit": true, "safety_hooks": true, "auto_formatting": true, "personas": true },
    "logging": { "enabled": true, "level": "info", "file_operations": true, "command_executions": true },
    "notifications": { "desktop_alerts": false, "protection_events": true, "formatting_results": false }
  }
}
```

### Removed

- **Deprecated buddy-config.json Creation**: Setup installer no longer creates `.claude-buddy/buddy-config.json`
- **Required Config Component**: Marked as optional/deprecated in manifest

### Migration Guide

**For Existing Users**:
1. Configuration automatically migrates - hooks check both locations
2. To fully migrate: Copy settings from `.claude-buddy/buddy-config.json` to `.claude/hooks.json` config section
3. Legacy file still supported for backward compatibility

**For New Users**:
- Configuration automatically included in `.claude/hooks.json` during installation
- No additional configuration file needed

### Benefits

- **Single Source of Truth**: All hook-related configuration in one file
- **Standard Pattern**: Uses Claude Code's native configuration system
- **Easier Discovery**: Config lives with hook definitions
- **Reduced Complexity**: One less file to maintain

## [2.1.0] - 2025-10-29

### Added

#### Claude Code Skills System
- **Skills Migration**: Migrated all `.claude-buddy/` content to Claude Code Skills at `.claude/skills/`
- **19 Auto-Activating Skills**:
  - 12 persona skills (scribe, architect, security, frontend, backend, performance, analyzer, qa, refactorer, devops, mentor, po)
  - 3 domain skills (react, jhipster, mulesoft)
  - 4 generator skills (spec-generator, plan-generator, tasks-generator, docs-generator)
- **Progressive Disclosure**: Skills load supporting files only when needed, reducing token usage by 30-70%
- **Auto-Discovery**: Skills activate automatically based on keywords, file patterns, and task context
- **Skill Composition**: Multiple skills can activate together for complex tasks

#### Updated Components
- **Agents**: Updated all agents (spec-writer, plan-writer, tasks-writer, docs-generator, git-workflow, foundation, persona-dispatcher) to use skills auto-activation instead of manual file loading
- **Commands**: Updated all slash commands (/buddy:commit, /buddy:spec, /buddy:plan, /buddy:tasks, /buddy:docs, /buddy:foundation) with skills auto-activation guidance
- **Installation Manifest**: Added skills component with proper distribution paths and directory structure

#### Documentation
- **Skills README**: Comprehensive documentation at `.claude/skills/README.md` with usage patterns and best practices
- **Migration Notice**: Added `.claude-buddy/MIGRATION-NOTICE.md` documenting the migration from manual loading to skills system

### Changed

#### Performance Improvements
- **Token Efficiency**: Reduced context loading from ~15,000 tokens (manual loading) to ~3,000-5,000 tokens (skills auto-activation)
- **Faster Responses**: Less context to process with progressive disclosure pattern
- **Smarter Activation**: Skills only load when relevant to the current task

#### Backward Compatibility
- **Legacy Support**: Retained `.claude-buddy/` directory for backward compatibility
- **Configuration Preserved**: `buddy-config.json` remains at `.claude-buddy/buddy-config.json`
- **Gradual Migration**: Both systems can coexist during transition period

### Technical Implementation

#### Skills Structure
```
.claude/skills/
├── personas/              # 12 persona skills
│   ├── scribe/
│   │   └── SKILL.md
│   ├── architect/
│   │   └── SKILL.md
│   └── ...
├── domains/               # 3 domain skills
│   ├── react/
│   │   ├── SKILL.md
│   │   └── supporting-files.md
│   ├── jhipster/
│   │   └── SKILL.md
│   └── mulesoft/
│       ├── SKILL.md
│       └── 6 supporting files
└── generators/            # 4 generator skills
    ├── spec-generator/
    │   ├── SKILL.md
    │   └── templates/
    ├── plan-generator/
    │   ├── SKILL.md
    │   └── templates/
    ├── tasks-generator/
    │   ├── SKILL.md
    │   └── templates/
    └── docs-generator/
        ├── SKILL.md
        └── templates/
```

#### Installation Updates
- Component version bumped from 2.0.3 to 2.1.0
- Added skills installation paths to manifest
- Updated bundle distribution to include `.claude/skills/`

### Benefits

- **30-70% Token Savings**: Compared to manual file loading
- **Better Composition**: Multiple skills work together naturally
- **Standard Pattern**: Uses Claude Code's native skill system
- **Simpler Agents**: Less boilerplate, more focused logic
- **Auto-Discovery**: No explicit skill invocation required

## [2.0.0] - 2025-10-02

### Added

#### Core Features
- **Fresh Installation**: Automated setup of all Claude Buddy components
- **Smart Updates**: Version-aware updates with customization preservation
- **Graceful Degradation**: Continues installation when optional dependencies unavailable
- **Transaction System**: Checkpoint-based rollback on failures
- **Cross-Platform Support**: macOS, Linux, and Windows compatibility

#### Installation Operations
- Install command for fresh installations
- Update command with merge strategies
- Uninstall command with preservation options
- Verify command for integrity checking
- Dry-run mode for previewing changes

#### Dependency Management
- Node.js version detection (required >= 18.0.0)
- UV package manager detection (optional, enables hooks)
- Python version detection (optional, enables hooks)
- Git detection (optional, enables VCS integration)
- Platform-specific dependency paths

#### Configuration
- Installation metadata tracking (`.claude-buddy/install-metadata.json`)
- Configuration file support (`.claude-buddy-rc.json`)
- Environment variable configuration
- Component-level enablement
- Customization tracking and preservation

#### User Experience
- Color-coded terminal output with chalk
- Progress indicators and spinners
- Section headers for organized output
- Verbose and quiet modes
- JSON output mode for automation
- Installation summary reporting

#### Safety Features
- Pre-installation environment validation
- Permission checking before modifications
- Disk space verification
- Transactional operations with rollback
- File backup before updates
- Lock file mechanism for concurrent prevention

#### Documentation
- Comprehensive README with usage examples
- Quickstart guide with step-by-step instructions
- Troubleshooting guide with common solutions
- API documentation for all modules
- Performance benchmarks and optimization tips

#### Testing
- Unit tests for all core modules
- Integration tests for all scenarios
- Performance tests (< 30s fresh install, < 10s update)
- Cross-platform compatibility tests
- Edge case and error handling tests

### Technical Implementation

#### Modules
- `lib/environment.js` - Platform and dependency detection
- `lib/manifest.js` - Component definitions and validation
- `lib/installer.js` - Fresh installation logic
- `lib/updater.js` - Update and preservation logic
- `lib/uninstaller.js` - Removal logic with preservation
- `lib/transaction.js` - Atomic operations with rollback
- `lib/logger.js` - Comprehensive logging system
- `lib/config.js` - Configuration management
- `lib/errors.js` - Custom error classes

#### Installation Manifest
- 7 core components defined (hooks, templates, personas, configs, commands, agents, foundation)
- Platform-specific overrides (Windows, macOS, Linux)
- Dependency requirements per component
- File pattern matching with glob
- Directory structure definitions

#### Transaction System
- Pre-install snapshot capture
- Checkpoint creation at each phase
- Action logging (create, update, delete, skip, backup)
- Automatic rollback on failure
- Recovery from interrupted transactions
- Stale lock detection and cleanup

#### Configuration Preservation
- Timestamp-based change detection
- Shallow and deep merge strategies
- User customization tracking
- Configuration migration for version upgrades
- Conflict resolution prompts
- Backup creation before updates

### Performance

- **Fresh Installation**: Completes in < 30 seconds
- **Update Operation**: Completes in < 10 seconds
- **Dry-Run Analysis**: Completes in < 5 seconds
- **File Operations**: Async/await throughout
- **Memory Usage**: Transaction snapshots limited to 100 files
- **Disk I/O**: Batch operations and streaming for large files

### Security

- File permission validation before modifications
- Sensitive file protection (.env, credentials)
- Path traversal prevention
- Input validation and sanitization
- No credential storage in metadata
- Audit logging for all operations

### Compatibility

#### Platforms
- macOS 10.15+ (Intel and Apple Silicon)
- Linux (Ubuntu 18.04+, Debian 10+, CentOS 7+, Alpine)
- Windows 10+ (PowerShell and CMD)

#### Node.js
- Node.js 18.0.0+ (required)
- NPM 8.0.0+ (included with Node.js)
- Native modules only (no compiled dependencies)

#### Optional Dependencies
- UV 0.1.0+ (for Python hooks)
- Python 3.8+ (for hooks)
- Git 2.0+ (for VCS integration)

### Installation Components

```
.claude-buddy/
├── buddy-config.json       # Framework configuration
├── personas/               # AI personas (7 default personas)
├── templates/              # Document templates (spec, plan, tasks, docs)
├── context/                # Stack-specific context
└── install-metadata.json   # Installation metadata

.claude/
├── hooks/                  # Python safety hooks (5 hooks)
│   ├── command-validator.py
│   ├── file-guard.py
│   ├── git-protector.py
│   ├── format-fixer.py
│   └── hooks.json
├── commands/               # Slash commands (7 commands)
│   └── buddy/
│       ├── commit.md
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       ├── docs.md
│       ├── foundation.md
│       └── persona.md
└── agents/                 # Specialized agents (5 agents)
    ├── spec-writer.md
    ├── planner.md
    ├── tasks-writer.md
    ├── doc-writer.md
    └── foundation-writer.md

directive/
└── foundation.md           # Project foundation template

specs/                      # Specification storage (created empty)
```

### Commands and Flags

#### Global Flags
- `--help` - Display help information
- `--version` - Display version information
- `--verbose` - Enable detailed logging
- `--quiet` - Suppress all output except errors
- `--dry-run` - Preview changes without executing
- `--non-interactive` - Run without user prompts
- `--target <dir>` - Specify target directory

#### Install Command
- `--force` - Force reinstall over existing installation
- `--skip-hooks` - Skip hook installation

#### Update Command
- `--preserve-all` - Preserve all files (no updates)
- `--merge-config` - Merge configuration files

#### Uninstall Command
- `--preserve-customizations` - Keep user-created files
- `--purge` - Complete removal including customizations

### Exit Codes

- `0` - Success
- `1` - General error
- `2` - User cancellation
- `10` - Environment validation failed
- `20` - Required dependency missing
- `30` - Permission denied
- `40` - Installation corrupted
- `50` - Transaction failed
- `60` - Rollback required

### Known Issues

None at this time.

### Breaking Changes

None (initial release).

### Migration Guide

Not applicable (initial release).

---

## [1.0.0] - 2025-10-01

### Initial Development

- Project structure established
- Core module implementations
- Basic installation functionality
- Internal testing

---

## Versioning Strategy

- **MAJOR** (X.0.0): Breaking changes to CLI interface or installation behavior
- **MINOR** (x.Y.0): New features, components, or commands (backward compatible)
- **PATCH** (x.y.Z): Bug fixes, performance improvements, documentation updates

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md with release notes
3. Run full test suite (`npm test`)
4. Create git tag (`git tag -a v2.0.0 -m "Release 2.0.0"`)
5. Push to repository (`git push origin v2.0.0`)
6. Publish to NPM (`npm publish`)

---

**Maintained By**: Claude Buddy Team
**Last Updated**: 2025-10-02
