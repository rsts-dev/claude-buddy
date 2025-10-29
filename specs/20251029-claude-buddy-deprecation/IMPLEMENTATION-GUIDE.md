# Implementation Guide: Complete `.claude-buddy/` Deprecation

**Status**: In Progress (2/16 tasks completed)
**Version Target**: 2.3.0
**Date**: October 29, 2025

## Completed Tasks

- ✅ [.claude/agents/git-workflow.md](../../.claude/agents/git-workflow.md:125) - Removed persona loading
- ✅ [.claude/agents/persona-dispatcher.md](../../.claude/agents/persona-dispatcher.md:312-320) - Updated to use skills

## Remaining Agent Updates (2 files)

### Task 3: Update docs-generator.md

**File**: `.claude/agents/docs-generator.md`

**Lines to Remove**: 136-148
```markdown
2. Load documentation template
   - Path: `.claude-buddy/templates/<foundation-type>/docs.md`
   - If template not found: Stop and report error
   - Parse template for all instructions and patterns

3. Load context files (optional)
   - Check if `.claude-buddy/context/<foundation-type>/` exists
   - Load all `.md` files if directory exists
   - Use context to enhance documentation accuracy

4. Load scribe persona
   - Path: `.claude-buddy/personas/scribe.md`
   - Load scribe's writing principles, style guidelines, and quality standards
   - Embody scribe persona throughout documentation generation
```

**Replace With**:
```markdown
2. **Skills Integration**: Leverage Claude Code Skills for comprehensive guidance:
   - The `docs-generator` skill provides documentation templates automatically
   - Domain skills (react, jhipster, mulesoft) provide technology-specific knowledge
   - The scribe persona provides professional writing guidance automatically
   - Skills activate based on:
     - Foundation type detected from `directive/foundation.md`
     - Keywords in documentation context
     - Technology patterns mentioned
   - All necessary templates and context provided by skills - no manual loading required
```

**Also Remove**: Line 254
```markdown
The template at `.claude-buddy/templates/<foundation-type>/docs.md` is the authoritative source for all documentation generation behavior. Follow it precisely.
```

**Replace With**:
```markdown
The docs-generator skill provides foundation-specific templates and patterns. Skills auto-activate based on foundation type and provide the authoritative source for documentation generation behavior.
```

### Task 4: Update foundation.md

**File**: `.claude/agents/foundation.md`

**Lines to Remove/Replace**:

1. Lines 38-43:
```markdown
- Load the template at `/.claude-buddy/templates/foundation.md` for structural guidance
  - Use this template's section structure, heading hierarchy, and formatting patterns
  - The template provides the architectural blueprint for the foundation document
- **Load stack-specific context** from `/.claude-buddy/context/<foundation-type>/`:
  - Read all `.md` files in the context directory for the foundation type
  - These files contain framework-specific best practices, patterns, and principles
```

**Replace With**:
```markdown
**Skills Integration**: Foundation templates and stack-specific context auto-activate:
  - Foundation template structure from skills system
  - Domain skills (react, jhipster, mulesoft) provide stack-specific best practices automatically
  - Skills activate based on detected foundation type and technology patterns
```

2. Lines 71-73:
```markdown
- Extract foundation type from existing foundation metadata or user specification
- Read all `.md` files from `/.claude-buddy/context/<foundation-type>/`
- Use this context to inform technical principles, best practices, and framework-specific requirements
- If context directory doesn't exist, proceed without stack-specific context
```

**Replace With**:
```markdown
- Extract foundation type from existing foundation metadata or user specification
- Domain skills auto-activate based on foundation type, providing:
  - Framework-specific best practices and patterns
  - Technical principles and requirements
  - Stack-specific guidance automatically
```

3. Lines 119-124:
```markdown
1. **`/.claude-buddy/templates/{foundation-type}/plan.md`**: Verify "Foundation Check" sections align with updated principles
2. **`/.claude-buddy/templates/{foundation-type}/spec.md`**: Ensure scope/requirements sections reflect any new mandatory constraints or removed requirements
3. **`/.claude-buddy/templates/{foundation-type}/tasks.md`**: Update task categorization to reflect principle-driven task types (e.g., observability, versioning, testing discipline)
4. **`/.claude-buddy/templates/commands/*.md`**: Remove outdated references; ensure generic guidance doesn't contain agent-specific names inappropriately
5. **Runtime guidance** (`README.md`, `docs/quickstart.md`, agent-specific docs): Update any references to changed principles
```

**Replace With**:
```markdown
1. **Generator Skills**: Update if foundation principles significantly change:
   - `plan-generator` skill: Verify "Foundation Check" sections align
   - `spec-generator` skill: Ensure scope/requirements reflect new constraints
   - `tasks-generator` skill: Update task categorization for principle-driven types
2. **Runtime guidance** (`README.md`, `docs/quickstart.md`): Update any references to changed principles
```

4. Lines 150-153:
```markdown
✅ /.claude-buddy/templates/{foundation-type}/plan.md - [specific changes]
✅ /.claude-buddy/templates/{foundation-type}/spec.md - [specific changes]
⚠️ /.claude-buddy/templates/{foundation-type}/tasks.md - [pending changes needed]
➖ /.claude-buddy/templates/commands/example.md - No changes required
```

**Replace With**:
```markdown
✅ Generator skills reviewed and aligned with foundation changes
✅ plan-generator skill - [specific changes if needed]
✅ spec-generator skill - [specific changes if needed]
⚠️ tasks-generator skill - [pending changes if needed]
```

## Command Updates (5 files)

### Task 5: Update commit.md

**File**: `.claude/commands/buddy/commit.md`
**Line**: 24

**Remove**:
```markdown
  4. Analyze changes using activated personas (load from `.claude-buddy/personas/<persona>.md`)
```

**Replace With**:
```markdown
  4. Analyze changes using auto-activated persona skills from `.claude/skills/personas/`
```

### Task 6: Update persona.md

**File**: `.claude/commands/buddy/persona.md`
**Line**: 108

**Remove**:
```markdown
3. Load persona contexts from `.claude-buddy/personas/`
```

**Replace With**:
```markdown
3. Activate persona skills from `.claude/skills/personas/` (auto-discovery via Claude Code Skills)
```

### Task 7: Update docs.md

**File**: `.claude/commands/buddy/docs.md`
**Lines**: 22-23

**Remove**:
```markdown
- Load the documentation template from `.claude-buddy/templates/<foundation-type>/docs.md`
- Load context files from `.claude-buddy/context/<foundation-type>/` (if available)
```

**Replace With**:
```markdown
**Skills that auto-activate**:
- docs-generator skill: Comprehensive documentation templates
- Scribe persona: Professional writing guidance
- Domain skills: Technology-specific documentation (react, jhipster, mulesoft)
```

### Task 8: Update plan.md

**File**: `.claude/commands/buddy/plan.md`
**Lines**: 30-31

**Remove**:
```markdown
- Load the plan template from `.claude-buddy/templates/<foundation-type>/plan.md`
- Load context files from `.claude-buddy/context/<foundation-type>/` (if available)
```

**Replace With**:
```markdown
**Skills that auto-activate**:
- plan-generator skill: Implementation planning templates
- Domain skills: Technology-specific planning patterns (react, jhipster, mulesoft)
- Architect persona: Systems design guidance
```

### Task 9: Update tasks.md

**File**: `.claude/commands/buddy/tasks.md`
**Lines**: 41-42

**Remove**:
```markdown
- Load the tasks template from `.claude-buddy/templates/<foundation-type>/tasks.md`
- Load context files from `.claude-buddy/context/<foundation-type>/` (if available)
```

**Replace With**:
```markdown
**Skills that auto-activate**:
- tasks-generator skill: Task breakdown templates
- Domain skills: Technology-specific task patterns (react, jhipster, mulesoft)
- QA persona: Testing and validation guidance
```

## Setup Package Updates (4 files)

### Task 10: Update manifest.js

**File**: `setup/lib/manifest.js`

**Changes**:
1. Line 16: Version '2.2.0' → '2.3.0'

2. Templates component (lines 34-48):
```javascript
{
  name: 'templates',
  displayName: 'Document Templates (Deprecated)',
  type: 'optional',  // was: required
  source: 'dist/.claude-buddy/templates/',
  target: '.claude-buddy/templates/',
  dependencies: [],
  filePatterns: ['**/*.md'],
  description: 'DEPRECATED: Legacy templates (replaced by generator skills in v2.3.0)',
  affectedFeatures: [
    'Backward compatibility with v2.2.x and earlier',
    'Templates now provided by generator skills at .claude/skills/generators/'
  ]
},
```

3. Personas component (lines 50-63):
```javascript
{
  name: 'personas',
  displayName: 'AI Personas (Deprecated)',
  type: 'optional',  // was: required
  source: 'dist/.claude-buddy/personas/',
  target: '.claude-buddy/personas/',
  dependencies: [],
  filePatterns: ['*.md'],
  description: 'DEPRECATED: Legacy personas (replaced by persona skills in v2.1.0)',
  affectedFeatures: [
    'Backward compatibility with v2.0.x and earlier',
    'Personas now available as skills at .claude/skills/personas/'
  ]
},
```

4. Context component (lines 65-77):
```javascript
{
  name: 'context',
  displayName: 'Framework Context Files (Deprecated)',
  type: 'optional',  // was: required
  source: 'dist/.claude-buddy/context/',
  target: '.claude-buddy/context/',
  dependencies: [],
  filePatterns: ['**/*.md'],
  description: 'DEPRECATED: Legacy context files (replaced by domain skills in v2.1.0)',
  affectedFeatures: [
    'Backward compatibility with v2.0.x and earlier',
    'Framework context now in domain skills at .claude/skills/domains/'
  ]
},
```

### Task 11: Update package.json

**File**: `setup/package.json`
**Line**: 3

**Change**: `"version": "2.2.0"` → `"version": "2.3.0"`

### Task 12: Update CHANGELOG.md

**File**: `setup/CHANGELOG.md`

**Add after line 7** (before ## [2.2.0]):

```markdown
## [2.3.0] - 2025-10-29

### Changed

#### Deprecated `.claude-buddy/` Directory
- **Agents**: All agents now use Claude Code Skills instead of manual loading from `.claude-buddy/`
  - [git-workflow.md](../../.claude/agents/git-workflow.md:125) - Persona skills auto-activate
  - [persona-dispatcher.md](../../.claude/agents/persona-dispatcher.md:312-320) - Skills integration
  - [docs-generator.md](../../.claude/agents/docs-generator.md) - Uses docs-generator skill
  - [foundation.md](../../.claude/agents/foundation.md) - Uses domain skills for context

- **Commands**: Updated to reference skills instead of `.claude-buddy/`
  - [commit.md](../../.claude/commands/buddy/commit.md:24) - Persona skills
  - [persona.md](../../.claude/commands/buddy/persona.md:108) - Persona skills
  - [docs.md](../../.claude/commands/buddy/docs.md:22-23) - docs-generator skill
  - [plan.md](../../.claude/commands/buddy/plan.md:30-31) - plan-generator skill
  - [tasks.md](../../.claude/commands/buddy/tasks.md:41-42) - tasks-generator skill

- **Setup Package**: Marked legacy components as optional/deprecated
  - Templates component: Now optional (replaced by generator skills)
  - Personas component: Now optional (replaced by persona skills)
  - Context component: Now optional (replaced by domain skills)
  - Configs component: Already deprecated in v2.2.0

#### Skills as Primary System
- All functionality now via Claude Code Skills at `.claude/skills/`
- Skills provide: Auto-activation, progressive disclosure, 30-70% token savings
- Legacy `.claude-buddy/` directory still installed for backward compatibility

### Migration Path

**v2.1.0**: Skills created, content duplicated in both locations
**v2.2.0**: Configuration migrated to hooks.json
**v2.3.0** (Current): Agents/commands use skills, `.claude-buddy/` deprecated
**v3.0.0** (Future): Complete removal of `.claude-buddy/` directory

### Backward Compatibility

- `.claude-buddy/` directory still exists and installed
- Marked as deprecated/optional in manifest
- Users on v2.0.x-2.2.x can still use it
- No breaking changes in v2.3.0

### Benefits

- **Single Source of Truth**: Skills provide all content
- **Auto-Activation**: No manual loading instructions needed
- **Token Efficiency**: Progressive disclosure reduces context by 30-70%
- **Better Composition**: Skills work together naturally
- **Simpler Maintenance**: Update skills, not scattered files

### Deprecation Notice

See [.claude/DEPRECATION-NOTICE.md](../../.claude/DEPRECATION-NOTICE.md) for details on:
- What's deprecated
- Migration timeline
- How to verify you're using skills
- Removal schedule (v3.0.0)
```

### Task 13: Update README.md

**File**: `setup/README.md`

**In "What Gets Installed" section** (around line 112), update structure:

```markdown
.claude/                 # Claude Code integration
├── hooks/               # Python safety hooks (requires UV + Python)
├── commands/            # Slash commands
├── agents/              # Specialized agents
└── skills/              # Auto-activating Claude Code Skills (PRIMARY SYSTEM v2.1.0+)
    ├── personas/        # 12 persona skills
    ├── domains/         # 3 domain skills
    └── generators/      # 4 generator skills

.claude-buddy/           # Legacy directory (DEPRECATED v2.3.0, removed v3.0.0)
├── buddy-config.json    # Deprecated (use .claude/hooks.json)
├── personas/            # Deprecated (use .claude/skills/personas/)
├── templates/           # Deprecated (use .claude/skills/generators/)
└── context/             # Deprecated (use .claude/skills/domains/)

directive/               # Project foundation
└── foundation.md        # Foundation document template

specs/                   # Specification storage
```

**Add deprecation notice**:

```markdown
### ⚠️ Deprecated Components (v2.3.0)

The `.claude-buddy/` directory is deprecated and will be removed in v3.0.0:

- **buddy-config.json**: Use `.claude/hooks.json` config section (migrated in v2.2.0)
- **personas/**: Use `.claude/skills/personas/` (migrated in v2.1.0)
- **templates/**: Use `.claude/skills/generators/` (migrated in v2.1.0)
- **context/**: Use `.claude/skills/domains/` (migrated in v2.1.0)

**Action Required**: No immediate action - backward compatibility maintained until v3.0.0.

**Recommended**: Verify your installation uses skills by checking that `.claude/skills/` directory exists and contains persona/domain/generator skills.
```

## Documentation Tasks (2 files)

### Task 14: Create DEPRECATION-NOTICE.md

**File**: `.claude/DEPRECATION-NOTICE.md` (create new file)

```markdown
# Deprecation Notice: `.claude-buddy/` Directory

**Status**: Deprecated as of v2.3.0
**Removal**: Planned for v3.0.0
**Date**: October 29, 2025

## What's Deprecated

The `.claude-buddy/` directory and all its contents:

### buddy-config.json
- **Deprecated**: v2.2.0
- **Replaced By**: `.claude/hooks.json` (config section)
- **Reason**: Unified configuration in Claude Code's native format

### personas/
- **Deprecated**: v2.3.0
- **Replaced By**: `.claude/skills/personas/`
- **Reason**: Auto-activating Claude Code Skills with progressive disclosure

### templates/
- **Deprecated**: v2.3.0
- **Replaced By**: `.claude/skills/generators/`
- **Reason**: Generator skills (spec, plan, tasks, docs) with auto-activation

### context/
- **Deprecated**: v2.3.0
- **Replaced By**: `.claude/skills/domains/`
- **Reason**: Domain skills (react, jhipster, mulesoft) with auto-activation

## Migration Timeline

| Version | Status | Description |
|---------|--------|-------------|
| v2.0.x | Active | `.claude-buddy/` is primary system |
| v2.1.0 | Migration Start | Skills created, content duplicated |
| v2.2.0 | Config Migration | buddy-config.json → hooks.json |
| **v2.3.0** | **Deprecated** | **Agents/commands use skills only** |
| v2.4.0-2.9.x | Warning Period | Warnings when `.claude-buddy/` detected |
| v3.0.0 | Removed | Complete removal from codebase |

## Why This Change?

### Skills Provide Better Experience

**Old Way** (`.claude-buddy/`):
- Manual loading from specific file paths
- All content loaded upfront (~15,000 tokens)
- Updates require changing file paths
- No auto-discovery

**New Way** (Skills):
- Auto-activation based on context
- Progressive disclosure (load only what's needed)
- 30-70% token savings
- Skills compose naturally
- Standard Claude Code pattern

### Example: Persona Loading

**Before** (deprecated):
```markdown
Load persona definitions from `.claude-buddy/personas/<persona>.md` to inform analysis.
```

**After** (skills):
```markdown
Persona skills auto-activate from `.claude/skills/personas/` based on file patterns and change analysis.
```

## How to Verify You're Using Skills

### 1. Check Directory Structure

```bash
# Skills directory should exist
ls -la .claude/skills/

# Should show:
# personas/    (12 skills)
# domains/     (3 skills)
# generators/  (4 skills)
```

### 2. Verify Agents Don't Reference .claude-buddy/

```bash
# Should return no results
grep -r "\.claude-buddy/" .claude/agents/*.md | grep -v "Note:"
```

### 3. Check hooks.json Has Config

```bash
# Should show config section
cat .claude/hooks.json | grep -A5 '"config"'
```

## What You Need to Do

### For Most Users: Nothing

- Backward compatibility maintained until v3.0.0
- `.claude-buddy/` still installed (but not used)
- Skills auto-activate automatically
- No action required

### For Advanced Users: Optional Migration

If you've customized files in `.claude-buddy/`:

1. **Personas**: Copy customizations to `.claude/skills/personas/<name>/SKILL.md`
2. **Templates**: Contribute to generator skills
3. **Context**: Contribute to domain skills
4. **Config**: Already migrated to `.claude/hooks.json` in v2.2.0

### For Contributors: Update References

If you're developing Claude Buddy:

- Use `.claude/skills/` in all new code
- Don't reference `.claude-buddy/` in agents/commands
- Update documentation to mention skills
- Test with skills system, not legacy files

## FAQs

### Q: Will my customizations in `.claude-buddy/` be lost?
**A**: No. The directory remains until v3.0.0. You have time to migrate customizations to skills.

### Q: When should I remove `.claude-buddy/` from my project?
**A**: Wait until v3.0.0 or when you've migrated any customizations. No rush - backward compat maintained.

### Q: Can I keep using `.claude-buddy/`?
**A**: Until v3.0.0, yes. But agents/commands won't load from it anymore after v2.3.0.

### Q: How do I customize skills?
**A**: Edit files in `.claude/skills/`. Each skill has a SKILL.md with frontmatter + supporting files.

### Q: What if I'm still on v2.0.x or v2.1.x?
**A**: `.claude-buddy/` still works. Upgrade when ready. Skills provide better experience.

## Support

- **Documentation**: [CONFIG-MIGRATION.md](CONFIG-MIGRATION.md)
- **Skills Guide**: [.claude/skills/README.md](skills/README.md)
- **Architecture Decisions**: [ARCHITECTURE-DECISIONS.md](ARCHITECTURE-DECISIONS.md)
- **Changelog**: [setup/CHANGELOG.md](../setup/CHANGELOG.md)

## Timeline Reminder

- **Now (v2.3.0)**: Deprecated, but still installed
- **Next 6 months**: Warning period (v2.4.x-2.9.x)
- **v3.0.0**: Complete removal

**Recommended Action**: Start using skills, migrate any customizations, verify everything works. You have until v3.0.0.

---

**Questions?** See [Claude Buddy Issues](https://github.com/your-org/claude-buddy/issues)
```

### Task 15: Update ARCHITECTURE-DECISIONS.md

**File**: `.claude/ARCHITECTURE-DECISIONS.md`

**Add after ADR-001**:

```markdown
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

- [ADR-001: Configuration Reading](ARCHITECTURE-DECISIONS.md#adr-001-configuration-reading---agents-vs-commands)
- [DEPRECATION-NOTICE.md](DEPRECATION-NOTICE.md)
- [CONFIG-MIGRATION.md](CONFIG-MIGRATION.md)

---

**Status**: Implemented in v2.3.0
**Reviewed By**: Architecture review
**Last Updated**: October 29, 2025
```

## Final Task: Build and Verify

### Task 16: Build and Verify Distribution

```bash
cd setup && npm run build
```

**Verify**:
1. ✅ hooks.json has config section
2. ✅ skills directory included (19 skills)
3. ✅ .claude-buddy/ still bundled (backward compat)
4. ✅ Updated agents/commands in dist
5. ✅ All 11 verification paths pass

## Completion Checklist

- [ ] All 4 agents updated
- [ ] All 5 commands updated
- [ ] manifest.js updated (version 2.3.0, components deprecated)
- [ ] package.json updated (version 2.3.0)
- [ ] CHANGELOG.md updated (v2.3.0 entry)
- [ ] README.md updated (deprecation notice)
- [ ] DEPRECATION-NOTICE.md created
- [ ] ARCHITECTURE-DECISIONS.md updated (ADR-002)
- [ ] Distribution built and verified
- [ ] No .claude-buddy/ references in agents/commands (except deprecation notes)

## Testing After Completion

1. Run `/buddy:commit` - verify persona skills activate
2. Run `/buddy:docs` - verify docs-generator skill works
3. Run `/buddy:plan` - verify plan-generator skill works
4. Check `.claude-buddy/` not loaded in any tool calls
5. Verify skills activate automatically

---

**Continue from Task 3** when ready. All tasks are documented above with exact changes needed.
