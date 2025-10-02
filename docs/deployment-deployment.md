# Deployment Procedures

Step-by-step procedures for deploying Claude Buddy.

## Deployment Overview

Claude Buddy deployment involves:
1. Installing prerequisites
2. Copying framework files to project
3. Configuring for environment
4. Verifying installation
5. Creating foundation
6. Generating initial documentation

## Manual Deployment

### Step 1: Prerequisites

```bash
# Verify prerequisites installed
python --version  # >= 3.8
uv --version
git --version  # >= 2.20
claude --version

# Install missing prerequisites
# See deployment-prerequisites.md for installation instructions
```

### Step 2: Copy Framework Files

```bash
# From Claude Buddy source directory
BUDDY_SOURCE=~/claude-buddy-source
PROJECT_DIR=/path/to/your/project

cd $PROJECT_DIR

# Copy Claude configuration
cp -r $BUDDY_SOURCE/.claude .

# Copy Claude Buddy framework
cp -r $BUDDY_SOURCE/.claude-buddy .

# Optional: Copy Taskfile
cp $BUDDY_SOURCE/Taskfile.yml .
```

### Step 3: Configure

```bash
# Enable hooks
cat > .claude/settings.local.json << 'EOF'
{
  "hooks": {
    "enabled": true
  }
}
EOF

# Customize configuration
vi .claude-buddy/buddy-config.json
# Adjust settings for your environment
```

### Step 4: Verify Installation

```bash
# Run verification script
cat > verify-installation.sh << 'EOF'
#!/bin/bash
echo "Verifying Claude Buddy installation..."

# Check directories
test -d .claude || (echo "✗ .claude/ missing" && exit 1)
echo "✓ .claude/ exists"

test -d .claude-buddy || (echo "✗ .claude-buddy/ missing" && exit 1)
echo "✓ .claude-buddy/ exists"

# Check configuration
test -f .claude-buddy/buddy-config.json || (echo "✗ Config missing" && exit 1)
python -m json.tool .claude-buddy/buddy-config.json >/dev/null || (echo "✗ Invalid JSON" && exit 1)
echo "✓ Configuration valid"

# Check hooks
test -f .claude/hooks/file-guard.py || (echo "✗ Hooks missing" && exit 1)
echo "✓ Hooks present"

# Test hook execution
echo '{"tool":"Write","parameters":{"file_path":"test.md","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py >/dev/null || \
  (echo "✗ Hook execution failed" && exit 1)
echo "✓ Hooks executable"

echo "Installation verified successfully!"
EOF

chmod +x verify-installation.sh
./verify-installation.sh
```

### Step 5: Initialize Foundation

```bash
# In Claude Code CLI
/buddy:foundation interactive

# Follow prompts to create foundation
# Verify: directive/foundation.md created
```

### Step 6: Generate Documentation

```bash
/buddy:docs

# Verify: docs/ directory created with all files
ls docs/
```

## Automated Deployment

### Using Task

```yaml
# Taskfile.yml
version: '3'

tasks:
  init:
    desc: Initialize Claude Buddy
    cmds:
      - cp -r /path/to/source/.claude .
      - cp -r /path/to/source/.claude-buddy .
      - echo '{"hooks":{"enabled":true}}' > .claude/settings.local.json
      - ./verify-installation.sh

  verify:
    desc: Verify installation
    cmds:
      - ./verify-installation.sh
```

Run:
```bash
task init
task verify
```

### Using NPM Script

```json
{
  "scripts": {
    "claude:init": "bash scripts/init-claude-buddy.sh",
    "claude:verify": "bash scripts/verify-installation.sh"
  }
}
```

Run:
```bash
npm run claude:init
npm run claude:verify
```

## Team Deployment

### For Existing Project

```bash
# 1. Add Claude Buddy to repository
git clone https://github.com/your-org/claude-buddy.git tmp-buddy
cp -r tmp-buddy/.claude .
cp -r tmp-buddy/.claude-buddy .
rm -rf tmp-buddy

# 2. Create foundation
claude # Start Claude Code
/buddy:foundation interactive

# 3. Generate documentation
/buddy:docs

# 4. Commit to repository
git add .claude .claude-buddy directive/ docs/
git commit -m "chore: add Claude Buddy framework"
git push

# 5. Team members pull changes
# Team member: git pull
# Team member: Enable hooks in their settings.local.json
```

### For New Project

```bash
# 1. Initialize git
git init
git remote add origin <repo-url>

# 2. Add Claude Buddy
# (same as above)

# 3. Initial commit
git add .
git commit -m "chore: initialize project with Claude Buddy"
git push -u origin main

# 4. Team clones and enables
# Team member: git clone <repo-url>
# Team member: cd project && echo '{"hooks":{"enabled":true}}' > .claude/settings.local.json
```

## CI/CD Deployment

### GitHub Actions

```yaml
# .github/workflows/claude-buddy.yml
name: Claude Buddy

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Verify installation
        run: bash verify-installation.sh

      - name: Validate foundation
        run: |
          test -f directive/foundation.md
          grep -q "^## Purpose" directive/foundation.md

  docs:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Generate documentation
        run: |
          # This would require Claude Code CLI in CI
          # Currently: Manual generation recommended
          test -d docs/

      - name: Commit updated docs
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add docs/
          git diff --staged --quiet || git commit -m "docs: update documentation"
          git push || true
```

## Rollback Procedures

### Rollback Configuration

```bash
# If configuration change causes issues

# 1. Restore from backup
cp .claude-buddy/buddy-config.json.backup .claude-buddy/buddy-config.json

# 2. Or restore from git
git checkout HEAD -- .claude-buddy/buddy-config.json

# 3. Verify
python -m json.tool .claude-buddy/buddy-config.json
```

### Rollback Framework

```bash
# If framework update causes issues

# 1. Identify last working version
git log --oneline .claude .claude-buddy | head

# 2. Restore from git
git checkout <commit-hash> -- .claude .claude-buddy

# 3. Verify
./verify-installation.sh
```

## Upgrade Procedures

### Upgrade Framework

```bash
# 1. Backup current installation
cp -r .claude .claude.backup
cp -r .claude-buddy .claude-buddy.backup

# 2. Get latest version
cd ~/claude-buddy-source
git pull origin main

# 3. Update files (careful with configs)
cd /path/to/project
cp -r ~/claude-buddy-source/.claude/commands .claude/
cp -r ~/claude-buddy-source/.claude/agents .claude/
cp -r ~/claude-buddy-source/.claude/hooks .claude/
cp -r ~/claude-buddy-source/.claude-buddy/personas .claude-buddy/
cp -r ~/claude-buddy-source/.claude-buddy/templates .claude-buddy/

# Don't overwrite:
# - .claude-buddy/buddy-config.json (your config)
# - .claude/hooks.json (your hooks config)
# - .claude/settings.local.json (user settings)

# 4. Verify
./verify-installation.sh

# 5. Test
/buddy:persona mentor - Test question
```

## Troubleshooting Deployment

### Issue: Permission Denied

```bash
# Make hooks executable
chmod +x .claude/hooks/*.py

# Or ensure Python can read them
chmod 644 .claude/hooks/*.py
```

### Issue: Invalid Configuration

```bash
# Validate JSON
python -m json.tool .claude-buddy/buddy-config.json

# Fix and retry
vi .claude-buddy/buddy-config.json
```

### Issue: Hooks Not Working

```bash
# Check hooks enabled
cat .claude/settings.local.json

# Should show: {"hooks": {"enabled": true}}

# If not, create it:
cat > .claude/settings.local.json << 'EOF'
{
  "hooks": {
    "enabled": true
  }
}
EOF
```

## Post-Deployment Checklist

- [ ] Prerequisites installed and verified
- [ ] Framework files copied
- [ ] Configuration customized for environment
- [ ] Installation verified
- [ ] Foundation document created
- [ ] Initial documentation generated
- [ ] Hooks tested and working
- [ ] Team members onboarded (if applicable)
- [ ] CI/CD integration configured (if applicable)
- [ ] Backup procedures documented

## Related Documentation

- [Deployment Prerequisites](./deployment-prerequisites.md) - Requirements
- [Deployment Configuration](./deployment-configuration.md) - Configuration options
- [Deployment Monitoring](./deployment-monitoring.md) - Monitoring and maintenance
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - Problem resolution
