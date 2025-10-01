<!--
SYNC IMPACT REPORT
Version Change: N/A → 1.0.0
Bump Rationale: Initial foundation creation for MuleSoft multi-project architecture

Modified Principles:
- N/A (initial creation)

Added Sections:
- Complete foundation document created from codebase analysis and MuleSoft context
- 7 core principles derived from API-Led Connectivity patterns
- Governance procedures for multi-project MuleSoft architecture
- Dependent artifacts catalog

Removed Sections:
- N/A (initial creation)

Template Updates:
✅ /.claude-buddy/templates/mulesoft/plan.md - Verified alignment with foundation principles
✅ /.claude-buddy/templates/mulesoft/spec.md - Verified alignment with foundation principles
➖ /.claude-buddy/templates/mulesoft/tasks.md - No changes required (structure compatible)
➖ /.claude-buddy/templates/commands/*.md - No changes required

Deferred Items:
- None

Generated: 2025-10-01T00:00:00Z
-->

# MuleSoft Multi-Project API Foundation

**Foundation Version**: 1.0.0
**Ratification Date**: 2025-10-01
**Last Amended**: 2025-10-01
**Foundation Type**: mulesoft

---

## Purpose

This foundation establishes the architectural principles, governance procedures, and quality standards for a MuleSoft-based API ecosystem organized into multiple projects categorized by API type (Experience APIs, Process APIs, System APIs) and shared modules/connectors.

This foundation serves as:
- The authoritative source of architectural decisions for all MuleSoft API projects
- A governance framework for maintaining consistency across experience, process, and system layers
- A quality gate ensuring adherence to API-Led Connectivity principles
- A reference for onboarding new team members and stakeholders

**Target Audience**: MuleSoft developers, solution architects, DevOps engineers, tech leads, and API governance teams.

---

## Core Principles

### Principle 1: API-Led Connectivity Architecture

All API implementations MUST adhere to the three-layer API-Led Connectivity pattern, with each layer having distinct responsibilities and no layer circumvention permitted.

**Requirements**:
- System APIs MUST provide direct access to backend systems (databases, legacy systems, SaaS) with CRUD operations only
- System APIs MUST NOT contain business logic, data orchestration, or cross-system aggregation
- Process APIs MUST orchestrate multiple System APIs and apply business rules, but MUST NOT access backends directly
- Process APIs MUST be reusable across multiple consumer channels
- Experience APIs MUST serve specific consumer needs (mobile, web, partner) by composing Process APIs
- Experience APIs MUST NOT contain business logic or direct backend access
- All APIs MUST be versioned independently following semantic versioning (v1, v2, etc.)
- API layer assignment MUST be documented with explicit rationale in specification documents

**Rationale**: API-Led Connectivity maximizes reusability, enables independent scaling, simplifies maintenance, and provides clear ownership boundaries. The three-layer pattern prevents tight coupling between consumers and backend systems while promoting composability.

**Compliance Verification**:
- Code reviews MUST verify no System API contains business logic
- Architecture reviews MUST confirm Process APIs don't bypass System layer
- API specifications MUST declare layer assignment with justification
- Deployment pipeline MUST validate layer-appropriate dependencies

---

### Principle 2: Contract-First API Development

All APIs MUST follow a RAML-first or OpenAPI Specification (OAS) approach where the API contract is designed, reviewed, and published to Anypoint Exchange before implementation begins.

**Requirements**:
- API specifications MUST be created in RAML 1.0 or OpenAPI 3.0 format before any Mule flow implementation
- Specifications MUST define all resources, methods, request/response schemas, and error responses
- Specifications MUST include examples for all operations
- Specifications MUST be published to Anypoint Exchange for stakeholder review
- APIkit scaffolding MUST be generated from the approved specification
- Contract tests MUST validate implementation against specification
- Breaking changes MUST trigger major version increment

**Rationale**: Contract-first development enables early stakeholder feedback, parallel development of consumers and providers, automatic flow scaffolding, and clear API contracts that reduce integration issues.

**Compliance Verification**:
- CI/CD pipeline MUST fail if API implementation diverges from specification
- Code reviews MUST verify RAML/OAS exists before flow implementation
- Exchange publication MUST precede deployment to any environment
- MUnit contract tests MUST achieve 100% specification coverage

---

### Principle 3: Configuration Externalization and Security

All environment-specific configuration, credentials, and sensitive data MUST be externalized from source code and encrypted at rest, with zero hardcoded values in Mule XML or DataWeave scripts.

**Requirements**:
- All connector configurations MUST reference property placeholders (e.g., `${db.host}`)
- Environment-specific properties MUST be stored in separate YAML files (dev.yaml, test.yaml, staging.yaml, prod.yaml)
- Credentials, API keys, and secrets MUST be encrypted using Mule Secure Properties or external secret managers
- Property encryption keys MUST NOT be committed to version control
- Global connector configurations MUST be defined in `global-config.xml` and reused across flows
- Database connection pools MUST be configured per environment load requirements
- No IP addresses, hostnames with credentials, or passwords MUST appear in source code

**Rationale**: Externalized configuration enables environment portability, simplifies deployment automation, prevents credential exposure, and ensures compliance with security policies (PCI-DSS, HIPAA, SOC 2).

**Compliance Verification**:
- Static code analysis MUST detect hardcoded credentials or URLs
- Code reviews MUST reject commits containing unencrypted sensitive values
- CI/CD pipeline MUST validate property file encryption
- Security audits MUST verify zero credentials in version control history

---

### Principle 4: Comprehensive Error Handling and Logging

All APIs MUST implement a three-level error handling strategy (processor-level try-catch, flow-level error handlers, global error handlers) with structured logging and standardized error response formats.

**Requirements**:
- Global error handler MUST be defined in `error-handlers/global-error-handler.xml` for application-wide fallback
- Flow-level error handlers MUST handle flow-specific errors (validation failures, duplicate keys, authorization)
- Processor-level try-catch MUST surround critical operations with fallback behavior
- Error responses MUST follow standard format: `{error: {code, message, timestamp, correlationId, details[]}}`
- Errors MUST NOT expose internal system details (database connection strings, stack traces) to consumers
- All flows MUST log entry/exit with INFO level including correlation IDs
- External API calls MUST log request/response at DEBUG level
- Errors MUST log with ERROR level including context and correlation IDs
- Sensitive data (passwords, PII, credit cards) MUST NOT be logged
- Production logging MUST use asynchronous appenders with log rotation

**Rationale**: Comprehensive error handling ensures graceful degradation, predictable consumer experience, operational visibility, security compliance, and simplified troubleshooting. Structured logging enables centralized monitoring and alerting.

**Compliance Verification**:
- Code reviews MUST verify global error handler is referenced in all flows
- MUnit tests MUST cover all error scenarios defined in API specification
- Security reviews MUST confirm no sensitive data appears in logs
- Deployment validation MUST verify log configuration per environment

---

### Principle 5: Test-Driven Development with MUnit

All API implementations MUST follow TDD principles where MUnit tests (contract tests, unit tests, integration tests) are written before flow implementation and achieve minimum 80% code coverage.

**Requirements**:
- Contract tests MUST validate API implementation against RAML/OAS specification before any flow logic
- Unit tests MUST cover individual flow components with mocked connectors
- Integration tests MUST verify end-to-end flows with test data
- MUnit tests MUST be organized in `/src/test/munit/` with subfolders: `contract/`, `unit/`, `integration/`
- All tests MUST run successfully in CI/CD pipeline before deployment
- Code coverage MUST be measured with MUnit Coverage plugin and meet 80% minimum
- Negative test cases MUST cover all error scenarios documented in API specification
- Mock services MUST be used for external dependencies during testing
- Test data MUST be stored in `/src/test/resources/` separate from test logic
- Performance tests MUST validate latency requirements for critical operations

**Rationale**: TDD ensures APIs meet specifications before delivery, reduces regression risks, enables confident refactoring, documents expected behavior, and maintains high code quality through measurable coverage metrics.

**Compliance Verification**:
- CI/CD pipeline MUST fail if coverage drops below 80%
- Code reviews MUST verify tests exist before flow implementation
- Deployment gates MUST block promotion if tests fail
- Test reports MUST be published to build artifacts

---

### Principle 6: Reusability Through Shared Modules

Common functionality, DataWeave libraries, error handlers, and connector configurations MUST be extracted into shared modules published to Anypoint Exchange for reuse across all API projects.

**Requirements**:
- Shared modules MUST be created for reusable components (common error handlers, DataWeave utility functions, standard validators)
- Shared modules MUST be published to Anypoint Exchange with semantic versioning
- Shared modules MUST have their own CI/CD pipelines and test suites
- API projects MUST declare shared module dependencies in `pom.xml` with explicit versions
- Breaking changes in shared modules MUST trigger major version increment
- Shared modules MUST be documented with usage examples in Exchange
- Custom connectors MUST be implemented as Mule SDK-based modules when standard connectors are insufficient
- Shared modules MUST NOT contain business logic specific to single APIs

**Rationale**: Shared modules eliminate code duplication, ensure consistency across APIs, simplify maintenance (fix once, deploy everywhere), accelerate development through reusable components, and establish organization-wide standards.

**Compliance Verification**:
- Code reviews MUST identify opportunities for module extraction
- Architecture reviews MUST verify shared modules are used instead of duplicated code
- Exchange publication MUST be automated via CI/CD
- Module usage metrics MUST be tracked for adoption validation

---

### Principle 7: Deployment Automation and Environment Promotion

All API deployments MUST follow automated CI/CD pipelines with gated promotions from development through production, with no manual XML file modifications or configuration changes between environments.

**Requirements**:
- CI/CD pipeline MUST include stages: build, unit tests, integration tests, static analysis, deployment, smoke tests
- Deployments to development MUST be automatic on successful builds
- Promotions to staging and production MUST require manual approval gates
- Environment-specific properties MUST be injected at deployment time (not stored in artifacts)
- Deployment artifacts MUST be immutable (same JAR across all environments)
- Anypoint CLI MUST be used for CloudHub/Runtime Fabric deployments
- API Manager auto-discovery MUST be configured with environment-specific API IDs
- Rollback procedures MUST be documented and tested for production deployments
- Deployment success MUST be validated with automated health checks and smoke tests
- Blue-green or canary deployment strategies MUST be used for zero-downtime production releases

**Rationale**: Deployment automation eliminates human error, ensures consistency across environments, enables rapid rollbacks, provides audit trails, accelerates time-to-production, and enforces approval workflows for controlled releases.

**Compliance Verification**:
- All production deployments MUST originate from CI/CD pipeline (no manual uploads)
- Audit logs MUST record all deployments with timestamps and approvers
- Health checks MUST pass before traffic routing to new deployments
- Rollback procedures MUST be tested quarterly

---

## Governance

### Amendment Procedure

1. **Proposal**: Any team member may propose amendments via pull request to this foundation document
2. **Discussion**: Amendment proposals MUST be discussed in architecture review meetings
3. **Impact Analysis**: Proposer MUST document impact on existing APIs and dependent artifacts
4. **Approval**: Amendments require approval from:
   - Solution Architect (mandatory)
   - Tech Lead (mandatory)
   - At least 2 senior developers (mandatory)
5. **Version Increment**: Follow semantic versioning rules (see below)
6. **Template Propagation**: All dependent templates MUST be updated before merging amendment
7. **Communication**: Approved amendments MUST be announced to all team members with migration guidance

### Versioning Policy

Foundation versions follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Backward-incompatible changes
  - Principle removal or fundamental redefinition
  - Mandatory tooling changes (e.g., switching from RAML to OAS)
  - Governance structure overhauls
  - API layer pattern changes
- **MINOR**: Backward-compatible additions
  - New principles added
  - Section expansions with new requirements
  - New governance procedures
  - New shared module categories
- **PATCH**: Clarifications and corrections
  - Wording improvements
  - Typo fixes
  - Example additions
  - Non-semantic clarifications

### Compliance Reviews

- **Quarterly Architecture Reviews**: Review adherence to API-Led principles across all projects
- **Monthly Code Review Audits**: Sample code reviews for foundation compliance
- **Pre-Production Gates**: All APIs MUST pass foundation checklist before production deployment
- **Annual Foundation Review**: Evaluate whether principles remain relevant; propose amendments if needed
- **Exception Process**: Deviations MUST be documented in `specs/{api}/plan.md` Complexity Tracking section with explicit justification

---

## Dependent Artifacts

The following templates and documentation artifacts depend on this foundation and MUST remain synchronized:

### Templates (`.claude-buddy/templates/mulesoft/`)
- **plan.md**: API implementation plan template - MUST align with Principles 1-7 in Foundation Check section
- **spec.md**: API specification template - MUST reflect contract-first approach (Principle 2)
- **tasks.md**: Task generation template - MUST enforce TDD workflow (Principle 5)

### Context Files (`.claude-buddy/context/mulesoft/`)
- **mule-guidelines.md**: MuleSoft architecture and design guidelines - MUST align with API-Led principles
- **dataweave.md**: DataWeave best practices - MUST reference shared module principle
- **mule-connector.md**: Connector usage patterns - MUST align with configuration externalization
- **docs-general.md**: General MuleSoft documentation snippets

### Agent Files (repository root)
- Agent-specific context files updated via `scripts/bash/update-agent-context.sh` or `scripts/powershell/update-agent-context.ps1`

---

## Foundation Metadata

**Maintained By**: MuleSoft Architecture Team
**Review Frequency**: Quarterly
**Last Compliance Audit**: 2025-10-01
**Next Scheduled Review**: 2026-01-01

**Applicable Projects**:
- All Experience API projects
- All Process API projects
- All System API projects
- Shared connector modules
- Shared DataWeave library modules

**Technology Stack**:
- MuleSoft Anypoint Platform (API Manager, Runtime Manager, Exchange)
- Mule Runtime Engine 4.6.x or later
- DataWeave 2.5.x or later
- MUnit 2.3.x or later
- APIkit (RAML) or REST Connect (OAS)
- CloudHub 2.0, CloudHub 1.0, or Runtime Fabric

**References**:
- [MuleSoft API-Led Connectivity](https://www.mulesoft.com/resources/api/api-led-connectivity)
- [Anypoint Platform Documentation](https://docs.mulesoft.com/)
- [DataWeave Reference](https://docs.mulesoft.com/dataweave/)
- [MUnit Documentation](https://docs.mulesoft.com/munit/)

---

## Review History

### v1.0.0 (2025-10-01)
- **Type**: Initial ratification
- **Changes**: Foundation document created from codebase analysis and MuleSoft context
- **Rationale**: Establish governance framework for multi-project MuleSoft architecture organized by API layers
- **Approved By**: Solution Architect (initial creation)
- **Principles Established**: 7 core principles derived from API-Led Connectivity patterns and MuleSoft best practices
