# Frequently Asked Questions

Common questions about Claude Buddy.

## General Questions

### What is Claude Buddy?

Claude Buddy is an AI assistant configuration framework that enhances Claude Code with specialized personas, automated workflows, and intelligent context management.

### Do I need an API key?

No. Claude Buddy works through Claude Code CLI, which handles authentication. You need a valid Claude Code subscription.

### Does it work offline?

Yes, once installed. Hook execution and command processing work offline. Only initial installation requires internet access.

### Is my data sent to external servers?

No. Claude Buddy operates entirely locally. All processing happens on your machine.

## Installation & Setup

### How do I install Claude Buddy?

Currently via manual file copying. See [Development Setup](./development-setup.md). NPM distribution is planned.

### Can I use it with VS Code?

Yes. Claude Code integrates with VS Code. Install the Claude Code extension and Claude Buddy works automatically.

### Do I need to install it in every project?

Yes. Claude Buddy is project-specific. Copy `.claude/` and `.claude-buddy/` to each project.

### Can I have different configurations per project?

Yes. Each project has its own `buddy-config.json` with independent settings.

## Personas

### How many personas can activate at once?

Default: 3. Configurable via `max_active_personas` setting.

### Can I create custom personas?

Yes. Add `.md` files to `.claude-buddy/personas/` following the persona template structure.

### Why isn't my persona activating?

Check:
1. Personas enabled in config
2. Confidence threshold (try lowering to 0.6)
3. Persona file exists and properly formatted
4. Use manual activation: `/buddy:persona name - question`

### Can I disable personas?

Yes. Set `features.personas: false` in `buddy-config.json`.

## Safety & Security

### What files are protected by default?

`.env*`, `*.key`, `*.pem`, `secrets.*`, `credentials.*`, SSH keys, AWS/SSH directories. See [API Authentication](./api-authentication.md).

### Can I add custom protected patterns?

Yes. Add to `file_protection.additional_patterns` in config.

### What commands are blocked?

`rm -rf /`, `sudo rm`, fork bombs, disk operations, format operations, dangerous chmod. See [API Authentication](./api-authentication.md).

### Can dangerous commands be whitelisted?

Yes, but carefully. Add to `command_validation.whitelist_patterns`. Use `strict_mode: true` for production.

### Does strict mode affect normal operations?

Strict mode blocks whitelist overrides for enhanced security. Only use for sensitive projects.

## Foundation & Documentation

### Do I need a foundation document?

Yes, for most commands. Run `/buddy:foundation` first.

### How do I update my foundation?

Run `/buddy:foundation` again. System will detect existing foundation and offer to update it with version bump.

### Can I have multiple foundation types?

No. One foundation type per project. Choose: default, jhipster, or mulesoft.

### How often should I regenerate docs?

After significant codebase changes. Run `/buddy:docs` to update.

### Can I edit generated documentation?

Yes. Generated docs are markdown files you can edit. Note: Regenerating will overwrite changes.

## Commands & Workflows

### What's the spec → plan → tasks workflow?

1. `/buddy:spec` - Define feature requirements
2. `/buddy:plan` - Create implementation strategy
3. `/buddy:tasks` - Break into actionable tasks
4. Implement code
5. `/buddy:commit` - Professional commit message

### Do commits include AI attribution?

No. Per project requirements, commit messages do NOT include Claude attribution.

### Can I customize commit messages?

Yes. `/buddy:commit` generates messages following your repository's style. You can edit before committing.

### What if I don't want auto-formatting?

Disable: `features.auto_formatting: false` in config.

## Performance

### Why are hooks slow?

Common causes:
- Too many protection patterns
- Large files
- Slow formatters

Solutions: Reduce patterns, add exclusions, increase timeouts. See [Performance Troubleshooting](./troubleshooting-performance.md).

### Why is documentation generation slow?

Large codebases take longer. Typical: 3-5 minutes for medium projects. Optimize by excluding large directories.

### Can I speed up persona activation?

Yes:
- Increase confidence threshold (0.75-0.8)
- Reduce max active personas (2 instead of 3)
- Use manual activation

## Troubleshooting

### Hooks aren't working

Check:
1. Hooks enabled: `.claude/settings.local.json`
2. Python/uv installed
3. Hooks registered: `.claude/hooks.json`
4. Test directly: `echo {...} | uv run python .claude/hooks/file-guard.py`

See [Troubleshooting Common Issues](./troubleshooting-common-issues.md).

### Commands not found

1. Verify files exist: `ls .claude/commands/buddy/`
2. Restart Claude Code
3. Update Claude Code to latest version

### Configuration errors

Validate JSON: `python -m json.tool .claude-buddy/buddy-config.json`

### Need more help?

See comprehensive troubleshooting docs:
- [Common Issues](./troubleshooting-common-issues.md)
- [Development Debugging](./development-debugging.md)
- [Performance Issues](./troubleshooting-performance.md)

## Advanced

### Can I modify hooks?

Yes. Edit Python files in `.claude/hooks/`. Test thoroughly before committing.

### Can I create custom commands?

Yes. Add `.md` files to `.claude/commands/buddy/` and corresponding agent protocols to `.claude/agents/`.

### Can I add custom templates?

Yes. Create new foundation type directory in `.claude-buddy/templates/` with spec.md, plan.md, tasks.md, docs.md.

### Can I integrate with CI/CD?

Yes. See [Deployment Deployment](./deployment-deployment.md) for GitHub Actions examples.

### Can I use with monorepos?

Yes. Install Claude Buddy at project root or in each sub-project depending on your needs.

## Compatibility

### Minimum Claude Code version?

Latest version recommended. Check: `claude --version`

### Python version required?

Python 3.8 or higher. Check: `python --version`

### Does it work on Windows?

Yes, with WSL2 recommended. Native Windows support limited for hook execution.

### macOS version required?

macOS 10.15 (Catalina) or later.

## Related Documentation

- [Architecture Overview](./architecture-overview.md) - How it works
- [Development Setup](./development-setup.md) - Installation guide
- [API Endpoints](./api-endpoints.md) - Command reference
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - Problem resolution
