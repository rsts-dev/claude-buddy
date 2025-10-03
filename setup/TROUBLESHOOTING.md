# Troubleshooting Guide

> Solutions for common issues with Claude Buddy installation

## Table of Contents

- [Installation Issues](#installation-issues)
- [Permission Problems](#permission-problems)
- [Dependency Issues](#dependency-issues)
- [Update Problems](#update-problems)
- [Configuration Issues](#configuration-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Advanced Debugging](#advanced-debugging)

---

## Installation Issues

### Installation fails immediately

**Symptom**: Installation exits with error before starting

**Possible Causes**:
- Node.js version too old
- Insufficient permissions
- Corrupted npm cache

**Solutions**:

```bash
# Check Node.js version (must be >= 18.0.0)
node --version

# Update Node.js if needed
nvm install 18
nvm use 18

# Clear npm cache
npm cache clean --force

# Retry installation
claude-buddy install
```

### Installation hangs or freezes

**Symptom**: Installation appears to hang with no output

**Possible Causes**:
- Network connectivity issues
- File system locks
- Dependency resolution problems

**Solutions**:

```bash
# Run with verbose logging to see where it's stuck
claude-buddy install --verbose

# Kill any hung processes
pkill -f claude-buddy

# Remove lock files
rm -f .claude-buddy/install.lock

# Retry with timeout
timeout 60s claude-buddy install
```

### Files not being created

**Symptom**: Installation completes but directories are empty

**Possible Causes**:
- Permission issues
- Disk space full
- Antivirus blocking file creation

**Solutions**:

```bash
# Check disk space
df -h .

# Check permissions
ls -la .claude-buddy

# Run with elevated permissions (if needed)
sudo claude-buddy install

# Disable antivirus temporarily (Windows)
# Then retry installation
```

---

## Permission Problems

### Permission denied errors

**Symptom**: `EACCES: permission denied` errors during installation

**Solution 1: Change directory ownership**

```bash
# Make yourself the owner
sudo chown -R $USER:$USER /path/to/project

# Retry installation
claude-buddy install
```

**Solution 2: Use sudo (not recommended)**

```bash
# Only if changing ownership doesn't work
sudo claude-buddy install
```

**Solution 3: Install in user directory**

```bash
# Install in a directory you own
mkdir ~/my-project
cd ~/my-project
claude-buddy install
```

### Cannot write to .claude-buddy directory

**Symptom**: Installation fails when creating `.claude-buddy` directory

**Solutions**:

```bash
# Check if directory already exists with wrong permissions
ls -la .claude-buddy

# Remove and recreate with correct permissions
rm -rf .claude-buddy
claude-buddy install

# Or fix permissions
chmod 755 .claude-buddy
chmod -R 644 .claude-buddy/*
```

### Hook scripts not executable

**Symptom**: Hooks installed but not executable (Unix only)

**Solutions**:

```bash
# Make hook scripts executable
chmod +x .claude/hooks/*.py

# Or use the verify command to fix
claude-buddy verify --fix
```

---

## Dependency Issues

### UV not found but required

**Symptom**: `UV package manager not found` warning

**Solutions**:

```bash
# Install UV (Unix/macOS)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install UV (Windows PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Add UV to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Verify UV installation
uv --version

# Retry Claude Buddy installation
claude-buddy install
```

### Python version mismatch

**Symptom**: `Python 3.8+ required` error

**Solutions**:

```bash
# Check Python version
python3 --version

# Install Python 3.11 (recommended)
# macOS with Homebrew
brew install python@3.11

# Ubuntu/Debian
sudo apt install python3.11

# Update alternatives (Linux)
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Retry installation
claude-buddy install
```

### Git not available

**Symptom**: `Git not found` warning (optional dependency)

**Solutions**:

```bash
# Install Git
# macOS
brew install git

# Ubuntu/Debian
sudo apt install git

# Windows
# Download from https://git-scm.com

# Verify Git installation
git --version

# Retry Claude Buddy installation
claude-buddy install
```

### Hooks installation skipped

**Symptom**: Hooks skipped due to missing UV or Python

**Solutions**:

```bash
# 1. Install missing dependencies (see above)

# 2. Force hook installation
claude-buddy install --force

# 3. Or accept partial installation
# Core functionality works without hooks
# Install hooks later when dependencies are available
```

---

## Update Problems

### Update overwrites customizations

**Symptom**: Custom personas or configurations are replaced

**Solutions**:

```bash
# Use preserve-all flag
claude-buddy update --preserve-all

# Or use merge strategy for configs
claude-buddy update --merge-config

# Check what will be preserved (dry-run)
claude-buddy update --dry-run
```

### Update fails with version conflict

**Symptom**: `Version conflict detected` error

**Solutions**:

```bash
# Check current version
claude-buddy verify

# Force update to specific version
npm install -g claude-buddy@latest
claude-buddy install --force

# Or clean install
claude-buddy uninstall --purge
claude-buddy install
```

### Backup not created before update

**Symptom**: No backup available after failed update

**Solutions**:

```bash
# Enable manual backup before update
cp -r .claude-buddy .claude-buddy-backup
claude-buddy update

# Or use dry-run to check changes first
claude-buddy update --dry-run
```

---

## Configuration Issues

### Configuration file corrupted

**Symptom**: `Invalid JSON in buddy-config.json` error

**Solutions**:

```bash
# Validate JSON manually
cat .claude-buddy/buddy-config.json | jq .

# Restore from backup
cp .claude-buddy/backup-*/buddy-config.json .claude-buddy/

# Or reset to defaults
claude-buddy install --force
```

### Custom configuration not loading

**Symptom**: `.claude-buddy-rc.json` ignored

**Solutions**:

```bash
# Check file location (must be in project or home directory)
ls -la .claude-buddy-rc.json

# Verify JSON syntax
cat .claude-buddy-rc.json | jq .

# Check environment variable override
echo $CLAUDE_BUDDY_CONFIG

# Debug configuration loading
claude-buddy install --verbose
```

### Persona auto-activation not working

**Symptom**: Personas don't activate automatically

**Solutions**:

```bash
# Check persona configuration
cat .claude-buddy/buddy-config.json | jq '.personas'

# Verify persona files exist
ls -la .claude-buddy/personas/

# Enable auto-activation in config
# Edit .claude-buddy/buddy-config.json:
{
  "personas": {
    "autoActivation": true,
    "confidenceThreshold": 0.7
  }
}
```

---

## Platform-Specific Issues

### macOS: Gatekeeper blocks installation

**Symptom**: "Application cannot be opened" warning

**Solutions**:

```bash
# Allow installation from identified developers
sudo spctl --master-disable

# Run installation
claude-buddy install

# Re-enable Gatekeeper
sudo spctl --master-enable
```

### macOS: Rosetta required (Apple Silicon)

**Symptom**: Installation fails on M1/M2 Mac

**Solutions**:

```bash
# Install Rosetta
softwareupdate --install-rosetta

# Or use ARM-native Node.js
arch -arm64 claude-buddy install
```

### Linux: Missing system libraries

**Symptom**: `libstdc++.so.6: cannot open shared object file`

**Solutions**:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"

# Alpine Linux
apk add --no-cache libstdc++ gcc g++ make
```

### Windows: Path too long error

**Symptom**: `ENAMETOOLONG: name too long` error

**Solutions**:

```powershell
# Enable long paths in Windows 10+
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Or install in shorter path
cd C:\Projects
claude-buddy install
```

### Windows: PowerShell execution policy

**Symptom**: Scripts cannot be executed

**Solutions**:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy to allow scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Retry installation
claude-buddy install
```

---

## Advanced Debugging

### Enable verbose logging

```bash
# Environment variable
export CLAUDE_BUDDY_VERBOSE=1
claude-buddy install

# Or use --verbose flag
claude-buddy install --verbose
```

### Enable file logging

```bash
# Log to file
claude-buddy install --log-file .claude-buddy/install.log

# View log
cat .claude-buddy/install.log
```

### Inspect transaction state

```bash
# Check for interrupted transaction
cat .claude-buddy/install-transaction.json

# Manually recover
claude-buddy install --recover

# Or rollback
claude-buddy install --rollback
```

### Debug with strace (Linux)

```bash
# Trace system calls
strace -f -o install.trace claude-buddy install

# Analyze trace
grep -E "open|write|mkdir" install.trace
```

### Test in isolated environment

```bash
# Use Docker for clean test
docker run -it --rm -v $(pwd):/app node:18 bash
cd /app
npm install -g claude-buddy
claude-buddy install
```

---

## Getting Help

If you've tried the solutions above and still experience issues:

### Collect diagnostic information

```bash
# System information
claude-buddy diagnose > diagnostic-report.txt

# Or manually collect
echo "Node version: $(node --version)" > report.txt
echo "NPM version: $(npm --version)" >> report.txt
echo "OS: $(uname -a)" >> report.txt
cat .claude-buddy/install-metadata.json >> report.txt
```

### Report an issue

1. Go to [GitHub Issues](https://github.com/your-org/claude-buddy/issues)
2. Search for existing issues
3. Create a new issue with:
   - Diagnostic report
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages (full stack trace)

### Community support

- **Discussions**: [GitHub Discussions](https://github.com/your-org/claude-buddy/discussions)
- **Discord**: [Join our server](https://discord.gg/claude-buddy)
- **Stack Overflow**: Tag `claude-buddy`

---

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 0 | Success | No action needed |
| 1 | General error | Check error message |
| 2 | User cancellation | Retry if unintended |
| 10 | Environment validation failed | Install required dependencies |
| 20 | Required dependency missing | Install Node.js >= 18.0.0 |
| 30 | Permission denied | Fix directory permissions |
| 40 | Installation corrupted | Run `claude-buddy install --force` |
| 50 | Transaction failed | Check logs, retry with `--recover` |
| 60 | Rollback required | Run `claude-buddy install --rollback` |

---

**Last Updated**: 2025-10-02
**Version**: 2.0.0
