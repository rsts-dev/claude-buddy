# Claude Buddy Installation Script

> Automated installation and configuration tool for Claude Buddy framework

## Overview

The Claude Buddy installation script provides a robust, cross-platform solution for setting up and managing the Claude Buddy AI assistant framework in your development projects. It handles fresh installations, updates, uninstallations, and gracefully degrades when optional dependencies are unavailable.

## Features

- **Fresh Installation**: Sets up all Claude Buddy components with zero configuration
- **Smart Updates**: Preserves user customizations while updating framework files
- **Graceful Degradation**: Continues installation when optional dependencies are missing
- **Dry-Run Mode**: Preview all actions before executing
- **Transaction Safety**: Automatic rollback on failures
- **Cross-Platform**: Works on macOS, Linux, and Windows
- **Non-Interactive Mode**: Perfect for CI/CD pipelines

## Quick Start

### Installation

```bash
# Install globally
npm install -g claude-buddy

# Run installation
claude-buddy install

# Or use npx for one-time installation
npx claude-buddy install
```

### Basic Usage

```bash
# Fresh installation in current directory
claude-buddy install

# Install in specific directory
claude-buddy install --target /path/to/project

# Update existing installation
claude-buddy update

# Dry-run mode (preview without changes)
claude-buddy install --dry-run

# Uninstall Claude Buddy
claude-buddy uninstall

# Verify installation
claude-buddy verify
```

## Commands

### `install`

Performs a fresh installation or updates an existing one.

```bash
claude-buddy install [options]
```

**Options:**
- `--target <dir>` - Target installation directory (default: current directory)
- `--force` - Force reinstall even if already installed
- `--skip-hooks` - Skip hook installation
- `--dry-run` - Preview changes without executing
- `--verbose` - Enable detailed logging
- `--quiet` - Suppress all output except errors
- `--non-interactive` - Run without user prompts (for CI/CD)

### `update`

Updates an existing installation while preserving customizations.

```bash
claude-buddy update [options]
```

**Options:**
- `--preserve-all` - Preserve all files (no updates)
- `--merge-config` - Merge configuration files instead of replacing

### `uninstall`

Removes Claude Buddy from the project.

```bash
claude-buddy uninstall [options]
```

**Options:**
- `--preserve-customizations` - Keep user-created files
- `--purge` - Complete removal including all customizations

### `verify`

Verifies installation integrity and shows status.

```bash
claude-buddy verify
```

## Installation Process

### What Gets Installed

```
.claude-buddy/           # Framework configuration
├── buddy-config.json    # Main configuration
├── personas/            # AI personas
├── templates/           # Document templates
└── context/             # Stack-specific context

.claude/                 # Claude Code integration
├── hooks/               # Python safety hooks (requires UV + Python)
├── commands/            # Slash commands
└── agents/              # Specialized agents

directive/               # Project foundation
└── foundation.md        # Foundation document template

specs/                   # Specification storage
```

### Dependencies

**Required:**
- Node.js >= 18.0.0

**Optional:**
- UV (Python package manager) - enables safety hooks
- Python 3.8+ - enables safety hooks
- Git - enables version control integration

**Graceful Degradation:**
When optional dependencies are missing, the installer:
- Skips related components with clear warnings
- Installs core functionality successfully
- Provides instructions for enabling skipped features

## Configuration

### Environment Variables

```bash
# Installation behavior
CLAUDE_BUDDY_HOME=/path/to/install       # Override installation directory
CLAUDE_BUDDY_VERBOSE=1                    # Enable verbose logging
CLAUDE_BUDDY_NO_COLOR=1                   # Disable color output
CLAUDE_BUDDY_CONFIG=/path/to/.clauderc   # Custom config file location
```

### Configuration File

Create `.claude-buddy-rc.json` in your project or home directory:

```json
{
  "installMode": "project",
  "autoUpdate": false,
  "preserveCustomizations": true,
  "hooks": {
    "enabled": true,
    "timeout": 10000
  },
  "logging": {
    "level": "normal",
    "file": ".claude-buddy/install.log"
  }
}
```

## Exit Codes

The installation script uses standard exit codes:

- `0` - Success
- `1` - General error
- `2` - User cancellation
- `10` - Environment validation failed
- `20` - Dependency missing (required)
- `30` - Permission denied
- `40` - Installation corrupted
- `50` - Transaction failed
- `60` - Rollback required

## Advanced Usage

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Install Claude Buddy
  run: |
    npx claude-buddy install \
      --non-interactive \
      --target $GITHUB_WORKSPACE \
      --skip-hooks
  env:
    CLAUDE_BUDDY_VERBOSE: 1
```

### Docker Installation

```dockerfile
FROM node:18-alpine

# Install Claude Buddy
RUN npx claude-buddy install \
    --non-interactive \
    --target /app

WORKDIR /app
```

### Programmatic Usage

```javascript
const { execSync } = require('child_process');

// Run installation programmatically
execSync('npx claude-buddy install --non-interactive', {
  cwd: '/path/to/project',
  stdio: 'inherit'
});
```

## Troubleshooting

### Common Issues

**Installation fails with permission errors:**
```bash
# Run with appropriate permissions
sudo claude-buddy install

# Or change directory ownership
sudo chown -R $USER:$USER /path/to/project
```

**Hooks not installing:**
- Ensure UV is installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Verify Python 3.8+: `python3 --version`
- Retry installation: `claude-buddy install --force`

**Update not preserving customizations:**
- Use `--preserve-all` flag: `claude-buddy update --preserve-all`
- Check `.claude-buddy/install-metadata.json` for tracked files

**Dry-run shows unexpected changes:**
- Review current installation: `claude-buddy verify`
- Check for manual modifications to framework files

For more troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Performance

### Benchmarks

- **Fresh Installation**: < 30 seconds
- **Update Operation**: < 10 seconds
- **Dry-Run Analysis**: < 5 seconds

### Performance Tuning

```bash
# Faster installation (quiet mode)
claude-buddy install --quiet

# Skip optional components for speed
claude-buddy install --skip-hooks
```

## Development

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests
npm run test:performance
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Architecture

### Core Modules

- **`lib/environment.js`** - Platform and dependency detection
- **`lib/manifest.js`** - Component definitions and validation
- **`lib/installer.js`** - Fresh installation logic
- **`lib/updater.js`** - Update and preservation logic
- **`lib/uninstaller.js`** - Removal logic
- **`lib/transaction.js`** - Atomic operations with rollback
- **`lib/logger.js`** - Logging and user feedback

### Transaction System

The installer uses a checkpoint-based transaction system:

1. **Pre-install snapshot** - Captures current state
2. **Planned actions** - Defines all operations
3. **Execution** - Performs actions with validation
4. **Checkpoint creation** - Saves state at each phase
5. **Automatic rollback** - Reverts on any failure

## Security

### File Protection

The installer protects sensitive files:
- `.env` files are never modified
- User credentials are preserved
- Git history remains intact

### Validation

All operations are validated:
- Permission checks before modifications
- Manifest validation before installation
- Integrity verification after completion

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

## Contributing

For development guidelines and contribution instructions, see the main project [CONTRIBUTING.md](../CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Support

- **Documentation**: [Full Documentation](../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/claude-buddy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/claude-buddy/discussions)

---

**Built with** ❤️ **for the Claude Code community**
