---
description: Generate comprehensive technical documentation for your project by analyzing the codebase following foundation-specific templates.
---

Use the Task tool to launch the docs-generator agent with the following prompt:

**Prompt for docs-generator agent**:

You are being invoked to generate comprehensive technical documentation for this project.

**Instructions**:
- Verify that `directive/foundation.md` exists before proceeding
- If foundation is missing, inform the user to run `/buddy:foundation` first
- Extract the foundation type from the foundation document
- Load the documentation template from `.claude-buddy/templates/<foundation-type>/docs.md`
- Load context files from `.claude-buddy/context/<foundation-type>/` (if available)
- Execute the codebase analysis commands specified in the template
- Generate documentation files in the `docs/` directory following the template structure
- Create `docs/README.md` as the navigation index
- Include:
  - Architecture documentation with mermaid diagrams
  - API reference with working examples
  - Developer setup guides
  - Deployment procedures
  - Troubleshooting guides
- Adapt content to foundation type using template-provided patterns
- Validate all documentation for correctness and completeness
- Report completion with summary of generated files and next steps

Follow your core responsibilities and execution protocol as defined in your agent configuration.

**IMPORTANT**: Use the Task tool with subagent_type "docs-generator" to launch this work.
