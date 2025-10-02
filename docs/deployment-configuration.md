# Deployment Configuration

Configuration options for deploying Claude Buddy across different environments.

## Configuration Files

### Primary Configuration

**File**: `.claude-buddy/buddy-config.json`

```json
{
  "version": "1.0.0",
  "mode": "project",
  "features": {
    "auto_commit": true,
    "safety_hooks": true,
    "auto_formatting": true,
    "personas": true
  },
  "file_protection": {
    "enabled": true,
    "strict_mode": false
  },
  "command_validation": {
    "enabled": true,
    "block_dangerous": true
  },
  "personas": {
    "auto_activation": {
      "confidence_threshold": 0.7,
      "max_active_personas": 3
    }
  },
  "logging": {
    "enabled": true,
    "level": "info"
  }
}
```

### Hook Configuration

**File**: `.claude/hooks.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "command": "uv run --no-project python .claude/hooks/file-guard.py",
            "enabled": true,
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

### User Settings

**File**: `.claude/settings.local.json`

```json
{
  "hooks": {
    "enabled": true
  }
}
```

## Environment-Specific Configuration

### Development Environment

```json
{
  "version": "1.0.0",
  "mode": "project",
  "features": {
    "personas": true,
    "auto_formatting": true,
    "safety_hooks": true
  },
  "file_protection": {
    "strict_mode": false,
    "whitelist_patterns": ["test/**/*.env"]
  },
  "logging": {
    "enabled": true,
    "level": "debug"
  }
}
```

### Production/Team Environment

```json
{
  "version": "1.0.0",
  "mode": "project",
  "features": {
    "personas": true,
    "safety_hooks": true
  },
  "file_protection": {
    "strict_mode": true,
    "additional_patterns": ["config/prod\\..*"]
  },
  "command_validation": {
    "strict_mode": true
  },
  "logging": {
    "enabled": true,
    "level": "info"
  }
}
```

### CI/CD Environment

```json
{
  "version": "1.0.0",
  "mode": "project",
  "features": {
    "personas": false,
    "safety_hooks": true,
    "auto_commit": false
  },
  "logging": {
    "enabled": true,
    "level": "warning"
  }
}
```

## Configuration by Use Case

### High Security Project

```json
{
  "file_protection": {
    "enabled": true,
    "strict_mode": true,
    "additional_patterns": [
      "config/.*\\.production\\..*",
      "secrets/.*",
      "private/.*\\.key$"
    ],
    "whitelist_patterns": []
  },
  "command_validation": {
    "enabled": true,
    "strict_mode": true,
    "block_dangerous": true,
    "additional_dangerous_patterns": [
      "curl.*production.*",
      "ssh.*production.*"
    ]
  }
}
```

### Open Source Project

```json
{
  "file_protection": {
    "enabled": true,
    "strict_mode": false
  },
  "personas": {
    "enabled": true,
    "preferences": {
      "preferred_personas": ["mentor", "scribe"],
      "domain_preferences": {
        "frontend": "auto",
        "backend": "auto"
      }
    }
  },
  "logging": {
    "enabled": false
  }
}
```

### Learning/Tutorial Project

```json
{
  "features": {
    "personas": true,
    "documentation_generation": true
  },
  "personas": {
    "preferences": {
      "preferred_personas": ["mentor"],
      "domain_preferences": {
        "frontend": "always",
        "backend": "always"
      }
    }
  },
  "file_protection": {
    "enabled": false
  },
  "command_validation": {
    "warn_performance": true,
    "block_dangerous": false
  }
}
```

## Deployment Scripts

### Initialize Project

```bash
#!/bin/bash
# init-claude-buddy.sh

set -e

echo "Initializing Claude Buddy..."

# Copy framework files
cp -r /path/to/claude-buddy/.claude .
cp -r /path/to/claude-buddy/.claude-buddy .

# Configure for environment
ENV=${1:-development}

case $ENV in
  development)
    cp .claude-buddy/configs/dev.json .claude-buddy/buddy-config.json
    ;;
  production)
    cp .claude-buddy/configs/prod.json .claude-buddy/buddy-config.json
    ;;
  ci)
    cp .claude-buddy/configs/ci.json .claude-buddy/buddy-config.json
    ;;
esac

# Enable hooks
cat > .claude/settings.local.json << 'EOF'
{
  "hooks": {
    "enabled": true
  }
}
EOF

echo "Claude Buddy initialized for $ENV environment"
```

### Update Configuration

```bash
#!/bin/bash
# update-config.sh

# Backup current config
cp .claude-buddy/buddy-config.json .claude-buddy/buddy-config.json.backup

# Apply environment-specific overrides
python << 'EOF'
import json

with open('.claude-buddy/buddy-config.json') as f:
    config = json.load(f)

# Update for current environment
config['logging']['level'] = 'info'
config['file_protection']['strict_mode'] = True

with open('.claude-buddy/buddy-config.json', 'w') as f:
    json.dump(config, f, indent=2)
EOF

echo "Configuration updated"
```

## Related Documentation

- [Deployment Prerequisites](./deployment-prerequisites.md) - System requirements
- [Deployment Deployment](./deployment-deployment.md) - Deployment procedures
- [Development Setup](./development-setup.md) - Setup guide
