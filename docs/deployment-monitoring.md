# Monitoring and Maintenance

Monitoring, logging, and maintenance procedures for Claude Buddy.

## Logging Configuration

Enable logging in `.claude-buddy/buddy-config.json`:

```json
{
  "logging": {
    "enabled": true,
    "level": "info",
    "file_operations": true,
    "command_executions": true,
    "hook_activities": true
  }
}
```

**Log Levels**:
- `debug`: Detailed diagnostic information
- `info`: General informational messages
- `warning`: Warning messages
- `error`: Error messages
- `critical`: Critical errors

## Monitoring Metrics

### Hook Performance

```bash
# Monitor hook execution times
grep "Execution time" .claude-buddy/logs/*.log

# Expected: < 10s for validation, < 30s for formatting
```

### Operation Success Rate

```bash
# Count blocked operations
grep "Operation blocked" .claude-buddy/logs/*.log | wc -l

# Count successful operations
grep "Operation approved" .claude-buddy/logs/*.log | wc -l
```

### Persona Activation Patterns

```bash
# Most activated personas
grep "Persona activated" .claude-buddy/logs/*.log | \
  awk '{print $NF}' | sort | uniq -c | sort -rn
```

## Health Checks

### Daily Health Check

```bash
#!/bin/bash
# health-check.sh

echo "Claude Buddy Health Check"

# 1. Configuration valid
python -m json.tool .claude-buddy/buddy-config.json >/dev/null && \
  echo "✓ Configuration valid" || echo "✗ Configuration invalid"

# 2. Hooks executable
echo '{"tool":"Write","parameters":{"file_path":"test.md","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py >/dev/null && \
  echo "✓ Hooks working" || echo "✗ Hooks failed"

# 3. Foundation exists
test -f directive/foundation.md && \
  echo "✓ Foundation exists" || echo "✗ Foundation missing"

# 4. Documentation current
test -d docs/ && \
  echo "✓ Documentation exists" || echo "✗ Documentation missing"
```

## Maintenance Tasks

### Weekly Maintenance

```bash
# 1. Review logs for issues
tail -100 .claude-buddy/logs/*.log | grep -i error

# 2. Clean old logs (keep last 30 days)
find .claude-buddy/logs/ -name "*.log" -mtime +30 -delete

# 3. Update documentation if codebase changed significantly
/buddy:docs
```

### Monthly Maintenance

```bash
# 1. Check for framework updates
cd ~/claude-buddy-source
git pull origin main

# 2. Review and update foundation if needed
cat directive/foundation.md
/buddy:foundation  # If updates needed

# 3. Review configuration
cat .claude-buddy/buddy-config.json
# Adjust thresholds, patterns as needed

# 4. Clean old specs
find specs/ -type d -mtime +90 | xargs rm -rf  # Archive old specs
```

## Performance Optimization

### Reduce Hook Latency

```json
{
  "file_protection": {
    "exclude_patterns": [
      "node_modules/",
      "vendor/",
      "large-data-dir/"
    ]
  }
}
```

### Optimize Persona Selection

```json
{
  "personas": {
    "auto_activation": {
      "confidence_threshold": 0.75,  // Higher = faster but less inclusive
      "max_active_personas": 2  // Lower = faster
    }
  }
}
```

## Related Documentation

- [Deployment Configuration](./deployment-configuration.md) - Configuration
- [Troubleshooting Performance](./troubleshooting-performance.md) - Performance issues
