# Technology Stack

This document provides a comprehensive overview of the technologies, tools, and frameworks used in Claude Buddy.

## Core Technologies

### Claude Code CLI
**Version**: Latest
**Purpose**: Primary runtime environment and orchestration layer
**Vendor**: Anthropic

Claude Buddy is built as an extension to Claude Code, leveraging its:
- Tool invocation system (Read, Write, Edit, Bash, etc.)
- Hook system (PreToolUse, PostToolUse)
- Agent protocol for specialized workflows
- Slash command framework

### Python 3.8+
**Purpose**: Safety hook implementation
**Key Libraries**:
- `cchooks` - Claude Code hooks integration library
- `json` - Request/response parsing
- `re` - Pattern matching for file/command validation
- `pathlib` - File path operations

**Execution Model**:
```bash
uv run --no-project python .claude/hooks/file-guard.py
```

Hooks run in isolated environments using `uv` for dependency management.

### Task (Taskfile.dev)
**Version**: 3.x
**Purpose**: Build automation and task management
**Configuration**: `Taskfile.yml`

**Available Tasks**:
- `task setup` - Initialize development environment
- `task test` - Run validation tests
- `task build` - Build for distribution
- `task lint` - Code style checking
- `task site:deploy` - Deploy GitHub Pages site

## Configuration Formats

### JSON
**Files**:
- `buddy-config.json` - Main configuration
- `hooks.json` - Hook registration
- `settings.local.json` - User-specific settings

**Usage**: Structured configuration with schema validation

### Markdown
**Files**:
- Personas (`.claude-buddy/personas/*.md`)
- Templates (`.claude-buddy/templates/*/*.md`)
- Documentation (`docs/*.md`)
- Foundation (`directive/foundation.md`)

**Extensions Used**:
- Mermaid diagrams for visualizations
- YAML front matter for metadata
- Code blocks with syntax highlighting

### YAML
**Files**:
- `Taskfile.yml` - Task automation
- CI/CD configurations (if present)

**Usage**: Task definitions and workflow automation

## Development Tools

### Code Formatters

#### Python - Black
**Purpose**: Auto-format Python hook scripts
**Configuration**: Default settings
**Invocation**: `auto-formatter.py` hook

#### JavaScript/TypeScript - Prettier
**Purpose**: Format JS/TS files
**Configuration**: Default settings
**Invocation**: `auto-formatter.py` hook

### Linting

#### ESLint
**Purpose**: JavaScript code quality (if JS files present)
**Configuration**: Project-specific
**Usage**: `task lint`

### Version Control

#### Git
**Purpose**: Source control and versioning
**Integration**: Enhanced via `git-workflow` agent

**Features**:
- Conventional commits
- Pre-commit hook integration
- Branch protection
- No force push to main/master

## Runtime Dependencies

### uv (Universal Virtualenv)
**Purpose**: Python environment isolation
**Usage**: Execute hooks without affecting global Python

**Command Pattern**:
```bash
uv run --no-project python <script.py>
```

### Node.js (Optional)
**Purpose**: JavaScript tooling (prettier, eslint)
**Version**: Not required for core functionality
**Usage**: Code formatting if installed

## File System Structure

```
project-root/
├── .claude/                          # Claude Code configuration
│   ├── commands/                     # Slash command definitions
│   │   └── buddy/                    # Claude Buddy commands
│   │       ├── persona.md
│   │       ├── foundation.md
│   │       ├── spec.md
│   │       ├── plan.md
│   │       ├── tasks.md
│   │       ├── docs.md
│   │       └── commit.md
│   ├── agents/                       # Specialized agent protocols
│   │   ├── persona-dispatcher.md
│   │   ├── foundation.md
│   │   ├── spec-writer.md
│   │   ├── plan-writer.md
│   │   ├── tasks-writer.md
│   │   ├── docs-generator.md
│   │   └── git-workflow.md
│   ├── hooks/                        # Safety hooks (Python)
│   │   ├── file-guard.py
│   │   ├── command-validator.py
│   │   └── auto-formatter.py
│   ├── hooks.json                    # Hook registration
│   ├── settings.local.json           # User settings
│   └── CLAUDE.md                     # Project instructions
│
├── .claude-buddy/                    # Claude Buddy framework
│   ├── personas/                     # Persona definitions
│   │   ├── architect.md
│   │   ├── frontend.md
│   │   ├── backend.md
│   │   ├── security.md
│   │   ├── performance.md
│   │   ├── analyzer.md
│   │   ├── qa.md
│   │   ├── refactorer.md
│   │   ├── devops.md
│   │   ├── po.md
│   │   ├── mentor.md
│   │   └── scribe.md
│   ├── templates/                    # Foundation-specific templates
│   │   ├── default/
│   │   │   ├── spec.md
│   │   │   ├── plan.md
│   │   │   ├── tasks.md
│   │   │   └── docs.md
│   │   ├── jhipster/
│   │   └── mulesoft/
│   ├── context/                      # Optional context libraries
│   │   ├── default/
│   │   ├── jhipster/
│   │   └── mulesoft/
│   ├── buddy-config.json             # Main configuration
│   └── templates/foundation.md       # Foundation template
│
├── directive/                        # Project governance
│   └── foundation.md                 # Foundation document
│
├── docs/                             # Generated documentation
│   └── *.md                          # Documentation files
│
├── specs/                            # Feature specifications
│   └── YYYYMMDD-feature-name/
│       ├── README.md
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
│
└── Taskfile.yml                      # Task automation
```

## Communication Protocols

### Hook Protocol
**Format**: JSON over stdin/stdout
**Timeout**: 10s (validation) / 30s (formatting)

**Request**:
```json
{
  "tool": "Write",
  "parameters": {
    "file_path": "/path/to/file.py",
    "content": "..."
  }
}
```

**Response**:
```json
{
  "approved": true|false,
  "message": "...",
  "suggestion": "...",
  "details": {}
}
```

### Agent Protocol
**Format**: Markdown document with structured instructions
**Invocation**: Via slash commands
**Context**: Provided through prompt engineering

### Configuration Loading
**Format**: JSON parsing with fallback defaults
**Precedence**: User → Project → Defaults

## Security Technologies

### File Protection Patterns
**Technology**: Python regex matching
**Implementation**: `file-guard.py`

**Protected Patterns**:
```python
r"\.env.*"           # Environment files
r".*\.key$"          # Key files
r".*\.pem$"          # Certificate files
r"secrets?\..*"      # Secret files
r"id_rsa.*"          # SSH keys
r"\.aws/.*"          # AWS credentials
```

### Command Validation
**Technology**: Python regex matching
**Implementation**: `command-validator.py`

**Dangerous Patterns**:
```python
r"rm\s+-rf\s+/"      # Recursive force delete root
r"sudo\s+rm"         # Elevated delete
r":(){ :|:& };:"     # Fork bomb
r"dd\s+if=.*of=/dev" # Disk operations
r"mkfs\."            # Format operations
```

## Data Storage

### Persistent Storage
- **Configuration**: JSON files in `.claude-buddy/` and `.claude/`
- **Documentation**: Markdown files in `docs/`, `specs/`, `directive/`
- **Logs**: Optional logging to file system (if enabled)

### Session Storage
- **Persona Memory**: Maintained during Claude session (if enabled)
- **Context Loading**: Cached during session for performance

### No External Databases
Claude Buddy operates entirely on file system storage. No database servers or external storage systems are required.

## Deployment Technologies

### Distribution (Planned)
**Target**: NPM package for global installation
**Installation**:
```bash
npm install -g claude-buddy
claude-buddy init  # Initialize in project
```

### Current Distribution
**Method**: Direct file copying
**Setup**: Manual copying of `.claude/` and `.claude-buddy/` directories

### Version Management
**Foundation**: Semantic versioning in `foundation.md`
**Framework**: Version in `buddy-config.json`

## Integration Points

### Claude Code Integration
- **Tools**: Read, Write, Edit, Bash, Glob, Grep
- **Hooks**: PreToolUse, PostToolUse
- **Agents**: Custom agent protocols
- **Commands**: Slash command framework

### Git Integration
- **Operations**: status, diff, log, add, commit (via Bash tool)
- **Safety**: No force push, no skip hooks, authorship preservation
- **Style**: Conventional commits, repository-specific patterns

### External Tools (Optional)
- **black**: Python formatting
- **prettier**: JavaScript/TypeScript formatting
- **eslint**: JavaScript linting

## Performance Characteristics

### Hook Execution
- **Validation**: < 10 seconds (enforced timeout)
- **Formatting**: < 30 seconds (enforced timeout)
- **Overhead**: Minimal (regex matching, JSON parsing)

### Document Generation
- **Specifications**: < 1 minute
- **Plans**: < 2 minutes
- **Tasks**: < 1 minute
- **Complete docs**: < 5 minutes

### Persona Activation
- **Analysis**: < 1 second (confidence scoring)
- **Loading**: < 1 second (markdown parsing)
- **Response**: Depends on complexity

## Scalability Considerations

### Project Size
- **Small**: < 100 files (< 1 second analysis)
- **Medium**: 100-1000 files (1-5 seconds)
- **Large**: 1000+ files (5-30 seconds)

### Persona Count
- **Current**: 12 personas
- **Recommended Max**: 15-20 personas
- **Active Limit**: 3 personas per request (configurable)

### Template Complexity
- **Simple**: < 5KB (instant loading)
- **Complex**: 15-30KB (< 1 second loading)

## Technology Decisions

### Why Python for Hooks?
- **Reason**: Strong regex support, JSON handling, cross-platform
- **Alternative**: Shell scripts (less maintainable)
- **Trade-off**: Requires Python runtime

### Why Markdown for Configuration?
- **Reason**: Human-readable, version control friendly, rich formatting
- **Alternative**: JSON/YAML (less expressive for long-form content)
- **Trade-off**: Parsing complexity for structured data

### Why JSON for Settings?
- **Reason**: Structured data, schema validation, tooling support
- **Alternative**: YAML (less strict), TOML (less widespread)
- **Trade-off**: Less human-friendly for complex nested data

### Why Task over Make?
- **Reason**: Cross-platform, YAML-based, better error messages
- **Alternative**: Make (POSIX, but complex syntax)
- **Trade-off**: Additional tool dependency

## Future Technology Considerations

### Planned Additions
- **NPM distribution**: Global package installation
- **CLI tool**: Project initialization and management
- **Web dashboard**: Configuration UI (optional)
- **VS Code extension**: Enhanced IDE integration

### Potential Enhancements
- **Docker support**: Containerized hook execution
- **Remote templates**: Template repository with versioning
- **Analytics**: Usage metrics and persona effectiveness tracking
- **AI model updates**: Support for newer Claude models

## Dependencies Summary

### Required
- **Claude Code**: Latest version
- **Python**: 3.8+
- **cchooks**: Latest (for hook integration)
- **Git**: Any modern version
- **uv**: For Python isolation

### Optional
- **Task**: For task automation
- **black**: Python formatting
- **prettier**: JavaScript formatting
- **eslint**: JavaScript linting
- **Node.js**: JavaScript tooling

### No Dependencies
- No databases
- No external services
- No network requirements (except npm distribution)
- No paid services

## Related Documentation

- [Architecture Overview](./architecture-overview.md) - High-level system design
- [Architecture Components](./architecture-components.md) - Component details
- [Data Flow](./architecture-data-flow.md) - Information flow analysis
- [Development Setup](./development-setup.md) - Getting started guide
