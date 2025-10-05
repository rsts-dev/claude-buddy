# Phase 0 Research: Claude Buddy Version 2 Site Update

**Created**: 2025-10-05
**Status**: Complete
**Researcher**: Plan Writer Agent

## Research Findings

### 1. V2 CLI Commands and Capabilities

**Decision**: Document full v2 CLI feature set based on setup/install.js implementation
**Rationale**: The v2 installer provides a comprehensive CLI interface with multiple commands and sophisticated option parsing
**Alternatives considered**: Simple installation script vs full CLI tool

**Key CLI Features Discovered**:
- **Main executable**: `claude-buddy` (via NPM bin configuration)
- **Package**: `@claude-buddy/setup` v2.0.0
- **Commands**:
  - `install` - Fresh installation or update (default command)
  - `update` - Explicit update of existing installation
  - `uninstall` - Remove Claude Buddy from target directory
  - `verify` - Verify installation integrity
- **Global flags**:
  - `--dry-run` - Preview changes without execution
  - `--verbose` - Detailed output
  - `--quiet` - Minimal output
  - `--non-interactive` - No prompts
  - `--force` - Override safety checks
  - `--skip-hooks` - Skip hook installation
  - `--preserve-all` - Keep all customizations during update
  - `--purge` - Complete removal including customizations
- **Installation modes**:
  - Global installation (system-wide)
  - Project-specific installation (workspace)
- **Transaction safety**: Rollback capability on failure
- **Node requirement**: >= 18.0.0
- **Cross-platform**: macOS, Linux, Windows support

### 2. NPM Package Details

**Decision**: Prominently feature NPM-based installation as the primary method
**Rationale**: NPM distribution provides standardized installation, dependency management, and easy updates
**Alternatives considered**: Git clone, manual installation, custom installers

**NPM Package Information**:
- **Package name**: `@claude-buddy/setup`
- **Version**: 2.0.0
- **Installation command**: `npm install -g claude-buddy`
- **Dependencies**:
  - chalk (colored terminal output)
  - fs-extra (enhanced file operations)
  - glob (pattern matching)
  - uuid (unique identifiers)
- **Installation targets**:
  - `.claude-buddy/` directory (personas, templates, context)
  - `.claude/` directory (agents, hooks)
  - Preserves existing customizations during updates

### 3. MuleSoft Template Features

**Decision**: Highlight MuleSoft as enterprise-grade API integration template
**Rationale**: MuleSoft template demonstrates Claude Buddy's capability to support complex enterprise architectures
**Alternatives considered**: Generic API templates vs specialized MuleSoft support

**MuleSoft Template Capabilities**:
- **API-Led Connectivity Architecture**:
  - Experience API layer
  - Process API layer
  - System API layer
- **Documentation scope**:
  - RAML specifications and API contracts
  - DataWeave transformations and mappings
  - Integration patterns (point-to-point, pub-sub, request-reply)
  - Mule flow architecture with HTTP listeners, routers, transformations
  - Global error handling strategies
- **Development support**:
  - Anypoint Studio setup guidance
  - MUnit testing frameworks
  - CloudHub deployment documentation
  - Runtime Manager monitoring
- **Connectors**: Database, Salesforce, SAP, HTTP, File
- **Security**: Client ID enforcement, OAuth 2.0, HTTPS

### 4. JHipster Template Features

**Decision**: Showcase JHipster as full-stack enterprise application template
**Rationale**: JHipster template proves Claude Buddy can handle modern full-stack development with Spring Boot and various frontend frameworks
**Alternatives considered**: Simple Spring Boot vs comprehensive JHipster platform

**JHipster Template Capabilities**:
- **Architecture patterns**:
  - Monolithic vs Microservices
  - Controller → Service → Repository pattern
  - JWT, Session, or OAuth2/OIDC security
- **Technology stack support**:
  - Spring Boot backend
  - Angular/React/Vue frontend options
  - Multiple database choices
  - Liquibase migrations
- **Documentation features**:
  - JDL (JHipster Domain Language) models
  - Entity relationship diagrams
  - Swagger/OpenAPI interactive documentation
  - MapStruct DTO mapping
- **Testing strategies**:
  - JUnit, MUnit for backend
  - Gatling for performance
  - Cypress/Protractor for e2e
- **Deployment options**:
  - Docker containerization
  - Cloud platforms (AWS, Azure, GCP, Heroku)
  - Spring profiles (dev, test, prod)
  - JHipster Console monitoring

### 5. Current Site Analysis

**Decision**: Maintain existing design while updating content to reflect v2 capabilities
**Rationale**: Current site has good structure, SEO optimization, and user experience - only content needs updating
**Alternatives considered**: Complete redesign vs content-only updates

**Current Site Structure**:
- **Hero section**: Features NPM installation but needs v2.0 messaging
- **Navigation**: Integration, Features, Personas, Install, GitHub
- **Terminal display**: Already shows NPM commands (needs minor updates)
- **Personas section**: 12 expert personas (still relevant in v2)
- **Commands**: Shows `/buddy:` slash commands (needs v2 command updates)
- **GitHub links**: Points to old repository (gsetsero/claude-buddy)
- **SEO**: Well optimized with meta tags, structured data, sitemap
- **Performance**: Has optimization opportunities per TODO.md
- **Analytics**: Google Analytics already integrated

### 6. V2 Workflow Features

**Decision**: Emphasize complete specification-driven development workflow
**Rationale**: V2's main innovation is the full workflow automation from spec to implementation
**Alternatives considered**: Focus on individual features vs integrated workflow

**Workflow Capabilities**:
- **Slash Commands Available**:
  - `/buddy:persona` - Activate specialized personas
  - `/buddy:foundation` - Create/update project foundation
  - `/buddy:spec` - Create formal specifications
  - `/buddy:plan` - Generate implementation plans
  - `/buddy:tasks` - Break down into implementation tasks
  - `/buddy:implement` - Execute tasks following TDD
  - `/buddy:commit` - Create professional git commits
  - `/buddy:docs` - Generate comprehensive documentation
- **Agent System**:
  - persona-dispatcher.md
  - spec-writer.md
  - plan-writer.md
  - tasks-writer.md
  - task-executor.md
  - docs-generator.md
  - git-workflow.md
  - foundation.md
- **Hook System**:
  - auto-formatter.py - Code formatting automation
  - command-validator.py - Dangerous command blocking
  - file-guard.py - Protected file patterns
  - Using cchooks library for Python hooks
  - Timeout enforcement (10s validation, 30s formatting)

### 7. Foundation-Driven Development

**Decision**: Feature foundation-driven development as core v2 innovation
**Rationale**: Foundation documents provide project-wide consistency and principle alignment
**Alternatives considered**: Template-only approach vs foundation-centric design

**Foundation System**:
- **Core Principles** (from foundation.md v2.0.0):
  1. Modular Extensibility
  2. Safety-First Automation
  3. Contextual Intelligence
  4. Developer Experience Excellence
  5. Transparent Collaboration
- **Foundation types**:
  - Default (generic projects)
  - MuleSoft (API integration)
  - JHipster (full-stack enterprise)
  - Custom (user-defined templates)
- **Template structure**:
  - `.claude-buddy/templates/[foundation-type]/`
  - spec.md, plan.md, tasks.md, docs.md templates
  - Context directories for stack-specific guidance
- **Governance**:
  - Amendment procedures
  - Compliance verification
  - Principle propagation to all artifacts

### 8. Repository and Documentation Updates

**Decision**: Update all GitHub links to new repository URL
**Rationale**: Repository has moved to rsts-dev organization
**Alternatives considered**: Redirect from old repository vs direct link updates

**Repository Changes**:
- **Old URL**: `https://github.com/gsetsero/claude-buddy`
- **New URL**: `https://github.com/rsts-dev/claude-buddy`
- **Documentation structure**: No README.md in root (needs creation)
- **License**: MIT (unchanged)
- **Organization**: Moved from personal to organization account

### 9. Personas Enhancement

**Decision**: Maintain 12 expert personas with v2 enhancements
**Rationale**: Personas remain core feature, now enhanced with auto-activation and confidence scoring
**Alternatives considered**: Reduce personas vs maintain full set

**V2 Persona Enhancements**:
- **12 Specialized Personas** (unchanged):
  - Architect, Security, Frontend, Backend
  - DevOps, QA, Performance, Mentor
  - Analyzer, Refactorer, Scribe, Product Owner
- **Auto-activation**: Confidence scoring (0.7 threshold)
- **Session memory**: Context continuity across interactions
- **Manual selection**: `/buddy:persona [names]`
- **Collaborative mode**: Multiple personas work together
- **Integration**: Personas participate in all workflow phases

### 10. Installation and Setup Process

**Decision**: Highlight simplified NPM installation with intelligent setup
**Rationale**: V2 installation is dramatically simpler than v1 git clone approach
**Alternatives considered**: Multiple installation methods vs single recommended approach

**Installation Features**:
- **One-line installation**: `npm install -g claude-buddy`
- **Setup command**: `claude-buddy --global` or `claude-buddy [directory]`
- **Intelligent detection**:
  - Environment validation
  - Existing installation detection
  - Python version check
  - Git repository detection
- **Transaction safety**:
  - Rollback on failure
  - Backup of existing configurations
  - Merge strategies for updates
- **Post-install**:
  - Hook registration
  - Permission setup
  - Configuration validation

## Key Messages for Site Update

### Primary Value Propositions
1. **NPM Distribution**: Professional package management and easy updates
2. **Complete Workflow**: Spec → Plan → Tasks → Implementation → Commit
3. **Enterprise Templates**: MuleSoft and JHipster out of the box
4. **Safety First**: Multiple validation layers and rollback capabilities
5. **Foundation-Driven**: Project-wide principle alignment and consistency

### What's New in V2
1. NPM package distribution (no more git clone)
2. CLI tool with multiple commands
3. Specification-driven development workflow
4. Foundation documents for project governance
5. Enterprise templates (MuleSoft, JHipster)
6. Enhanced Python hooks with cchooks library
7. Transaction-safe installation with rollback
8. Agent-based workflow automation
9. Confidence-based persona activation
10. Template extensibility for custom stacks

### Migration Benefits (V1 → V2)
1. No breaking changes (personas preserved)
2. Simplified installation process
3. Automatic updates via NPM
4. Enhanced safety features
5. Complete workflow automation
6. Enterprise-ready templates
7. Better error handling and recovery
8. Cross-platform support improved

### Target Audiences
1. **Individual Developers**: Simplified setup, enhanced productivity
2. **Enterprise Teams**: MuleSoft/JHipster templates, governance
3. **Open Source Projects**: Foundation documents, consistent standards
4. **Claude Code Users**: Seamless integration, familiar commands

## Recommendations for Phase 1

1. **Hero Section**: Lead with "Claude Buddy 2.0 - Now with NPM" messaging
2. **Installation**: Make NPM command the primary CTA
3. **Features Grid**: Add workflow automation and templates sections
4. **Commands**: Update to show new `/buddy:` slash commands
5. **Personas**: Keep but emphasize v2 enhancements
6. **Repository Links**: Update all to rsts-dev organization
7. **Documentation**: Link to future v2 docs (plan for creation)
8. **Footer**: Add version indicator and update copyright

## Technical Notes

- No performance metrics available yet (per clarification)
- No testimonials or case studies for v2 (per clarification)
- No migration guide needed (low v1 adoption per clarification)
- Focus on features over performance optimization (per clarification)
- Maintain current design aesthetic (per clarification)

---

**Research Complete**: Ready for Phase 1 Design & Contracts