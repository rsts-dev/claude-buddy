# Tasks: Claude Buddy Version 2 Site Update

**Branch**: `feature/site-v2-update`
**Spec**: `/specs/20251005-site-version-update/spec.md`
**Plan**: `/specs/20251005-site-version-update/plan.md`
**Created**: 2025-10-05
**Status**: Completed
**Input**: Feature specification from `/specs/20251005-site-version-update/spec.md` and plan from `/specs/20251005-site-version-update/plan.md`
**Prerequisites**: plan.md (complete), research.md (complete), content-structure.md (complete), quickstart.md (complete)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: HTML5/CSS3/JS ES6+, static site structure
   → Identify: site/ directory structure
2. Load optional design documents:
   → content-structure.md: Extract content updates → content tasks
   → quickstart.md: Extract validation steps → testing tasks
   → research.md: Extract v2 features → update tasks
3. Generate tasks by category:
   → Setup: backup, environment verification
   → Tests: validation checklist, browser testing
   → Core: content updates, link updates
   → Integration: SEO, metadata, responsive design
   → Polish: performance, accessibility, final testing
4. Apply task rules:
   → Different sections = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests after implementation (validate changes)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All content sections updated?
   → All links verified?
   → All validation steps included?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different sections, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Static site**: `site/` at repository root
- **Main page**: `site/index.html`
- **Styles**: `site/assets/css/styles.css`
- **Scripts**: `site/assets/js/script.js`
- **SEO files**: `site/robots.txt`, `site/sitemap.xml`

## Phase 3.1: Setup & Backup
- [X] T001 Create backup of current site directory (`cp -r site/ site-backup-v1/`)
- [X] T002 Verify site structure matches plan.md (index.html, assets/, CNAME present)
- [X] T003 [P] Create working branch `feature/site-v2-update`
- [X] T004 [P] Set up local development server for testing

## Phase 3.2: Version & Messaging Updates
- [X] T005 Update hero section in site/index.html with "Claude Buddy 2.0 is Here" messaging
- [X] T006 Add version announcement banner section in site/index.html
- [X] T007 Update page title and meta description in site/index.html `<head>` section
- [X] T008 [P] Update Open Graph and Twitter card metadata in site/index.html
- [X] T009 [P] Update footer with "v2.0.0" version indicator in site/index.html

## Phase 3.3: Installation Section Updates
- [X] T010 Replace git clone instructions with NPM installation commands in site/index.html
- [X] T011 Update terminal display to show `npm install -g claude-buddy` in site/index.html
- [X] T012 Add 3-step installation process (Install, Initialize, Choose Foundation) in site/index.html
- [X] T013 [P] Add CLI options display (`--dry-run`, `--verbose`, `--force`) in site/index.html

## Phase 3.4: Feature Comparison & What's New
- [X] T014 Create "What's New in v2" section with feature grid in site/index.html
- [X] T015 Add v1 vs v2 comparison table in site/index.html
- [X] T016 [P] Add NPM Distribution feature card with icon and details in site/index.html
- [X] T017 [P] Add Enterprise Templates feature card (MuleSoft & JHipster) in site/index.html
- [X] T018 [P] Add Workflow Automation feature card in site/index.html
- [X] T019 [P] Add Foundation System feature card in site/index.html

## Phase 3.5: Enterprise Templates Showcase
- [X] T020 Create MuleSoft template showcase section in site/index.html
- [X] T021 Create JHipster template showcase section in site/index.html
- [X] T022 [P] Add MuleSoft use cases and features list in site/index.html
- [X] T023 [P] Add JHipster use cases and features list in site/index.html

## Phase 3.6: Workflow & Commands Documentation
- [X] T024 Create workflow visualization section (Spec → Plan → Tasks → Implement) in site/index.html
- [X] T025 Update commands section with new `/buddy:` slash commands in site/index.html
- [X] T026 [P] Add foundation & setup commands grid in site/index.html
- [X] T027 [P] Add development workflow commands grid in site/index.html
- [X] T028 [P] Add persona & analysis commands grid in site/index.html
- [X] T029 [P] Add documentation & git commands grid in site/index.html

## Phase 3.7: Personas Enhancement
- [X] T030 Update personas section introduction with v2 enhancements in site/index.html
- [X] T031 Add auto-activation and confidence scoring description in site/index.html
- [X] T032 [P] Update each persona card to reflect v2 capabilities (if needed) in site/index.html

## Phase 3.8: Repository & Link Updates
- [X] T033 Update all GitHub links from `gsetsero/claude-buddy` to `rsts-dev/claude-buddy` in site/index.html
- [X] T034 [P] Update GitHub link in navigation menu in site/index.html
- [X] T035 [P] Update repository link in footer in site/index.html
- [X] T036 [P] Add NPM package link to `claude-buddy` in site/index.html

## Phase 3.9: Code Examples & Syntax Updates
- [X] T037 Update all v1 code examples to v2 syntax in site/index.html
- [X] T038 [P] Update CLI command examples to use `claude-buddy` executable in site/index.html
- [X] T039 [P] Update slash command examples to latest v2 commands in site/index.html

## Phase 3.10: SEO & Metadata Updates
- [X] T040 Update structured data JSON-LD with version "2.0.0" in site/index.html
- [X] T041 Update sitemap.xml with new section anchors in site/sitemap.xml
- [X] T042 [P] Verify robots.txt remains unchanged in site/robots.txt
- [X] T043 [P] Update canonical URL if needed in site/index.html

## Phase 3.11: Responsive Design Validation
- [X] T044 Test mobile view (320px - 768px) for all new sections
- [X] T045 Test tablet view (768px - 1024px) for all new sections
- [X] T046 Test desktop view (1024px+) for all new sections
- [X] T047 [P] Verify hamburger menu functionality on mobile
- [X] T048 [P] Test horizontal scrolling issues on mobile devices

## Phase 3.12: Content Validation
- [X] T049 Verify all "v1" references are updated to "v2" throughout site/index.html
- [X] T050 Verify NPM installation command is correct (`claude-buddy`)
- [X] T051 [P] Verify all 12 personas are still listed correctly in site/index.html
- [X] T052 [P] Verify all new slash commands are accurate in site/index.html
- [X] T053 [P] Check for any remaining `gsetsero` references in site/index.html

## Phase 3.13: Browser Compatibility Testing
- [X] T054 [P] Test in Chrome (latest version)
- [X] T055 [P] Test in Firefox (latest version)
- [X] T056 [P] Test in Safari (latest version)
- [X] T057 [P] Test in Edge (latest version)

## Phase 3.14: Performance & Accessibility
- [X] T058 Run Lighthouse audit and verify Performance > 90
- [X] T059 Run Lighthouse audit and verify Accessibility > 95
- [X] T060 [P] Run Lighthouse audit and verify Best Practices > 90
- [X] T061 [P] Run Lighthouse audit and verify SEO > 95
- [X] T062 [P] Test keyboard navigation for all interactive elements
- [X] T063 [P] Verify color contrast ratios meet WCAG 2.1 AA standards

## Phase 3.15: Link & Functionality Testing
- [X] T064 Test GitHub repository link (https://github.com/rsts-dev/claude-buddy)
- [X] T065 Test NPM package link (if added)
- [X] T066 [P] Test all internal anchor links (#features, #installation, etc.)
- [X] T067 [P] Test copy-to-clipboard functionality for code blocks
- [X] T068 [P] Test theme toggle (light/dark) persistence

## Phase 3.16: Final Validation & Documentation
- [X] T069 Complete all items in quickstart.md Pre-Deployment Checklist
- [X] T070 Update site/README.md with v2.0 information
- [X] T071 [P] Take screenshots of updated sections for documentation
- [X] T072 [P] Document any CSS adjustments made in site/assets/css/styles.css
- [X] T073 Create rollback instructions in case of issues

## Dependencies
- Setup (T001-T004) before any content updates
- Version updates (T005-T009) before feature sections
- Content updates (T010-T039) before validation
- All content complete before testing (T044-T068)
- Testing complete before final validation (T069-T073)

## Parallel Execution Examples

### Content Section Updates (can run simultaneously)
```
# Launch T016-T019 together (feature cards):
Task: "Add NPM Distribution feature card"
Task: "Add Enterprise Templates feature card"
Task: "Add Workflow Automation feature card"
Task: "Add Foundation System feature card"

# Launch T026-T029 together (command grids):
Task: "Add foundation & setup commands grid"
Task: "Add development workflow commands grid"
Task: "Add persona & analysis commands grid"
Task: "Add documentation & git commands grid"
```

### Testing Phase (can run simultaneously)
```
# Launch T054-T057 together (browser testing):
Task: "Test in Chrome"
Task: "Test in Firefox"
Task: "Test in Safari"
Task: "Test in Edge"
```

## Notes
- Most content updates are in the same file (index.html) so limited parallelization
- Backup site before making changes (T001)
- Test locally before deployment
- Keep CSS changes minimal per plan requirements
- Focus on content updates, not design changes
- Preserve SEO optimizations from v1

## Validation Checklist
*GATE: Checked before marking complete*

- [x] All v2 features from research.md included
- [x] All content sections from content-structure.md covered
- [x] All validation steps from quickstart.md included
- [x] Repository links updated to rsts-dev
- [x] NPM installation prominently featured
- [x] Enterprise templates showcased
- [x] Workflow automation explained
- [x] Testing phases comprehensive
- [x] Rollback plan included