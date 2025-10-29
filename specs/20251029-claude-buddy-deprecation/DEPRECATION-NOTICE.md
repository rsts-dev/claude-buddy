# Removal Notice: `.claude-buddy/` Directory

**Status**: ❌ **REMOVED** in v3.0.0
**Removal Date**: October 29, 2025
**Deprecated**: v2.3.0 (October 29, 2025)

## What Was Removed

The `.claude-buddy/` directory and all its contents were completely removed in v3.0.0:

### buddy-config.json
- **Removed**: v3.0.0
- **Replaced By**: `.claude/hooks.json` (config section)
- **Migration**: v2.2.0

### personas/
- **Removed**: v3.0.0
- **Replaced By**: `.claude/skills/personas/`
- **Migration**: v2.1.0

### templates/
- **Removed**: v3.0.0
- **Replaced By**: `.claude/skills/generators/`
- **Migration**: v2.1.0

### context/
- **Removed**: v3.0.0
- **Replaced By**: `.claude/skills/domains/`
- **Migration**: v2.1.0

## Removal Timeline

| Version | Date | Status |
|---------|------|--------|
| v2.0.x | - | `.claude-buddy/` primary system |
| v2.1.0 | Oct 2025 | Skills created, both systems exist |
| v2.2.0 | Oct 2025 | Config migrated to hooks.json |
| v2.3.0 | Oct 29, 2025 | **DEPRECATED** - Agents use skills only |
| **v3.0.0** | **Oct 29, 2025** | **REMOVED** - Directory deleted |

## Migration for v3.0.0 Users

If you're upgrading from v2.x to v3.0.0, you **MUST** have:

### 1. Configuration in `.claude/hooks.json`

```bash
# Verify configuration exists
cat .claude/hooks.json | grep -A5 '"config"'
```

**If missing**: Your configuration will use defaults. Copy your old settings from `.claude-buddy/buddy-config.json` to `.claude/hooks.json` config section.

### 2. Skills Directory Installed

```bash
# Verify skills exist
ls .claude/skills/{personas,domains,generators}
```

**If missing**: Reinstall Claude Buddy v3.0.0 to get skills.

### 3. No Custom `.claude-buddy/` Content

If you have customizations in `.claude-buddy/`:

- **Personas**: Migrate to `.claude/skills/personas/<name>/SKILL.md`
- **Templates**: Contribute to generator skills or create custom ones
- **Context**: Add to domain skills or create custom ones
- **Config**: Already in `.claude/hooks.json` (migrated v2.2.0)

## Current System (v3.0.0+)

### Configuration
**Location**: `.claude/hooks.json`
```json
{
  "hooks": { ... },
  "config": {
    "file_protection": { ... },
    "command_validation": { ... },
    "auto_formatting": { ... },
    "git": { ... },
    "features": { ... }
  }
}
```

### Persona Skills
**Location**: `.claude/skills/personas/<name>/SKILL.md`
- Auto-activate based on task context
- 12 personas: scribe, architect, security, frontend, backend, performance, analyzer, qa, refactorer, devops, mentor, po

### Domain Skills
**Location**: `.claude/skills/domains/<domain>/SKILL.md`
- Auto-activate based on technology patterns
- 3 domains: react, jhipster, mulesoft

### Generator Skills
**Location**: `.claude/skills/generators/<generator>/SKILL.md`
- Auto-activate for document generation
- 4 generators: spec-generator, plan-generator, tasks-generator, docs-generator

## Why Skills Are Better

### Before (`.claude-buddy/` - REMOVED)
- Manual loading from specific file paths
- All content loaded upfront (~15,000 tokens)
- Updates require changing file paths
- No auto-discovery
- Confusing dual-system (both `.claude/` and `.claude-buddy/`)

### After (Skills - v3.0.0+)
- ✅ Auto-activation based on context
- ✅ Progressive disclosure (load only what's needed)
- ✅ 30-70% token savings
- ✅ Skills compose naturally
- ✅ Standard Claude Code pattern
- ✅ Single source of truth (`.claude/` only)
- ✅ 40% smaller package size

## Verification

### Check You're Using v3.0.0 Correctly

```bash
# 1. Verify .claude-buddy/ doesn't exist
ls .claude-buddy 2>&1 | grep "No such file"

# 2. Verify configuration location
cat .claude/hooks.json | grep -A2 '"config"'

# 3. Verify skills installed
ls .claude/skills/{personas,domains,generators} | wc -l
# Should show: 12, 3, 4

# 4. Verify no legacy references in agents
grep -r "\.claude-buddy/" .claude/agents/*.md | grep -v "Note:"
# Should return nothing
```

## Support

- **Documentation**: [setup/README.md](../setup/README.md)
- **Changelog**: [setup/CHANGELOG.md](../setup/CHANGELOG.md#300---2025-10-29)
- **Skills Guide**: [.claude/skills/README.md](skills/README.md)
- **Architecture**: [ARCHITECTURE-DECISIONS.md](ARCHITECTURE-DECISIONS.md) (ADR-002)

## FAQs

### Q: I have v2.x and custom `.claude-buddy/` files. What now?
**A**: Migrate your customizations to `.claude/skills/` before upgrading to v3.0.0. Or stay on v2.3.0 until you're ready.

### Q: Can I downgrade if v3.0.0 doesn't work?
**A**: Yes. Uninstall v3.0.0 and install v2.3.0. Your `.claude/` directory will remain intact.

### Q: Where did my configuration go?
**A**: Check `.claude/hooks.json` (config section). If missing, defaults are used. Restore from backup if needed.

### Q: Skills aren't activating. What's wrong?
**A**: Verify `.claude/skills/` exists and contains all persona/domain/generator subdirectories. Reinstall if missing.

### Q: Can I create custom skills?
**A**: Yes! Add new skills to `.claude/skills/`. Follow the SKILL.md format with frontmatter activation criteria.

---

**v3.0.0**: `.claude-buddy/` is gone. Skills-only system. Simpler, faster, better.
