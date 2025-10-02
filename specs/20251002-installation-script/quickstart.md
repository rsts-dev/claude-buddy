# Claude Buddy Installation Quickstart Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-02
**Related**: [spec.md](./spec.md), [plan.md](./plan.md)

---

## Prerequisites

Before installing Claude Buddy, ensure you have:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org))
- **NPM** >= 8.0.0 (included with Node.js)
- **Write permissions** to your project directory

**Optional (for full functionality)**:
- **UV** package manager ([Install Guide](https://docs.astral.sh/uv/))
- **Python** 3.8+ ([Download](https://python.org))
- **Git** 2.0+ ([Download](https://git-scm.com))

---

## Installation Methods

### 1. Global Installation (Recommended)

Install Claude Buddy globally to use across all projects:

```bash
npm install -g claude-buddy
```

Then install into your project:

```bash
cd /path/to/your/project
claude-buddy install
```

### 2. Project-Specific Installation

Install as a dev dependency in your project:

```bash
cd /path/to/your/project
npm install --save-dev claude-buddy
npx claude-buddy install
```

### 3. One-Time Installation (No Install)

Use npx without installing:

```bash
cd /path/to/your/project
npx claude-buddy install
```

---

## Quick Start: Fresh Installation

### Step 1: Install Claude Buddy

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run installation
claude-buddy install
```

**Expected Output**:
```
🔧 Claude Buddy Installation v1.0.0

📍 Target: /path/to/your/project
🔍 Checking system requirements...
  ✓ Node.js 18.0.0
  ✓ UV 0.1.0
  ✓ Python 3.11.0
  ✓ Git 2.30.0

⚙️ Installing components...
  ✓ Framework configuration
  ✓ Document templates
  ✓ AI personas
  ✓ Slash commands
  ✓ Python hooks

✅ Installation complete!

📦 Version: 1.0.0
📍 Location: /path/to/your/project/.claude-buddy
⏱️  Duration: 3.2s

Next steps:
  1. Run: claude-buddy verify
  2. Create foundation: /buddy:foundation
  3. Create first spec: /buddy:spec
```

### Step 2: Verify Installation

```bash
claude-buddy verify
```

**Expected Output**:
```
✅ Claude Buddy v1.0.0 is correctly installed

Installation Status:
  ✓ Framework files present
  ✓ Configuration valid
  ✓ Hooks registered
  ✓ Templates available
  ✓ Personas loaded

Enabled Features:
  ✓ Slash commands (/buddy:*)
  ✓ Python safety hooks
  ✓ Document generation
  ✓ AI personas

Everything is working correctly!
```

### Step 3: Create Project Foundation

In your Claude Code session:

```
/buddy:foundation
```

Follow the interactive prompts to create your project foundation document.

### Step 4: Start Using Claude Buddy

Create your first feature specification:

```
/buddy:spec

Describe your feature: "Add user authentication with JWT tokens"
```

---

## Common Installation Scenarios

### Scenario 1: Missing UV (Hooks Disabled)

If UV is not installed, hooks will be skipped with a warning:

```
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

✅ Installation complete with partial functionality

💡 To enable hooks, install UV:
   curl -LsSf https://astral.sh/uv/install.sh | sh

   Then run: claude-buddy verify
```

**To enable hooks later**:
1. Install UV: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. Run: `claude-buddy verify` (will detect UV and enable hooks)

### Scenario 2: Preview Before Installing (Dry-Run)

See what will be installed without making changes:

```bash
claude-buddy install --dry-run
```

**Output**:
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
  ✓ hooks (15 files)

Would create configuration:
  ✓ .claude-buddy/install-metadata.json
  ✓ .claude-buddy/buddy-config.json

Installation would complete successfully.
```

### Scenario 3: Verbose Installation (Detailed Output)

See detailed installation steps:

```bash
claude-buddy install --verbose
```

**Output** (excerpt):
```
[DEBUG] Detecting platform: darwin
[DEBUG] Node version check: 18.0.0 >= 18.0.0 ✓
[DEBUG] Checking UV installation: /usr/local/bin/uv
[VERBOSE] Creating directory: .claude-buddy
[VERBOSE] Creating directory: .claude-buddy/personas
[VERBOSE] Copying file: templates/spec.md -> .claude-buddy/templates/default/spec.md
[VERBOSE] Setting permissions: .claude/hooks/command-validator.py (755)
...
```

---

## Updating Existing Installation

### Check Current Version

```bash
claude-buddy verify
```

### Update to Latest Version

```bash
# Update the package
npm update -g claude-buddy

# Run update in your project
cd /path/to/your/project
claude-buddy update
```

**Expected Output**:
```
🔄 Updating Claude Buddy from v1.0.0 to v1.1.0

🔍 Detecting user customizations...
  Found 3 customizations to preserve:
    • .claude-buddy/personas/custom-reviewer.md
    • .claude-buddy/personas/custom-architect.md
    • .claude-buddy/buddy-config.json (modified)

💾 Creating backup...
  Backup saved: .claude-buddy/backup-2025-10-02T12-00-00Z/

⚙️ Updating framework files...
  ✓ Updated 45 files
  🔒 Preserved 3 customizations

✅ Update complete!

📦 Version: 1.1.0
⏱️  Duration: 8.5s
```

### Force Update (Overwrite Customizations)

```bash
claude-buddy update --force
```

**Warning**: This will overwrite all customizations. Use with caution!

---

## Uninstalling Claude Buddy

### Standard Uninstall (Preserve Customizations)

```bash
claude-buddy uninstall
```

**Interactive Prompt**:
```
⚠️  Claude Buddy Uninstallation

This will remove Claude Buddy from: /path/to/your/project

The following will be removed:
  • Framework files (.claude-buddy, .claude)
  • Slash commands and agents
  • Hook scripts

The following will be preserved:
  • User customizations (3 files)
  • Custom personas (2 files)
  • Project specifications (specs/)

Are you sure you want to uninstall? (y/N): y
```

**Output**:
```
✅ Claude Buddy successfully uninstalled

Removed:
  • 67 framework files
  • 7 directories

Preserved:
  • 5 user customizations
  • Backup: .claude-buddy-preserved-2025-10-02/

⏱️  Duration: 2.3s

To restore preserved files:
  cp -r .claude-buddy-preserved-2025-10-02/* .
```

### Complete Purge (Remove Everything)

```bash
claude-buddy uninstall --purge
```

**Warning Prompt**:
```
⚠️  WARNING: Complete Purge

This will PERMANENTLY remove ALL Claude Buddy files including:
  • Framework files
  • User customizations
  • Custom personas
  • All configurations

This action CANNOT be undone (even with backup).

Type 'PURGE' to confirm complete removal: PURGE
```

---

## Configuration Files

After installation, you'll have:

### `.claude-buddy/` Directory Structure
```
.claude-buddy/
├── buddy-config.json          # Framework configuration
├── install-metadata.json      # Installation metadata
├── personas/                  # AI persona definitions
│   ├── architect.md
│   ├── reviewer.md
│   ├── security.md
│   └── ...
└── templates/                 # Document templates
    ├── default/
    │   ├── spec.md
    │   ├── plan.md
    │   ├── tasks.md
    │   └── docs.md
    └── ...
```

### `.claude/` Directory Structure
```
.claude/
├── hooks.json                 # Hook registration
├── hooks/                     # Python safety hooks
│   ├── command-validator.py
│   ├── file-guard.py
│   └── ...
├── commands/                  # Slash commands
│   └── buddy/
│       ├── commit.md
│       ├── spec.md
│       ├── plan.md
│       └── ...
└── agents/                    # Specialized agents
    ├── spec-writer.md
    ├── plan-writer.md
    └── ...
```

### `directive/` Directory
```
directive/
└── foundation.md              # Project foundation document
```

---

## Available Slash Commands

After installation, you can use these slash commands in Claude Code:

- `/buddy:foundation` - Create or update project foundation
- `/buddy:spec` - Generate feature specification
- `/buddy:plan` - Create implementation plan from spec
- `/buddy:tasks` - Generate task breakdown from plan
- `/buddy:docs` - Generate project documentation
- `/buddy:commit` - Create professional git commits
- `/buddy:persona` - Activate specialized AI personas

**Example Usage**:
```
User: /buddy:spec
Claude: I'll help you create a feature specification. Please describe the feature you want to build.

User: Add user authentication with JWT tokens

Claude: [Creates detailed specification in specs/YYYYMMDD-user-authentication/spec.md]
```

---

## Troubleshooting

### Issue: Permission Denied

**Error**:
```
✗ Error: Permission denied when creating .claude-buddy/
```

**Solutions**:
1. Check directory permissions:
   ```bash
   ls -la /path/to/your/project
   ```

2. Change directory ownership:
   ```bash
   sudo chown -R $USER /path/to/your/project
   ```

3. Run with appropriate permissions:
   ```bash
   sudo claude-buddy install
   ```

### Issue: Node.js Version Too Old

**Error**:
```
✗ Error: Node.js version 18.0.0 or higher is required
  Current version: 16.0.0
```

**Solutions**:
1. Update Node.js: Visit [nodejs.org](https://nodejs.org)

2. Use nvm to install latest version:
   ```bash
   nvm install 18
   nvm use 18
   ```

### Issue: UV Not Found (Hooks Disabled)

**Warning**:
```
⚠ UV not found. Hook functionality will be disabled.
```

**Solutions**:
1. Install UV:
   ```bash
   # Unix/macOS
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

2. Verify installation works:
   ```bash
   claude-buddy verify
   ```

### Issue: Corrupted Installation

**Error**:
```
✗ Error: Installation corrupted
  Expected files missing or invalid
```

**Solutions**:
1. Repair installation:
   ```bash
   claude-buddy install --force
   ```

2. Complete reinstall:
   ```bash
   claude-buddy uninstall --purge
   claude-buddy install
   ```

### Issue: Interrupted Installation

**Scenario**: Installation was interrupted (Ctrl+C, network issue, etc.)

**Solutions**:
1. Claude Buddy will detect the interrupted transaction:
   ```
   ⚠ Interrupted transaction detected. What would you like to do?
     1. Rollback and retry
     2. Resume from last checkpoint
     3. Abort
   ```

2. Choose option based on your situation:
   - **Rollback and retry**: Safest option, starts fresh
   - **Resume**: Continue from where it stopped
   - **Abort**: Cancel and fix issues manually

---

## Getting Help

### Command Help

```bash
# General help
claude-buddy --help

# Command-specific help
claude-buddy install --help
claude-buddy update --help
claude-buddy uninstall --help
```

### Verbose Logging

For troubleshooting, enable verbose mode:

```bash
claude-buddy install --verbose
```

Or set environment variable:

```bash
export CLAUDE_BUDDY_VERBOSE=true
claude-buddy install
```

### Check Installation Logs

```bash
cat .claude-buddy/install.log
```

### Version Information

```bash
claude-buddy --version
```

---

## Next Steps After Installation

1. **Create Foundation Document**:
   ```
   /buddy:foundation
   ```

2. **Create Your First Specification**:
   ```
   /buddy:spec
   ```

3. **Generate Implementation Plan**:
   ```
   /buddy:plan
   ```

4. **Break Down Into Tasks**:
   ```
   /buddy:tasks
   ```

5. **Generate Documentation**:
   ```
   /buddy:docs
   ```

---

## Environment Variables

Customize installation behavior:

```bash
# Enable verbose logging
export CLAUDE_BUDDY_VERBOSE=true

# Disable color output
export CLAUDE_BUDDY_NO_COLOR=true

# Set custom installation directory
export CLAUDE_BUDDY_HOME=/custom/path

# Set custom config file location
export CLAUDE_BUDDY_CONFIG=/path/to/config.json
```

---

## CI/CD Integration

For automated installations in CI/CD pipelines:

```bash
# Non-interactive installation
claude-buddy install --non-interactive --quiet

# Check exit code
if [ $? -eq 0 ]; then
  echo "Installation successful"
else
  echo "Installation failed"
  exit 1
fi
```

**Example GitHub Actions**:
```yaml
- name: Install Claude Buddy
  run: |
    npm install -g claude-buddy
    claude-buddy install --non-interactive --quiet
```

**Example GitLab CI**:
```yaml
install_claude_buddy:
  script:
    - npm install -g claude-buddy
    - claude-buddy install --non-interactive --quiet
```

---

## Configuration File (.claude-buddy-rc.json)

Create a configuration file to set installation defaults:

```json
{
  "installDefaults": {
    "skipHooks": false,
    "nonInteractive": false,
    "verbose": false,
    "preserveCustomizations": true
  },
  "components": {
    "hooks": "auto",
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

**Location Options**:
1. Project directory: `/path/to/project/.claude-buddy-rc.json`
2. User home: `~/.claude-buddy-rc.json`

**Precedence**: Command-line flags > Project config > User config > Defaults

---

## FAQ

### Q: Can I install Claude Buddy in an existing project?
**A**: Yes! Claude Buddy works with existing projects and won't interfere with your current setup.

### Q: Will installation modify my code?
**A**: No. Claude Buddy only creates new directories (`.claude-buddy/`, `.claude/`, `directive/`) and doesn't modify existing code.

### Q: Can I customize personas and templates?
**A**: Yes! You can create custom personas in `.claude-buddy/personas/` and custom templates. They will be preserved during updates.

### Q: How do I disable hooks?
**A**: Use `--skip-hooks` flag:
```bash
claude-buddy install --skip-hooks
```

### Q: Can I install in a monorepo?
**A**: Yes! Install Claude Buddy in each package directory, or once at the root with custom configuration.

### Q: How do I upgrade Claude Buddy?
**A**: Update the npm package and run update:
```bash
npm update -g claude-buddy
claude-buddy update
```

### Q: Is internet connection required?
**A**: Only for initial npm installation. The installation script itself works offline once the package is downloaded.

---

## Additional Resources

- **Documentation**: [Claude Buddy Docs](https://github.com/your-repo/docs)
- **Examples**: [Example Projects](https://github.com/your-repo/examples)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-repo/issues)
- **Community**: [Discussions](https://github.com/your-repo/discussions)

---

*Happy building with Claude Buddy!* 🤖
