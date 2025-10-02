# CLI Interface Contract

**Module**: `setup/install.js`
**Type**: Command-line interface
**Related**: [data-model.md](../data-model.md), [research.md](../research.md)

---

## Overview

The CLI interface serves as the primary entry point for all Claude Buddy installation operations. It provides a simple, intuitive command structure with intelligent defaults and comprehensive error handling.

---

## Command Structure

### Base Command
```bash
claude-buddy [command] [options] [target-directory]
```

### Available Commands

#### 1. Install (Default)
```bash
claude-buddy install [target-directory]
claude-buddy [target-directory]  # Shorthand
```

**Description**: Installs Claude Buddy framework into the target directory. Automatically detects whether to perform fresh installation or update.

**Behavior**:
- If no installation exists: Fresh install
- If older version exists: Update with customization preservation
- If same version exists: Repair/verify installation
- If newer version exists: Prompt for downgrade confirmation

#### 2. Update
```bash
claude-buddy update [target-directory]
```

**Description**: Explicitly updates an existing installation to the current version.

**Behavior**:
- Requires existing installation
- Preserves user customizations
- Runs configuration migrations
- Displays update summary

#### 3. Uninstall
```bash
claude-buddy uninstall [target-directory]
```

**Description**: Removes Claude Buddy from the target directory.

**Behavior**:
- Prompts for confirmation (unless --non-interactive)
- Option to preserve user customizations
- Displays removal summary
- Cleans up all framework files

#### 4. Verify
```bash
claude-buddy verify [target-directory]
```

**Description**: Verifies installation integrity and displays status.

**Behavior**:
- Checks all components are present
- Validates configuration files
- Reports dependency status
- Suggests repairs if issues found

---

## Options

### Global Options
Available with all commands:

#### --dry-run
```bash
claude-buddy install --dry-run
```
- Previews all actions without executing
- Displays what would be created, updated, or deleted
- Shows warnings and dependency issues
- Exit code: 0 (preview complete)

#### --verbose, -v
```bash
claude-buddy install --verbose
claude-buddy install -v
```
- Enables detailed logging
- Shows all file operations
- Displays dependency detection details
- Useful for troubleshooting

#### --quiet, -q
```bash
claude-buddy install --quiet
claude-buddy install -q
```
- Suppresses all output except errors
- Suitable for CI/CD pipelines
- Returns only exit codes

#### --non-interactive
```bash
claude-buddy install --non-interactive
```
- Disables all user prompts
- Uses sensible defaults for all decisions
- Required for automated installations
- Fails with error if user input needed

#### --help, -h
```bash
claude-buddy --help
claude-buddy install --help
```
- Displays command usage and options
- Shows examples
- Lists available commands

#### --version, -V
```bash
claude-buddy --version
```
- Displays installed package version
- Shows no other output

### Installation Options

#### --force, -f
```bash
claude-buddy install --force
```
- Overwrites existing files without prompting
- Bypasses customization preservation
- Use with caution (creates backup)

#### --skip-hooks
```bash
claude-buddy install --skip-hooks
```
- Skips hook installation even if dependencies available
- Useful for environments where hooks are not desired

#### --target, -t
```bash
claude-buddy install --target /path/to/project
```
- Explicitly specify target directory
- Alternative to positional argument

### Update Options

#### --preserve-all
```bash
claude-buddy update --preserve-all
```
- Preserves all existing files
- Only adds new files, never updates existing
- Use when heavy customization exists

#### --merge-config
```bash
claude-buddy update --merge-config
```
- Deep merges configuration files
- Prompts on conflicts
- Default: shallow merge

### Uninstall Options

#### --preserve-customizations
```bash
claude-buddy uninstall --preserve-customizations
```
- Keeps user-created personas and configs
- Removes only framework files
- Creates backup before removal

#### --purge
```bash
claude-buddy uninstall --purge
```
- Removes everything including customizations
- Requires explicit confirmation
- Cannot be undone (unless backup exists)

---

## Arguments

### target-directory
**Type**: String (file path)
**Required**: No
**Default**: Current working directory (`process.cwd()`)

**Validation**:
- Must be a valid directory path
- Must exist or be creatable
- Must have write permissions
- Cannot be system directories (/, /usr, /etc, etc.)

**Examples**:
```bash
claude-buddy install                    # Install in current directory
claude-buddy install /path/to/project   # Install in specific directory
claude-buddy install .                  # Explicit current directory
claude-buddy install ~/my-project       # User home directory expansion
```

---

## Exit Codes

### Success Codes
- **0**: Operation completed successfully
- **0**: Dry-run completed without errors

### Error Codes
- **1**: General error (with error message to stderr)
- **2**: Invalid arguments or usage
- **3**: Permission denied
- **4**: Dependency missing (required dependency)
- **5**: Installation corrupted (unrecoverable)
- **10**: User cancelled operation
- **20**: Network error (if applicable)
- **30**: Disk space insufficient
- **99**: Unknown error

**Usage**:
```bash
claude-buddy install
echo $?  # Check exit code
```

---

## Output Format

### Standard Output (stdout)

#### Normal Mode
Human-readable output with:
- Progress indicators (spinners, progress bars)
- Color-coded status messages (green=success, yellow=warning, red=error)
- Hierarchical information display
- Summary at completion

**Example**:
```
🔧 Claude Buddy Installation v1.0.0

📍 Target: /Users/dev/my-project
🔍 Checking system requirements...
  ✓ Node.js 18.0.0
  ✗ UV not found
    ⚠ Hook functionality will be disabled
  ✓ Git 2.30.0

⚙️ Installing components...
  ✓ Framework configuration
  ✓ Document templates
  ✓ AI personas
  ✓ Slash commands
  ⊘ Python hooks (skipped: UV unavailable)

✅ Installation complete!

📦 Version: 1.0.0
📍 Location: /Users/dev/my-project/.claude-buddy
⏱️  Duration: 3.2s

Next steps:
  1. Run: claude-buddy verify
  2. Create foundation: /buddy:foundation
  3. Create first spec: /buddy:spec

💡 To enable hooks, install UV: curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### JSON Mode
```bash
claude-buddy install --json
```

Machine-readable JSON output:
```json
{
  "success": true,
  "version": "1.0.0",
  "operation": "install",
  "duration": 3200,
  "components": {
    "installed": ["configs", "templates", "personas", "commands"],
    "skipped": ["hooks"],
    "failed": []
  },
  "warnings": [
    {
      "type": "dependency_missing",
      "dependency": "uv",
      "message": "UV not found. Hook functionality will be disabled.",
      "installGuide": "curl -LsSf https://astral.sh/uv/install.sh | sh"
    }
  ],
  "nextSteps": [
    "Run: claude-buddy verify",
    "Create foundation: /buddy:foundation",
    "Create first spec: /buddy:spec"
  ]
}
```

#### Quiet Mode
```bash
claude-buddy install --quiet
```
- No output on success
- Errors only to stderr
- Exit code indicates status

### Standard Error (stderr)

All errors and warnings in verbose mode:
```
ERROR: Permission denied when creating .claude-buddy/
  Required: Write access to /Users/dev/my-project
  Current user: devuser
  Directory owner: root

Resolution:
  1. Change directory ownership: sudo chown -R devuser /Users/dev/my-project
  2. Or run with sudo: sudo claude-buddy install /Users/dev/my-project
```

---

## Environment Variables

### CLAUDE_BUDDY_HOME
**Type**: String (directory path)
**Default**: Not set
**Description**: Override default installation location

**Example**:
```bash
export CLAUDE_BUDDY_HOME=/opt/claude-buddy
claude-buddy install  # Installs to /opt/claude-buddy
```

### CLAUDE_BUDDY_VERBOSE
**Type**: Boolean ("true", "1", "yes")
**Default**: "false"
**Description**: Enable verbose logging

**Example**:
```bash
CLAUDE_BUDDY_VERBOSE=true claude-buddy install
```

### CLAUDE_BUDDY_NO_COLOR
**Type**: Boolean ("true", "1", "yes")
**Default**: "false"
**Description**: Disable colored output

**Example**:
```bash
CLAUDE_BUDDY_NO_COLOR=true claude-buddy install
```

### CLAUDE_BUDDY_CONFIG
**Type**: String (file path)
**Default**: `.claude-buddy-rc.json`
**Description**: Path to configuration file for defaults

**Example**:
```bash
CLAUDE_BUDDY_CONFIG=/etc/claude-buddy.json claude-buddy install
```

---

## Configuration File

### .claude-buddy-rc.json
**Location**: Target directory root or user home directory
**Format**: JSON

**Schema**:
```json
{
  "installDefaults": {
    "skipHooks": false,
    "nonInteractive": false,
    "verbose": false,
    "preserveCustomizations": true
  },
  "components": {
    "hooks": "auto",        // "auto", "skip", "required"
    "templates": "required",
    "personas": "required",
    "commands": "required"
  },
  "dependencies": {
    "uv": {
      "autoInstall": false,
      "locations": ["/usr/local/bin/uv", "~/.local/bin/uv"]
    }
  }
}
```

**Precedence** (highest to lowest):
1. Command-line flags
2. Environment variables
3. `.claude-buddy-rc.json` in target directory
4. `.claude-buddy-rc.json` in user home directory
5. Built-in defaults

---

## Usage Examples

### Fresh Installation
```bash
# Install in current directory with defaults
claude-buddy install

# Install in specific directory
claude-buddy install /path/to/project

# Install with verbose output
claude-buddy install --verbose

# Preview installation without executing
claude-buddy install --dry-run
```

### Update Existing Installation
```bash
# Update with customization preservation
claude-buddy update

# Force update, overwrite all files
claude-buddy update --force

# Update with deep config merge
claude-buddy update --merge-config
```

### Uninstallation
```bash
# Uninstall with confirmation
claude-buddy uninstall

# Uninstall preserving customizations
claude-buddy uninstall --preserve-customizations

# Complete removal without confirmation
claude-buddy uninstall --purge --non-interactive
```

### Verification
```bash
# Verify installation
claude-buddy verify

# Verify with verbose output
claude-buddy verify --verbose
```

### Non-Interactive (CI/CD)
```bash
# Silent installation for CI/CD
claude-buddy install --non-interactive --quiet

# Check exit code
if [ $? -eq 0 ]; then
  echo "Installation successful"
else
  echo "Installation failed"
  exit 1
fi
```

---

## Error Handling

### Common Error Scenarios

#### Permission Denied
```
ERROR: Permission denied
  Cannot write to /path/to/project/.claude-buddy

Resolution:
  1. Check directory permissions: ls -la /path/to/project
  2. Run with appropriate permissions
  3. Change directory owner: chown -R $USER /path/to/project
```
**Exit Code**: 3

#### Missing Required Dependency
```
ERROR: Required dependency missing
  Node.js version 18.0.0 or higher is required
  Current version: 16.0.0

Resolution:
  1. Update Node.js: https://nodejs.org
  2. Use nvm: nvm install 18
```
**Exit Code**: 4

#### Corrupted Installation
```
ERROR: Installation corrupted
  Expected files missing or invalid:
    - .claude-buddy/buddy-config.json
    - .claude/hooks.json

Resolution:
  1. Repair: claude-buddy install --force
  2. Clean reinstall: claude-buddy uninstall --purge && claude-buddy install
```
**Exit Code**: 5

#### Insufficient Disk Space
```
ERROR: Insufficient disk space
  Required: 50 MB
  Available: 10 MB

Resolution:
  1. Free up disk space
  2. Install to different location with --target
```
**Exit Code**: 30

---

## Signal Handling

### SIGINT (Ctrl+C)
- Gracefully stop installation
- Rollback partial changes
- Display cleanup status
- Exit code: 10

### SIGTERM
- Same as SIGINT
- Suitable for container orchestration

### SIGHUP
- Detach and continue in background (if supported)
- Log to file instead of stdout

---

## Compatibility

### Minimum Requirements
- Node.js: >= 18.0.0
- NPM: >= 8.0.0
- Platform: macOS, Linux, Windows 10+

### Shell Compatibility
- Bash: >= 4.0
- Zsh: >= 5.0
- PowerShell: >= 5.1
- Command Prompt: Windows 10+

### Terminal Features
- Color support: Optional (degrades gracefully)
- Unicode support: Optional (uses ASCII fallback)
- Interactive prompts: Optional (--non-interactive flag)

---

*This CLI interface contract defines the complete command-line experience for Claude Buddy installation.*
