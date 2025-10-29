# Configuration Migration Guide

**Version**: 2.2.0
**Date**: October 29, 2025
**Breaking Change**: Yes (with backward compatibility)

## Overview

Claude Buddy v2.2.0 migrates configuration from `.claude-buddy/buddy-config.json` to `.claude/hooks.json` (config section). This provides a unified configuration location following Claude Code's native patterns.

## What Changed

### Old Location (Deprecated)
```
.claude-buddy/buddy-config.json
```

### New Location
```
.claude/hooks.json (config section)
```

## Migration Status

### ✅ Automatically Handled

All Python hooks have been updated to check both locations:
1. First: `.claude/hooks.json` (preferred)
2. Fallback: `.claude-buddy/buddy-config.json` (legacy)
3. Default: Built-in sensible defaults

**No action required** - configuration will work from either location.

### Files Updated

#### Python Hooks (3 files)
- [.claude/hooks/file-guard.py](.claude/hooks/file-guard.py:60-103) - Updated `load_config()`
- [.claude/hooks/command-validator.py](.claude/hooks/command-validator.py:64-110) - Updated `load_config()`
- [.claude/hooks/auto-formatter.py](.claude/hooks/auto-formatter.py:98-142) - Updated `load_config()`

#### Agents (1 file)
- [.claude/agents/git-workflow.md](.claude/agents/git-workflow.md:322-329) - Updated documentation

#### Commands (1 file)
- [.claude/commands/buddy/commit.md](.claude/commands/buddy/commit.md:47-53) - Updated documentation

#### Setup Package (3 files)
- [setup/lib/installer.js](../setup/lib/installer.js:454-463) - Removed buddy-config.json creation
- [setup/lib/manifest.js](../setup/lib/manifest.js:80-92) - Marked configs component as deprecated
- [setup/scripts/bundle-dist.js](../setup/scripts/bundle-dist.js:107-120) - Updated verification

## Configuration Structure

### hooks.json Format

```json
{
  "hooks": {
    "PreToolUse": [ ... ],
    "PostToolUse": [ ... ]
  },
  "config": {
    "file_protection": {
      "enabled": true,
      "additional_patterns": [],
      "whitelist_patterns": [],
      "strict_mode": false
    },
    "command_validation": {
      "enabled": true,
      "block_dangerous": true,
      "warn_performance": true,
      "suggest_best_practices": true,
      "additional_dangerous_patterns": [],
      "whitelist_patterns": [],
      "strict_mode": false
    },
    "auto_formatting": {
      "enabled": true,
      "extensions": [".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".css", ".scss", ".md"],
      "tools": {},
      "exclude_patterns": ["node_modules/", ".git/", "dist/", "build/", "__pycache__/", ".venv/"],
      "create_backup": false
    },
    "git": {
      "auto_push": true,
      "branch_protection": ["main", "master"],
      "commit_validation": true,
      "conventional_commits": true,
      "sign_commits": false
    },
    "features": {
      "auto_commit": true,
      "safety_hooks": true,
      "auto_formatting": true,
      "commit_templates": "conventional",
      "documentation_generation": true,
      "code_review": true,
      "personas": true
    },
    "logging": {
      "enabled": true,
      "level": "info",
      "file_operations": true,
      "command_executions": true,
      "hook_activities": true
    },
    "notifications": {
      "desktop_alerts": false,
      "protection_events": true,
      "formatting_results": false,
      "commit_summaries": true
    }
  }
}
```

## Migration Options

### Option 1: Do Nothing (Recommended for Most Users)

Your existing `.claude-buddy/buddy-config.json` will continue to work. Hooks automatically check both locations.

**Best for**: Users who don't need to change their configuration.

### Option 2: Manual Migration

Copy your custom settings from `.claude-buddy/buddy-config.json` to `.claude/hooks.json` config section.

**Steps**:
1. Open `.claude-buddy/buddy-config.json`
2. Open `.claude/hooks.json`
3. Copy settings into the `config` section
4. Test that hooks still work correctly
5. Optionally delete `.claude-buddy/buddy-config.json`

**Best for**: Users who want to fully adopt the new configuration location.

### Option 3: Fresh Install

If you're installing Claude Buddy v2.2.0+ for the first time, configuration will be automatically included in `.claude/hooks.json`.

**Best for**: New installations.

## Accessing Configuration

### From Python Hooks

The hooks automatically load from the correct location:

```python
# This code works in all hooks
config = load_config()  # Checks .claude/hooks.json first, then fallbacks

# Access settings
file_protection = config.get("file_protection", {})
enabled = file_protection.get("enabled", True)
```

### From Agents/Commands

Reference the new location in documentation:

```markdown
Check `.claude/hooks.json` (config section) for:
- `config.features.auto_commit`
- `config.git.auto_push`
- `config.git.branch_protection`
```

## Customizing Configuration

### Add Custom File Patterns

Edit `.claude/hooks.json`:

```json
{
  "config": {
    "file_protection": {
      "additional_patterns": [".*\\.secret$", "my-private-.*"]
    }
  }
}
```

### Whitelist Specific Files

```json
{
  "config": {
    "file_protection": {
      "whitelist_patterns": ["test\\.env", "example-credentials\\.json"]
    }
  }
}
```

### Disable Specific Features

```json
{
  "config": {
    "auto_formatting": {
      "enabled": false
    },
    "command_validation": {
      "warn_performance": false
    }
  }
}
```

## Benefits of New Location

1. **Single Source of Truth**: All hook-related configuration in one file
2. **Standard Pattern**: Uses Claude Code's native configuration system
3. **Easier Discovery**: Config lives with hook definitions
4. **Reduced Complexity**: One less file to maintain
5. **Better Organization**: Hooks and their config together

## Troubleshooting

### Configuration Not Loading

**Symptom**: Hooks don't respect your custom settings.

**Solution**:
1. Verify `.claude/hooks.json` exists
2. Check JSON is valid: `python3 -m json.tool .claude/hooks.json`
3. Ensure `config` section exists in hooks.json
4. Verify file permissions allow reading

### Hooks Using Wrong Settings

**Symptom**: Hooks use different settings than expected.

**Solution**:
1. Check which config file exists:
   - `.claude/hooks.json` (preferred)
   - `.claude-buddy/buddy-config.json` (legacy fallback)
2. If both exist, `.claude/hooks.json` takes precedence
3. Merge settings to preferred location

### Fresh Install Missing Config

**Symptom**: Fresh install doesn't have config section.

**Solution**:
1. Verify you're using v2.2.0+: `npx claude-buddy --version`
2. Check dist bundle includes hooks.json: `ls -la .claude/hooks.json`
3. Re-run installation: `npx claude-buddy install --force`

## Deprecation Timeline

- **v2.2.0** (Current): `.claude-buddy/buddy-config.json` deprecated but supported
- **v2.3.0** (Next Minor): Warning added when using legacy location
- **v3.0.0** (Next Major): Legacy location support may be removed

We recommend migrating to `.claude/hooks.json` at your convenience.

## Questions?

- **Documentation**: [setup/CHANGELOG.md](../setup/CHANGELOG.md:8-68)
- **Issues**: https://github.com/your-org/claude-buddy/issues
- **Discussions**: https://github.com/your-org/claude-buddy/discussions

---

**Migration completed successfully on October 29, 2025**
**Claude Buddy v2.2.0 - Unified Configuration**
