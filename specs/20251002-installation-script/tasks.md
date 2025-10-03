# Tasks: Installation Script for Claude Buddy

**Branch**: `installation-script`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Created**: 2025-10-02
**Status**: Ready for Review
**Input**: Feature specification from `/specs/20251002-installation-script/spec.md` and plan from `/specs/20251002-installation-script/plan.md`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Plan loaded successfully: Installation Script
   → Extract: JavaScript/Node.js 18+, single project structure
2. Load optional design documents:
   → data-model.md: 5 entities (Manifest, Metadata, Transaction, Environment, MergeResult)
   → contracts/: 8 API specifications loaded
   → research.md: 6 research topics with decisions
   → quickstart.md: Usage scenarios and examples
3. Generate tasks by category:
   → Setup: project init, dependencies, package config
   → Tests: Integration tests for all scenarios (TDD)
   → Core: Logger, Environment, Manifest, Transaction modules
   → Implementation: Installer, Updater, Uninstaller modules
   → Integration: CLI interface, error handling, verification
   → Polish: Documentation, manual testing, validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests? ✓
   → All entities in data model? ✓
   → All scenarios from quickstart? ✓
   → TDD ordering verified? ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Single project structure:
- Source: `setup/lib/` for modules
- Entry: `setup/install.js` for CLI
- Tests: `setup/tests/` for integration and unit tests
- NPM: `setup/package.json` for package configuration

---

## Phase 3.1: Setup & Infrastructure

### Project Structure
- [X] T001 Create project directory structure: `setup/lib/`, `setup/tests/integration/`, `setup/tests/unit/`, `setup/tests/fixtures/`

### Package Configuration
- [X] T002 Initialize package.json with bin entry `claude-buddy` pointing to `setup/install.js` and dependencies: chalk, fs-extra, uuid
- [X] T003 [P] Create ESLint configuration in `setup/.eslintrc.json` for code quality
- [X] T004 [P] Create Jest configuration in `setup/jest.config.js` for testing framework

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Integration Tests: Fresh Installation
- [X] T005 [P] Integration test for fresh installation scenario in `setup/tests/integration/fresh-install.test.js`
- [X] T006 [P] Integration test for graceful degradation (missing UV) in `setup/tests/integration/graceful-degradation.test.js`
- [X] T007 [P] Integration test for dry-run mode in `setup/tests/integration/dry-run.test.js`

### Integration Tests: Update Scenarios
- [X] T008 [P] Integration test for update with customization preservation in `setup/tests/integration/update.test.js`
- [X] T009 [P] Integration test for configuration merging in `setup/tests/integration/config-merge.test.js`
- [X] T010 [P] Integration test for version migration in `setup/tests/integration/version-migration.test.js`

### Integration Tests: Uninstallation
- [X] T011 [P] Integration test for uninstallation with preservation in `setup/tests/integration/uninstall-preserve.test.js`
- [X] T012 [P] Integration test for complete purge in `setup/tests/integration/uninstall-purge.test.js`

### Integration Tests: Error Handling
- [X] T013 [P] Integration test for permission errors in `setup/tests/integration/error-permissions.test.js`
- [X] T014 [P] Integration test for interrupted transaction recovery in `setup/tests/integration/interrupted-transaction.test.js`
- [X] T015 [P] Integration test for rollback on failure in `setup/tests/integration/rollback.test.js`

### Integration Tests: Post-Installation
- [X] T016 [P] Integration test for verification command in `setup/tests/integration/verify.test.js`

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Logger Module (Foundation - No Dependencies)
- [X] T017 Create logger module with createLogger, log, info, warn, error, success, debug, verbose functions in `setup/lib/logger.js`
- [X] T018 Implement section headers, progress indicators, and spinner in logger module at `setup/lib/logger.js`
- [X] T019 Implement specialized logging functions: logInstallationSummary, logUpdateSummary, logUninstallSummary, logErrorWithSuggestions in `setup/lib/logger.js`
- [X] T020 Implement output modes: normal, verbose, quiet, JSON in logger module at `setup/lib/logger.js`
- [X] T021 Implement file logging with rotation in logger module at `setup/lib/logger.js`
- [X] T022 Implement color support with chalk and terminal capability detection in `setup/lib/logger.js`

### Environment Detection Module
- [X] T023 [P] Create environment detection module with platform detection (darwin, linux, windows) in `setup/lib/environment.js`
- [X] T024 [P] Implement dependency detection for Node.js, UV, Python, Git in `setup/lib/environment.js`
- [X] T025 [P] Implement permission checking for target directory in `setup/lib/environment.js`
- [X] T026 [P] Implement disk space checking in `setup/lib/environment.js`
- [X] T027 [P] Implement existing installation detection and version comparison in `setup/lib/environment.js`

### Manifest Module
- [X] T028 [P] Create manifest module with hardcoded component definitions (hooks, templates, personas, commands, agents, foundation) in `setup/lib/manifest.js`
- [X] T029 [P] Implement manifest validation and platform-specific override logic in `setup/lib/manifest.js`
- [X] T030 [P] Implement component filtering by available dependencies in `setup/lib/manifest.js`

### Transaction Module
- [X] T031 [P] Create transaction module with createTransaction, executeAction, createCheckpoint in `setup/lib/transaction.js`
- [X] T032 [P] Implement checkpoint system with file state snapshots in `setup/lib/transaction.js`
- [X] T033 [P] Implement action execution for create, update, delete, skip, backup types in `setup/lib/transaction.js`
- [X] T034 [P] Implement commitTransaction with cleanup and metadata updates in `setup/lib/transaction.js`
- [X] T035 [P] Implement rollbackTransaction with LIFO action reversal in `setup/lib/transaction.js`
- [X] T036 [P] Implement getTransactionStatus and transaction recovery logic in `setup/lib/transaction.js`
- [X] T037 [P] Implement lock file mechanism for concurrent installation prevention in `setup/lib/transaction.js`

---

## Phase 3.4: Installation Operations

### Installer Module (Depends on: Logger, Environment, Manifest, Transaction)
- [X] T038 Create installer module with fresh installation logic in `setup/lib/installer.js`
- [X] T039 Implement directory creation from manifest in installer module at `setup/lib/installer.js`
- [X] T040 Implement component installation with file copying in `setup/lib/installer.js`
- [X] T041 Implement permission setting for Unix systems in installer module at `setup/lib/installer.js`
- [X] T042 Implement metadata creation and initialization in `setup/lib/installer.js`
- [X] T043 Implement post-installation verification in installer module at `setup/lib/installer.js`

### Updater Module (Depends on: Logger, Environment, Manifest, Transaction)
- [X] T044 [P] Create updater module with update detection and customization preservation logic in `setup/lib/updater.js`
- [X] T045 [P] Implement user modification detection using timestamp comparison in `setup/lib/updater.js`
- [X] T046 [P] Implement configuration merging strategies (shallow/deep merge) in `setup/lib/updater.js`
- [X] T047 [P] Implement version migration registry and execution in `setup/lib/updater.js`
- [X] T048 [P] Implement backup creation before updates in `setup/lib/updater.js`
- [X] T049 [P] Implement update summary generation in `setup/lib/updater.js`

### Uninstaller Module (Depends on: Logger, Environment, Transaction)
- [X] T050 [P] Create uninstaller module with removal logic in `setup/lib/uninstaller.js`
- [X] T051 [P] Implement customization detection and preservation in `setup/lib/uninstaller.js`
- [X] T052 [P] Implement purge mode for complete removal in `setup/lib/uninstaller.js`
- [X] T053 [P] Implement backup preservation on uninstall in `setup/lib/uninstaller.js`
- [X] T054 [P] Implement uninstall summary generation in `setup/lib/uninstaller.js`

---

## Phase 3.5: CLI Integration

### CLI Entry Point (Depends on: All modules above)
- [X] T055 Create CLI entry point with argument parsing using process.argv in `setup/install.js`
- [X] T056 Implement command routing for install, update, uninstall, verify in `setup/install.js`
- [X] T057 Implement global flags: --dry-run, --verbose, --quiet, --non-interactive, --help, --version in `setup/install.js`
- [X] T058 Implement installation-specific flags: --force, --skip-hooks, --target in `setup/install.js`
- [X] T059 Implement update-specific flags: --preserve-all, --merge-config in `setup/install.js`
- [X] T060 Implement uninstall-specific flags: --preserve-customizations, --purge in `setup/install.js`
- [X] T061 Implement environment variable handling: CLAUDE_BUDDY_HOME, CLAUDE_BUDDY_VERBOSE, CLAUDE_BUDDY_NO_COLOR, CLAUDE_BUDDY_CONFIG in `setup/install.js`
- [X] T062 Implement exit codes (0-99) and error handling in `setup/install.js`
- [X] T063 Implement signal handling for SIGINT, SIGTERM with graceful shutdown in `setup/install.js`

### Verify Command
- [X] T064 [P] Implement verify command with component checking in `setup/install.js`
- [X] T065 [P] Implement configuration validation in verify command at `setup/install.js`
- [X] T066 [P] Implement dependency status reporting in verify command at `setup/install.js`
- [X] T067 [P] Implement repair suggestions on corruption detection in `setup/install.js`

### Help and Documentation
- [X] T068 [P] Implement --help text with command usage and examples in `setup/install.js`
- [X] T069 [P] Implement --version display in `setup/install.js`

---

## Phase 3.6: Error Handling & Edge Cases

### Error Classes
- [X] T070 [P] Create TransactionError class with error codes in `setup/lib/errors.js`
- [X] T071 [P] Create EnvironmentError class for environment issues in `setup/lib/errors.js`
- [X] T072 [P] Create ValidationError class for validation failures in `setup/lib/errors.js`

### Error Recovery
- [X] T073 Implement interrupted transaction detection on startup in `setup/install.js`
- [X] T074 Implement user prompt for recovery options (rollback/resume/abort) in `setup/install.js`
- [X] T075 Implement corrupted installation repair logic in `setup/lib/installer.js`

### Edge Case Handling
- [X] T076 [P] Implement permission error handling with actionable suggestions in `setup/lib/environment.js`
- [X] T077 [P] Implement disk space check with clear error messages in `setup/lib/environment.js`
- [X] T078 [P] Implement conflicting configuration resolution prompts in `setup/lib/updater.js`
- [X] T079 [P] Implement downgrade confirmation workflow in `setup/lib/updater.js`
- [X] T080 [P] Implement stale lock file detection and cleanup in `setup/lib/transaction.js`

---

## Phase 3.7: Configuration File Support

### Configuration Loading
- [X] T081 [P] Create configuration loader module for .claude-buddy-rc.json in `setup/lib/config.js`
- [X] T082 [P] Implement configuration precedence: CLI flags > env vars > project config > user config > defaults in `setup/lib/config.js`
- [X] T083 [P] Implement configuration validation against schema in `setup/lib/config.js`

---

## Phase 3.8: Polish & Documentation

### Unit Tests
- [X] T084 [P] Unit tests for version comparison logic in `setup/tests/unit/version.test.js`
- [X] T085 [P] Unit tests for path normalization across platforms in `setup/tests/unit/paths.test.js`
- [X] T086 [P] Unit tests for configuration merge strategies in `setup/tests/unit/config-merge.test.js`
- [X] T087 [P] Unit tests for dependency detection functions in `setup/tests/unit/dependency-detection.test.js`
- [X] T088 [P] Unit tests for manifest validation in `setup/tests/unit/manifest.test.js`
- [X] T089 [P] Unit tests for logger output formatting in `setup/tests/unit/logger.test.js`

### Performance Tests
- [X] T090 [P] Performance test: fresh installation completes in < 30 seconds in `setup/tests/performance/install-speed.test.js`
- [X] T091 [P] Performance test: update completes in < 10 seconds in `setup/tests/performance/update-speed.test.js`

### Documentation
- [X] T092 [P] Create README.md for setup/ directory with installation usage in `setup/README.md`
- [X] T093 [P] Update quickstart.md with tested examples and screenshots in `specs/20251002-installation-script/quickstart.md`
- [X] T094 [P] Create TROUBLESHOOTING.md guide with common issues and solutions in `setup/TROUBLESHOOTING.md`
- [X] T095 [P] Create CHANGELOG.md with v1.0.0 initial release notes in `setup/CHANGELOG.md`

### Code Quality
- [X] T096 [P] Run ESLint and fix all linting errors across all files in setup/
- [X] T097 [P] Add JSDoc comments to all public functions in setup/lib/
- [ ] T098 Remove code duplication and refactor common patterns in setup/lib/

### Manual Testing Validation
- [ ] T099 Execute quickstart.md scenarios manually on macOS
- [ ] T100 Execute quickstart.md scenarios manually on Linux
- [ ] T101 Execute quickstart.md scenarios manually on Windows
- [ ] T102 Test CI/CD non-interactive mode in GitHub Actions

---

## Dependencies

### Phase Dependencies
- Phase 3.2 (Tests) must complete before Phase 3.3 (Core)
- Phase 3.3 (Core) must complete before Phase 3.4 (Operations)
- Phase 3.4 (Operations) must complete before Phase 3.5 (CLI)
- Phase 3.5 (CLI) must complete before Phase 3.6 (Error Handling)

### Module Dependencies
- **Logger** (T017-T022): No dependencies, must be first
- **Environment** (T023-T027): Depends on Logger
- **Manifest** (T028-T030): Depends on Logger
- **Transaction** (T031-T037): Depends on Logger
- **Installer** (T038-T043): Depends on Logger, Environment, Manifest, Transaction
- **Updater** (T044-T049): Depends on Logger, Environment, Manifest, Transaction
- **Uninstaller** (T050-T054): Depends on Logger, Environment, Transaction
- **CLI** (T055-T069): Depends on all modules above
- **Error Classes** (T070-T072): No dependencies, can be done early
- **Config** (T081-T083): Depends on Logger

### Task-Level Dependencies
- T017 (Logger core) blocks T018-T022 (Logger features)
- T023 (Environment core) blocks T024-T027 (Environment features)
- T031 (Transaction core) blocks T032-T037 (Transaction features)
- T038 (Installer core) blocks T039-T043 (Installer features)
- T044 (Updater core) blocks T045-T049 (Updater features)
- T050 (Uninstaller core) blocks T051-T054 (Uninstaller features)
- T055 (CLI entry) blocks T056-T069 (CLI features)
- All implementation (T017-T083) blocks polish (T084-T102)

---

## Parallel Execution Examples

### Phase 3.2: All Integration Tests in Parallel
```bash
# All integration tests can run simultaneously (different files)
Task T005: Integration test fresh install
Task T006: Integration test graceful degradation
Task T007: Integration test dry-run
Task T008: Integration test update
Task T009: Integration test config merge
Task T010: Integration test version migration
Task T011: Integration test uninstall preserve
Task T012: Integration test uninstall purge
Task T013: Integration test permission errors
Task T014: Integration test interrupted transaction
Task T015: Integration test rollback
Task T016: Integration test verify
```

### Phase 3.3: Logger Features in Parallel
```bash
# After T017 (Logger core) completes
Task T018: Progress indicators
Task T019: Specialized logging functions
Task T020: Output modes
Task T021: File logging
Task T022: Color support
```

### Phase 3.3: Module Cores in Parallel
```bash
# After Logger is complete, these can start simultaneously
Task T023: Environment detection module
Task T028: Manifest module
Task T031: Transaction module
```

### Phase 3.4: Module Internals in Parallel
```bash
# Within Environment module (after T023)
Task T024: Dependency detection
Task T025: Permission checking
Task T026: Disk space checking
Task T027: Existing installation detection

# Within Manifest module (after T028)
Task T029: Validation
Task T030: Component filtering

# Within Transaction module (after T031)
Task T032: Checkpoint system
Task T033: Action execution
Task T034: Commit logic
Task T035: Rollback logic
Task T036: Status tracking
Task T037: Lock mechanism
```

### Phase 3.4: Operation Modules in Parallel
```bash
# After core modules complete
Task T038: Installer module core
Task T044: Updater module core
Task T050: Uninstaller module core
```

### Phase 3.8: Unit Tests in Parallel
```bash
# All unit tests are independent
Task T084: Version comparison tests
Task T085: Path normalization tests
Task T086: Config merge tests
Task T087: Dependency detection tests
Task T088: Manifest validation tests
Task T089: Logger formatting tests
```

### Phase 3.8: Documentation in Parallel
```bash
# All documentation tasks are independent
Task T092: README.md
Task T093: quickstart.md updates
Task T094: TROUBLESHOOTING.md
Task T095: CHANGELOG.md
```

---

## Validation Checklist

### Design Coverage
- [x] All contracts have corresponding implementation tasks
  - cli-interface.md → T055-T069 (CLI tasks)
  - environment-api.md → T023-T027 (Environment tasks)
  - manifest-api.md → T028-T030 (Manifest tasks)
  - transaction-api.md → T031-T037 (Transaction tasks)
  - installer-api.md → T038-T043 (Installer tasks)
  - updater-api.md → T044-T049 (Updater tasks)
  - uninstaller-api.md → T050-T054 (Uninstaller tasks)
  - logger-api.md → T017-T022 (Logger tasks)

- [x] All entities from data-model.md have creation tasks
  - Installation Manifest → T028 (Manifest module)
  - Installation Metadata → T042 (Metadata creation)
  - Installation Transaction → T031 (Transaction creation)
  - Environment Detection → T023 (Environment module)
  - Configuration Merge Result → T046 (Config merging)

- [x] All scenarios from quickstart.md have test tasks
  - Fresh installation → T005
  - Missing UV (graceful degradation) → T006
  - Dry-run mode → T007
  - Update with customizations → T008
  - Uninstall with preservation → T011
  - Uninstall purge → T012
  - Verify installation → T016

- [x] All research.md decisions have corresponding implementation tasks
  - Transactional patterns → T031-T037 (Transaction module)
  - NPM distribution → T002 (package.json bin)
  - Cross-platform compatibility → T023 (Environment detection)
  - Dependency detection → T024, T030 (Graceful degradation)
  - Configuration preservation → T044-T049 (Updater module)
  - Version management → T027, T042 (Metadata and version comparison)

### TDD Compliance
- [x] All tests come before implementation
  - Integration tests: T005-T016 (Phase 3.2)
  - Implementation: T017-T083 (Phases 3.3-3.7)
  - Unit tests: T084-T089 (Phase 3.8)

- [x] Tests cover all acceptance scenarios from spec.md
  - Scenario 1 (Fresh Installation) → T005
  - Scenario 2 (Update Existing) → T008
  - Scenario 3 (Dry-Run Mode) → T007
  - Scenario 4 (Graceful Degradation) → T006
  - Scenario 5 (Uninstallation) → T011, T012
  - Scenario 6 (Post-Install Verification) → T016

- [x] Edge cases from spec.md have test coverage
  - Missing Permissions → T013
  - Corrupted Installation → T075 (repair logic)
  - Network Failures → N/A (no network operations in install script)
  - Conflicting Configurations → T009 (config merge test)
  - Platform-Specific Failures → T006 (graceful degradation)
  - Interrupted Installation → T014

### Task Quality
- [x] Parallel tasks truly independent
  - All [P] tasks operate on different files
  - No shared state between parallel tasks
  - Examples verified in parallel execution section

- [x] Each task specifies exact file path
  - All tasks include file paths in descriptions
  - Paths follow single project structure

- [x] No task modifies same file as another [P] task
  - Verified: No file conflicts in parallel task groups

- [x] Task numbering is sequential
  - T001 through T102 in order

- [x] Dependencies are clearly documented
  - Module-level dependencies documented
  - Task-level blocking relationships documented
  - Phase ordering enforced

---

## Summary Statistics

**Total Tasks**: 102
- Setup & Infrastructure: 4 tasks (T001-T004)
- Integration Tests (TDD): 12 tasks (T005-T016)
- Core Implementation: 20 tasks (T017-T037)
- Operation Modules: 17 tasks (T038-T054)
- CLI Integration: 15 tasks (T055-T069)
- Error Handling: 11 tasks (T070-T080)
- Configuration Support: 3 tasks (T081-T083)
- Unit Tests: 6 tasks (T084-T089)
- Performance Tests: 2 tasks (T090-T091)
- Documentation: 4 tasks (T092-T095)
- Code Quality: 3 tasks (T096-T098)
- Manual Testing: 4 tasks (T099-T102)

**Parallel Tasks**: 68 tasks marked with [P]
**Sequential Tasks**: 34 tasks (no [P] marker)
**Critical Path Length**: ~15 sequential tasks

**Estimated Duration**:
- Optimistic (with parallelization): ~20 hours
- Pessimistic (mostly sequential): ~40 hours
- Realistic (mixed approach): ~30 hours

---

## Notes for Implementation

### Key Implementation Order
1. **Start with Logger** (T017-T022): All other modules depend on it
2. **Core Modules in Parallel** (T023, T028, T031): Can be developed simultaneously after logger
3. **Operation Modules** (T038, T044, T050): Implement after core modules
4. **CLI Integration** (T055): Final integration point
5. **Polish Last** (T084-T102): After all functionality works

### Testing Strategy
- Write integration tests first (T005-T016)
- Run tests before implementation to verify they fail
- Implement functionality to make tests pass
- Add unit tests for edge cases (T084-T089)
- Perform manual cross-platform testing (T099-T102)

### Quality Gates
- All integration tests must pass before Phase 3.5
- All unit tests must pass before Phase 3.8
- ESLint must pass with 0 errors before completion
- Manual testing must succeed on all 3 platforms

### Foundation Alignment
This task breakdown aligns with all 5 foundation principles:
1. **Modular Extensibility**: Each module is independent with clear interfaces
2. **Safety-First Automation**: TDD approach, transaction system, extensive error handling
3. **Contextual Intelligence**: Version detection, metadata tracking, intelligent updates
4. **Developer Experience Excellence**: Comprehensive help, clear errors, verbose logging
5. **Transparent Collaboration**: Detailed logging, user prompts, clear attribution

---

*Tasks generated from design documents on 2025-10-02. Ready for Phase 3 execution.*
