---
description: "Implementation plan for foundation type creation system"
---

# Implementation Plan: Foundation Type Creation System

**Branch**: `foundation-type-creator`
**Spec**: `/Users/ogarcia/Workspaces/ws-rsts-dev/claude-buddy/specs/20251006-foundation-type-creation/spec.md`
**Created**: 2025-10-06
**Status**: Draft
**Input**: Feature specification from `/specs/20251006-foundation-type-creation/spec.md`

## Execution Flow (/buddy:plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Foundation Check section based on the content of the foundation document.
4. Evaluate Foundation Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Foundation Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. Re-evaluate Foundation Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Foundation Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /buddy:tasks command
```

**IMPORTANT**: The /buddy:plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /buddy:tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Create a slash command `/buddy:create-foundation-type` and supporting agent that enables Claude Buddy users to add new foundation types (like spring-boot, django, fastapi) within their projects. This system will generate customized templates and context files that all existing buddy agents (spec-writer, plan-writer, tasks-writer, docs-generator) will automatically use for framework-specific assistance.

## Technical Context
**Language/Version**: TypeScript/JavaScript (Node.js 18+) for slash command, Python 3.9+ for agent implementation
**Primary Dependencies**: Node.js filesystem APIs, Python asyncio, cchooks library, markdown parsing libraries
**Storage**: File system based (.claude-buddy/templates/, .claude-buddy/context/)
**Testing**: Jest for JavaScript components, pytest for Python agent
**Target Platform**: Cross-platform (macOS, Linux, Windows with WSL)
**Project Type**: single - CLI tool integration with Claude Code
**Performance Goals**: Template generation < 5 seconds, context retrieval < 10 seconds
**Constraints**: Must not break existing foundation types (default, jhipster, mulesoft)
**Scale/Scope**: Support unlimited foundation types per project, typical usage 1-5 types

## Foundation Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `/directive/foundation.md` v2.0.0, verify compliance with:

### Principle 1: Modular Extensibility
- [x] Feature components are designed as independent modules
- [x] New functionality extends without modifying core framework
- [x] Templates and configurations are properly isolated

### Principle 2: Safety-First Automation
- [x] All automated operations include validation steps
- [x] Destructive operations are explicitly protected
- [x] Error handling prevents unintended consequences

### Principle 3: Contextual Intelligence
- [x] Design leverages foundation document principles
- [x] Context from previous phases propagates forward
- [x] Templates maintain consistency with project patterns

### Principle 4: Developer Experience Excellence
- [x] Clear documentation for all new components
- [x] Error messages provide actionable guidance
- [x] Progressive disclosure of advanced features

### Principle 5: Transparent Collaboration
- [x] Changes maintain clear attribution trails
- [x] Automated operations are logged appropriately
- [x] Human review points are explicitly defined

**Violations Requiring Justification**: None - design fully complies with foundation principles

## Project Structure

### Documentation (this feature)
```
specs/20251006-foundation-type-creation/
├── plan.md              # This file (/buddy:plan command output)
├── research.md          # Phase 0 output (/buddy:plan command)
├── data-model.md        # Phase 1 output (/buddy:plan command)
├── quickstart.md        # Phase 1 output (/buddy:plan command)
├── contracts/           # Phase 1 output (/buddy:plan command)
└── tasks.md             # Phase 2 output (/buddy:tasks command - NOT created by /buddy:plan)
```

### Source Code (repository root)
```
# Claude Buddy structure for foundation type creation
.claude/
├── commands/
│   └── buddy/
│       └── create-foundation-type.md    # Slash command definition
└── agents/
    └── foundation-type-creator.md       # Agent implementation

.claude-buddy/
├── templates/
│   ├── default/                        # Existing default templates
│   ├── jhipster/                       # Existing JHipster templates
│   ├── mulesoft/                       # Existing MuleSoft templates
│   └── {new-foundation-type}/          # New foundation type templates
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       └── docs.md
├── context/
│   ├── default/                        # Existing default context
│   └── {new-foundation-type}/          # New foundation type context
│       └── *.md                        # Framework-specific context files
└── lib/
    ├── foundation-validator.js         # Validation utilities
    ├── template-generator.js           # Template generation logic
    └── context-fetcher.js              # Documentation retrieval

tests/
├── unit/
│   ├── foundation-validator.test.js
│   ├── template-generator.test.js
│   └── context-fetcher.test.js
├── integration/
│   └── foundation-type-creation.test.js
└── contract/
    └── foundation-type-api.test.js
```

**Structure Decision**: Single project structure chosen as this is a CLI tool extension integrated with Claude Code, not requiring separate frontend/backend components.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - [NEEDS CLARIFICATION: Should the system support importing templates from external repositories or only generate from defaults?]
   - [NEEDS CLARIFICATION: What validation should be performed on URLs provided for documentation fetching (security, format, reachability)?]
   - [NEEDS CLARIFICATION: Should foundation types support versioning (e.g., spring-boot-2.x vs spring-boot-3.x)?]
   - [NEEDS CLARIFICATION: How should the system handle partial failures during template generation (rollback, continue, or manual cleanup)?]
   - [NEEDS CLARIFICATION: Should there be a maximum number of context files or total size limit per foundation type?]

2. **Generate and dispatch research agents**:
   ```
   Task: "Research best practices for template generation in Node.js"
   Task: "Find patterns for safe URL fetching and content sanitization"
   Task: "Research markdown parsing and validation libraries"
   Task: "Investigate interactive CLI wizards (inquirer.js patterns)"
   Task: "Research file system transaction patterns for atomic operations"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: Template generation using mustache/handlebars
   - Rationale: Widely adopted, secure, well-documented
   - Alternatives considered: EJS, custom string replacement

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - FoundationType entity with name, description, version, createdAt
   - TemplateSet entity with spec, plan, tasks, docs templates
   - ContextKnowledge entity with source, content, metadata
   - FoundationRegistry tracking all types and usage

2. **Generate API contracts** from functional requirements:
   - POST /buddy/foundation-types - Create new foundation type
   - GET /buddy/foundation-types - List available types
   - GET /buddy/foundation-types/{name} - Get specific type details
   - DELETE /buddy/foundation-types/{name} - Remove foundation type
   - POST /buddy/foundation-types/{name}/context - Add context file

3. **Generate contract tests** from contracts:
   - Test foundation type creation with valid/invalid names
   - Test duplicate name prevention
   - Test template generation completeness
   - Test context file addition and retrieval

4. **Extract test scenarios** from user stories:
   - Create spring-boot foundation type successfully
   - Handle documentation URL fetching with retries
   - Prevent duplicate foundation type names
   - Interactive wizard flow completion
   - Agent loading of custom templates

5. **Update agent file incrementally**:
   - Add foundation type creation patterns to CLAUDE.md
   - Document template customization guidelines
   - Include context file best practices

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /buddy:tasks command will do - DO NOT execute during /buddy:plan*

**Task Generation Strategy**:
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each entity → model creation task [P]
- Slash command implementation task
- Agent implementation task
- Template generation logic tasks [P]
- Context fetching logic tasks [P]
- Validation logic tasks [P]
- Interactive wizard tasks
- Integration test tasks
- Documentation update tasks

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Validators → Generators → Commands → Agent
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /buddy:tasks command, NOT by /buddy:plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /buddy:plan command*

**Phase 3**: Task execution (/buddy:tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following foundational principles)
**Phase 5**: Validation (run tests, execute quickstart.md, verify agent integration)

## Complexity Tracking
*No violations requiring justification - design fully complies with foundation principles*

## Areas Requiring Clarification

The following aspects need clarification before proceeding to implementation:

1. **Template Import Strategy**: [NEEDS CLARIFICATION: Should the system support importing templates from external repositories (GitHub, GitLab) or only generate from the default foundation type templates?]

2. **URL Validation Depth**: [NEEDS CLARIFICATION: What level of validation should be performed on documentation URLs - just format checking, or also verify reachability, SSL certificates, and content type?]

3. **Foundation Type Versioning**: [NEEDS CLARIFICATION: Should foundation types support versioning to handle different framework versions (e.g., spring-boot-2.x vs spring-boot-3.x) or keep it simple with one version per type?]

4. **Failure Handling Strategy**: [NEEDS CLARIFICATION: During template generation, if one file fails, should the system rollback all changes, continue with remaining files, or leave partial state for manual cleanup?]

5. **Context Storage Limits**: [NEEDS CLARIFICATION: Should there be limits on the number of context files or total storage size per foundation type to prevent excessive token consumption?]

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/buddy:plan command)
- [ ] Phase 1: Design complete (/buddy:plan command)
- [ ] Phase 2: Task planning complete (/buddy:plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/buddy:tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Foundation Check: PASS
- [ ] Post-Design Foundation Check: PENDING
- [ ] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Foundation v2.0.0 - See `/directive/foundation.md` for complete principles and governance*