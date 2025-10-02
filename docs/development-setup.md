# Development Environment Setup

This guide walks you through setting up Claude Buddy in your development environment.

## Prerequisites

### Required
- **Claude Code CLI**: Latest version from Anthropic
- **Python**: 3.8 or higher
- **uv**: Universal Python package installer
- **Git**: Any modern version

### Optional
- **Task**: For task automation (`brew install go-task/tap/go-task`)
- **black**: Python code formatter
- **prettier**: JavaScript/TypeScript formatter
- **Node.js**: 14+ (for JavaScript tooling)

## Installation Methods

### Method 1: Manual Setup (Current)

**Step 1: Clone or Download Claude Buddy**

```bash
# If using git
git clone https://github.com/your-org/claude-buddy.git ~/claude-buddy-source

# Or download and extract archive
```

**Step 2: Copy to Your Project**

```bash
cd /path/to/your/project

# Copy Claude configuration
cp -r ~/claude-buddy-source/.claude .

# Copy Claude Buddy framework
cp -r ~/claude-buddy-source/.claude-buddy .

# Copy Taskfile (optional)
cp ~/claude-buddy-source/Taskfile.yml .
```

**Step 3: Install Python Dependencies**

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Test hook execution
uv run --no-project python .claude/hooks/file-guard.py --help
```

**Step 4: Enable Hooks in Claude Code**

Create/edit `.claude/settings.local.json`:
```json
{
  "hooks": {
    "enabled": true
  }
}
```

**Step 5: Initialize Foundation**

```bash
# In Claude Code CLI
/buddy:foundation interactive
```

### Method 2: NPM Installation (Planned)

```bash
# Future installation method
npm install -g claude-buddy
claude-buddy init
```

## Configuration

### 1. Basic Configuration

Edit `.claude-buddy/buddy-config.json`:

```json
{
  "version": "1.0.0",
  "mode": "project",
  "features": {
    "auto_commit": true,
    "safety_hooks": true,
    "auto_formatting": true,
    "personas": true,
    "documentation_generation": true
  }
}
```

### 2. File Protection

Configure protected file patterns:

```json
{
  "file_protection": {
    "enabled": true,
    "additional_patterns": [
      "config/production\\..*",
      "private/.*\\.key$"
    ],
    "whitelist_patterns": [
      "test/fixtures/\\.env\\.test"
    ],
    "strict_mode": false
  }
}
```

### 3. Command Validation

Configure dangerous command blocking:

```json
{
  "command_validation": {
    "enabled": true,
    "block_dangerous": true,
    "warn_performance": true,
    "additional_dangerous_patterns": [
      "kubectl delete namespace production"
    ],
    "whitelist_patterns": [
      "rm -rf dist/",
      "rm -rf build/"
    ]
  }
}
```

### 4. Persona Settings

Configure persona auto-activation:

```json
{
  "personas": {
    "enabled": true,
    "auto_activation": {
      "enabled": true,
      "confidence_threshold": 0.7,
      "max_active_personas": 3,
      "learning_enabled": true,
      "session_memory": true
    }
  }
}
```

## Verification

### Test Hook System

**Test file protection**:
```bash
# In Claude Code
# Try: Write to .env
# Expected: Operation blocked

echo "Testing file protection hook"
```

**Test command validation**:
```bash
# In Claude Code
# Try: Execute dangerous command
# Expected: Command blocked or warned
```

### Test Commands

```bash
# Test persona command
/buddy:persona mentor - Explain how Claude Buddy works

# Expected: Mentor persona activates and provides explanation
```

### Test Foundation Creation

```bash
/buddy:foundation interactive

# Follow prompts to create foundation
# Verify: directive/foundation.md created
```

## Project Structure

After setup, your project should look like:

```
your-project/
├── .claude/
│   ├── commands/buddy/          # Slash commands
│   ├── agents/                  # Agent protocols
│   ├── hooks/                   # Safety hooks (Python)
│   ├── hooks.json               # Hook registration
│   ├── settings.local.json      # User settings
│   └── CLAUDE.md                # Project instructions
│
├── .claude-buddy/
│   ├── personas/                # 12 persona definitions
│   ├── templates/               # Foundation-specific templates
│   │   ├── default/
│   │   ├── jhipster/
│   │   └── mulesoft/
│   ├── context/                 # Optional context libraries
│   │   ├── default/
│   │   ├── jhipster/
│   │   └── mulesoft/
│   └── buddy-config.json        # Main configuration
│
├── directive/
│   └── foundation.md            # Created by /buddy:foundation
│
├── docs/                        # Created by /buddy:docs
│   └── *.md
│
├── specs/                       # Created by /buddy:spec
│   └── YYYYMMDD-feature/
│
├── Taskfile.yml                 # Optional task automation
└── [your project files]
```

## Customization

### Adding Custom Personas

Create `.claude-buddy/personas/custom.md`:

```markdown
# Custom Persona - Your Domain Expert

## Identity & Expertise
- **Role**: Domain specialist
- **Priority Hierarchy**: Domain knowledge → best practices → code quality
- **Specializations**: Your specific domain

## Core Principles
1. Domain-driven design
2. Business logic clarity
...

## Auto-Activation Triggers
### High Confidence (95%+)
- Keywords: "domain", "business logic", [your keywords]
...
```

### Adding Custom Templates

Create `.claude-buddy/templates/custom-foundation/`:

```
templates/custom-foundation/
├── spec.md
├── plan.md
├── tasks.md
└── docs.md
```

Each template follows the same structure as `default/` templates.

### Adding Custom Context

Create `.claude-buddy/context/your-foundation/`:

```
context/your-foundation/
├── framework-guide.md
├── best-practices.md
└── conventions.md
```

## IDE Integration

### VS Code

1. Install Claude Code extension
2. Hooks automatically integrate
3. Commands available via command palette

### Other Editors

Claude Code CLI works from any terminal. Run commands in terminal:

```bash
claude /buddy:persona architect - Design question
```

## Development Workflow

### Daily Workflow

```bash
# Start development session
claude

# Use personas for assistance
/buddy:persona [question]

# Create features
/buddy:spec [feature]
/buddy:plan
/buddy:tasks

# Implement code

# Commit with professional messages
/buddy:commit

# Update docs periodically
/buddy:docs
```

### Feature Development Workflow

```bash
# 1. Define feature
/buddy:spec Add payment processing with Stripe

# 2. Plan implementation
/buddy:plan

# 3. Break into tasks
/buddy:tasks

# 4. Implement following tasks
# [write code]

# 5. Commit incrementally
git add [files]
/buddy:commit

# 6. Update docs when complete
/buddy:docs
```

## Troubleshooting Setup

### Hooks Not Running

**Symptom**: No file protection or command validation

**Checks**:
```bash
# 1. Verify hooks enabled
cat .claude/settings.local.json
# Should show: "hooks": { "enabled": true }

# 2. Verify hooks registered
cat .claude/hooks.json
# Should show PreToolUse and PostToolUse hooks

# 3. Test hook directly
echo '{"tool":"Write","parameters":{"file_path":".env","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# Expected: {"approved": false, ...}

# 4. Check Python and uv installed
python --version  # Should be 3.8+
uv --version      # Should show uv version
```

### Commands Not Found

**Symptom**: `/buddy:` commands not available

**Checks**:
```bash
# 1. Verify command files exist
ls .claude/commands/buddy/
# Should show: persona.md, foundation.md, spec.md, etc.

# 2. Check Claude Code version
claude --version
# Should be latest version

# 3. Restart Claude Code session
```

### Foundation Creation Fails

**Symptom**: `/buddy:foundation` produces errors

**Checks**:
```bash
# 1. Verify directive directory writable
mkdir -p directive
touch directive/test.md
rm directive/test.md

# 2. Check agent file exists
ls .claude/agents/foundation.md

# 3. Check template exists
ls .claude-buddy/templates/foundation.md
```

### Performance Issues

**Symptom**: Hooks or commands slow

**Solutions**:
```bash
# 1. Increase hook timeouts in hooks.json
"timeout": 30  # instead of 10

# 2. Disable unnecessary features
{
  "features": {
    "auto_formatting": false  # If causing delays
  }
}

# 3. Use exclude patterns for large directories
{
  "auto_formatting": {
    "exclude_patterns": [
      "node_modules/",
      "vendor/",
      "large-data-dir/"
    ]
  }
}
```

## Updating Claude Buddy

### Manual Update

```bash
# Get latest version
cd ~/claude-buddy-source
git pull origin main

# Copy updated files (preserving your configs)
cd /path/to/your/project

# Backup your configs
cp .claude-buddy/buddy-config.json buddy-config.backup.json
cp .claude/hooks.json hooks.backup.json

# Update framework (careful not to overwrite configs)
cp -r ~/claude-buddy-source/.claude/commands .claude/
cp -r ~/claude-buddy-source/.claude/agents .claude/
cp -r ~/claude-buddy-source/.claude/hooks .claude/
cp -r ~/claude-buddy-source/.claude-buddy/personas .claude-buddy/
cp -r ~/claude-buddy-source/.claude-buddy/templates .claude-buddy/

# Restore configs if overwritten
cp buddy-config.backup.json .claude-buddy/buddy-config.json
cp hooks.backup.json .claude/hooks.json
```

### NPM Update (Future)

```bash
# Update global package
npm update -g claude-buddy

# Update project
claude-buddy update
```

## Next Steps

After setup:

1. **Create foundation**: `/buddy:foundation interactive`
2. **Generate docs**: `/buddy:docs`
3. **Try personas**: `/buddy:persona mentor - Show me examples`
4. **Start development**: Use spec → plan → tasks workflow

## Related Documentation

- [API Endpoints](./api-endpoints.md) - Command reference
- [API Examples](./api-examples.md) - Real-world usage
- [Development Coding Standards](./development-coding-standards.md) - Best practices
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - Problem resolution
