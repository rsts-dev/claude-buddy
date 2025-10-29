# Architecture Decision Records

This document records significant architectural decisions made for Claude Buddy.

## ADR-001: Configuration Reading - Agents vs Commands

**Date**: October 29, 2025
**Status**: Accepted
**Version**: 2.2.0

### Context

Claude Buddy uses both agents and commands for operations. Configuration needs to be read and used, creating a question about which layer should handle configuration.

### Decision

Configuration documentation belongs in agents, not commands. Commands simply invoke agents without repeating configuration details.

### Rationale

1. **Single Responsibility**: Commands invoke, agents execute and configure
2. **Avoids Duplication**: Configuration docs exist in one place (agents)
3. **Maintainability**: Updates only needed in agent files
4. **Clear Separation**: Command layer stays thin and focused on invocation

### Implementation

- Removed configuration documentation from command files
- Kept all configuration documentation in agent files
- Commands reference agent documentation for config options

### Status

Implemented in v2.2.0

---

## ADR-002: Skills vs Manual File Loading

**Date**: October 29, 2025
**Status**: Accepted
**Version**: 2.3.0

### Context

Claude Buddy initially used manual file loading from `.claude-buddy/` directory for personas, templates, and context files. Agents and commands explicitly loaded files with Read tool before processing.

With Claude Code Skills system available, we had two options:
1. Continue manual loading from `.claude-buddy/`
2. Migrate to Claude Code Skills at `.claude/skills/`

### Decision

Adopt Claude Code Skills as the primary system for all content delivery (personas, templates, context).

### Rationale

#### Manual Loading Problems

1. **Token Inefficiency**
   - Loaded all content upfront (~15,000 tokens)
   - No progressive disclosure
   - Wasted context on unused content

2. **Maintenance Burden**
   - File paths hardcoded in multiple places
   - Updates require changing many files
   - Easy to get out of sync

3. **No Auto-Discovery**
   - Agents must know exact file paths
   - Can't discover new personas/templates
   - Requires explicit loading logic

4. **No Composition**
   - Each file loaded independently
   - No natural collaboration between files
   - Complex merge logic required

#### Skills System Benefits

1. **Token Efficiency**
   - Progressive disclosure (30-70% savings)
   - Load only what's needed
   - Supporting files on-demand

2. **Auto-Activation**
   - Skills activate based on keywords/patterns
   - No explicit loading needed
   - Discovery automatic

3. **Better Composition**
   - Multiple skills work together naturally
   - Priority/conflict resolution built-in
   - Cleaner architecture

4. **Standard Pattern**
   - Uses Claude Code's native system
   - Familiar to Claude Code users
   - Better long-term support

### Implementation

#### Before (Manual Loading)

**Agent Code**:
```markdown
Load persona definitions from `.claude-buddy/personas/<persona>.md` to inform analysis.
```

**Agent Execution**:
1. Read file with Read tool
2. Parse markdown
3. Extract persona content
4. Load into context (full file, always)

**Token Cost**: ~2,000 tokens per persona × N personas

#### After (Skills)

**Agent Code**:
```markdown
Persona skills auto-activate from `.claude/skills/personas/` based on file patterns and change analysis.
```

**Agent Execution**:
1. Skills auto-activate based on frontmatter criteria
2. Progressive disclosure loads only needed sections
3. Skills compose automatically

**Token Cost**: ~1,000 tokens per skill (core) + supporting files if referenced (~30-70% savings)

### Migration Path

```
v2.0.x: Manual loading from .claude-buddy/
    ↓
v2.1.0: Skills created, both systems exist
    ↓
v2.2.0: Config migrated to hooks.json
    ↓
v2.3.0: Agents/commands use skills only
    ↓
v2.4.x-2.9.x: Warning period
    ↓
v3.0.0: Remove .claude-buddy/ completely
```

### Consequences

#### Positive

- ✅ 30-70% token savings from progressive disclosure
- ✅ Auto-activation based on context
- ✅ Better skill composition
- ✅ Standard Claude Code pattern
- ✅ Easier to add new personas/domains/templates
- ✅ Less code in agents (no manual loading)

#### Negative

- ⚠️ Breaking change for users who customized `.claude-buddy/` files
- ⚠️ Migration period required (v2.1.0 → v3.0.0)
- ⚠️ Must learn skills frontmatter format

#### Mitigations

- Backward compatibility until v3.0.0
- Clear migration documentation
- Skills frontmatter is simple YAML
- Gradual deprecation (not sudden removal)

### Alternatives Considered

#### Option B: Keep Manual Loading

Continue using `.claude-buddy/` with manual file loading.

**Rejected because**:
- Token inefficiency (15K+ tokens always loaded)
- Doesn't use Claude Code's native capabilities
- Harder to maintain (scattered file paths)
- No auto-discovery

#### Option C: Hybrid Approach

Use skills for some content, manual loading for others.

**Rejected because**:
- Confusing to users (which system when?)
- Maintains both systems (double maintenance)
- Doesn't solve token inefficiency fully
- Unclear migration path

### Verification

#### Skills Activation Test
```bash
# Create test file matching persona pattern
touch test-security-file.env

# Run commit - security persona should auto-activate
# Check logs for "security" skill activation

# Verify no .claude-buddy/ file reads
# Check for Read tool calls to .claude-buddy/personas/
```

#### Token Usage Test
```bash
# Before (manual loading): ~15,000 tokens
# After (skills): ~3,000-5,000 tokens
# Savings: 67-80%
```

### Related Decisions

- [ADR-001: Configuration Reading](#adr-001-configuration-reading---agents-vs-commands)
- [DEPRECATION-NOTICE.md](DEPRECATION-NOTICE.md)
- [CONFIG-MIGRATION.md](CONFIG-MIGRATION.md)

---

**Status**: Implemented in v2.3.0
**Reviewed By**: Architecture review
**Last Updated**: October 29, 2025
