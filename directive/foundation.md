<!--
SYNC IMPACT REPORT
Version Change: 1.0.0 → 2.0.0
Bump Rationale: Major version update for installation script implementation

Modified Principles:
- N/A (initial creation)

Added Sections:
- Purpose: Defines project mission and value proposition
- Core Principles: 5 foundational principles established
- Governance: Amendment procedures and compliance framework
- Dependent Artifacts: Template and documentation dependencies
- Foundation Metadata: Version tracking and review history

Removed Sections:
- N/A (initial creation)

Template Updates:
✅ /.claude-buddy/templates/default/plan.md - Verified foundation check alignment
✅ /.claude-buddy/templates/default/spec.md - No updates required (template compatible)
✅ /.claude-buddy/templates/default/tasks.md - No updates required (template compatible)
✅ /.claude-buddy/templates/default/docs.md - No updates required (template compatible)
➖ /.claude-buddy/templates/commands/*.md - No changes required

Deferred Items:
- None

Generated: 2025-10-02T16:55:00Z
-->

# Claude Buddy Project Foundation

## Purpose

Claude Buddy is an AI assistant configuration framework that enhances Claude Code with specialized personas, automated workflows, and intelligent context management. This project provides a comprehensive ecosystem for developers to leverage domain-specific AI expertise through configurable personas, Python-based safety hooks, and template-driven document generation, distributed via NPM for easy installation and updates.

## Core Principles

### Principle 1: Modular Extensibility
The system MUST be designed as a collection of modular, pluggable components that can be independently configured, extended, or replaced without affecting the core framework.

**Requirements:**
- All personas SHALL be defined as independent configuration modules in `.claude-buddy/personas/`
- Hooks MUST be implemented as standalone Python scripts using the cchooks library
- Templates SHALL be organized by foundation type allowing project-specific customization
- Commands and agents MUST follow a standardized interface for registration and invocation

**Rationale:** Modularity enables teams to adapt Claude Buddy to their specific needs without forking the entire framework, promotes code reuse, and simplifies maintenance and testing of individual components.

**Compliance Verification:**
- Review that new features are implemented as plugins or extensions
- Verify persona definitions are self-contained configuration files
- Check that hooks follow the cchooks interface patterns
- Ensure templates maintain foundation type separation

### Principle 2: Safety-First Automation
All automated operations MUST prioritize safety through multiple validation layers, with explicit protections against destructive actions and clear user consent mechanisms.

**Requirements:**
- Pre-execution hooks SHALL validate all file modifications and command executions
- Dangerous operations (rm -rf, sudo, format) MUST be blocked by default
- Protected file patterns SHALL prevent modification of sensitive files (.env, secrets, keys)
- All automated commits MUST preserve authorship and include clear change descriptions
- Hook timeouts MUST be enforced (default 10s for validation, 30s for formatting)

**Rationale:** Automated AI assistance carries inherent risks of unintended consequences. Multiple safety layers ensure that automation enhances productivity without compromising security or data integrity.

**Compliance Verification:**
- Audit hook configurations for proper matcher patterns
- Test dangerous command blocking in command-validator.py
- Verify file protection patterns in file-guard.py
- Review git operations for proper attribution

### Principle 3: Contextual Intelligence
The system SHALL leverage contextual understanding through foundation documents, project templates, and session memory to provide relevant and consistent AI assistance.

**Requirements:**
- Foundation documents MUST serve as the single source of truth for project principles
- Personas SHALL maintain session memory for context continuity
- Auto-activation MUST use confidence scoring (threshold: 0.7) for persona selection
- Templates SHALL propagate foundation principles to all generated artifacts
- Context directories MAY provide stack-specific guidance for enhanced relevance

**Rationale:** Contextual awareness enables Claude Buddy to provide assistance that aligns with project goals, maintains consistency across interactions, and reduces the need for repetitive context setting.

**Compliance Verification:**
- Check foundation document references in generated content
- Verify persona activation logs show confidence scores
- Review template outputs for foundation alignment
- Test session memory persistence across interactions

### Principle 4: Developer Experience Excellence
The framework MUST provide an intuitive, discoverable interface with comprehensive documentation, clear error messages, and progressive disclosure of advanced features.

**Requirements:**
- Slash commands SHALL follow the `/buddy:command` naming convention
- All commands MUST include help text and usage examples
- Error messages SHALL provide actionable resolution steps
- Documentation MUST cover quick start, common tasks, and API reference
- Advanced features MAY be accessed through configuration without cluttering basic usage

**Rationale:** A tool's effectiveness is limited by its usability. Excellent developer experience ensures rapid adoption, reduces support burden, and maximizes the value delivered to users.

**Compliance Verification:**
- Test command discovery and help systems
- Review error messages for clarity and actionability
- Validate documentation completeness and accuracy
- Survey user feedback on interface intuitiveness

### Principle 5: Transparent Collaboration
AI-assisted operations SHALL maintain transparency through clear attribution, detailed logging, and human-readable outputs that preserve decision accountability.

**Requirements:**
- AI contributions MUST NOT be attributed in git commits or public artifacts
- Hook activities SHALL be logged with configurable verbosity levels
- Persona reasoning and confidence scores MUST be available for review
- Generated content SHALL include clear indicators of automated generation where appropriate
- Human review and approval workflows MUST be supported for critical operations

**Rationale:** Transparency builds trust in AI assistance, enables debugging of automated decisions, maintains professional standards in code attribution, and ensures human accountability for all changes.

**Compliance Verification:**
- Audit git commits for absence of AI attribution
- Review log files for appropriate detail levels
- Check persona activation logs for reasoning traces
- Verify critical operations require explicit approval

## Governance

### Amendment Procedure
1. Proposed changes to this foundation MUST be submitted as a specification using `/buddy:spec`
2. Changes affecting core principles require review by project maintainers
3. Minor clarifications may be applied through pull requests with maintainer approval
4. All amendments SHALL be documented in the Sync Impact Report

### Versioning Policy
This foundation follows semantic versioning:
- **MAJOR (X.0.0)**: Removal or fundamental redefinition of principles, breaking changes to governance structure
- **MINOR (x.Y.0)**: Addition of new principles, material expansion of requirements, new governance procedures
- **PATCH (x.y.Z)**: Clarifications, wording improvements, typo fixes, formatting adjustments

### Compliance Reviews
- Quarterly reviews SHALL assess adherence to foundation principles
- New features MUST include foundation compliance assessment in design phase
- Pull requests affecting core functionality require foundation alignment verification
- Violations SHALL be tracked and addressed in subsequent releases

## Dependent Artifacts

### Primary Templates
- `/.claude-buddy/templates/default/spec.md` - Specification generation template
- `/.claude-buddy/templates/default/plan.md` - Implementation planning template
- `/.claude-buddy/templates/default/tasks.md` - Task breakdown template
- `/.claude-buddy/templates/default/docs.md` - Documentation generation template

### Configuration Files
- `/.claude-buddy/buddy-config.json` - Framework configuration
- `/.claude/hooks.json` - Hook registration and configuration
- `/.claude-buddy/personas/` - Persona definition modules

### Command Definitions
- `/.claude/commands/buddy/` - Slash command implementations
- `/.claude/agents/` - Specialized agent protocols

## Foundation Metadata

**Foundation Type**: default
**Version**: 2.0.0
**Ratification Date**: 2025-10-02
**Last Amended**: 2025-10-02

## Review History

| Date | Version | Changes | Reviewer |
|------|---------|---------|----------|
| 2025-10-02 | 2.0.0 | Major version bump for installation script | Foundation Agent |
| 2025-10-02 | 1.0.0 | Initial foundation creation | Foundation Agent |

---

*This foundation serves as the governing document for the Claude Buddy project. All development activities, architectural decisions, and feature implementations must align with these principles.*