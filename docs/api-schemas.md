# Configuration Schemas

This document provides schema definitions for all Claude Buddy configuration files.

## buddy-config.json Schema

**Location**: `.claude-buddy/buddy-config.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "mode"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Configuration format version",
      "example": "1.0.0"
    },
    "mode": {
      "type": "string",
      "enum": ["project", "global"],
      "description": "Configuration scope"
    },
    "features": {
      "type": "object",
      "properties": {
        "auto_commit": {"type": "boolean", "default": true},
        "safety_hooks": {"type": "boolean", "default": true},
        "auto_formatting": {"type": "boolean", "default": true},
        "commit_templates": {
          "type": "string",
          "enum": ["conventional", "custom"],
          "default": "conventional"
        },
        "documentation_generation": {"type": "boolean", "default": true},
        "code_review": {"type": "boolean", "default": true},
        "personas": {"type": "boolean", "default": true}
      }
    },
    "file_protection": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "additional_patterns": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Additional regex patterns to protect"
        },
        "whitelist_patterns": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Patterns to exclude from protection"
        },
        "strict_mode": {"type": "boolean", "default": false}
      }
    },
    "command_validation": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "block_dangerous": {"type": "boolean", "default": true},
        "warn_performance": {"type": "boolean", "default": true},
        "suggest_best_practices": {"type": "boolean", "default": true},
        "additional_dangerous_patterns": {
          "type": "array",
          "items": {"type": "string"}
        },
        "whitelist_patterns": {
          "type": "array",
          "items": {"type": "string"}
        },
        "strict_mode": {"type": "boolean", "default": false}
      }
    },
    "auto_formatting": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "extensions": {
          "type": "array",
          "items": {"type": "string"},
          "default": [".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".css", ".scss", ".md"]
        },
        "tools": {"type": "object"},
        "exclude_patterns": {
          "type": "array",
          "items": {"type": "string"},
          "default": ["node_modules/", ".git/", "dist/", "build/"]
        },
        "create_backup": {"type": "boolean", "default": false}
      }
    },
    "personas": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "auto_activation": {
          "type": "object",
          "properties": {
            "enabled": {"type": "boolean", "default": true},
            "confidence_threshold": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "default": 0.7
            },
            "max_active_personas": {
              "type": "integer",
              "minimum": 1,
              "maximum": 5,
              "default": 3
            },
            "learning_enabled": {"type": "boolean", "default": true},
            "session_memory": {"type": "boolean", "default": true}
          }
        }
      }
    },
    "logging": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean", "default": true},
        "level": {
          "type": "string",
          "enum": ["debug", "info", "warning", "error", "critical"],
          "default": "info"
        },
        "file_operations": {"type": "boolean", "default": true},
        "command_executions": {"type": "boolean", "default": true},
        "hook_activities": {"type": "boolean", "default": true}
      }
    }
  }
}
```

### Example Configuration

```json
{
  "version": "1.0.0",
  "mode": "project",
  "features": {
    "auto_commit": true,
    "safety_hooks": true,
    "personas": true
  },
  "file_protection": {
    "enabled": true,
    "additional_patterns": ["config/secrets\\..*"],
    "whitelist_patterns": ["test/fixtures/\\.env\\.test"]
  },
  "personas": {
    "auto_activation": {
      "confidence_threshold": 0.7,
      "max_active_personas": 3
    }
  }
}
```

## hooks.json Schema

**Location**: `.claude/hooks.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "hooks": {
      "type": "object",
      "properties": {
        "PreToolUse": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["matcher", "hooks"],
            "properties": {
              "matcher": {
                "type": "string",
                "enum": ["Write", "Edit", "MultiEdit", "Bash", "Read", "Glob", "Grep"]
              },
              "hooks": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["type", "command"],
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": ["command"]
                    },
                    "command": {
                      "type": "string",
                      "description": "Shell command to execute"
                    },
                    "description": {"type": "string"},
                    "enabled": {"type": "boolean", "default": true},
                    "timeout": {
                      "type": "integer",
                      "description": "Timeout in seconds",
                      "default": 10
                    }
                  }
                }
              }
            }
          }
        },
        "PostToolUse": {
          "type": "array",
          "description": "Same structure as PreToolUse"
        }
      }
    }
  }
}
```

### Example Hook Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "uv run --no-project python .claude/hooks/file-guard.py",
            "description": "Protect sensitive files",
            "enabled": true,
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "uv run --no-project python .claude/hooks/auto-formatter.py",
            "description": "Auto-format code",
            "enabled": true,
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Hook Communication Protocol

### Request Schema (stdin)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["tool", "parameters"],
  "properties": {
    "tool": {
      "type": "string",
      "enum": ["Write", "Edit", "Bash"],
      "description": "Tool being invoked"
    },
    "parameters": {
      "type": "object",
      "description": "Tool-specific parameters",
      "oneOf": [
        {
          "title": "Write/Edit Parameters",
          "properties": {
            "file_path": {"type": "string"},
            "content": {"type": "string"}
          }
        },
        {
          "title": "Bash Parameters",
          "properties": {
            "command": {"type": "string"}
          }
        }
      ]
    }
  }
}
```

### Response Schema (stdout)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["approved"],
  "properties": {
    "approved": {
      "type": "boolean",
      "description": "Whether operation is authorized"
    },
    "message": {
      "type": "string",
      "description": "Human-readable message"
    },
    "suggestion": {
      "type": "string",
      "description": "Alternative approach if blocked"
    },
    "details": {
      "type": "object",
      "description": "Additional context",
      "properties": {
        "pattern": {"type": "string"},
        "severity": {
          "type": "string",
          "enum": ["low", "medium", "high", "critical"]
        }
      }
    }
  }
}
```

### Example Hook Communication

**Request**:
```json
{
  "tool": "Write",
  "parameters": {
    "file_path": "/project/.env",
    "content": "API_KEY=secret123"
  }
}
```

**Response (Blocked)**:
```json
{
  "approved": false,
  "message": "Operation blocked: File matches protected pattern .env",
  "suggestion": "Use .env.example for template files. Store actual credentials in secure vault.",
  "details": {
    "pattern": "\\.env.*",
    "severity": "high"
  }
}
```

**Response (Approved)**:
```json
{
  "approved": true,
  "message": "Operation approved"
}
```

## Foundation Document Schema

**Location**: `directive/foundation.md`

While not JSON, the foundation document follows a structured markdown format:

```markdown
# [Project Name] Foundation

## Purpose
[Single paragraph defining project mission]

## Core Principles

### Principle 1: [Title]
[Description paragraph]

**Requirements:**
- [Requirement 1]
- [Requirement 2]

**Rationale:** [Why this principle matters]

**Compliance Verification:**
- [How to verify adherence]

[Repeat for Principles 2-5]

## Governance

### Amendment Procedure
[How to propose changes]

### Versioning Policy
[Semantic versioning rules]

## Dependent Artifacts
[List of dependent templates and configurations]

## Foundation Metadata

**Foundation Type**: [default|jhipster|mulesoft]
**Version**: X.Y.Z
**Ratification Date**: YYYY-MM-DD
**Last Amended**: YYYY-MM-DD

## Review History

| Date | Version | Changes | Reviewer |
|------|---------|---------|----------|
| ... | ... | ... | ... |
```

## Persona Definition Schema

**Location**: `.claude-buddy/personas/[name].md`

```markdown
# [Persona Name] - [Brief Description]

## Identity & Expertise
- **Role**: [Primary role]
- **Priority Hierarchy**: [Ordered priorities]
- **Specializations**: [Specific areas]

## Core Principles
1. [Principle 1]
2. [Principle 2]
...

## Auto-Activation Triggers

### High Confidence (95%+)
- Keywords: [list]

### Medium Confidence (80-94%)
- Keywords: [list]

### Context Clues
- [File patterns]
- [Project indicators]

## Collaboration Patterns
- **With [Other Persona]**: [Collaboration description]

## Response Patterns
[How persona approaches problems]

## Command Specializations
- **`/buddy:command`**: [Expertise description]
```

## Template Structure

**Location**: `.claude-buddy/templates/[foundation-type]/[template-name].md`

Templates contain:
1. **Agent Role Definition**
2. **Scope Definition**
3. **Analysis Process** (bash commands to execute)
4. **Output Specification** (file structure)
5. **Content Generation Strategy**
6. **Quality Assurance** (validation checklist)

## Validation

To validate configuration files:

```bash
# Using jq (if installed)
jq empty .claude-buddy/buddy-config.json
jq empty .claude/hooks.json

# Using Python
python -m json.tool .claude-buddy/buddy-config.json
python -m json.tool .claude/hooks.json
```

## Related Documentation

- [API Authentication](./api-authentication.md) - Authorization mechanisms
- [API Endpoints](./api-endpoints.md) - Command reference
- [Development Setup](./development-setup.md) - Configuration guide
