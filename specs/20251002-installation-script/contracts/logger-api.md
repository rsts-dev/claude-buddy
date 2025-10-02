# Logger API Contract

**Module**: `setup/lib/logger.js`
**Type**: Internal module
**Related**: [cli-interface.md](./cli-interface.md)

---

## Overview

The Logger module provides comprehensive logging and user feedback capabilities with configurable verbosity levels, color output, and structured logging for troubleshooting.

---

## Module Exports

```javascript
module.exports = {
  createLogger,
  log,
  info,
  warn,
  error,
  success,
  debug,
  verbose,
  progress,
  section
};
```

---

## Logger Configuration

### createLogger()

**Description**: Creates a configured logger instance.

**Signature**:
```javascript
function createLogger(options: LoggerOptions): Logger
```

**Parameters**:
```typescript
interface LoggerOptions {
  verbose?: boolean;           // Default: false
  quiet?: boolean;             // Default: false
  noColor?: boolean;           // Default: false
  json?: boolean;              // Default: false
  logFile?: string;            // Default: null (no file logging)
}
```

**Returns**: `Logger` instance

**Example**:
```javascript
const { createLogger } = require('./lib/logger');

const logger = createLogger({
  verbose: true,
  noColor: false,
  logFile: '.claude-buddy/install.log'
});

logger.info('Installation started');
logger.success('Installation complete');
```

---

## Logging Functions

### 1. log()

**Description**: General purpose logging (always displayed unless quiet mode).

**Signature**:
```javascript
function log(message: string, ...args: any[]): void
```

**Example**:
```javascript
logger.log('Installing component: %s', componentName);
```

**Output**:
```
Installing component: hooks
```

---

### 2. info()

**Description**: Informational messages (blue color).

**Signature**:
```javascript
function info(message: string, ...args: any[]): void
```

**Example**:
```javascript
logger.info('Detected Node.js version: %s', nodeVersion);
```

**Output**:
```
ℹ Detected Node.js version: 18.0.0
```

---

### 3. warn()

**Description**: Warning messages (yellow color).

**Signature**:
```javascript
function warn(message: string, ...args: any[]): void
```

**Example**:
```javascript
logger.warn('UV not found. Hooks will be disabled.');
```

**Output**:
```
⚠ UV not found. Hooks will be disabled.
```

---

### 4. error()

**Description**: Error messages (red color).

**Signature**:
```javascript
function error(message: string, error?: Error): void
```

**Example**:
```javascript
logger.error('Installation failed', new Error('Permission denied'));
```

**Output**:
```
✗ Installation failed
  Error: Permission denied
```

---

### 5. success()

**Description**: Success messages (green color).

**Signature**:
```javascript
function success(message: string, ...args: any[]): void
```

**Example**:
```javascript
logger.success('Component installed: %s', componentName);
```

**Output**:
```
✓ Component installed: hooks
```

---

### 6. debug()

**Description**: Debug messages (only in verbose mode, gray color).

**Signature**:
```javascript
function debug(message: string, ...args: any[]): void
```

**Example**:
```javascript
logger.debug('Checking file permissions: %s', filePath);
```

**Output (verbose mode only)**:
```
[DEBUG] Checking file permissions: /path/to/file
```

---

### 7. verbose()

**Description**: Detailed messages (only in verbose mode).

**Signature**:
```javascript
function verbose(message: string, ...args: any[]): void
```

**Example**:
```javascript
logger.verbose('Copying file: %s -> %s', sourcePath, targetPath);
```

**Output (verbose mode only)**:
```
[VERBOSE] Copying file: .claude/hooks/file-guard.py -> /project/.claude/hooks/file-guard.py
```

---

### 8. progress()

**Description**: Progress indicator with percentage.

**Signature**:
```javascript
function progress(message: string, current: number, total: number): void
```

**Example**:
```javascript
logger.progress('Installing files', 45, 100);
```

**Output**:
```
⚙️  Installing files... [45/100] (45%)
```

**With Spinner** (if terminal supports):
```
⠋ Installing files... [45/100] (45%)
```

---

### 9. section()

**Description**: Section header for grouping related messages.

**Signature**:
```javascript
function section(title: string): void
```

**Example**:
```javascript
logger.section('Environment Detection');
logger.info('Platform: darwin');
logger.info('Node version: 18.0.0');
```

**Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment Detection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ Platform: darwin
ℹ Node version: 18.0.0
```

---

## Specialized Logging Functions

### logInstallationSummary()

**Description**: Logs comprehensive installation summary.

**Signature**:
```javascript
function logInstallationSummary(result: InstallationResult): void
```

**Example**:
```javascript
logger.logInstallationSummary({
  success: true,
  version: '1.0.0',
  installedComponents: ['hooks', 'templates', 'personas'],
  skippedComponents: [],
  duration: 3200,
  warnings: []
});
```

**Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Installation Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Claude Buddy v1.0.0 installed successfully

Installed Components:
  ✓ Python Safety Hooks
  ✓ Document Templates
  ✓ AI Personas

⏱️  Duration: 3.2s

Next Steps:
  1. Verify installation: claude-buddy verify
  2. Create foundation: /buddy:foundation
  3. Create first spec: /buddy:spec
```

---

### logUpdateSummary()

**Description**: Logs update summary with preserved customizations.

**Signature**:
```javascript
function logUpdateSummary(result: UpdateResult): void
```

**Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Update Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Updated from v1.0.0 to v1.1.0

Updated Files: 45
Preserved Customizations: 5
Backup Created: .claude-buddy/backup-2025-10-02T12-00-00Z/

⏱️  Duration: 8.5s
```

---

### logUninstallSummary()

**Description**: Logs uninstallation summary.

**Signature**:
```javascript
function logUninstallSummary(result: UninstallResult): void
```

**Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Uninstallation Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Claude Buddy successfully removed

Removed:
  • 67 framework files
  • 7 directories

Preserved:
  • 5 user customizations
  • Backup: .claude-buddy-preserved-2025-10-02/

⏱️  Duration: 2.3s
```

---

### logErrorWithSuggestions()

**Description**: Logs error with actionable suggestions.

**Signature**:
```javascript
function logErrorWithSuggestions(
  error: Error,
  suggestions: string[]
): void
```

**Example**:
```javascript
logger.logErrorWithSuggestions(
  new Error('Permission denied'),
  [
    'Check directory permissions: ls -la /path/to/project',
    'Change directory owner: chown -R $USER /path/to/project',
    'Run with sudo: sudo claude-buddy install'
  ]
);
```

**Output**:
```
✗ Error: Permission denied

Suggestions:
  1. Check directory permissions: ls -la /path/to/project
  2. Change directory owner: chown -R $USER /path/to/project
  3. Run with sudo: sudo claude-buddy install
```

---

## Output Modes

### Normal Mode
- Color-coded output
- Icons/symbols for visual hierarchy
- Progress indicators
- Human-readable format

### Verbose Mode
- All normal output
- Debug messages
- Detailed file operations
- Stack traces for errors
- Timestamp prefixes

### Quiet Mode
- Errors only
- No informational messages
- No progress indicators
- Suitable for scripting

### JSON Mode
- Structured JSON output
- Machine-readable
- All information preserved
- No ANSI colors or formatting

**JSON Output Example**:
```json
{
  "level": "info",
  "timestamp": "2025-10-02T12:00:00Z",
  "message": "Installation started",
  "metadata": {
    "version": "1.0.0",
    "targetDirectory": "/path/to/project"
  }
}
```

---

## Color Scheme

### Chalk Integration

```javascript
const chalk = require('chalk');

const colors = {
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  success: chalk.green,
  debug: chalk.gray,
  highlight: chalk.cyan,
  dim: chalk.dim
};
```

### Icon Set

```javascript
const icons = {
  info: 'ℹ',
  warn: '⚠',
  error: '✗',
  success: '✓',
  arrow: '→',
  bullet: '•',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
};
```

### No-Color Mode

When `CLAUDE_BUDDY_NO_COLOR` or `--no-color`:
- Strip all ANSI codes
- Use plain ASCII characters
- Replace icons with text: `[INFO]`, `[WARN]`, `[ERROR]`

---

## File Logging

### Log File Format

**Location**: `.claude-buddy/install.log`

**Format**: Structured logs with timestamp

```
[2025-10-02T12:00:00Z] INFO: Installation started
[2025-10-02T12:00:01Z] DEBUG: Checking platform: darwin
[2025-10-02T12:00:01Z] DEBUG: Node version: 18.0.0
[2025-10-02T12:00:02Z] INFO: Creating directory: .claude-buddy
[2025-10-02T12:00:03Z] SUCCESS: Component installed: hooks
[2025-10-02T12:00:05Z] SUCCESS: Installation complete (duration: 5000ms)
```

### Log Rotation

- Max file size: 10MB
- Keep last 3 log files
- Compress old logs (gzip)
- Format: `install.log.1.gz`, `install.log.2.gz`, etc.

---

## Error Formatting

### Stack Trace (Verbose Mode)

```javascript
function formatError(error: Error, verbose: boolean): string {
  const lines = [];

  lines.push(`${colors.error('✗')} ${error.message}`);

  if (verbose && error.stack) {
    lines.push('');
    lines.push(colors.dim('Stack trace:'));
    lines.push(colors.dim(error.stack));
  }

  if (error.code) {
    lines.push('');
    lines.push(colors.dim(`Error code: ${error.code}`));
  }

  return lines.join('\n');
}
```

### Validation Errors

```javascript
function formatValidationErrors(errors: ValidationError[]): string {
  const lines = [colors.error('✗ Validation failed:')];

  errors.forEach((err, index) => {
    lines.push(`  ${index + 1}. ${err.field}: ${err.message}`);
  });

  return lines.join('\n');
}
```

---

## Progress Indicators

### Spinner

```javascript
class Spinner {
  constructor(message) {
    this.message = message;
    this.frameIndex = 0;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => {
      const frame = icons.spinner[this.frameIndex];
      process.stdout.write(`\r${frame} ${this.message}...`);
      this.frameIndex = (this.frameIndex + 1) % icons.spinner.length;
    }, 80);
  }

  stop(finalMessage) {
    clearInterval(this.interval);
    process.stdout.write(`\r${colors.success('✓')} ${finalMessage}\n`);
  }
}
```

### Progress Bar

```javascript
function progressBar(current: number, total: number, width: number = 40): string {
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

// Usage
logger.log(`Installing files ${progressBar(45, 100)}`);
// Output: Installing files [██████████████████░░░░░░░░░░░░░░░░░░░░░░] 45%
```

---

## Testing Support

### Mock Logger

```javascript
function createMockLogger(): Logger {
  const logs = [];

  return {
    log: (msg) => logs.push({ level: 'log', message: msg }),
    info: (msg) => logs.push({ level: 'info', message: msg }),
    warn: (msg) => logs.push({ level: 'warn', message: msg }),
    error: (msg) => logs.push({ level: 'error', message: msg }),
    success: (msg) => logs.push({ level: 'success', message: msg }),
    getLogs: () => logs,
    clear: () => logs.length = 0
  };
}
```

### Log Capture for Testing

```javascript
function captureOutput(fn) {
  const originalWrite = process.stdout.write;
  let output = '';

  process.stdout.write = (chunk) => {
    output += chunk;
    return true;
  };

  fn();

  process.stdout.write = originalWrite;
  return output;
}
```

---

## Performance Considerations

1. **Lazy String Formatting**: Only format if message will be displayed
2. **Buffered Writes**: Group console writes to reduce I/O
3. **Async File Logging**: Don't block on file writes
4. **Conditional Color**: Skip color processing if --no-color
5. **Stream Optimization**: Use stderr for errors, stdout for info

---

## Environment Detection

### Terminal Capabilities

```javascript
function detectTerminalCapabilities() {
  return {
    supportsColor: process.stdout.isTTY && !process.env.CLAUDE_BUDDY_NO_COLOR,
    supportsUnicode: !process.env.TERM || !process.env.TERM.includes('linux'),
    supportsInteractive: process.stdout.isTTY,
    columns: process.stdout.columns || 80
  };
}
```

### Adaptive Output

```javascript
function adaptOutput(message, capabilities) {
  if (!capabilities.supportsUnicode) {
    // Replace Unicode symbols with ASCII
    message = message.replace(/✓/g, '[OK]');
    message = message.replace(/✗/g, '[ERROR]');
    message = message.replace(/⚠/g, '[WARN]');
  }

  if (!capabilities.supportsColor) {
    // Strip ANSI codes
    message = message.replace(/\x1b\[[0-9;]*m/g, '');
  }

  return message;
}
```

---

*This logger API provides comprehensive, user-friendly logging with multiple output modes and rich formatting.*
