# Deployment Prerequisites

Prerequisites and requirements for deploying Claude Buddy to development and production environments.

## System Requirements

### Operating Systems

**Supported**:
- macOS 10.15+ (Catalina or later)
- Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+, Alpine 3.14+)
- Windows 10/11 (with WSL2 recommended)

**Not Supported**:
- Windows without WSL2 (Python hook execution limited)

### Software Dependencies

#### Required

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| Claude Code CLI | Latest | Runtime environment |
| Python | 3.8+ | Hook execution |
| uv | Latest | Python package isolation |
| Git | 2.20+ | Version control |

#### Optional

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| Task | 3.0+ | Build automation |
| black | 22.0+ | Python formatting |
| prettier | 2.0+ | JS/TS formatting |
| Node.js | 14+ | JavaScript tooling |

### Hardware Requirements

| Environment | CPU | RAM | Disk |
|------------|-----|-----|------|
| Development | 2+ cores | 4GB | 500MB |
| CI/CD | 2+ cores | 2GB | 1GB |
| Production | N/A | N/A | N/A |

**Note**: Claude Buddy runs client-side only, no production server deployment required.

## Network Requirements

### Internet Connectivity

**Required for**:
- Initial Claude Code installation
- Python package downloads (uv)
- Optional: NPM package installation

**Not required for**:
- Runtime operation
- Hook execution
- Command processing

**Firewall**:
- No inbound ports required
- Outbound HTTPS (443) for downloads only

## Access Requirements

### File System Permissions

**Read Access Required**:
```
.claude/
.claude-buddy/
directive/
specs/ (if exists)
docs/ (if exists)
[project files]
```

**Write Access Required**:
```
.claude-buddy/buddy-config.json
directive/foundation.md
specs/
docs/
[generated files]
```

**No Access Required**:
```
/system-directories
/other-users
```

### Git Permissions

**Required Git Operations**:
- `git status`
- `git diff`
- `git log`
- `git add`
- `git commit`

**Optional Git Operations**:
- `git push` (if auto-push enabled)
- `git tag` (for versioning)

**Not Required**:
- Force push capabilities
- Branch deletion rights
- Repository administration

## User Accounts

### Development Environment

**Required**:
- Local user account with project access
- Git configured with name and email:
  ```bash
  git config user.name "Your Name"
  git config user.email "your.email@example.com"
  ```

**Not Required**:
- Administrator/sudo access (except for optional tool installation)
- Special security clearances
- External service accounts

### CI/CD Environment

**Required**:
- CI service account with repository access
- Read/write permissions to project files
- Git commit permissions

**Recommended**:
- Separate CI user for audit trail
- Limited scope tokens
- Environment variable support

## Integration Requirements

### Claude Code Integration

**Required**:
- Claude Code CLI installed and configured
- Valid Anthropic account
- Active Claude subscription (as per Claude Code requirements)

**Configuration**:
```json
{
  "hooks": {
    "enabled": true
  }
}
```

### Git Integration

**Required**:
- Initialized git repository
- At least one commit
- Valid remote configured (for push operations)

**Setup**:
```bash
git init
git remote add origin <repository-url>
```

### Optional Integrations

**Black (Python Formatting)**:
```bash
pip install black
# or
uv pip install black
```

**Prettier (JS/TS Formatting)**:
```bash
npm install -g prettier
# or per-project
npm install --save-dev prettier
```

## Security Requirements

### File Protection

**Protected Patterns** (default):
```
.env*
*.key
*.pem
*.p12
secrets.*
credentials.*
id_rsa*
.aws/*
.ssh/*
```

**Verification**:
```bash
# Test file protection active
echo '{"tool":"Write","parameters":{"file_path":".env","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# Expected: {"approved": false}
```

### Command Validation

**Blocked Commands** (default):
```
rm -rf /
sudo rm
:(){ :|:& };:  # Fork bomb
dd if=.* of=/dev
mkfs.*
chmod -R 777
```

**Verification**:
```bash
# Test command validation active
echo '{"tool":"Bash","parameters":{"command":"rm -rf /"}}' | \
  uv run --no-project python .claude/hooks/command-validator.py

# Expected: {"approved": false}
```

## Environment Setup

### Development Environment

**Checklist**:
- [ ] Python 3.8+ installed
- [ ] uv installed
- [ ] Git configured
- [ ] Claude Code CLI installed
- [ ] .claude/ directory copied to project
- [ ] .claude-buddy/ directory copied to project
- [ ] Hooks enabled in settings.local.json
- [ ] buddy-config.json configured

**Verification**:
```bash
python --version  # >= 3.8
uv --version
git --version  # >= 2.20
claude --version
test -d .claude && echo "Claude dir exists"
test -d .claude-buddy && echo "Claude Buddy dir exists"
test -f .claude/settings.local.json && echo "Settings exist"
test -f .claude-buddy/buddy-config.json && echo "Config exists"
```

### CI/CD Environment

**Additional Requirements**:
- [ ] Non-interactive mode support
- [ ] Environment variable configuration
- [ ] Artifact storage for generated docs
- [ ] Git credentials configured

**Example GitHub Actions**:
```yaml
name: Claude Buddy CI

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

      - name: Validate configuration
        run: |
          python -m json.tool .claude-buddy/buddy-config.json
          test -d .claude-buddy/personas
          test -d .claude-buddy/templates
```

## Storage Requirements

### Disk Space

**Minimum**:
```
.claude/           : 500KB (commands, agents, hooks)
.claude-buddy/     : 2MB (personas, templates, context)
directive/         : 100KB (foundation document)
docs/              : 1-5MB (generated documentation)
specs/             : Variable (per feature)
```

**Recommended**:
- Development: 10MB free for growth
- CI/CD: 50MB for artifacts
- Logs: 100MB (if logging enabled)

### File Limits

**File Count**:
- Personas: ~12 files
- Templates: ~12 files (3 foundation types × 4 templates)
- Context: ~10 files
- Commands: ~7 files
- Agents: ~7 files
- Hooks: ~3 files

**Total**: ~50 configuration files + generated content

## Validation Checklist

### Pre-Deployment Checklist

**Configuration**:
- [ ] buddy-config.json valid JSON
- [ ] hooks.json valid JSON and registered
- [ ] settings.local.json has hooks enabled
- [ ] Foundation type matches available templates

**Files**:
- [ ] All persona files present in .claude-buddy/personas/
- [ ] All template files present for foundation type
- [ ] All command files present in .claude/commands/buddy/
- [ ] All agent files present in .claude/agents/
- [ ] All hook scripts present in .claude/hooks/

**Permissions**:
- [ ] Hook scripts executable (or Python can run them)
- [ ] Configuration files readable
- [ ] Output directories writable (directive/, docs/, specs/)

**Testing**:
- [ ] Hook test passes
- [ ] Command test passes
- [ ] Foundation creation works
- [ ] Documentation generation works

### Post-Deployment Verification

```bash
# Run validation script
cat > validate-deployment.sh << 'EOF'
#!/bin/bash
echo "Validating Claude Buddy deployment..."

# Check Python
python --version || exit 1

# Check uv
uv --version || exit 1

# Check directory structure
test -d .claude || (echo "Missing .claude/" && exit 1)
test -d .claude-buddy || (echo "Missing .claude-buddy/" && exit 1)

# Check configuration files
test -f .claude-buddy/buddy-config.json || exit 1
test -f .claude/hooks.json || exit 1

# Validate JSON
python -m json.tool .claude-buddy/buddy-config.json >/dev/null || exit 1
python -m json.tool .claude/hooks.json >/dev/null || exit 1

# Test hooks
echo '{"tool":"Write","parameters":{"file_path":"test.md","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py >/dev/null || exit 1

echo "✓ All checks passed"
EOF

chmod +x validate-deployment.sh
./validate-deployment.sh
```

## Troubleshooting Prerequisites

### Issue: Python Not Found

```bash
# Check Python installation
which python python3

# Install Python if needed
# macOS
brew install python@3.10

# Ubuntu/Debian
sudo apt-get install python3 python3-pip

# Verify
python3 --version
```

### Issue: uv Not Found

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH if needed
export PATH="$HOME/.cargo/bin:$PATH"

# Verify
uv --version
```

### Issue: Permission Denied

```bash
# Check file permissions
ls -la .claude/hooks/*.py

# Make executable if needed
chmod +x .claude/hooks/*.py

# Or run with python explicitly (no +x needed)
python .claude/hooks/file-guard.py
```

## Related Documentation

- [Development Setup](./development-setup.md) - Detailed setup guide
- [Deployment Configuration](./deployment-configuration.md) - Configuration options
- [Deployment Deployment](./deployment-deployment.md) - Deployment procedures
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - Problem resolution
