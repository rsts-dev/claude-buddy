# Architecture Decisions

This document records key architectural decisions made for Claude Buddy.

## ADR-001: Configuration Reading - Agents vs Commands

**Date**: October 29, 2025
**Status**: Accepted
**Version**: 2.2.0

### Context

After migrating configuration from `.claude-buddy/buddy-config.json` to `.claude/hooks.json`, we discovered duplication: both the `/buddy:commit` command and the `git-workflow` agent documented the same configuration options.

**Question**: Should configuration be read and documented in commands, agents, or both?

### Decision

**Agents** should be the single source of truth for configuration documentation and reading.

### Rationale

#### Why Agents Read Configuration

1. **Separation of Concerns**
   - Commands: Thin wrappers that invoke agents
   - Agents: Execute actual logic and need config to make decisions

2. **Single Responsibility Principle**
   - Agents handle: git operations + configuration
   - Commands handle: parsing user input + invoking agents

3. **Reusability**
   - Agents can be invoked directly (not just via commands)
   - If commands held config, direct agent calls would lose configuration
   - Example: User can call git-workflow agent directly via Task tool

4. **DRY (Don't Repeat Yourself)**
   - Multiple commands might invoke the same agent
   - Duplicating config docs in each command violates DRY
   - Single source of truth in agent documentation

5. **Consistency with Python Hooks**
   - Python hooks (`file-guard.py`, `command-validator.py`, `auto-formatter.py`) read config directly
   - They don't receive config from commands
   - Agents should follow the same pattern

#### Architecture Pattern

```
User Input
    ↓
Command (thin wrapper)
    ├─ Parse arguments
    ├─ Reference agent docs for config options
    └─ Invoke agent via Task tool
        ↓
    Agent (logic executor)
        ├─ Read configuration from .claude/hooks.json
        ├─ Execute logic based on config + arguments
        └─ Return results
```

### Implementation

#### Before (Duplication)

**Command** (commit.md):
```markdown
- Check `.claude/hooks.json` (config section) for configuration:
  - `config.features.auto_commit`: Default to auto-yes mode if true
  - `config.git.auto_push`: Automatically push after commit if true
  - `config.git.branch_protection`: Branches requiring confirmation
  - `config.git.conventional_commits`: Enforce conventional commit format
```

**Agent** (git-workflow.md):
```markdown
Check `.claude/hooks.json` (config section) for:
- `config.features.auto_commit`: If true, default to auto-yes mode
- `config.git.auto_push`: If true, automatically push after commit
- `config.git.branch_protection`: List of branches that require confirmation
- `config.git.conventional_commits`: If true, enforce conventional commit format
```

**Problem**: Same information in two places, easy to get out of sync.

#### After (Single Source of Truth)

**Command** (commit.md):
```markdown
**Configuration**: The git-workflow agent reads configuration from `.claude/hooks.json` (config section).
See the git-workflow agent documentation for available configuration options.
```

**Agent** (git-workflow.md):
```markdown
## Integration with Project Configuration

Check `.claude/hooks.json` (config section) for:
- `config.features.auto_commit`: If true, default to auto-yes mode
- `config.git.auto_push`: If true, automatically push after commit
- `config.git.branch_protection`: List of branches that require confirmation
- `config.git.conventional_commits`: If true, enforce conventional commit format
- `config.git.commit_validation`: If true, validate commit message format before committing
```

**Benefit**: Configuration documented once, in the agent that uses it.

### Consequences

#### Positive

- ✅ **Single Source of Truth**: Config documented where it's actually used
- ✅ **DRY**: No duplication between commands and agents
- ✅ **Clearer Separation**: Commands invoke, agents configure and execute
- ✅ **Easier Maintenance**: Update config docs in one place
- ✅ **Better Reusability**: Agents can be called directly with config intact
- ✅ **Consistency**: Matches Python hooks pattern

#### Negative

- ⚠️ Users need to check agent docs to see config options (but command references agent docs)
- ⚠️ Slight indirection (command → agent docs) but more maintainable long-term

### Alternatives Considered

#### Option B: Commands Read and Pass Config to Agents

Commands would read configuration and pass as parameters to agents.

**Rejected because**:
- ❌ Agents can be invoked directly, bypassing command
- ❌ Adds complexity to command layer
- ❌ Breaks agent reusability
- ❌ Requires parameter passing infrastructure
- ❌ Inconsistent with Python hooks which read config directly

#### Option C: Both Commands and Agents Document Config

Keep documentation in both places.

**Rejected because**:
- ❌ Violates DRY principle
- ❌ Duplication leads to inconsistencies
- ❌ More files to update when config changes
- ❌ Unclear which is authoritative

### Related Decisions

- [CONFIG-MIGRATION.md](CONFIG-MIGRATION.md) - Migration from buddy-config.json to hooks.json
- See [CHANGELOG v2.2.0](../setup/CHANGELOG.md:8-68) for configuration migration details

### Files Changed

- [.claude/commands/buddy/commit.md](commands/buddy/commit.md:47) - Removed config duplication, added reference to agent
- [.claude/agents/git-workflow.md](agents/git-workflow.md:322-329) - Remains single source of truth for config

### Verification

Checked all commands and agents:
```bash
# Only git-workflow agent references hooks.json config
grep -r "hooks\.json.*config" .claude/agents/
# Output: git-workflow.md (correct)

# Only commit command previously referenced config
grep -r "hooks\.json.*config" .claude/commands/
# Output: commit.md (now just references agent)
```

**Result**: No other commands/agents have this duplication issue.

---

**Status**: Implemented in v2.2.0
**Reviewed By**: Architecture review
**Last Updated**: October 29, 2025
