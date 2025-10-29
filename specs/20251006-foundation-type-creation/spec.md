# Default Feature Specification: Foundation Type Creation System

**Feature Branch**: `foundation-type-creator`
**Created**: 2025-10-06
**Status**: Ready for Review
**Input**: User description: "Create `/buddy:create-foundation-type` slash command and agent to enable Claude Buddy maintainers and end users to add new foundation types within their own projects"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors (users, agents), actions (create, generate, validate), data (foundation types, templates, context), constraints (validation, compatibility)
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing

### Primary User Story
As a Claude Buddy user working on a Spring Boot project, I want to create a "spring-boot" foundation type within my project so that all spec/plan/task/docs generation uses Spring Boot-specific templates and context, enabling Claude to provide more relevant and framework-aware assistance throughout my development workflow.

### Acceptance Scenarios
1. **Given** a user wants to create a new foundation type for Spring Boot, **When** they execute the foundation type creation command with "spring-boot" as the parameter, **Then** the system generates complete template scaffolding in the templates directory and creates the context directory structure for Spring Boot-specific knowledge

2. **Given** a user provides documentation URLs for their framework, **When** they include these URLs during foundation type creation, **Then** the system retrieves and processes the documentation content into context files that enhance AI understanding of the framework

3. **Given** a foundation type "django" already exists, **When** a user attempts to create another foundation type named "django", **Then** the system prevents the creation and displays a clear error message about the naming conflict

4. **Given** a new foundation type has been created, **When** any agent (spec-writer, plan-writer, etc.) is invoked on a project using that foundation type, **Then** the agent automatically loads and uses the custom templates and context files specific to that foundation type

5. **Given** a user runs the foundation type command without parameters, **When** the interactive mode launches, **Then** the system guides them through a wizard that collects all necessary information step-by-step

### Edge Cases
- What happens when a user tries to create a foundation type with invalid characters (spaces, special characters)?
- How does system handle network failures when fetching documentation from URLs?
- What happens when template generation is interrupted mid-process?
- How does the system behave if context files are malformed markdown?
- What happens when a foundation type name conflicts with existing ones?

## Requirements

### Functional Requirements

#### Foundation Type Creation
- **FR-001**: System MUST provide `/buddy:create-foundation-type` slash command for creating new foundation types
- **FR-002**: System MUST accept foundation type name as the primary parameter (e.g., `/buddy:create-foundation-type spring-boot`)
- **FR-003**: System MUST validate foundation type names to ensure they are lowercase, hyphenated, and contain no special characters
- **FR-004**: System MUST prevent creation of foundation types with names that already exist in the project
- **FR-005**: System MUST support an interactive wizard mode when no parameters are provided
- **FR-006**: System MUST accept optional description of the technology or framework
- **FR-007**: System MUST accept optional URLs or file paths to reference documentation for context generation
- **FR-008**: System MUST generate template files (spec.md, plan.md, tasks.md, docs.md) in `.claude-buddy/templates/{foundation-type}/`
- **FR-009**: System MUST create context directory at `.claude-buddy/context/{foundation-type}/` for framework-specific knowledge

#### Template Generation
- **FR-010**: System MUST generate customized versions of all four required templates (spec.md, plan.md, tasks.md, docs.md)
- **FR-011**: System MUST use "default" foundation type templates as the baseline starting point
- **FR-012**: Users MUST have complete freedom to customize templates for their framework needs
- **FR-013**: System MUST support framework-specific sections in templates (e.g., JHipster JDL entities, MuleSoft DataWeave)
- **FR-014**: System MUST validate that all generated templates are syntactically correct markdown
- **FR-015**: Templates MUST follow the existing template structure conventions (execution flow, quick guidelines, etc.)

#### Context Management
- **FR-016**: System MUST support adding multiple context files in markdown format to `.claude-buddy/context/{foundation-type}/`
- **FR-017**: System MUST support fetching framework documentation from provided URLs to create context files
- **FR-018**: System MUST support importing local markdown files as context
- **FR-019**: System MUST NOT enforce size limits on context files (user responsibility to manage)
- **FR-020**: System MUST store context files with descriptive names (e.g., `spring-boot-best-practices.md`, `spring-data-jpa.md`)
- **FR-021**: Context files MUST contain framework-specific best practices, patterns, and conventions that agents can reference

#### Foundation Type Discovery
- **FR-022**: System MUST discover available foundation types by scanning `.claude-buddy/templates/` directory
- **FR-023**: System MUST provide a command to list all available foundation types in the current project
- **FR-024**: System MUST validate that a foundation type's required templates exist (spec.md, plan.md, tasks.md, docs.md)
- **FR-025**: System MUST validate foundation type references in `directive/foundation.md` metadata field

#### Integration Requirements
- **FR-026**: All existing agents (spec-writer, plan-writer, tasks-writer, docs-generator, foundation) MUST work seamlessly with newly created foundation types without modification
- **FR-027**: Agents MUST automatically load templates from `.claude-buddy/templates/{foundation-type}/` based on the foundation type specified in `directive/foundation.md`
- **FR-028**: Agents MUST load ALL markdown files from `.claude-buddy/context/{foundation-type}/` when processing requests
- **FR-029**: The `/buddy:foundation` command MUST use context files to enhance principle derivation for framework-specific projects
- **FR-030**: Context content MUST inform specification requirements, planning steps, and documentation patterns

#### Foundation Type Selection
- **FR-031**: When multiple foundation types exist, system MUST prompt user to select which foundation type to use
- **FR-032**: System MUST provide a list of detected foundation types with confidence scores or suggested matches
- **FR-033**: System MUST allow explicit foundation type specification via command parameter
- **FR-034**: System MUST update `directive/foundation.md` metadata field with selected foundation type

#### User Experience
- **FR-035**: System MUST provide clear feedback during template and context generation
- **FR-036**: System MUST display validation messages for naming conflicts and invalid inputs
- **FR-037**: System MUST provide success confirmation showing created files and next steps
- **FR-038**: System MUST include help documentation with examples of common foundation types

#### Quality Assurance
- **FR-039**: System MUST validate that generated templates are syntactically correct markdown
- **FR-040**: System MUST handle errors gracefully with informative error messages
- **FR-041**: System MUST verify that all four required template files are created successfully
- **FR-042**: System MUST verify that context directory is created successfully

### Key Entities

- **Foundation Type**: Represents a specific technology stack or framework (e.g., spring-boot, django, fastapi) with associated templates and context knowledge. Contains metadata such as name, description, version, and creation date.

- **Template Set**: Collection of document templates (spec.md, plan.md, tasks.md, docs.md) customized for a specific foundation type. Each template contains framework-specific sections and guidance.

- **Context Knowledge**: Framework-specific best practices, patterns, and conventions stored as markdown files. Used by agents to enhance understanding and generate more relevant outputs.

- **Foundation Registry**: Central catalog of all available foundation types with their metadata, usage tracking, and version information.

- **Foundation Type Configuration**: Settings and preferences for a foundation type including optional sections, section ordering, validation rules, and quality checklists.

---

## Clarifications Received

All clarification questions have been answered:

1. **Security validation scope**: Not applicable - users manage their own context content
2. **Context file size limits**: No limits enforced - users manage context file sizes
3. **Deletion permanence**: Not applicable - users can manually delete directories if needed
4. **Versioning strategy**: Not applicable - simple directory-based foundation types without versioning
5. **Migration compatibility**: Not applicable - no automated migration system needed
6. **Context source validation**: Not applicable - users can provide any URLs they choose
7. **Template customization depth**: **Complete freedom** - users can fully customize templates for their needs
8. **Multi-language support**: Not applicable - English is standard, users can customize as needed
9. **Dependency management**: Not applicable - each foundation type is independent
10. **Conflict resolution**: **Prompt user with list of best guesses** - system suggests foundation types and lets user choose

---

## Assumptions Made

The following assumptions have been made based on the current system context:

1. Foundation types follow the existing directory structure at `.claude-buddy/templates/{foundation-type}/` and `.claude-buddy/context/{foundation-type}/`
2. The "default" foundation type serves as the baseline for creating new foundation types
3. Context files are markdown format (`.md`) for consistency with existing patterns
4. Foundation type names use lowercase, hyphenated naming (e.g., `spring-boot`, `django-rest`)
5. Each project uses one foundation type at a time, specified in `directive/foundation.md` metadata
6. Foundation types are project-local (not shared across different projects)

---

## Success Metrics

The feature will be considered successful when:

1. Users can create a new foundation type with `/buddy:create-foundation-type {name}` command
2. All four generated templates (spec.md, plan.md, tasks.md, docs.md) are immediately usable by existing agents
3. Context files loaded from provided URLs enhance agent understanding of the framework
4. Existing foundation types (default, jhipster, mulesoft) continue working without modification
5. Foundation type creation completes successfully with clear confirmation of created files
6. System handles naming conflicts and invalid inputs with clear error messages
7. When multiple foundation types exist, users are prompted with suggested options

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked and resolved
- [x] User scenarios defined
- [x] Requirements generated (42 functional requirements)
- [x] Entities identified
- [x] Review checklist passed

---