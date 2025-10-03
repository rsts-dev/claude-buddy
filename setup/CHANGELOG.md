# Changelog

All notable changes to the Claude Buddy installation script will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
