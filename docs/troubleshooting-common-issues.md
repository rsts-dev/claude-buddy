# Troubleshooting Common Issues

Quick solutions to common Claude Buddy problems.

## Hooks Not Working

**Symptom**: No file protection or command validation

**Solutions**:

```bash
# 1. Enable hooks in settings
cat > .claude/settings.local.json << 'EOF'
{
  "hooks": {
    "enabled": true
  }
}
EOF

# 2. Verify hook registration
jq .hooks .claude/hooks.json

# 3. Test hook directly
echo '{"tool":"Write","parameters":{"file_path":".env","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# 4. Check Python/uv installed
python --version && uv --version
```

## Commands Not Found

**Symptom**: `/buddy:persona` not recognized

**Solutions**:

```bash
# 1. Verify command files exist
ls .claude/commands/buddy/

# 2. Verify agent files exist
ls .claude/agents/

# 3. Restart Claude Code session

# 4. Check Claude Code version
claude --version
```

## Foundation Creation Fails

**Symptom**: `/buddy:foundation` errors

**Solutions**:

```bash
# 1. Ensure directive/ writable
mkdir -p directive
touch directive/test.md && rm directive/test.md

# 2. Verify agent exists
test -f .claude/agents/foundation.md || echo "Agent missing"

# 3. Try minimal input
/buddy:foundation provided
# Input: "Simple test project"
```

## Documentation Generation Fails

**Symptom**: `/buddy:docs` errors

**Solutions**:

```bash
# 1. Create foundation first
test -f directive/foundation.md || /buddy:foundation interactive

# 2. Verify template exists
FOUNDATION_TYPE=$(grep "^**Foundation Type**:" directive/foundation.md | awk '{print $NF}')
test -f .claude-buddy/templates/$FOUNDATION_TYPE/docs.md || echo "Template missing"

# 3. Ensure docs/ writable
mkdir -p docs
```

## Persona Not Activating

**Symptom**: Expected persona doesn't activate

**Solutions**:

```json
// Lower confidence threshold in buddy-config.json
{
  "personas": {
    "auto_activation": {
      "confidence_threshold": 0.6
    }
  }
}
```

Or use manual activation:
```bash
/buddy:persona security - Review this code
```

## File Protection Too Strict

**Symptom**: Legitimate files blocked

**Solutions**:

```json
// Add to whitelist in buddy-config.json
{
  "file_protection": {
    "whitelist_patterns": [
      "test/fixtures/\\.env\\.test",
      "path/to/safe/file"
    ]
  }
}
```

## Command Blocked Unexpectedly

**Symptom**: Safe command blocked

**Solutions**:

```json
// Add to whitelist in buddy-config.json
{
  "command_validation": {
    "whitelist_patterns": [
      "rm -rf dist/",
      "specific safe command"
    ]
  }
}
```

## Hook Timeout

**Symptom**: Hook exceeds timeout

**Solutions**:

```json
// Increase timeout in hooks.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "timeout": 30  // Increase from 10
          }
        ]
      }
    ]
  }
}
```

## Invalid Configuration

**Symptom**: JSON errors

**Solutions**:

```bash
# Validate JSON
python -m json.tool .claude-buddy/buddy-config.json

# Fix syntax errors, then retry

# Restore from backup if needed
git checkout .claude-buddy/buddy-config.json
```

## Commit Issues

**Symptom**: `/buddy:commit` fails

**Solutions**:

```bash
# 1. Ensure changes staged or modified
git status

# 2. Configure git identity
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 3. Verify agent exists
test -f .claude/agents/git-workflow.md
```

## Quick Fixes

### Reset Configuration

```bash
# Restore default configuration
cp .claude-buddy/buddy-config.json.default .claude-buddy/buddy-config.json
```

### Reinstall Framework

```bash
# Backup configs
cp .claude-buddy/buddy-config.json buddy-config.backup.json

# Reinstall
rm -rf .claude .claude-buddy
# Copy from source again

# Restore config
cp buddy-config.backup.json .claude-buddy/buddy-config.json
```

### Clear Cache (if applicable)

```bash
# Remove logs
rm -rf .claude-buddy/logs/*

# Remove temp files
rm -rf .claude-buddy/tmp/*
```

## Getting Help

### Check Documentation

1. [Development Setup](./development-setup.md)
2. [Development Debugging](./development-debugging.md)
3. [Deployment Prerequisites](./deployment-prerequisites.md)

### Verify Installation

```bash
# Run verification script
bash verify-installation.sh
```

### Enable Debug Logging

```json
{
  "logging": {
    "enabled": true,
    "level": "debug"
  }
}
```

## Related Documentation

- [Development Debugging](./development-debugging.md) - Detailed debugging
- [Troubleshooting Performance](./troubleshooting-performance.md) - Performance issues
- [Troubleshooting FAQ](./troubleshooting-faq.md) - Frequently asked questions
