# Testing Guide

Comprehensive testing strategies for Claude Buddy.

## Testing Philosophy

Claude Buddy emphasizes:
1. **Safety-first**: Hooks prevent dangerous operations
2. **Foundation alignment**: All features respect principles
3. **Transparency**: Operations are logged and auditable

## Test Categories

### 1. Hook Testing

**Purpose**: Verify safety hooks correctly validate operations

#### File Protection Hook Tests

```bash
# Test 1: Protected file blocked
echo '{"tool":"Write","parameters":{"file_path":".env","content":"SECRET=test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# Expected: {"approved": false, "message": "...protected pattern .env..."}

# Test 2: Regular file allowed
echo '{"tool":"Write","parameters":{"file_path":"README.md","content":"# Test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# Expected: {"approved": true}

# Test 3: Whitelist override
# Add to buddy-config.json: "whitelist_patterns": ["test/.env.test"]
echo '{"tool":"Write","parameters":{"file_path":"test/.env.test","content":"TEST=1"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# Expected: {"approved": true}
```

#### Command Validation Hook Tests

```bash
# Test 1: Dangerous command blocked
echo '{"tool":"Bash","parameters":{"command":"rm -rf /"}}' | \
  uv run --no-project python .claude/hooks/command-validator.py

# Expected: {"approved": false, "message": "...dangerous command..."}

# Test 2: Safe command allowed
echo '{"tool":"Bash","parameters":{"command":"ls -la"}}' | \
  uv run --no-project python .claude/hooks/command-validator.py

# Expected: {"approved": true}

# Test 3: Performance warning
echo '{"tool":"Bash","parameters":{"command":"find / -name test"}}' | \
  uv run --no-project python .claude/hooks/command-validator.py

# Expected: {"approved": true, "message": "...performance warning..."}
```

#### Auto-Formatter Hook Tests

```bash
# Test Python formatting
echo '{"tool":"Write","parameters":{"file_path":"test.py","content":"def foo( ):\n  pass"}}' | \
  uv run --no-project python .claude/hooks/auto-formatter.py

# Expected: Formatted Python code

# Test JSON formatting
echo '{"tool":"Write","parameters":{"file_path":"test.json","content":"{\\"a\\":1,\\"b\\":2}"}}' | \
  uv run --no-project python .claude/hooks/auto-formatter.py

# Expected: Pretty-printed JSON
```

### 2. Command Testing

**Purpose**: Verify slash commands work correctly

#### Foundation Command Tests

```bash
# Test foundation creation (interactive mode)
/buddy:foundation interactive
# Follow prompts, verify directive/foundation.md created

# Test foundation update
/buddy:foundation provided
# Provide updated overview, verify version bump

# Verify foundation structure
grep "^## Purpose" directive/foundation.md
grep "^### Principle [1-5]:" directive/foundation.md
grep "^**Foundation Type**:" directive/foundation.md
```

#### Spec-Plan-Tasks Workflow Tests

```bash
# Test 1: Create specification
/buddy:spec Add user login with email and password

# Verify outputs
test -f specs/$(ls -t specs/ | head -1)/spec.md
grep "## Functional Requirements" specs/*/spec.md

# Test 2: Create plan from spec
/buddy:plan

# Verify outputs
test -f specs/$(ls -t specs/ | head -1)/plan.md
grep "## Implementation Strategy" specs/*/plan.md

# Test 3: Create tasks from plan
/buddy:tasks

# Verify outputs
test -f specs/$(ls -t specs/ | head -1)/tasks.md
grep "### \[TASK-" specs/*/tasks.md
```

#### Documentation Generation Tests

```bash
# Test documentation generation
/buddy:docs

# Verify all expected files created
test -f docs/README.md
test -f docs/architecture-overview.md
test -f docs/api-endpoints.md
test -f docs/development-setup.md

# Verify content quality
grep "```mermaid" docs/architecture-overview.md  # Has diagrams
grep "## " docs/README.md  # Has sections
```

#### Persona Tests

```bash
# Test auto-activation
/buddy:persona How do I optimize database queries?
# Verify: performance persona activates (look for performance-specific advice)

# Test manual selection
/buddy:persona security - Review this authentication code
# Verify: security persona provides security-focused review

# Test collaboration
/buddy:persona architect security - Design secure microservices architecture
# Verify: Both perspectives included in response
```

### 3. Integration Testing

**Purpose**: Test complete workflows end-to-end

#### Feature Development Workflow Test

```bash
# Complete workflow from spec to commit
echo "Testing complete feature development workflow..."

# Step 1: Create foundation
/buddy:foundation provided
# Input: "Test project for validating Claude Buddy workflows"

# Step 2: Create specification
/buddy:spec Add simple counter API with increment and decrement endpoints

# Step 3: Create plan
/buddy:plan

# Step 4: Create tasks
/buddy:tasks

# Step 5: Implement (simulate)
mkdir -p src
cat > src/counter.py << 'EOF'
counter = 0

def increment():
    global counter
    counter += 1
    return counter

def decrement():
    global counter
    counter -= 1
    return counter
EOF

# Step 6: Commit
git add src/counter.py
/buddy:commit

# Verify: All files created, commit message follows standards
test -d specs/
test -f src/counter.py
git log -1 --pretty=%B | grep -E "^(feat|fix|docs|refactor|test|chore):"
```

#### Documentation Update Workflow Test

```bash
# Test documentation stays current

# Initial documentation
/buddy:docs
cp -r docs docs.backup

# Make code changes
# [simulate changes]

# Regenerate documentation
/buddy:docs

# Verify: Documentation updated
diff -r docs docs.backup && echo "FAIL: Docs unchanged" || echo "PASS: Docs updated"
```

### 4. Configuration Testing

**Purpose**: Verify configuration changes take effect

#### Feature Flag Tests

```bash
# Test disabling personas
cat > .claude-buddy/buddy-config.json << 'EOF'
{
  "version": "1.0.0",
  "mode": "project",
  "features": {
    "personas": false
  }
}
EOF

/buddy:persona Test question
# Expected: Error or indication that personas disabled

# Re-enable
sed -i '' 's/"personas": false/"personas": true/' .claude-buddy/buddy-config.json
```

#### Protection Pattern Tests

```bash
# Add custom protection pattern
cat > .claude-buddy/buddy-config.json << 'EOF'
{
  "file_protection": {
    "enabled": true,
    "additional_patterns": ["config/prod\\..*"]
  }
}
EOF

# Try to write protected file in Claude
# Expected: Blocked

# Verify in hook
echo '{"tool":"Write","parameters":{"file_path":"config/prod.yaml","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py
# Expected: {"approved": false}
```

### 5. Performance Testing

**Purpose**: Ensure operations complete within acceptable time

#### Hook Performance Tests

```bash
# Test hook execution time
time echo '{"tool":"Write","parameters":{"file_path":"test.md","content":"# Test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py

# Expected: < 1 second

time echo '{"tool":"Bash","parameters":{"command":"ls -la"}}' | \
  uv run --no-project python .claude/hooks/command-validator.py

# Expected: < 1 second
```

#### Documentation Generation Performance

```bash
# Time documentation generation
time /buddy:docs

# Expected times:
# Small project (< 100 files): < 2 minutes
# Medium project (< 1000 files): < 5 minutes
# Large project (> 1000 files): < 10 minutes
```

### 6. Error Handling Tests

**Purpose**: Verify graceful failure and helpful error messages

#### Missing Prerequisites Tests

```bash
# Test: Spec without foundation
rm -rf directive/foundation.md
/buddy:spec Test feature

# Expected: Clear error about missing foundation

# Test: Plan without spec
rm -rf specs/
/buddy:plan

# Expected: Clear error about missing specification

# Test: Docs without foundation
rm -rf directive/foundation.md
/buddy:docs

# Expected: Clear error message with instructions
```

#### Invalid Configuration Tests

```bash
# Test: Invalid JSON
echo '{invalid json}' > .claude-buddy/buddy-config.json

# Try using Claude Buddy
# Expected: Clear JSON parsing error

# Fix configuration
git checkout .claude-buddy/buddy-config.json
```

## Test Automation

### Automated Test Suite

Create `tests/test_hooks.sh`:

```bash
#!/bin/bash
set -e

echo "Running Claude Buddy test suite..."

# Test 1: File protection
echo "Testing file protection..."
result=$(echo '{"tool":"Write","parameters":{"file_path":".env","content":"test"}}' | \
  uv run --no-project python .claude/hooks/file-guard.py)
echo "$result" | grep -q '"approved": false' || (echo "FAIL: .env not blocked" && exit 1)
echo "PASS: File protection works"

# Test 2: Command validation
echo "Testing command validation..."
result=$(echo '{"tool":"Bash","parameters":{"command":"rm -rf /"}}' | \
  uv run --no-project python .claude/hooks/command-validator.py)
echo "$result" | grep -q '"approved": false' || (echo "FAIL: Dangerous command not blocked" && exit 1)
echo "PASS: Command validation works"

# Test 3: Foundation structure
echo "Testing foundation structure..."
test -f directive/foundation.md || (echo "FAIL: Foundation not found" && exit 1)
grep -q "^## Purpose" directive/foundation.md || (echo "FAIL: Invalid foundation structure" && exit 1)
echo "PASS: Foundation structure valid"

echo "All tests passed!"
```

Run tests:
```bash
chmod +x tests/test_hooks.sh
./tests/test_hooks.sh
```

### Continuous Testing

Add to `.github/workflows/test.yml`:

```yaml
name: Test Claude Buddy

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Run hook tests
        run: ./tests/test_hooks.sh

      - name: Validate configurations
        run: |
          python -m json.tool .claude-buddy/buddy-config.json
          python -m json.tool .claude/hooks.json
```

## Testing Checklist

Before committing changes:

- [ ] All hook tests pass
- [ ] Command workflows verified
- [ ] Configuration validated
- [ ] Documentation generated successfully
- [ ] Foundation structure correct
- [ ] No secrets in commits
- [ ] Performance within limits
- [ ] Error messages helpful

## Common Test Scenarios

### Scenario 1: New Persona

1. Create persona file
2. Test auto-activation with relevant keywords
3. Test manual activation
4. Test collaboration with other personas
5. Verify response quality

### Scenario 2: New Foundation Type

1. Create template directory
2. Add spec, plan, tasks, docs templates
3. Create foundation with new type
4. Test complete workflow
5. Verify generated outputs

### Scenario 3: Custom Protection Pattern

1. Add pattern to config
2. Test matching files blocked
3. Test non-matching files allowed
4. Test whitelist override
5. Verify error messages clear

## Troubleshooting Test Failures

### Hook Test Fails

```bash
# Debug with verbose output
echo '{"tool":"Write","parameters":{"file_path":".env","content":"test"}}' | \
  python .claude/hooks/file-guard.py 2>&1

# Check Python environment
python --version
which python

# Verify hook syntax
python -m py_compile .claude/hooks/file-guard.py
```

### Command Test Fails

```bash
# Check command files exist
ls .claude/commands/buddy/

# Check agent files exist
ls .claude/agents/

# Verify Claude Code version
claude --version
```

### Integration Test Fails

```bash
# Check file permissions
ls -la .claude-buddy/
ls -la .claude/

# Verify directory structure
find .claude* -type f | sort

# Check for syntax errors in markdown
# Use markdown linter if available
```

## Related Documentation

- [Development Setup](./development-setup.md) - Environment configuration
- [Development Debugging](./development-debugging.md) - Debugging guide
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - Problem resolution
