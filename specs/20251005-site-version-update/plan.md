---
description: "Implementation plan for Claude Buddy Version 2 Site Update"
---

# Implementation Plan: Claude Buddy Version 2 Site Update

**Branch**: `feature/site-v2-update`
**Spec**: `/specs/20251005-site-version-update/spec.md`
**Created**: 2025-10-05
**Status**: Ready for Review
**Input**: Feature specification from `/specs/20251005-site-version-update/spec.md`

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
Update the Claude Buddy marketing website to reflect the major improvements and capabilities introduced in version 2.0, emphasizing the new NPM-based installation process, CLI tool, foundation-driven development approach, and comprehensive workflow automation while maintaining the existing design aesthetic and user experience. The update will transform the site from showcasing v1's persona-based features to highlighting v2's complete ecosystem including MuleSoft and JHipster enterprise templates, extensible foundation framework, and specification-driven development workflow.

## Technical Context
**Language/Version**: HTML5, CSS3, JavaScript ES6+
**Primary Dependencies**: None (static site with vanilla JS)
**Storage**: N/A (static site hosted on GitHub Pages)
**Testing**: Browser-based testing, lighthouse performance audits
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: single (static website)
**Performance Goals**: Focus on functional improvements; performance optimization is not a priority for this update
**Constraints**: Maintain SEO optimization, preserve responsive design, GitHub Pages compatibility
**Scale/Scope**: Single-page marketing site with ~10 content sections

## Foundation Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `/directive/foundation.md` v2.0.0, verify compliance with:

### Principle 1: Modular Extensibility
- [x] Feature components are designed as independent modules (content sections are modular)
- [x] New functionality extends without modifying core framework (updating content only)
- [x] Templates and configurations are properly isolated (static site structure preserved)
- [x] **Phase 1 Validation**: Content-structure.md maintains modular sections

### Principle 2: Safety-First Automation
- [x] All automated operations include validation steps (quickstart.md includes comprehensive validation)
- [x] Destructive operations are explicitly protected (content updates are non-destructive)
- [x] Error handling prevents unintended consequences (rollback plan defined)
- [x] **Phase 1 Validation**: Quickstart.md includes pre-deployment checklist and rollback procedures

### Principle 3: Contextual Intelligence
- [x] Design leverages foundation document principles (showcasing v2 features aligned with foundation)
- [x] Context from previous phases propagates forward (research.md informed content-structure.md)
- [x] Templates maintain consistency with project patterns (maintaining existing design patterns)
- [x] **Phase 1 Validation**: Content structure builds on research findings and maintains v1 patterns

### Principle 4: Developer Experience Excellence
- [x] Clear documentation for all new components (comprehensive content structure documented)
- [x] Error messages provide actionable guidance (N/A for static site)
- [x] Progressive disclosure of advanced features (content hierarchy from basic NPM to advanced templates)
- [x] **Phase 1 Validation**: Clear installation steps, feature progression, and validation procedures

### Principle 5: Transparent Collaboration
- [x] Changes maintain clear attribution trails (git history for site updates)
- [x] Automated operations are logged appropriately (N/A for static content)
- [x] Human review points are explicitly defined (sign-off checklist in quickstart.md)
- [x] **Phase 1 Validation**: Quickstart.md includes stakeholder review and approval process

**Violations Requiring Justification**: None
**Post-Design Assessment**: All principles remain satisfied with enhanced validation through Phase 1 deliverables

## Project Structure

### Documentation (this feature)
```
specs/20251005-site-version-update/
├── plan.md              # This file (/buddy:plan command output)
├── research.md          # Phase 0 output (/buddy:plan command)
├── data-model.md        # Phase 1 output (N/A for static site)
├── quickstart.md        # Phase 1 output (/buddy:plan command)
├── contracts/           # Phase 1 output (N/A for static site)
└── tasks.md             # Phase 2 output (/buddy:tasks command - NOT created by /buddy:plan)
```

### Source Code (repository root)
```
site/
├── index.html           # Main marketing page (to be updated)
├── assets/
│   ├── css/
│   │   └── styles.css   # Site styles (may need v2 adjustments)
│   └── js/
│       └── script.js    # Site interactions (may need v2 features)
├── robots.txt           # SEO configuration (preserve)
├── sitemap.xml          # SEO sitemap (update with v2 content)
├── CNAME                # GitHub Pages domain (preserve)
└── README.md            # Site documentation (update for v2)
```

**Structure Decision**: Using existing single static site structure in the `site/` directory. No structural changes needed as this is a content and messaging update to reflect v2 capabilities.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Research current v2 feature implementation details from codebase
   - Research NPM package details and installation process
   - Review foundation templates (MuleSoft, JHipster) for accurate descriptions

2. **Generate and dispatch research agents**:
   ```
   Task: "Extract v2 CLI commands and capabilities from setup/ directory"
   Task: "Review NPM package.json for accurate installation instructions"
   Task: "Analyze MuleSoft and JHipster templates for feature descriptions"
   Task: "Review existing site analytics/metrics if available"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: Focus on functional improvements over performance optimization
   - Rationale: Priority is v2 feature showcase, not performance metrics
   - Alternatives considered: N/A

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Content Structure Updates** (replacing data-model.md for static site):
   - Hero Section: v2.0 major upgrade messaging
   - Installation Section: NPM-based process prominence
   - Features Grid: v1 vs v2 comparison matrix
   - Foundation Templates: MuleSoft/JHipster showcase
   - Workflow Automation: spec→plan→tasks→implement flow
   - CLI Tools: claude-buddy command documentation
   - Migration Path: v1 to v2 transition (minimal given low adoption)

2. **Visual Design Updates**:
   - Maintain current design aesthetic
   - Content-only updates (no new visual indicators, badges, icons, or animations)
   - NPM installation command in prominent code block
   - Feature comparison table or grid (using existing design patterns)
   - Foundation template cards or showcase (using existing design patterns)

3. **SEO and Metadata Updates**:
   - Update meta descriptions for v2
   - Refresh Open Graph tags
   - Update sitemap.xml with new sections
   - Maintain existing SEO optimizations

4. **Content Migration Strategy**:
   - Preserve existing brand identity (infinity logo, color scheme)
   - Update all v1 references to v2
   - Replace git clone instructions with NPM install
   - Update GitHub links to new repository URL
   - Refresh all code examples to v2 syntax

5. **Update quickstart.md** with validation steps:
   - Verify all v2 features are accurately described
   - Test all links (GitHub, documentation, NPM)
   - Validate responsive design on multiple devices
   - Run Lighthouse audit for performance
   - Check SEO metadata rendering

**Output**: content structure plan, visual updates list, quickstart.md

**Phase 1 Completed Outputs**:
- `content-structure.md` - Comprehensive content organization and messaging guide (replaces data-model.md for static site)
- `quickstart.md` - Complete validation and testing procedures with detailed checklists

## Phase 2: Task Planning Approach
*This section describes what the /buddy:tasks command will do - DO NOT execute during /buddy:plan*

**Task Generation Strategy**:
- Load content structure from Phase 1
- Generate content update tasks for each section
- Create validation tasks for links and features
- Add SEO and performance verification tasks
- Include responsive design testing tasks

**Ordering Strategy**:
- Content updates first (hero, features, installation)
- Visual/styling updates second
- SEO and metadata updates third
- Testing and validation last
- Mark [P] for parallel content section updates

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /buddy:tasks command, NOT by /buddy:plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /buddy:plan command*

**Phase 3**: Task execution (/buddy:tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following foundational principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations to document - all foundation principles are satisfied*

## Clarifications Received

The following clarifications were provided:

1. **Performance Targets**: Focus shifted to functional improvements; performance optimization is not a priority for this update.

2. **Visual Design Changes**: Maintain current design with content-only updates; no new visual indicators, badges, icons, or animations.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/buddy:plan command) - Completed 2025-10-05
- [x] Phase 1: Design complete (/buddy:plan command) - Completed 2025-10-05
- [ ] Phase 2: Task planning complete (/buddy:plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/buddy:tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Foundation Check: PASS
- [x] Post-Design Foundation Check: PASS (Re-evaluated 2025-10-05)
- [x] All NEEDS CLARIFICATION resolved: COMPLETE (2 items resolved)
- [x] Complexity deviations documented: N/A (none required)

---
*Based on Foundation v2.0.0 - See `/directive/foundation.md` for complete principles and governance*