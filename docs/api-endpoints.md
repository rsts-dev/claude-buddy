# Command Reference

Claude Buddy provides a set of slash commands that serve as the "API" for interacting with the framework. This document provides a complete reference of all available commands.

## Command Naming Convention

All commands follow the pattern: `/buddy:<command-name>`

This prefix ensures:
- **Discoverability**: Easy to find all Claude Buddy commands
- **Namespace isolation**: No conflicts with other commands
- **Consistency**: Uniform interface across all features

## Available Commands

### /buddy:persona

**Purpose**: Activate specialized personas based on request context

**Syntax**:
```
/buddy:persona [persona-names] - [request]
/buddy:persona [request]  # Auto-activation mode
```

**Parameters**:
- `persona-names` (optional): Space-separated list of persona names
- `request` (required): Your question or task

**Examples**:
```bash
# Auto-activation (recommended)
/buddy:persona How should I design a scalable microservices architecture?
/buddy:persona Review this React component for accessibility issues
/buddy:persona Help me optimize this database query

# Manual selection
/buddy:persona architect security - review this authentication system
/buddy:persona frontend qa - test this component for bugs
/buddy:persona backend performance - optimize this API endpoint
```

**Available Personas**:
- `architect`, `frontend`, `backend`, `security`, `performance`
- `analyzer`, `qa`, `refactorer`, `devops`, `po`
- `mentor`, `scribe`

**Response**: Expert guidance from activated persona(s)

---

### /buddy:foundation

**Purpose**: Create or update project foundation document

**Syntax**:
```
/buddy:foundation
/buddy:foundation [mode]
```

**Parameters**:
- `mode` (optional): `interactive` or `provided`

**Interactive Mode**:
```bash
/buddy:foundation interactive
# System asks guided questions about your project
```

**Provided Mode**:
```bash
/buddy:foundation provided
# Followed by your project overview in the conversation
```

**Output**: `directive/foundation.md` with:
- Purpose statement
- 5 core principles
- Governance procedures
- Dependent artifacts
- Version metadata

**Example Usage**:
```bash
/buddy:foundation provided
My project is a customer relationship management system built with React and Node.js...
```

---

### /buddy:spec

**Purpose**: Generate formal specification from natural language feature description

**Syntax**:
```
/buddy:spec [feature description]
```

**Parameters**:
- `feature description` (required): Natural language description of desired feature

**Examples**:
```bash
/buddy:spec Add user authentication with OAuth2 support
/buddy:spec Implement real-time notifications using WebSockets
/buddy:spec Create admin dashboard with user management
```

**Output**: `specs/YYYYMMDD-feature-name/spec.md` containing:
- Feature overview
- Functional requirements
- Non-functional requirements
- Technical constraints
- Acceptance criteria
- Dependencies

---

### /buddy:plan

**Purpose**: Create implementation plan from existing specification

**Syntax**:
```
/buddy:plan [path-to-spec]
/buddy:plan  # Uses most recent spec
```

**Parameters**:
- `path-to-spec` (optional): Path to specification file

**Prerequisites**: Existing `spec.md` file

**Examples**:
```bash
/buddy:plan
/buddy:plan specs/20251002-user-auth/spec.md
```

**Output**: `specs/YYYYMMDD-feature-name/plan.md` containing:
- Implementation strategy
- Architecture decisions
- Component breakdown
- Integration points
- Risk analysis
- Timeline estimates

---

### /buddy:tasks

**Purpose**: Generate actionable task breakdown from implementation plan

**Syntax**:
```
/buddy:tasks [path-to-plan]
/buddy:tasks  # Uses most recent plan
```

**Parameters**:
- `path-to-plan` (optional): Path to plan file

**Prerequisites**: Existing `plan.md` file

**Examples**:
```bash
/buddy:tasks
/buddy:tasks specs/20251002-user-auth/plan.md
```

**Output**: `specs/YYYYMMDD-feature-name/tasks.md` containing:
- Task list with IDs
- Priorities and dependencies
- Acceptance criteria
- Effort estimates
- Technical implementation notes

**Task Format**:
```markdown
### [TASK-001] Setup OAuth2 Library
**Priority**: High
**Description**: Install and configure OAuth2 library
**Acceptance Criteria**: Library installed, config file created
**Dependencies**: None
**Estimated Effort**: 2 hours
**Notes**: Use passport.js for Node.js implementation
```

---

### /buddy:docs

**Purpose**: Generate comprehensive technical documentation

**Syntax**:
```
/buddy:docs
```

**Parameters**: None

**Prerequisites**:
- `directive/foundation.md` must exist
- Run `/buddy:foundation` first if not present

**Examples**:
```bash
/buddy:docs
```

**Output**: `docs/` directory with 19+ files:
- **Architecture**: overview, components, data-flow, technology-stack
- **API**: authentication, endpoints, schemas, examples
- **Development**: setup, coding-standards, testing, debugging
- **Deployment**: prerequisites, configuration, deployment, monitoring
- **Troubleshooting**: common-issues, performance, faq

**Generation Time**: 3-5 minutes depending on codebase size

---

### /buddy:commit

**Purpose**: Create professional git commits with enhanced analysis

**Syntax**:
```
/buddy:commit
/buddy:commit [message]  # Provide custom message
```

**Parameters**:
- `message` (optional): Custom commit message

**Examples**:
```bash
/buddy:commit
# Analyzes changes and generates commit message

/buddy:commit "fix: resolve authentication timeout issue"
# Uses provided message
```

**Behavior**:
1. Runs `git status`, `git diff`, `git log` in parallel
2. Analyzes all staged and unstaged changes
3. Follows repository commit style
4. Generates conventional commit message
5. Per project requirements: **NO Claude attribution**

**Commit Message Format**:
```
<type>: <subject>

<body>

<footer>
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Build process or auxiliary tool changes

---

## Command Workflow Patterns

### Feature Development Workflow

```mermaid
flowchart LR
    Spec[/buddy:spec] --> Plan[/buddy:plan]
    Plan --> Tasks[/buddy:tasks]
    Tasks --> Implement[Implement Code]
    Implement --> Commit[/buddy:commit]
    Commit --> Done[Feature Complete]
```

**Steps**:
1. `/buddy:spec Add user authentication` - Define requirements
2. `/buddy:plan` - Create implementation strategy
3. `/buddy:tasks` - Break down into tasks
4. Implement the code following tasks
5. `/buddy:commit` - Commit with professional message

### Project Setup Workflow

```mermaid
flowchart LR
    Foundation[/buddy:foundation] --> Docs[/buddy:docs]
    Docs --> Persona[/buddy:persona]
    Persona --> Ready[Ready to Develop]
```

**Steps**:
1. `/buddy:foundation interactive` - Establish project principles
2. `/buddy:docs` - Generate comprehensive documentation
3. `/buddy:persona` - Use for ongoing development assistance

### Documentation Update Workflow

```bash
# When codebase changes significantly
/buddy:docs  # Regenerate documentation

# Or for specific questions
/buddy:persona scribe - Update API documentation for new endpoints
```

## Command Options and Flags

### Global Behavior

All commands respect:
- **Foundation alignment**: Check `directive/foundation.md`
- **Safety hooks**: File protection and command validation
- **Logging**: Activity logged if enabled in config

### Configuration Impact

Commands are affected by `buddy-config.json`:

```json
{
  "features": {
    "auto_commit": true,          // Affects /buddy:commit
    "documentation_generation": true,  // Enables /buddy:docs
    "personas": true              // Enables /buddy:persona
  }
}
```

## Error Handling

### Common Errors

**Foundation Not Found**:
```
Error: Foundation document not found at directive/foundation.md
Please run /buddy:foundation to create it first
```

**Feature Disabled**:
```
Error: Personas feature is disabled in buddy-config.json
Enable it by setting features.personas = true
```

**Prerequisites Missing**:
```
Error: No specification found for /buddy:plan
Please run /buddy:spec first to create a specification
```

### Error Resolution

1. **Check prerequisites**: Ensure required files/features exist
2. **Review configuration**: Verify feature flags in `buddy-config.json`
3. **Check permissions**: Ensure write access to output directories
4. **Review logs**: Check activity logs if logging enabled

## Performance Characteristics

| Command | Typical Duration | Dependencies |
|---------|-----------------|--------------|
| `/buddy:persona` | < 5 seconds | Persona files |
| `/buddy:foundation` | 1-3 minutes | User input |
| `/buddy:spec` | 30-90 seconds | Foundation |
| `/buddy:plan` | 1-2 minutes | Spec, foundation |
| `/buddy:tasks` | 30-90 seconds | Plan, spec |
| `/buddy:docs` | 3-5 minutes | Foundation, codebase |
| `/buddy:commit` | 10-30 seconds | Git history |

## Related Documentation

- [Architecture Components](./architecture-components.md) - Command implementation details
- [Development Setup](./development-setup.md) - Configuration guide
- [API Examples](./api-examples.md) - Real-world usage examples
