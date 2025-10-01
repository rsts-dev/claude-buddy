<!--
SYNC IMPACT REPORT
Version Change: N/A → 1.0.0
Bump Rationale: Initial foundation document creation for MuleSoft multi-project workspace

Modified Principles:
- N/A (initial creation)

Added Sections:
- Purpose: Establishes governance for MuleSoft API-Led architecture workspace
- Core Principles: 7 principles covering API-Led connectivity, reusability, template-driven development, test-first approach, error handling, semantic versioning, and phase-gated execution
- Governance: Amendment procedures, versioning policy, and compliance reviews
- Dependent Artifacts: References to MuleSoft-specific templates
- Foundation Metadata: Project classification and version tracking
- Review History: Initial ratification record

Removed Sections:
- N/A (initial creation)

Template Updates:
✅ /.claude-buddy/templates/mulesoft/plan.md - Verified alignment with principles
✅ /.claude-buddy/templates/mulesoft/spec.md - Verified alignment with principles
✅ /.claude-buddy/templates/mulesoft/tasks.md - Verified alignment with principles

Deferred Items:
- None

Generated: 2025-10-01T00:00:00Z
-->

# Project Foundation: MuleSoft API-Led Multi-Project Workspace

**Foundation Version**: 1.0.0
**Foundation Type**: mulesoft
**Ratified**: 2025-10-01
**Last Amended**: 2025-10-01

## Purpose

This foundation document establishes the core principles, standards, and governance procedures for a MuleSoft workspace containing multiple API projects organized by API-Led Connectivity layers (Experience APIs, Process APIs, System APIs) and shared modules/connectors.

The foundation serves as the authoritative source for:

- API-Led architecture principles and layer-specific design constraints
- MuleSoft development standards and best practices
- Template-driven development workflows
- Testing, error handling, and quality assurance requirements
- Versioning and deployment governance
- Phase-gated execution and compliance verification

All team members, development agents, and automated processes MUST adhere to these principles. Deviations require explicit documentation and justification through the amendment procedure defined in the Governance section.

## Core Principles

### Principle 1: API-Led Connectivity Architecture

**Requirements**:

All APIs MUST be classified into exactly one of three layers according to MuleSoft API-Led Connectivity principles:

- **System APIs**: Provide direct access to backend systems (databases, SaaS applications, legacy systems) with no business logic. System APIs MUST expose data and operations in a consistent, reusable manner independent of consumer needs. System APIs SHALL NOT contain data transformation logic beyond format normalization.

- **Process APIs**: Orchestrate multiple System APIs to implement business processes and workflows. Process APIs MUST contain business logic, data composition, and cross-system orchestration. Process APIs SHALL NOT directly access backend systems; they MUST call System APIs instead.

- **Experience APIs**: Tailor data and operations for specific consumer channels (mobile apps, web portals, partner integrations). Experience APIs MUST aggregate and shape data from Process APIs or System APIs to match consumer-specific requirements. Experience APIs SHALL NOT contain business logic; they focus on presentation and channel optimization.

Each API MUST document its layer assignment with explicit rationale. Layer violations (e.g., System API containing business logic, Process API accessing databases directly) require justification in the Complexity Tracking section of implementation plans.

**Rationale**:

API-Led Connectivity enables reusability, maintainability, and independent scaling of integration components. Clear layer boundaries prevent tight coupling and ensure APIs serve multiple consumers without modification.

**Compliance Verification**:

- API specifications MUST include "API Layer Classification" section with layer assignment and rationale
- Implementation plans MUST verify layer-appropriate design patterns
- Code reviews MUST validate layer boundaries are not violated
- APIs containing cross-layer responsibilities trigger compliance review

### Principle 2: Reusability and Shared Modules

**Requirements**:

Shared functionality MUST be extracted into reusable modules to avoid duplication across API projects:

- **Common DataWeave Libraries**: Transformation functions, validators, formatters MUST reside in shared modules, not duplicated per API
- **Error Handling Modules**: Standard error response formats, error transformations, and logging patterns MUST be centralized
- **Connector Configurations**: Reusable connector configurations for common systems (Salesforce, SAP, databases) MUST be packaged as shared modules
- **Security Policies**: Standard policies (OAuth 2.0, rate limiting, CORS) MUST be defined once and applied consistently via API Manager

Each API project MUST declare dependencies on shared modules in `pom.xml`. Updates to shared modules MUST follow semantic versioning to prevent breaking changes.

APIs MUST NOT contain hardcoded values; all configuration MUST be externalized to property files (`local.yaml`, `dev.yaml`, `prod.yaml`) to enable environment-specific deployments.

**Rationale**:

Reusability reduces maintenance burden, ensures consistency across APIs, and accelerates development by leveraging proven components. Centralized modules enable organization-wide improvements without modifying individual API projects.

**Compliance Verification**:

- Duplicate DataWeave transformations across projects trigger refactoring into shared libraries
- Hardcoded values in Mule flows fail code review
- Shared module dependencies MUST be declared explicitly in Maven POM files
- Version conflicts in shared dependencies require resolution before deployment

### Principle 3: Template-Driven Development

**Requirements**:

All API development workflows MUST follow standardized templates to ensure consistency, completeness, and quality:

- **API Specification Template** (`/.claude-buddy/templates/mulesoft/spec.md`): Defines consumer scenarios, functional requirements, API operations, data models, and security requirements without implementation details
- **Implementation Plan Template** (`/.claude-buddy/templates/mulesoft/plan.md`): Structures research, design, and task planning phases with foundation compliance checks
- **Task Generation Template** (`/.claude-buddy/templates/mulesoft/tasks.md`): Generates ordered, dependency-aware implementation tasks following TDD principles

Templates provide phase-gated execution flows that MUST be validated before progression. Templates MUST use absolute file paths (not relative paths) to ensure clarity and avoid ambiguity.

Agent-specific configuration updates (e.g., updating technology stacks, recent changes) MUST follow incremental O(1) patterns, appending new context without rewriting entire files.

**Rationale**:

Templates codify best practices, reduce cognitive load, and prevent missing critical steps (security, testing, error handling). Standardized workflows enable automation, parallelization, and predictable quality outcomes.

**Compliance Verification**:

- API projects lacking specification documents fail foundation check
- Implementation plans missing foundation compliance sections trigger review
- Task lists not following template structure (e.g., tests after implementation) are rejected
- Relative file paths in templates or documentation are corrected to absolute paths

### Principle 4: Test-First Development (TDD)

**Requirements**:

All MuleSoft APIs MUST follow Test-Driven Development principles with MUnit as the testing framework:

- **MUnit Contract Tests**: MUST validate API specifications (RAML/OAS) compliance for all operations before implementation. Contract tests ensure request/response formats, status codes, and data models match API specifications.

- **MUnit Integration Tests**: MUST validate end-to-end flows including DataWeave transformations, connector operations, and error handling. Integration tests MUST execute before flows are considered complete.

- **MUnit Unit Tests**: MUST validate individual components (DataWeave scripts, validation logic, error handlers) in isolation with mocked dependencies.

Tests MUST be written before corresponding implementation and MUST initially fail (proving they test real behavior, not placeholders). Implementation is complete only when all tests pass with >80% line coverage.

Connector dependencies MUST be mocked in MUnit tests using Spy and Mock processors to ensure tests run independently of external systems.

**Rationale**:

TDD ensures APIs behave as specified, prevents regressions, and provides living documentation. Failing-first tests validate test quality. High coverage thresholds ensure production-ready code quality.

**Compliance Verification**:

- Implementation tasks MUST NOT start until corresponding MUnit tests exist and fail
- Coverage reports <80% block deployment
- Tests passing before implementation indicate test quality issues requiring investigation
- Integration tests skipping connector mocking fail code review

### Principle 5: Explicit Error Handling

**Requirements**:

All MuleSoft APIs MUST implement comprehensive error handling at multiple levels:

- **Global Error Handlers**: MUST define standardized error response formats, log errors with correlation IDs, and transform technical errors into consumer-friendly messages
- **Flow-Specific Error Handlers**: MUST handle operation-specific error scenarios (validation failures, connector errors, timeout exceptions)
- **DataWeave Error Handling**: MUST include defensive transformations using `default` values and `try/catch` constructs to prevent null pointer exceptions

Error responses MUST follow a standard format including:
- HTTP status code (400 for client errors, 500 for server errors, etc.)
- Error code (e.g., "VALIDATION_FAILED", "SYSTEM_UNAVAILABLE")
- Human-readable error message
- Correlation ID for request tracing
- Timestamp

Errors MUST be logged with sufficient context (request details, system state) to enable debugging without exposing sensitive data (passwords, tokens, PII).

**Rationale**:

Explicit error handling prevents cascading failures, provides actionable feedback to API consumers, and enables rapid incident diagnosis. Standardized error formats simplify client-side error handling across all APIs.

**Compliance Verification**:

- APIs without global error handlers fail foundation check
- Error responses not matching standard format trigger refactoring
- Errors logged without correlation IDs fail observability review
- DataWeave scripts lacking defensive patterns (e.g., null handling) are flagged in code review

### Principle 6: Semantic Versioning and Change Management

**Requirements**:

All APIs and shared modules MUST follow semantic versioning (MAJOR.MINOR.PATCH) to communicate change impact:

- **MAJOR version (X.0.0)**: Breaking changes that require consumer updates (removing endpoints, changing request/response formats, incompatible security policy changes)
- **MINOR version (X.Y.0)**: Backward-compatible additions (new endpoints, optional request parameters, additional response fields)
- **PATCH version (X.Y.Z)**: Backward-compatible fixes (bug fixes, performance improvements, documentation updates)

API specifications MUST include version in URL path (e.g., `/api/v1/customers`) or header (`X-API-Version: 1`). Multiple major versions MAY coexist during deprecation periods (e.g., v1 and v2 running concurrently).

Git branches MUST follow naming convention: `[issue-number]-[api-name]` (e.g., `123-customer-api`). Commit messages MUST be professional and describe actual changes without AI attribution (per project standards).

Deprecation notices MUST provide minimum 6-month migration period before removing major versions. Deprecated APIs MUST return `Deprecation` header with sunset date.

**Rationale**:

Semantic versioning enables API consumers to assess change impact and plan migrations. Version governance prevents breaking changes from disrupting production systems. Clear deprecation policies balance innovation with stability.

**Compliance Verification**:

- Breaking changes without MAJOR version bump fail API Manager approval
- APIs lacking version in URL/header are rejected in specification review
- Commit messages containing AI attribution are corrected before merge
- Deprecated APIs without migration documentation block version promotion

### Principle 7: Phase-Gated Execution with Foundation Checks

**Requirements**:

All API development MUST progress through defined phases with validation gates:

**Phase 0: Specification** - Define consumer requirements, API operations, and acceptance criteria without implementation details. Output: `spec.md` with all `[NEEDS CLARIFICATION]` markers resolved.

**Phase 1: Research** - Investigate technical unknowns (connector versions, security policy configurations, API-Led layer boundaries). Output: `research.md` with documented decisions and rationales.

**Phase 2: Design & Contracts** - Create API specifications (RAML/OAS), DataWeave mappings, error handling strategies, and failing MUnit tests. Output: `api-specification.raml`, `dataweave/mappings.md`, `error-handlers.md`, `policies.json`, `munit/test-plan.md`.

**Phase 3: Task Generation** - Generate ordered implementation tasks from design documents following TDD principles. Output: `tasks.md` with numbered tasks, parallel execution markers, and dependency graph.

**Phase 4: Implementation** - Execute tasks to implement flows, transformations, and configurations. All MUnit tests MUST pass with >80% coverage.

**Phase 5: Validation** - Deploy to test environment, validate performance (<500ms p95 latency), apply security policies in API Manager, and complete integration testing.

**Foundation Checks** MUST be performed at phase boundaries:
- After Phase 0: Validate layer assignment and consumer scenarios
- After Phase 2: Verify design adheres to all principles (reusability, error handling, testing)
- After Phase 4: Confirm implementation matches design and all tests pass

Progression to next phase is blocked if foundation checks fail. Violations require documentation in Complexity Tracking section with justification.

**Rationale**:

Phase gates prevent expensive rework by catching design issues early. Foundation checks ensure principles are enforced systematically, not as afterthoughts. Clear phase outputs enable parallelization and handoffs between team members or agents.

**Compliance Verification**:

- Implementation starting before specification completion triggers process violation
- Design documents missing foundation check sections fail review
- Tasks generated without dependency analysis create execution errors
- Deployment without passing all MUnit tests and foundation checks is blocked

## Governance

### Amendment Procedure

Foundation amendments may be proposed by any team member or development agent. Amendments follow this process:

1. **Proposal**: Submit amendment as pull request modifying `/.claude-buddy/foundation.md` with:
   - Sync Impact Report documenting version change rationale
   - Updated principle text with clear requirements
   - Modified dependent templates to maintain consistency
   - Justification explaining need for change

2. **Review**: Technical leads and stakeholders review for:
   - Alignment with MuleSoft best practices and API-Led principles
   - Impact on existing APIs and shared modules
   - Completeness of template updates
   - Clarity and testability of updated principles

3. **Approval**: Amendments require approval from:
   - Integration Architecture team (for API-Led and reusability principles)
   - Development Lead (for technical standards and tooling changes)
   - Product Owner (for governance and compliance impacts)

4. **Propagation**: After approval:
   - Update `LAST_AMENDED_DATE` to current date
   - Increment `FOUNDATION_VERSION` per semantic versioning rules
   - Synchronize all dependent templates and documentation
   - Communicate changes to all teams via release notes

5. **Enforcement**: New principles take effect immediately for new APIs. Existing APIs MUST comply by next major version release or during next significant refactoring.

### Versioning Policy

Foundation document versions follow semantic versioning:

- **MAJOR (X.0.0)**: Backward-incompatible changes (removing principles, redefining API-Led layer boundaries, fundamental workflow changes). Requires existing APIs to undergo compliance review and potential refactoring.

- **MINOR (X.Y.0)**: New principles added, sections materially expanded, or new governance procedures introduced. Existing APIs SHOULD adopt new principles during next update but are not forced to refactor immediately.

- **PATCH (X.Y.Z)**: Clarifications, wording improvements, typo fixes, non-semantic refinements. No impact on existing APIs.

Version history is maintained in Review History section. Each version MUST document changes, rationale, and affected artifacts.

### Compliance Reviews

**Scheduled Reviews**:
- **Quarterly**: Review all active API projects for foundation compliance. Non-compliant APIs receive remediation plan with 30-day correction deadline.
- **Pre-Deployment**: All APIs undergo foundation check before production promotion. Blocking violations prevent deployment.
- **Post-Incident**: After production incidents, conduct compliance audit to determine if principle violations contributed to failure.

**Review Criteria**:
- API specifications include layer classification and consumer scenarios
- Implementation plans document foundation compliance checks
- MUnit tests exist for all flows with >80% coverage
- Error handling follows standard format
- Shared modules are used instead of duplicated code
- Security policies are applied via API Manager
- Semantic versioning is followed for all changes

**Non-Compliance Handling**:
- **Minor Violations** (missing documentation, incomplete tests): Logged as technical debt, corrected in next sprint
- **Major Violations** (wrong API layer, missing error handling, no tests): Block deployment, require immediate remediation
- **Repeated Violations**: Escalated to technical leads for process improvement or additional training

Compliance metrics (% APIs compliant, average remediation time, violation categories) are reported monthly to integration leadership.

## Dependent Artifacts

The following templates and documentation files depend on this foundation and MUST remain synchronized with principle updates:

**MuleSoft Workflow Templates**:
- `/.claude-buddy/templates/mulesoft/plan.md` - References all principles in Foundation Check section
- `/.claude-buddy/templates/mulesoft/spec.md` - Enforces API Layer Classification and Consumer Scenarios principles
- `/.claude-buddy/templates/mulesoft/tasks.md` - Implements Test-First Development and Phase-Gated Execution principles

**Command Documentation**:
- `/.claude-buddy/templates/commands/*.md` - Generic guidance MUST NOT contradict foundation principles

**Agent Configuration**:
- Agent-specific context files MUST reference foundation version for compatibility tracking

**Project Documentation**:
- `README.md` (if present) - Onboarding documentation MUST reference foundation for new team members
- `docs/architecture.md` (if present) - Architectural decisions MUST align with API-Led Connectivity principles

Any addition or removal of principles requires reviewing all dependent artifacts for consistency. Template updates are tracked in Sync Impact Report prepended to foundation document after amendments.

## Foundation Metadata

**Project Type**: MuleSoft Multi-Project Workspace
**Primary Technology**: MuleSoft Anypoint Platform, Mule Runtime 4.x
**Architecture Pattern**: API-Led Connectivity (System/Process/Experience layers)
**Development Methodology**: Template-Driven Development, Test-Driven Development (MUnit)
**Deployment Targets**: CloudHub 2.0, CloudHub 1.0, Runtime Fabric, Hybrid
**Testing Framework**: MUnit 2.x with >80% coverage requirement
**Versioning Strategy**: Semantic Versioning (MAJOR.MINOR.PATCH)
**Security Standards**: OAuth 2.0, Client ID Enforcement, Rate Limiting via API Manager

**Organizational Context**:
- Multiple API projects grouped by API-Led layer
- Shared modules for common DataWeave libraries, connectors, and error handlers
- Centralized governance via foundation document and template-driven workflows

## Review History

### Version 1.0.0 (2025-10-01)
**Type**: Initial Ratification
**Changes**: Established foundational principles for MuleSoft API-Led multi-project workspace
**Rationale**: Codify MuleSoft best practices and API-Led Connectivity principles into enforceable governance document
**Approved By**: Foundation Architect (initial creation)
**Affected Artifacts**: All MuleSoft workflow templates created to align with principles

**Key Principles Established**:
1. API-Led Connectivity Architecture (System/Process/Experience layers)
2. Reusability and Shared Modules
3. Template-Driven Development
4. Test-First Development (TDD with MUnit)
5. Explicit Error Handling
6. Semantic Versioning and Change Management
7. Phase-Gated Execution with Foundation Checks

**Next Review Scheduled**: 2026-01-01 (Quarterly compliance review)
