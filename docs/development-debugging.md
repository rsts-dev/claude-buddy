# Debugging Guide

Comprehensive debugging strategies for Claude Buddy.

## Debugging Tools

### 1. Hook Debugging

**Enable verbose output**:
```bash
# Run hook with stderr visible
echo '{"tool":"Write","parameters":{"file_path":".env","content":"test"}}' | \
  python .claude/hooks/file-guard.py 2>&1 | tee debug.log
```

**Add debug logging to hooks**:
```python
import sys
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

logger = logging.getLogger(__name__)

# In your code
logger.debug(f"Checking file: {file_path}")
logger.debug(f"Pattern matched: {pattern}")
```

### 2. Configuration Debugging

**Validate JSON**:
```bash
# Check buddy-config.json
jq . .claude-buddy/buddy-config.json || echo "Invalid JSON"

# Check hooks.json
jq . .claude/hooks.json || echo "Invalid JSON"

# Pretty print for readability
jq . .claude-buddy/buddy-config.json | less
```

**Check configuration loading**:
```python
import json

# Test configuration loading
with open('.claude-buddy/buddy-config.json') as f:
    config = json.load(f)
    print(json.dumps(config, indent=2))

# Check specific settings
print(f"Personas enabled: {config.get('features', {}).get('personas')}")
print(f"Confidence threshold: {config.get('personas', {}).get('auto_activation', {}).get('confidence_threshold')}")
```

### 3. Foundation Debugging

**Check foundation structure**:
```bash
# Verify foundation exists
test -f directive/foundation.md && echo "Foundation exists" || echo "Foundation missing"

# Extract key metadata
grep "^**Foundation Type**:" directive/foundation.md
grep "^**Version**:" directive/foundation.md

# Count principles
grep -c "^### Principle [0-9]:" directive/foundation.md
```

**Validate foundation format**:
```bash
# Check required sections
for section in "Purpose" "Core Principles" "Governance" "Foundation Metadata"; do
  grep -q "^## $section" directive/foundation.md && \
    echo "✓ $section found" || \
    echo "✗ $section missing"
done
```

## Common Issues and Solutions

### Issue 1: Hooks Not Executing

**Symptoms**:
- File protection not working
- Dangerous commands not blocked
- No formatting applied

**Debug steps**:

```bash
# 1. Check hooks enabled in Claude settings
cat .claude/settings.local.json

# Expected:
# {"hooks": {"enabled": true}}

# 2. Verify hooks.json exists and valid
test -f .claude/hooks.json && jq . .claude/hooks.json

# 3. Test hook directly
echo '{"tool":"Write","parameters":{"file_path":"test.md","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# 4. Check Python environment
which python
python --version
which uv
uv --version

# 5. Verify hook file permissions
ls -l .claude/hooks/*.py

# 6. Test hook command from hooks.json
uv run --no-project python /absolute/path/to/.claude/hooks/file-guard.py --version 2>&1
```

**Solution**: Enable hooks in settings.local.json, verify Python/uv installed, fix file paths in hooks.json

### Issue 2: Command Not Found

**Symptoms**:
- `/buddy:persona` not recognized
- `/buddy:foundation` returns error
- Slash commands unavailable

**Debug steps**:

```bash
# 1. Check command files exist
ls -la .claude/commands/buddy/

# Expected output: persona.md, foundation.md, spec.md, etc.

# 2. Verify agent files exist
ls -la .claude/agents/

# Expected output: persona-dispatcher.md, foundation.md, etc.

# 3. Check Claude Code version
claude --version

# 4. Restart Claude Code
# Sometimes commands need to be reloaded

# 5. Check for syntax errors in command markdown
cat .claude/commands/buddy/persona.md | head -20
```

**Solution**: Ensure all command and agent files present, restart Claude Code, update to latest version

### Issue 3: Persona Not Activating

**Symptoms**:
- Auto-activation doesn't select expected persona
- Manual activation fails
- No persona-specific response

**Debug steps**:

```bash
# 1. Check personas enabled
jq '.features.personas' .claude-buddy/buddy-config.json

# 2. Check confidence threshold
jq '.personas.auto_activation.confidence_threshold' .claude-buddy/buddy-config.json

# 3. Verify persona file exists
test -f .claude-buddy/personas/security.md && echo "Exists" || echo "Missing"

# 4. Check persona file format
head -30 .claude-buddy/personas/security.md

# 5. Test with lower threshold temporarily
# Edit buddy-config.json: "confidence_threshold": 0.5

# 6. Try manual activation to rule out confidence issue
/buddy:persona security - Test question
```

**Solution**: Enable personas in config, adjust confidence threshold, verify persona file exists and properly formatted

### Issue 4: Foundation Creation Fails

**Symptoms**:
- `/buddy:foundation` returns error
- directive/foundation.md not created
- Invalid foundation structure

**Debug steps**:

```bash
# 1. Check directive directory exists and writable
mkdir -p directive
touch directive/test.md && rm directive/test.md

# 2. Verify foundation agent exists
test -f .claude/agents/foundation.md && echo "Agent exists" || echo "Agent missing"

# 3. Check foundation template
test -f .claude-buddy/templates/foundation.md && echo "Template exists" || echo "Template missing"

# 4. Try with minimal input
/buddy:foundation provided
# Input: "Test project for debugging"

# 5. Check for partial creation
ls -la directive/
cat directive/foundation.md  # If exists
```

**Solution**: Ensure directive/ directory writable, foundation agent and template exist, provide valid input

### Issue 5: Documentation Generation Fails

**Symptoms**:
- `/buddy:docs` errors out
- Partial documentation created
- Missing diagrams or content

**Debug steps**:

```bash
# 1. Verify foundation exists
test -f directive/foundation.md || echo "Foundation missing - run /buddy:foundation first"

# 2. Check foundation type
grep "^**Foundation Type**:" directive/foundation.md

# 3. Verify template exists for foundation type
FOUNDATION_TYPE=$(grep "^**Foundation Type**:" directive/foundation.md | awk '{print $NF}')
test -f .claude-buddy/templates/$FOUNDATION_TYPE/docs.md || echo "Template missing"

# 4. Check docs directory permissions
mkdir -p docs
touch docs/test.md && rm docs/test.md

# 5. Check for large codebase timeout
find . -name "*.py" -o -name "*.js" | wc -l

# 6. Try docs generation with verbose logging (if supported)
/buddy:docs
```

**Solution**: Create foundation first, verify template exists, ensure docs/ writable, adjust timeout for large codebases

### Issue 6: Commit Command Issues

**Symptoms**:
- `/buddy:commit` fails
- No commit message generated
- Commit message includes unwanted attribution

**Debug steps**:

```bash
# 1. Check git status
git status

# 2. Check for staged changes
git diff --cached

# 3. Verify git-workflow agent
test -f .claude/agents/git-workflow.md

# 4. Check git configuration
git config user.name
git config user.email

# 5. Verify no pre-commit hooks interfering
ls .git/hooks/pre-commit

# 6. Check project CLAUDE.md for commit instructions
cat .claude/CLAUDE.md | grep -A 5 "Commit Message"
```

**Solution**: Stage changes first, ensure git configured, verify agent exists, per project requirements NO Claude attribution

## Advanced Debugging

### Trace Hook Execution

Create debug wrapper for hooks:

```bash
# .claude/hooks/debug-wrapper.sh
#!/bin/bash
HOOK_NAME=$1
INPUT=$(cat)

echo "[DEBUG] Hook: $HOOK_NAME" >&2
echo "[DEBUG] Input: $INPUT" >&2

RESULT=$(echo "$INPUT" | uv run --no-project python ".claude/hooks/$HOOK_NAME.py" 2>&1)
EXIT_CODE=$?

echo "[DEBUG] Output: $RESULT" >&2
echo "[DEBUG] Exit code: $EXIT_CODE" >&2

echo "$RESULT"
exit $EXIT_CODE
```

Update hooks.json temporarily:
```json
{
  "command": "bash .claude/hooks/debug-wrapper.sh file-guard"
}
```

### Persona Activation Analysis

Add logging to persona-dispatcher (if modifying):

```markdown
Debug output format:

Request: "How do I optimize database queries?"

Keyword analysis:
- "optimize" → performance: 0.9
- "database" → backend: 0.8, performance: 0.7
- "queries" → backend: 0.9, performance: 0.8

Context analysis:
- Technical question: +0.2 architect, performance
- No file context: neutral

File pattern analysis:
- No files mentioned: neutral

Historical analysis:
- performance recently used: +0.1

Final scores:
- performance: 0.95 (ACTIVATED)
- backend: 0.82 (ACTIVATED)
- architect: 0.68 (BELOW THRESHOLD 0.7)

Selected: performance, backend
```

### Configuration Tracing

```python
# debug_config.py
import json
from pathlib import Path

def trace_config():
    config_files = [
        '.claude-buddy/buddy-config.json',
        '.claude/hooks.json',
        '.claude/settings.local.json'
    ]

    for config_file in config_files:
        print(f"\n=== {config_file} ===")
        path = Path(config_file)
        if path.exists():
            with open(path) as f:
                config = json.load(f)
                print(json.dumps(config, indent=2))
        else:
            print("FILE NOT FOUND")

if __name__ == "__main__":
    trace_config()
```

Run: `python debug_config.py`

## Logging Configuration

Enable comprehensive logging in `buddy-config.json`:

```json
{
  "logging": {
    "enabled": true,
    "level": "debug",
    "file_operations": true,
    "command_executions": true,
    "hook_activities": true,
    "output_file": ".claude-buddy/logs/debug.log"
  }
}
```

View logs:
```bash
tail -f .claude-buddy/logs/debug.log
```

## Debugging Workflows

### Debug New Feature

```bash
# 1. Test specification generation
/buddy:spec Simple test feature
ls -la specs/*/spec.md

# 2. Verify spec content
cat specs/$(ls -t specs/ | head -1)/spec.md

# 3. Test plan generation
/buddy:plan
cat specs/$(ls -t specs/ | head -1)/plan.md

# 4. Test tasks generation
/buddy:tasks
cat specs/$(ls -t specs/ | head -1)/tasks.md

# 5. Check for consistency
grep "user-authentication" specs/*/spec.md specs/*/plan.md specs/*/tasks.md
```

### Debug Hook Behavior

```bash
# Test all hook scenarios
for file in ".env" "secrets.json" "README.md" "config.yaml"; do
  echo "Testing: $file"
  result=$(echo "{\"tool\":\"Write\",\"parameters\":{\"file_path\":\"$file\",\"content\":\"test\"}}" | \
    uv run --no-project python .claude/hooks/file-guard.py)
  echo "Result: $result"
  echo "---"
done
```

### Debug Persona Selection

```bash
# Test various requests
requests=(
  "Design a microservices architecture"
  "Fix this security vulnerability"
  "Optimize database performance"
  "Write unit tests"
  "Review code quality"
)

for request in "${requests[@]}"; do
  echo "Request: $request"
  /buddy:persona $request
  echo "====="
done
```

## Performance Debugging

### Profile Hook Execution

```python
# Add to hook file
import time
start = time.time()

# ... hook logic ...

duration = time.time() - start
sys.stderr.write(f"Execution time: {duration:.3f}s\n")
```

### Measure Command Performance

```bash
# Time documentation generation
time /buddy:docs

# Time foundation creation
time /buddy:foundation provided

# Compare with different project sizes
find . -name "*.py" | wc -l
time /buddy:docs
```

## Error Message Interpretation

### Hook Error Messages

**"Operation blocked: File matches protected pattern"**
- Cause: File matches pattern in file-guard.py
- Solution: Verify file should be protected, or add to whitelist

**"Hook timeout exceeded"**
- Cause: Hook took longer than timeout setting
- Solution: Increase timeout in hooks.json or optimize hook

**"Invalid JSON in request"**
- Cause: Malformed JSON input to hook
- Solution: Check Claude Code version, verify hook registration

### Command Error Messages

**"Foundation document not found"**
- Cause: directive/foundation.md missing
- Solution: Run `/buddy:foundation` first

**"Template not found for foundation type"**
- Cause: Template directory missing for foundation type
- Solution: Verify foundation type, ensure template exists

**"Personas feature is disabled"**
- Cause: Personas disabled in buddy-config.json
- Solution: Enable in config: "features": {"personas": true}

## Related Documentation

- [Development Setup](./development-setup.md) - Configuration guide
- [Development Testing](./development-testing.md) - Testing strategies
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - Quick fixes
