# Usage Examples

This document provides real-world examples of using Claude Buddy commands and features.

## Quick Start Example

### Setting Up a New Project

```bash
# Step 1: Create foundation
/buddy:foundation interactive

# Answer questions:
# - What is your project about? "E-commerce API with microservices"
# - Primary technology stack? "Node.js, Express, PostgreSQL, Docker"
# - Key quality attributes? "Security, scalability, maintainability"

# Step 2: Generate documentation
/buddy:docs

# Step 3: Ready to develop with persona assistance
/buddy:persona architect - What's the best way to structure my microservices?
```

## Feature Development Examples

### Example 1: Adding User Authentication

**Step 1: Create Specification**
```bash
/buddy:spec Add user authentication with JWT tokens. Users should be able to register, login, logout, and refresh tokens. Include password hashing with bcrypt and rate limiting on auth endpoints.
```

**Generated Output** (`specs/20251002-user-authentication/spec.md`):
```markdown
# User Authentication Specification

## Overview
Implement secure user authentication using JWT tokens with registration, login, logout, and token refresh capabilities.

## Functional Requirements
- FR-1: Users can register with email and password
- FR-2: Passwords hashed using bcrypt (cost factor: 12)
- FR-3: JWT tokens issued on successful login
- FR-4: Access tokens valid for 15 minutes
- FR-5: Refresh tokens valid for 7 days
- FR-6: Users can logout (token blacklisting)
- FR-7: Rate limiting: 5 attempts per 15 minutes per IP

## Non-Functional Requirements
- NFR-1: Password validation (min 8 chars, uppercase, lowercase, number, special char)
- NFR-2: Authentication response time < 200ms (P95)
- NFR-3: Secure token storage (httpOnly cookies)
- NFR-4: OWASP compliance for authentication
...
```

**Step 2: Create Implementation Plan**
```bash
/buddy:plan
```

**Generated Output** (`specs/20251002-user-authentication/plan.md`):
```markdown
# Implementation Plan: User Authentication

## Strategy
Implement authentication using passport.js with JWT strategy. Use PostgreSQL for user storage and Redis for token blacklist and rate limiting.

## Architecture Decisions
1. **Library Choice**: passport.js + passport-jwt
2. **Token Storage**: httpOnly cookies (XSS protection)
3. **Password Hashing**: bcrypt with cost factor 12
4. **Rate Limiting**: express-rate-limit with Redis store
5. **Token Blacklist**: Redis with TTL matching token expiry

## Component Breakdown
1. User Model (PostgreSQL)
2. Auth Controller (registration, login, logout, refresh)
3. Auth Middleware (JWT validation)
4. Rate Limit Middleware
5. Token Service (generate, verify, blacklist)
...
```

**Step 3: Generate Tasks**
```bash
/buddy:tasks
```

**Generated Output** (`specs/20251002-user-authentication/tasks.md`):
```markdown
# Implementation Tasks: User Authentication

### [TASK-001] Setup Dependencies
**Priority**: High
**Description**: Install required npm packages
**Acceptance Criteria**: All packages installed and in package.json
**Dependencies**: None
**Estimated Effort**: 30 minutes
**Notes**:
```bash
npm install passport passport-jwt bcrypt jsonwebtoken express-rate-limit redis
```

### [TASK-002] Create User Model
**Priority**: High
**Description**: Define User model with Sequelize/TypeORM
**Acceptance Criteria**: User table created with email, password_hash, created_at
**Dependencies**: TASK-001
**Estimated Effort**: 1 hour
...
```

**Step 4: Implement and Commit**
```bash
# After implementing TASK-001 and TASK-002
git add .
/buddy:commit

# Generated commit message:
# feat: add user model and authentication dependencies
#
# - Install passport, passport-jwt, bcrypt, and jsonwebtoken
# - Create User model with email and password fields
# - Add database migration for users table
# - Configure Sequelize connection
```

### Example 2: Optimizing Performance

```bash
/buddy:persona performance - This API endpoint is slow. Here's the code:
[paste code]

# Response from performance persona:
# "I've analyzed your code and identified 3 bottlenecks:
# 1. N+1 query problem in the user lookup (line 45)
# 2. Missing database index on email column
# 3. Unnecessary JSON serialization in loop
#
# Recommended fixes:
# 1. Use eager loading: .include({ model: User })
# 2. Add index: CREATE INDEX idx_users_email ON users(email)
# 3. Move serialization outside loop using map()
#
# Expected improvement: 80% reduction in response time"
```

### Example 3: Security Review

```bash
/buddy:persona security - Review this authentication middleware for vulnerabilities
[paste middleware code]

# Response from security persona:
# "Security analysis of authentication middleware:
#
# ✓ GOOD: Using httpOnly cookies
# ✓ GOOD: JWT signature verification
# ⚠ WARNING: Missing CSRF protection
# ⚠ WARNING: No rate limiting on this endpoint
# ❌ CRITICAL: Token expiry not validated
# ❌ CRITICAL: User input not sanitized before database query
#
# Priority fixes:
# 1. Add token expiry check: if (Date.now() >= payload.exp * 1000)
# 2. Implement CSRF tokens for state-changing operations
# 3. Sanitize userId before query: validator.escape(userId)
# 4. Add rate limiting middleware before this handler"
```

## Configuration Examples

### Custom File Protection

```json
{
  "file_protection": {
    "enabled": true,
    "additional_patterns": [
      "config/production\\..*",
      "secrets/.*",
      ".*\\.key$"
    ],
    "whitelist_patterns": [
      "test/fixtures/sample\\.env"
    ],
    "strict_mode": false
  }
}
```

### Custom Command Validation

```json
{
  "command_validation": {
    "enabled": true,
    "block_dangerous": true,
    "additional_dangerous_patterns": [
      "curl.*-X DELETE.*production",
      "DROP DATABASE.*"
    ],
    "whitelist_patterns": [
      "rm -rf dist/",
      "rm -rf build/"
    ]
  }
}
```

### Persona Auto-Activation Tuning

```json
{
  "personas": {
    "enabled": true,
    "auto_activation": {
      "enabled": true,
      "confidence_threshold": 0.75,
      "max_active_personas": 2,
      "learning_enabled": true
    },
    "preferences": {
      "preferred_personas": ["security", "performance"],
      "domain_preferences": {
        "frontend": "auto",
        "backend": "auto",
        "security": "always"
      }
    }
  }
}
```

## Multi-Persona Collaboration Examples

### Architecture + Security Review

```bash
/buddy:persona architect security - Design a microservices architecture for a payment processing system

# Response combines both perspectives:
#
# **Architect Perspective:**
# - Service decomposition: Payment Service, Ledger Service, Notification Service
# - API Gateway for routing and authentication
# - Event-driven communication using message queue
# - Database per service pattern
#
# **Security Perspective:**
# - PCI DSS compliance requirements
# - End-to-end encryption for payment data
# - Service-to-service authentication with mTLS
# - Audit logging for all financial transactions
# - Secrets management with HashiCorp Vault
#
# **Combined Recommendation:**
# [Detailed architecture with security controls integrated]
```

### Frontend + QA Collaboration

```bash
/buddy:persona frontend qa - Create a React form component for user registration

# Response includes both perspectives:
#
# **Frontend Implementation:**
# [React component with proper structure, hooks, styling]
#
# **QA Testing Strategy:**
# - Unit tests for validation logic
# - Integration tests for form submission
# - Accessibility tests (ARIA labels, keyboard navigation)
# - Error handling tests
# - Edge cases (long inputs, special characters, etc.)
```

## Hook Integration Examples

### Blocked Operation Example

**Attempt to modify .env file**:
```bash
# Claude attempts: Write .env file
# Hook blocks operation

# User sees:
Operation blocked: File matches protected pattern .env

Reason: Environment files may contain sensitive credentials
Suggestion: Use .env.example for template files and store actual secrets in secure vault

Pattern matched: \.env.*
Severity: high
```

### Command Warning Example

**Attempt dangerous but whitelisted command**:
```bash
# Claude attempts: rm -rf dist/
# Hook validates and warns

# User sees:
⚠ WARNING: Command has performance implications
Command: rm -rf dist/
Reason: Recursive deletion of large directories can be slow
Suggestion: Consider using specific file patterns if possible
Status: APPROVED (in whitelist)
```

## Advanced Workflow Examples

### CI/CD Documentation Generation

```yaml
# .github/workflows/docs.yml
name: Update Documentation

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate docs
        run: |
          # Assuming claude command available
          claude /buddy:docs
      - name: Commit docs
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add docs/
          git commit -m "docs: auto-update documentation" || exit 0
          git push
```

### Foundation Amendment Workflow

```bash
# Step 1: Propose amendment via spec
/buddy:spec Propose amendment to foundation: Add new principle for API versioning

# Step 2: Review generated specification
# Step 3: If approved, update foundation
/buddy:foundation provided
[Updated foundation content with new principle]

# Step 4: Document in sync report
# System automatically generates sync impact report showing:
# - Version bump: 1.0.0 → 1.1.0
# - Modified principles: None
# - Added sections: Core Principle 6 - API Versioning
# - Template updates: [List of affected templates]
```

## Troubleshooting Examples

### Issue: Persona Not Activating

**Problem**: Expected persona not activated automatically

**Solution**:
```bash
# Check confidence threshold
cat .claude-buddy/buddy-config.json | jq '.personas.auto_activation.confidence_threshold'
# If too high (e.g., 0.9), lower it:
# Edit config: "confidence_threshold": 0.7

# Or use manual activation:
/buddy:persona security - Review this code
```

### Issue: Hook Timeout

**Problem**: Hook execution exceeds timeout

**Solution**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "command": "python .claude/hooks/command-validator.py",
            "timeout": 20  // Increase from default 10
          }
        ]
      }
    ]
  }
}
```

### Issue: Documentation Generation Fails

**Problem**: `/buddy:docs` fails with foundation error

**Solution**:
```bash
# Check foundation exists
ls directive/foundation.md

# If missing, create it:
/buddy:foundation interactive

# Then retry:
/buddy:docs
```

## Best Practices

### 1. Always Start with Foundation

```bash
# New project setup
/buddy:foundation interactive
/buddy:docs
# Now ready for development
```

### 2. Use Spec → Plan → Tasks Workflow

```bash
# For any new feature
/buddy:spec [feature description]
/buddy:plan
/buddy:tasks
# Then implement following tasks
```

### 3. Leverage Persona Collaboration

```bash
# For complex problems, use multiple personas
/buddy:persona architect security performance - Design high-traffic API

# For specific expertise, use manual selection
/buddy:persona refactorer - Clean up this legacy code
```

### 4. Regular Documentation Updates

```bash
# After significant changes
/buddy:docs  # Regenerate documentation
/buddy:commit  # Professional commit message
```

### 5. Security-First Configuration

```json
{
  "file_protection": {
    "enabled": true,
    "strict_mode": true  // For production projects
  },
  "command_validation": {
    "enabled": true,
    "block_dangerous": true
  }
}
```

## Related Documentation

- [API Endpoints](./api-endpoints.md) - Complete command reference
- [Development Setup](./development-setup.md) - Configuration guide
- [Troubleshooting Common Issues](./troubleshooting-common-issues.md) - Problem resolution
