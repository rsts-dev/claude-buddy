# Coding Standards

Coding standards and best practices for Claude Buddy development and usage.

## Foundation-Driven Development

### Principle: Alignment with Foundation

All development must align with principles in `directive/foundation.md`.

**Before starting development**:
```bash
# 1. Read foundation
cat directive/foundation.md

# 2. Verify feature aligns with principles
/buddy:persona architect - Does this feature align with our foundation principles?
```

**Foundation Compliance Checklist**:
- [ ] Feature supports core principles
- [ ] Implementation follows requirements
- [ ] Decision rationale documented
- [ ] Compliance verification added

## Configuration File Standards

### JSON Configuration Files

**File**: `buddy-config.json`, `hooks.json`, `settings.local.json`

**Standards**:
```json
{
  // Use 2-space indentation
  "version": "1.0.0",

  // Group related settings
  "features": {
    "auto_commit": true,
    "safety_hooks": true
  },

  // Include comments where helpful (JSONC style in docs only)
  "personas": {
    "enabled": true,
    "auto_activation": {
      "confidence_threshold": 0.7  // 0.0 to 1.0
    }
  }
}
```

**Validation**:
```bash
# Always validate JSON before committing
jq empty .claude-buddy/buddy-config.json
python -m json.tool .claude/hooks.json
```

### Markdown Files

**Files**: Personas, templates, documentation, foundation

**Standards**:
```markdown
# Use ATX-style headers (not Setext)

## Clear Hierarchy
Start with H1, use H2-H4 for structure

### Code Blocks with Language
\`\`\`python
# Always specify language
def example():
    pass
\`\`\`

### Lists
- Use hyphens for unordered lists
- Maintain consistent indentation (2 spaces)
  - For nested items
  - Keep alignment

1. Use numbers for ordered lists
2. Let Markdown auto-number
3. Easier to maintain

### Links
Use [descriptive text](./relative-path.md) for internal links
Use [descriptive text](https://example.com) for external links
```

**Mermaid Diagrams**:
```markdown
\`\`\`mermaid
graph TD
    A[Clear Labels] --> B[Logical Flow]
    B --> C[Consistent Styling]

    %% Use comments for complex diagrams
    %% Keep diagrams focused on one concept
\`\`\`
```

## Python Hook Standards

**Location**: `.claude/hooks/*.py`

### Code Style

Follow PEP 8 with these specifics:

```python
#!/usr/bin/env python3
"""
Module docstring describing hook purpose.

This hook validates/formats/processes...
"""

import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Any

# Constants in UPPER_SNAKE_CASE
DEFAULT_TIMEOUT = 10
PROTECTED_PATTERNS = [
    r"\.env.*",
    r".*\.key$",
]


def validate_operation(tool: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate tool operation against safety rules.

    Args:
        tool: Tool name (Write, Edit, Bash)
        parameters: Tool-specific parameters

    Returns:
        Dict with 'approved' boolean and 'message' string

    Raises:
        ValueError: If parameters invalid
    """
    # Implementation
    pass


def main() -> int:
    """Main entry point for hook execution."""
    try:
        # Read stdin
        request = json.loads(sys.stdin.read())

        # Process
        result = validate_operation(
            request["tool"],
            request["parameters"]
        )

        # Write stdout
        print(json.dumps(result))
        return 0

    except Exception as e:
        # Error handling
        error_response = {
            "approved": False,
            "message": f"Hook error: {str(e)}"
        }
        print(json.dumps(error_response))
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

### Hook Best Practices

1. **Fast Execution**: Complete within timeout (10-30s)
2. **Clear Messages**: Provide actionable error messages
3. **Graceful Failure**: Return error JSON, don't crash
4. **No Side Effects**: Don't modify files or state
5. **Logging**: Use stderr for debug info, stdout for JSON

### Hook Testing

```bash
# Test with sample input
echo '{"tool":"Write","parameters":{"file_path":".env","content":"TEST"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# Expected output
{"approved": false, "message": "Operation blocked: File matches protected pattern .env"}

# Test all paths
pytest .claude/hooks/test_file_guard.py  # If tests exist
```

## Agent Protocol Standards

**Location**: `.claude/agents/*.md`

### Agent Structure

```markdown
# Agent Name

## Role Definition
[Clear description of agent's purpose]

## Prerequisites
- [ ] Foundation document exists
- [ ] Required templates loaded
- [ ] Context files available (if needed)

## Execution Protocol

### Phase 1: [Phase Name]
[Step-by-step instructions]

### Phase 2: [Phase Name]
[Step-by-step instructions]

## Output Specification
[Exact file structure and content format]

## Quality Assurance
- [ ] Validation checkpoint 1
- [ ] Validation checkpoint 2

## Error Handling
- **Error Type 1**: Resolution steps
- **Error Type 2**: Resolution steps
```

### Agent Best Practices

1. **Idempotent**: Multiple runs produce consistent results
2. **Defensive**: Check prerequisites before executing
3. **Transparent**: Log decisions and reasoning
4. **Helpful**: Provide clear guidance in outputs

## Persona Standards

**Location**: `.claude-buddy/personas/*.md`

### Persona Structure

```markdown
# Persona Name - Brief Description

## Identity & Expertise
- **Role**: Primary role and responsibility
- **Priority Hierarchy**: Ordered list of priorities
- **Specializations**: Specific areas of expertise

## Core Principles
1. Principle 1: Description
2. Principle 2: Description
...

## Auto-Activation Triggers
### High Confidence (95%+)
- Keywords: [primary, keywords, here]

### Medium Confidence (80-94%)
- Keywords: [secondary, keywords, here]

### Context Clues
- File patterns: *.test.*, src/components/
- Project indicators: package.json with "react"

## Collaboration Patterns
- **With architect**: System design discussions
- **With qa**: Testing strategy development

## Response Patterns
[How persona approaches problems and structures responses]

## Command Specializations
- **`/buddy:command`**: Expertise description
```

### Persona Guidelines

1. **Focused Expertise**: Clear specialty, don't overlap too much
2. **Consistent Voice**: Maintain persona's characteristic approach
3. **Collaborative**: Define how persona works with others
4. **Trigger Accuracy**: Keywords should reflect actual usage

## Template Standards

**Location**: `.claude-buddy/templates/[foundation-type]/*.md`

### Template Structure

```markdown
# Template Name

## AGENT ROLE
[What this template does]

## SCOPE
[What this template covers]

## ANALYSIS PROCESS
### Phase 1: Detection
\`\`\`bash
# Bash commands to run
find . -name "*.py" | wc -l
\`\`\`

### Phase 2: Analysis
\`\`\`bash
# More commands
\`\`\`

## OUTPUT SPECIFICATION
[Exact file structure to generate]

## CONTENT GENERATION STRATEGY
[Patterns and examples for content]

## QUALITY ASSURANCE
- [ ] Check 1
- [ ] Check 2
```

### Template Guidelines

1. **Technology-Specific**: Adapt to foundation type
2. **Executable Commands**: All bash commands must work
3. **Example-Rich**: Provide patterns to follow
4. **QA-Focused**: Include validation steps

## Commit Message Standards

**Per Project Requirements**: NO Claude Code attribution

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

### Examples

**Good**:
```
feat: add JWT authentication to API

- Implement passport-jwt strategy
- Add login and refresh endpoints
- Include rate limiting on auth routes
- Add comprehensive test coverage
```

**Bad**:
```
update stuff

changed some files
```

### Commit Best Practices

1. **Atomic**: One logical change per commit
2. **Complete**: Include all related changes
3. **Tested**: Ensure tests pass before committing
4. **Documented**: Update docs if behavior changes

## Documentation Standards

### Structure

```markdown
# Title (H1 - One per document)

Brief introduction paragraph.

## Major Section (H2)

Content with examples.

### Subsection (H3)

Detailed content.

#### Minor Point (H4)

Avoid going deeper than H4.
```

### Code Examples

```markdown
Always include:
1. Language specification
2. Comments explaining key points
3. Complete, runnable examples
4. Expected output where relevant

\`\`\`python
# Example: File protection hook
def is_protected(file_path: str) -> bool:
    """Check if file matches protected pattern."""
    for pattern in PROTECTED_PATTERNS:
        if re.match(pattern, file_path):
            return True
    return False
\`\`\`
```

### Cross-References

```markdown
Use relative links for internal docs:
See [Setup Guide](./development-setup.md)

Use descriptive link text (not "click here"):
GOOD: See the [configuration guide](./config.md) for details
BAD: Click [here](./config.md) for configuration
```

## Version Control Standards

### Branch Naming

```
feature/short-description
fix/bug-description
docs/what-documenting
refactor/what-refactoring
```

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Make changes incrementally
# 3. Commit frequently with clear messages
/buddy:commit

# 4. Push to remote
git push origin feature/user-authentication

# 5. Create pull request
gh pr create --title "Add user authentication" --body "$(cat <<EOF
## Summary
- Implement JWT-based authentication
- Add login/logout endpoints
- Include rate limiting

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
EOF
)"
```

### Protected Branches

Never force push to:
- `main`
- `master`
- `production`
- `release/*`

## Security Standards

### Secrets Management

**NEVER commit**:
- API keys or tokens
- Passwords or credentials
- Private keys or certificates
- `.env` files with real values

**Instead use**:
- Environment variables
- Secure vaults (AWS Secrets Manager, HashiCorp Vault)
- `.env.example` templates (no real values)

### File Protection

```json
{
  "file_protection": {
    "enabled": true,
    "strict_mode": true,  // For production projects
    "additional_patterns": [
      "config/production\\..*",
      ".*\\.key$",
      ".*\\.pem$"
    ]
  }
}
```

### Command Validation

```json
{
  "command_validation": {
    "enabled": true,
    "block_dangerous": true,
    "additional_dangerous_patterns": [
      "curl.*production.*DELETE",
      "DROP DATABASE.*production"
    ]
  }
}
```

## Testing Standards

### Hook Testing

```python
# .claude/hooks/test_file_guard.py
import json
from file_guard import validate_operation

def test_blocks_env_file():
    """Test that .env files are blocked."""
    request = {
        "tool": "Write",
        "parameters": {
            "file_path": ".env",
            "content": "SECRET=value"
        }
    }
    result = validate_operation(request["tool"], request["parameters"])
    assert result["approved"] == False
    assert ".env" in result["message"]

def test_allows_regular_file():
    """Test that regular files are allowed."""
    request = {
        "tool": "Write",
        "parameters": {
            "file_path": "README.md",
            "content": "# Project"
        }
    }
    result = validate_operation(request["tool"], request["parameters"])
    assert result["approved"] == True
```

### Integration Testing

```bash
# Test complete workflow
/buddy:spec Add simple feature
/buddy:plan
/buddy:tasks

# Verify outputs created
ls specs/*/spec.md
ls specs/*/plan.md
ls specs/*/tasks.md
```

## Performance Standards

### Hook Performance

- **Validation hooks**: Complete in < 10 seconds
- **Formatting hooks**: Complete in < 30 seconds
- **Large file handling**: Stream processing for files > 1MB

### Documentation Generation

- **Small projects** (< 100 files): < 2 minutes
- **Medium projects** (100-1000 files): < 5 minutes
- **Large projects** (1000+ files): < 10 minutes

## Related Documentation

- [Development Setup](./development-setup.md) - Environment configuration
- [Development Testing](./development-testing.md) - Testing strategies
- [Architecture Components](./architecture-components.md) - Component details
