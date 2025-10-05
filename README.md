# ♾️ Claude Buddy 2.0

[![NPM Version](https://img.shields.io/npm/v/@claude-buddy/setup)](https://www.npmjs.com/package/@claude-buddy/setup)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Enterprise-Ready AI Development Platform for Claude Code

Transform your development workflow with Claude Buddy 2.0 - an NPM-powered AI platform featuring 12 specialized personas, enterprise templates for MuleSoft & JHipster, and complete workflow automation from specification to deployment.

## Quick Start

```bash
# Install globally via NPM
npm install -g @claude-buddy/setup

# Initialize in your project
claude-buddy install

# Start using slash commands
/buddy:spec Create a user authentication system with JWT
```

[Full Documentation](docs/README.md) | [Installation Guide](setup/README.md) | [Visit Website](https://claude-buddy.dev)

## What is Claude Buddy?

Claude Buddy 2.0 is a comprehensive AI development platform that extends Claude Code with:

- **12 Expert Personas** - Specialized AI perspectives from architecture to QA
- **Enterprise Templates** - Production-ready frameworks for MuleSoft & JHipster
- **Workflow Automation** - Complete development lifecycle management
- **Foundation-Driven Development** - Principles-based project alignment
- **Safety-First Design** - Multi-layer protection with Python-based hooks
- **NPM Distribution** - Professional package management with automatic updates

### Development Workflow

```
/buddy:spec → /buddy:plan → /buddy:tasks → /buddy:implement → /buddy:commit
  Create       Generate      Break down     Execute with      Professional
  specification implementation task list      TDD approach      commits
```

## Key Features

### 🎭 12 AI Personas

Each persona brings specialized expertise to your development process:

| Persona | Focus | Icon |
|---------|-------|------|
| **Architect** | Systems design & long-term architecture | 🏛️ |
| **Frontend** | UI/UX & accessibility | 🎨 |
| **Backend** | APIs & reliability engineering | ⚙️ |
| **Security** | Threat modeling & vulnerabilities | 🛡️ |
| **Performance** | Optimization & bottleneck elimination | ⚡ |
| **Analyzer** | Root cause analysis | 🔍 |
| **QA** | Testing & quality advocacy | ✅ |
| **Refactorer** | Code quality & technical debt | 🔧 |
| **DevOps** | Infrastructure & deployment | 🚀 |
| **PO** | Product requirements & strategy | 📋 |
| **Mentor** | Knowledge transfer & education | 👨‍🏫 |
| **Scribe** | Documentation & writing | ✍️ |

### 🏢 Enterprise Templates

**MuleSoft API Platform**
- RAML specifications
- DataWeave transformations
- MUnit test suites
- CloudHub deployment
- Error handling flows

**JHipster Full-Stack**
- Spring Boot backend
- Angular/React/Vue frontend
- Microservices architecture
- JWT/OAuth2 authentication
- Docker & Kubernetes

**Default Template**
- General-purpose development
- Language-agnostic
- Flexible workflows

### 🔒 Safety & Security

- **File Protection**: Prevents modification of sensitive files (.env, credentials, keys)
- **Command Validation**: Blocks dangerous operations (rm -rf, sudo, format)
- **Hook Timeouts**: Enforced execution limits (10s validation, 30s formatting)
- **Transaction Safety**: Automatic rollback on failures
- **No AI Attribution**: Clean, professional git commits

## Installation

### Prerequisites

- **Node.js**: ≥18.0.0
- **npm**: ≥9.0.0
- **Claude Code**: Latest version

### Global Installation

```bash
# Install the setup package globally
npm install -g @claude-buddy/setup

# Verify installation
claude-buddy --version

# Initialize in your project
claude-buddy install
```

### Project-Specific Installation

```bash
# Using npx (no global install)
npx @claude-buddy/setup install

# Or install locally
npm install --save-dev @claude-buddy/setup
npx claude-buddy install
```

### Verification

```bash
# Check installed components
ls -la .claude/
ls -la .claude-buddy/

# Test a command
/buddy:foundation
```

## Usage

### Slash Commands

Claude Buddy provides 8 powerful slash commands:

| Command | Description |
|---------|-------------|
| `/buddy:foundation` | Initialize project foundation with core principles |
| `/buddy:spec` | Create formal feature specifications |
| `/buddy:plan` | Generate implementation plans from specs |
| `/buddy:tasks` | Break down plans into executable tasks |
| `/buddy:implement` | Execute tasks with TDD approach |
| `/buddy:commit` | Create professional git commits |
| `/buddy:docs` | Generate comprehensive documentation |
| `/buddy:persona` | Activate specific personas or auto-activate |

### Workflow Example

```bash
# 1. Create a specification
/buddy:spec Build a REST API for user management with CRUD operations,
authentication, and role-based access control

# 2. Generate implementation plan
/buddy:plan

# 3. Create task breakdown
/buddy:tasks

# 4. Execute implementation (TDD approach)
/buddy:implement

# 5. Commit changes
/buddy:commit

# 6. Generate documentation
/buddy:docs
```

### Persona Activation

**Auto-Activation Mode** (Recommended)
```bash
/buddy:persona Review this authentication system for security issues
# → Automatically activates Security + Backend personas
```

**Manual Selection**
```bash
/buddy:persona frontend qa - Test this component for accessibility
# → Explicitly activates Frontend + QA personas
```

**Collaboration Patterns**
- `architect + performance` → System design with performance budgets
- `security + backend` → Secure server-side development
- `frontend + qa` → User-focused development with testing
- `mentor + scribe` → Educational content creation

## Project Structure

```
claude-buddy/
├── .claude/                    # Claude Code configuration
│   ├── commands/buddy/        # Slash command definitions
│   └── agents/                # Specialized agent protocols
├── .claude-buddy/             # Framework configuration
│   ├── personas/              # 12 persona definitions
│   ├── templates/             # Template system
│   │   ├── default/          # General-purpose templates
│   │   ├── mulesoft/         # MuleSoft API templates
│   │   └── jhipster/         # JHipster templates
│   └── buddy-config.json     # Configuration
├── setup/                     # NPM package (@claude-buddy/setup)
│   ├── install.js            # Installation script
│   ├── lib/                  # Core modules
│   └── tests/                # Test suites
├── docs/                      # Technical documentation
│   ├── architecture-*.md     # Architecture guides
│   ├── development-*.md      # Development guides
│   ├── deployment-*.md       # Deployment guides
│   └── api-*.md             # API documentation
├── site/                      # Marketing website
├── specs/                     # Feature specifications
├── directive/                 # Project foundation
└── Taskfile.yml              # Task automation
```

## Documentation

Comprehensive documentation is available in the [docs/](docs/) directory:

- **[Architecture Overview](docs/architecture-overview.md)** - System design and components
- **[Development Setup](docs/development-setup.md)** - Getting started with development
- **[API Documentation](docs/api-endpoints.md)** - API reference and examples
- **[Deployment Guide](docs/deployment-deployment.md)** - Production deployment
- **[Troubleshooting](docs/troubleshooting-common-issues.md)** - Common issues and solutions

Installation script documentation: [setup/README.md](setup/README.md)

## Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/rsts-dev/claude-buddy.git
cd claude-buddy

# Install dependencies
task setup

# Run tests
task test

# Run specific test suites
task test:unit
task test:integration
```

### Running Tasks

The project uses [Task](https://taskfile.dev/) for automation:

```bash
# List available tasks
task --list

# Run tests
task test

# Build distribution
task build

# Lint code
task lint

# Run CI checks
task ci
```

### Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Templates

### Available Templates

Claude Buddy supports multiple foundation types with specialized templates:

#### Default Template
General-purpose development for any language or framework.

**Use Cases:**
- Custom applications
- Library development
- General scripting
- Language-agnostic projects

#### MuleSoft Template
Enterprise integration and API development.

**Components:**
- RAML API specifications
- DataWeave transformation mappings
- MUnit test scenarios
- Error handling flows
- CloudHub deployment configs
- Security policies (OAuth2, Rate Limiting)

**Use Cases:**
- System integration
- API management
- Enterprise Service Bus
- B2B connectivity

#### JHipster Template
Full-stack enterprise web applications.

**Components:**
- JDL entity models
- Spring Boot backend
- Angular/React/Vue frontend
- Microservices architecture
- JWT/OAuth2 authentication
- Docker/Kubernetes configs
- Test scenarios

**Use Cases:**
- Enterprise web apps
- Microservices platforms
- Cloud-native applications
- Full-stack development

### Using Templates

```bash
# Initialize with specific template
/buddy:foundation mulesoft

# Or select during interactive setup
/buddy:foundation
# → Select foundation type: [default, mulesoft, jhipster]
```

## Safety Features

Claude Buddy implements multiple layers of protection:

### File Protection
- Blocks modification of `.env`, credentials, secrets, keys
- Customizable protection patterns
- Whitelist support for exceptions
- Strict mode for enhanced security

### Command Validation
- Prevents dangerous operations (`rm -rf`, `sudo`, `format`)
- Warns about performance-impacting commands
- Suggests best practices
- Configurable strictness levels

### Git Safety
- No AI attribution in commits (professional output)
- Branch protection (main/master)
- Commit message validation
- Conventional commits support
- Optional GPG signing

### Hook Configuration

All safety features are configurable in `.claude-buddy/buddy-config.json`:

```json
{
  "file_protection": {
    "enabled": true,
    "strict_mode": false
  },
  "command_validation": {
    "enabled": true,
    "block_dangerous": true
  },
  "git": {
    "branch_protection": ["main", "master"],
    "commit_validation": true
  }
}
```

## Version Compatibility

| Claude Buddy | Node.js | NPM | Claude Code |
|--------------|---------|-----|-------------|
| 2.x          | ≥18.0.0 | ≥9.0.0 | Latest |
| 1.x          | ≥16.0.0 | ≥8.0.0 | Latest |

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Run the test suite (`task test`)
6. Commit your changes (using `/buddy:commit`)
7. Push to your fork
8. Open a Pull Request

See [Development Guide](docs/development-setup.md) for detailed setup instructions.

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Claude Buddy Contributors

## Links

- **Website**: [https://claude-buddy.dev](https://claude-buddy.dev)
- **GitHub**: [https://github.com/rsts-dev/claude-buddy](https://github.com/rsts-dev/claude-buddy)
- **NPM Package**: [@claude-buddy/setup](https://www.npmjs.com/package/@claude-buddy/setup)
- **Documentation**: [docs/](docs/)
- **Issue Tracker**: [GitHub Issues](https://github.com/rsts-dev/claude-buddy/issues)

## Support

- **Bug Reports**: [GitHub Issues](https://github.com/rsts-dev/claude-buddy/issues)
- **Questions**: [GitHub Discussions](https://github.com/rsts-dev/claude-buddy/discussions)
- **Security**: Report security vulnerabilities privately via GitHub

## Acknowledgments

Built with ♾️ for the Claude Code community.

Special thanks to all [contributors](https://github.com/rsts-dev/claude-buddy/graphs/contributors) who help make Claude Buddy better.

---

**Claude Buddy v2.0.0** - Enterprise-Ready AI Development Platform
