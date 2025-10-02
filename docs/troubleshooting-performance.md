# Performance Troubleshooting

Solutions for Claude Buddy performance issues.

## Performance Targets

| Operation | Target | Acceptable | Slow |
|-----------|--------|------------|------|
| Hook validation | < 1s | < 5s | > 10s |
| Hook formatting | < 5s | < 20s | > 30s |
| Persona activation | < 2s | < 5s | > 10s |
| Foundation creation | < 1min | < 3min | > 5min |
| Documentation generation | < 3min | < 10min | > 15min |

## Hook Performance Issues

### Slow File Protection Hook

**Symptoms**: Write/Edit operations take > 5 seconds

**Diagnosis**:
```bash
time echo '{"tool":"Write","parameters":{"file_path":"test.md","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py
```

**Solutions**:

1. **Reduce pattern count**:
```json
{
  "file_protection": {
    "additional_patterns": []  // Remove unnecessary patterns
  }
}
```

2. **Optimize patterns**:
```python
# Use specific patterns instead of broad ones
# SLOW: ".*secret.*"
# FAST: "config/secrets\\.yaml"
```

3. **Add exclusions**:
```json
{
  "file_protection": {
    "exclude_patterns": [
      "node_modules/",
      "vendor/",
      "large-directory/"
    ]
  }
}
```

### Slow Command Validation

**Symptoms**: Bash commands take > 5 seconds

**Solutions**:

1. **Reduce dangerous pattern count**
2. **Increase timeout if patterns necessary**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"timeout": 20}]
      }
    ]
  }
}
```

### Slow Auto-Formatter

**Symptoms**: Formatting takes > 30 seconds

**Solutions**:

1. **Disable for large files**:
```json
{
  "auto_formatting": {
    "max_file_size_kb": 500  // Skip files > 500KB
  }
}
```

2. **Exclude directories**:
```json
{
  "auto_formatting": {
    "exclude_patterns": [
      "node_modules/",
      "generated/",
      "dist/"
    ]
  }
}
```

3. **Disable specific formatters**:
```json
{
  "auto_formatting": {
    "tools": {
      "black": false  // Disable if slow
    }
  }
}
```

## Persona Performance Issues

### Slow Persona Activation

**Symptoms**: `/buddy:persona` takes > 10 seconds

**Solutions**:

1. **Reduce max active personas**:
```json
{
  "personas": {
    "auto_activation": {
      "max_active_personas": 2  // Instead of 3
    }
  }
}
```

2. **Increase confidence threshold**:
```json
{
  "personas": {
    "auto_activation": {
      "confidence_threshold": 0.8  // Instead of 0.7
    }
  }
}
```

3. **Use manual activation for speed**:
```bash
/buddy:persona security - Question  # Faster than auto-activation
```

## Documentation Generation Issues

### Slow Documentation Generation

**Symptoms**: `/buddy:docs` takes > 15 minutes

**Diagnosis**:
```bash
# Check project size
find . -name "*.py" -o -name "*.js" -o -name "*.ts" | wc -l

# Profile execution
time /buddy:docs
```

**Solutions**:

1. **Exclude large directories**:
```bash
# In template analysis commands
find . -name "*.py" -not -path "*/node_modules/*" -not -path "*/vendor/*"
```

2. **Limit analysis depth**:
```bash
# Use maxdepth in find commands
find . -maxdepth 3 -name "*.py"
```

3. **Generate incrementally**:
```bash
# Generate specific sections only
# (Would require template modifications)
```

## System Resource Issues

### High Memory Usage

**Symptoms**: System running out of memory

**Solutions**:

1. **Process files in batches**
2. **Reduce concurrent operations**
3. **Clear logs regularly**:
```bash
rm -rf .claude-buddy/logs/*.log
```

### High CPU Usage

**Symptoms**: CPU at 100% during operations

**Solutions**:

1. **Reduce hook complexity**
2. **Disable auto-formatting**:
```json
{
  "features": {
    "auto_formatting": false
  }
}
```

3. **Use simpler patterns**

## Best Practices

### Optimize Configuration

```json
{
  "file_protection": {
    "enabled": true,
    "additional_patterns": [],  // Only add if necessary
    "exclude_patterns": ["node_modules/", "vendor/"]
  },
  "command_validation": {
    "enabled": true,
    "additional_dangerous_patterns": []  // Only add if necessary
  },
  "auto_formatting": {
    "enabled": true,
    "exclude_patterns": ["node_modules/", "dist/", "build/"]
  },
  "personas": {
    "auto_activation": {
      "confidence_threshold": 0.75,  // Higher = faster
      "max_active_personas": 2  // Lower = faster
    }
  }
}
```

### Monitor Performance

```bash
# Create performance monitoring script
cat > monitor-performance.sh << 'EOF'
#!/bin/bash

echo "=== Hook Performance ==="
time echo '{"tool":"Write","parameters":{"file_path":"test.md","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py >/dev/null

echo ""
echo "=== Command Validation ==="
time echo '{"tool":"Bash","parameters":{"command":"ls"}}' | \
  uv run --no-project python .claude/hooks/command-validator.py >/dev/null

echo ""
echo "=== Project Size ==="
echo "Files: $(find . -type f | wc -l)"
echo "Python: $(find . -name "*.py" | wc -l)"
EOF

chmod +x monitor-performance.sh
./monitor-performance.sh
```

## Related Documentation

- [Deployment Monitoring](./deployment-monitoring.md) - Monitoring setup
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - General issues
- [Development Debugging](./development-debugging.md) - Debugging guide
