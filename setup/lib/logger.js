/**
 * Logger Module for Claude Buddy Installation Script
 * Provides comprehensive logging functionality with multiple output modes,
 * color support, progress indicators, and file logging capabilities.
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
// const os = require('os'); // Reserved for future use

/**
 * Logger configuration and state
 */
const loggerState = {
  level: 'normal', // 'normal', 'verbose', 'quiet', 'json'
  colorEnabled: true,
  logFile: null,
  logFileStream: null,
  spinner: null,
  spinnerInterval: null,
  spinnerFrames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  spinnerIndex: 0,
  currentSection: null
};

/**
 * Create a logger instance with specified configuration
 * @param {Object} options - Logger options
 * @param {string} options.level - Log level ('normal', 'verbose', 'quiet', 'json')
 * @param {boolean} options.color - Enable/disable color output
 * @param {string} options.logFile - Path to log file (optional)
 * @returns {Object} Logger instance
 */
function createLogger(options = {}) {
  loggerState.level = options.level || 'normal';
  loggerState.colorEnabled = options.color !== false;
  loggerState.logFile = options.logFile || null;

  // Detect terminal color support
  if (loggerState.colorEnabled && !supportsColor()) {
    loggerState.colorEnabled = false;
  }

  // Initialize file logging if specified
  if (loggerState.logFile) {
    initializeFileLogging(loggerState.logFile);
  }

  return {
    log,
    info,
    warn,
    error,
    success,
    debug,
    verbose,
    section,
    progress,
    startSpinner,
    stopSpinner,
    logInstallationSummary,
    logUpdateSummary,
    logUninstallSummary,
    logErrorWithSuggestions,
    setLevel,
    close
  };
}

/**
 * Detect if the terminal supports color output
 * @returns {boolean} True if colors are supported
 */
function supportsColor() {
  // Check if stdout is a TTY
  if (!process.stdout.isTTY) {
    return false;
  }

  // Check for NO_COLOR or FORCE_COLOR environment variables
  if (process.env.NO_COLOR || process.env.CLAUDE_BUDDY_NO_COLOR) {
    return false;
  }

  if (process.env.FORCE_COLOR || process.env.CLAUDE_BUDDY_FORCE_COLOR) {
    return true;
  }

  // Check TERM environment variable
  const term = process.env.TERM || '';
  if (term === 'dumb') {
    return false;
  }

  // Most modern terminals support color
  return true;
}

/**
 * Initialize file logging with rotation
 * @param {string} filePath - Path to log file
 */
async function initializeFileLogging(filePath) {
  try {
    const logDir = path.dirname(filePath);
    await fs.mkdir(logDir, { recursive: true });

    // Rotate old log files
    await rotateLogFiles(filePath);

    // Create write stream for new log file
    loggerState.logFileStream = await fs.open(filePath, 'a');

    // Write log header
    const header = `\n${'='.repeat(80)}\n` +
                  `Installation Log Started: ${new Date().toISOString()}\n` +
                  `${'='.repeat(80)}\n`;
    await writeToFile(header);
  } catch (err) {
    console.error(`Warning: Failed to initialize log file: ${err.message}`);
  }
}

/**
 * Rotate log files (keep last 3, delete older than 7 days)
 * @param {string} filePath - Base log file path
 */
async function rotateLogFiles(filePath) {
  try {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, '.log');
    const files = await fs.readdir(dir);

    // Find all log files with timestamp suffix
    const logFiles = files
      .filter(f => f.startsWith(basename) && f.endsWith('.log'))
      .map(f => ({
        name: f,
        path: path.join(dir, f),
        time: 0
      }));

    // Get file stats and sort by modification time
    for (const file of logFiles) {
      try {
        const stats = await fs.stat(file.path);
        file.time = stats.mtime.getTime();
      } catch (err) {
        // Skip files that can't be accessed
      }
    }

    logFiles.sort((a, b) => b.time - a.time);

    // Keep only the last 3 files, delete the rest
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    for (let i = 3; i < logFiles.length; i++) {
      try {
        if (logFiles[i].time < sevenDaysAgo) {
          await fs.unlink(logFiles[i].path);
        }
      } catch (err) {
        // Ignore deletion errors
      }
    }

    // Rename current log file if it exists
    try {
      await fs.access(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newName = path.join(dir, `${basename}-${timestamp}.log`);
      await fs.rename(filePath, newName);
    } catch (err) {
      // File doesn't exist, no need to rename
    }
  } catch (err) {
    // Rotation is optional, don't fail if it doesn't work
  }
}

/**
 * Write message to log file
 * @param {string} message - Message to write
 */
async function writeToFile(message) {
  if (loggerState.logFileStream) {
    try {
      await loggerState.logFileStream.write(message + '\n', 'utf-8');
    } catch (err) {
      // Ignore file write errors
    }
  }
}

/**
 * Format message with color (if enabled)
 * @param {string} message - Message to format
 * @param {string} color - Color name
 * @returns {string} Formatted message
 */
function colorize(message, color) {
  if (!loggerState.colorEnabled || !chalk[color]) {
    return message;
  }
  return chalk[color](message);
}

/**
 * Log a generic message
 * @param {string} message - Message to log
 */
function log(message) {
  if (loggerState.level === 'quiet' || loggerState.level === 'json') {
    return;
  }

  console.log(message);
  writeToFile(message);
}

/**
 * Log an informational message
 * @param {string} message - Message to log
 */
function info(message) {
  if (loggerState.level === 'quiet' || loggerState.level === 'json') {
    return;
  }

  const formatted = colorize(`ℹ ${message}`, 'blue');
  console.log(formatted);
  writeToFile(`INFO: ${message}`);
}

/**
 * Log a warning message
 * @param {string} message - Message to log
 */
function warn(message) {
  if (loggerState.level === 'quiet' || loggerState.level === 'json') {
    return;
  }

  const formatted = colorize(`⚠ ${message}`, 'yellow');
  console.log(formatted);
  writeToFile(`WARN: ${message}`);
}

/**
 * Log an error message
 * @param {string} message - Message to log
 */
function error(message) {
  // Always log errors, even in quiet mode
  const formatted = loggerState.colorEnabled
    ? chalk.red(`✗ ${message}`)
    : `ERROR: ${message}`;

  if (loggerState.level === 'json') {
    console.error(JSON.stringify({ level: 'error', message }));
  } else {
    console.error(formatted);
  }

  writeToFile(`ERROR: ${message}`);
}

/**
 * Log a success message
 * @param {string} message - Message to log
 */
function success(message) {
  if (loggerState.level === 'quiet' || loggerState.level === 'json') {
    return;
  }

  const formatted = colorize(`✓ ${message}`, 'green');
  console.log(formatted);
  writeToFile(`SUCCESS: ${message}`);
}

/**
 * Log a debug message (only in verbose mode)
 * @param {string} message - Message to log
 */
function debug(message) {
  if (loggerState.level !== 'verbose') {
    return;
  }

  const formatted = colorize(`🔍 ${message}`, 'gray');
  console.log(formatted);
  writeToFile(`DEBUG: ${message}`);
}

/**
 * Log a verbose message (only in verbose mode)
 * @param {string} message - Message to log
 */
function verbose(message) {
  if (loggerState.level !== 'verbose') {
    return;
  }

  const formatted = colorize(message, 'gray');
  console.log(formatted);
  writeToFile(`VERBOSE: ${message}`);
}

/**
 * Log a section header
 * @param {string} title - Section title
 */
function section(title) {
  if (loggerState.level === 'quiet' || loggerState.level === 'json') {
    return;
  }

  loggerState.currentSection = title;
  const separator = '─'.repeat(Math.min(title.length + 4, 80));
  const formatted = colorize(`\n${separator}\n  ${title}\n${separator}`, 'cyan');

  console.log(formatted);
  writeToFile(`\n=== ${title} ===`);
}

/**
 * Display progress indicator
 * @param {string} message - Progress message
 * @param {number} current - Current progress value
 * @param {number} total - Total progress value
 */
function progress(message, current, total) {
  if (loggerState.level === 'quiet' || loggerState.level === 'json') {
    return;
  }

  const percentage = Math.floor((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.floor((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

  const formatted = `${message} [${bar}] ${percentage}% (${current}/${total})`;
  process.stdout.write('\r' + formatted);

  if (current === total) {
    process.stdout.write('\n');
    writeToFile(`PROGRESS: ${message} - Complete (${current}/${total})`);
  }
}

/**
 * Start a spinner with a message
 * @param {string} message - Spinner message
 */
function startSpinner(message) {
  if (loggerState.level === 'quiet' || loggerState.level === 'json' || !process.stdout.isTTY) {
    // Just log the message without spinner
    log(message);
    return;
  }

  // Stop existing spinner if any
  stopSpinner();

  loggerState.spinner = message;
  loggerState.spinnerIndex = 0;

  loggerState.spinnerInterval = setInterval(() => {
    const frame = loggerState.spinnerFrames[loggerState.spinnerIndex];
    const formatted = colorize(`${frame} ${loggerState.spinner}`, 'cyan');
    process.stdout.write('\r' + formatted + ' '.repeat(10));
    loggerState.spinnerIndex = (loggerState.spinnerIndex + 1) % loggerState.spinnerFrames.length;
  }, 80);

  writeToFile(`SPINNER: ${message}`);
}

/**
 * Stop the current spinner
 * @param {string} finalMessage - Optional final message to display
 * @param {boolean} success - Whether the operation succeeded
 */
function stopSpinner(finalMessage, success = true) {
  if (loggerState.spinnerInterval) {
    clearInterval(loggerState.spinnerInterval);
    loggerState.spinnerInterval = null;

    if (process.stdout.isTTY) {
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
    }

    if (finalMessage) {
      if (success) {
        this.success(finalMessage);
      } else {
        this.error(finalMessage);
      }
    }

    loggerState.spinner = null;
  }
}

/**
 * Log installation summary
 * @param {Object} summary - Installation summary data
 */
function logInstallationSummary(summary) {
  if (loggerState.level === 'json') {
    console.log(JSON.stringify({ type: 'installation-summary', ...summary }));
    return;
  }

  section('Installation Summary');

  success(`Claude Buddy v${summary.version} installed successfully`);
  info(`Installation mode: ${summary.mode}`);
  info(`Target directory: ${summary.targetDirectory}`);

  if (summary.components && summary.components.length > 0) {
    log('\nInstalled components:');
    for (const component of summary.components) {
      if (component.enabled) {
        success(`  ${component.name} - ${component.description}`);
      } else {
        warn(`  ${component.name} - Skipped (${component.reason})`);
      }
    }
  }

  if (summary.warnings && summary.warnings.length > 0) {
    log('\nWarnings:');
    for (const warning of summary.warnings) {
      warn(`  ${warning}`);
    }
  }

  if (summary.nextSteps && summary.nextSteps.length > 0) {
    log('\nNext steps:');
    for (const step of summary.nextSteps) {
      info(`  ${step}`);
    }
  }

  writeToFile(JSON.stringify(summary, null, 2));
}

/**
 * Log update summary
 * @param {Object} summary - Update summary data
 */
function logUpdateSummary(summary) {
  if (loggerState.level === 'json') {
    console.log(JSON.stringify({ type: 'update-summary', ...summary }));
    return;
  }

  section('Update Summary');

  success(`Updated from v${summary.fromVersion} to v${summary.toVersion}`);

  if (summary.updatedFiles && summary.updatedFiles.length > 0) {
    log('\nUpdated files:');
    for (const file of summary.updatedFiles) {
      info(`  ${file}`);
    }
  }

  if (summary.preservedFiles && summary.preservedFiles.length > 0) {
    log('\nPreserved customizations:');
    for (const file of summary.preservedFiles) {
      success(`  ${file}`);
    }
  }

  if (summary.migrations && summary.migrations.length > 0) {
    log('\nMigrations applied:');
    for (const migration of summary.migrations) {
      info(`  ${migration}`);
    }
  }

  writeToFile(JSON.stringify(summary, null, 2));
}

/**
 * Log uninstallation summary
 * @param {Object} summary - Uninstallation summary data
 */
function logUninstallSummary(summary) {
  if (loggerState.level === 'json') {
    console.log(JSON.stringify({ type: 'uninstall-summary', ...summary }));
    return;
  }

  section('Uninstallation Summary');

  success('Claude Buddy uninstalled successfully');

  if (summary.removedFiles && summary.removedFiles.length > 0) {
    log('\nRemoved files:');
    for (const file of summary.removedFiles) {
      info(`  ${file}`);
    }
  }

  if (summary.preservedFiles && summary.preservedFiles.length > 0) {
    log('\nPreserved files:');
    for (const file of summary.preservedFiles) {
      success(`  ${file}`);
    }
  }

  writeToFile(JSON.stringify(summary, null, 2));
}

/**
 * Log error with actionable suggestions
 * @param {Object} errorInfo - Error information
 */
function logErrorWithSuggestions(errorInfo) {
  if (loggerState.level === 'json') {
    console.error(JSON.stringify({ type: 'error', ...errorInfo }));
    return;
  }

  section('Error Occurred');

  error(errorInfo.message);

  if (errorInfo.details) {
    log('\nDetails:');
    log(colorize(errorInfo.details, 'gray'));
  }

  if (errorInfo.suggestions && errorInfo.suggestions.length > 0) {
    log('\nSuggestions:');
    for (const suggestion of errorInfo.suggestions) {
      info(`  • ${suggestion}`);
    }
  }

  if (errorInfo.technicalDetails) {
    verbose('\nTechnical details:');
    verbose(errorInfo.technicalDetails);
  }

  writeToFile(JSON.stringify(errorInfo, null, 2));
}

/**
 * Set the logger level
 * @param {string} level - New log level
 */
function setLevel(level) {
  loggerState.level = level;
}

/**
 * Close the logger and cleanup resources
 */
async function close() {
  if (loggerState.spinnerInterval) {
    stopSpinner();
  }

  if (loggerState.logFileStream) {
    try {
      const footer = `\n${'='.repeat(80)}\n` +
                    `Installation Log Ended: ${new Date().toISOString()}\n` +
                    `${'='.repeat(80)}\n`;
      await writeToFile(footer);
      await loggerState.logFileStream.close();
      loggerState.logFileStream = null;
    } catch (err) {
      // Ignore close errors
    }
  }
}

// Export the logger factory and individual functions
module.exports = {
  createLogger,
  log,
  info,
  warn,
  error,
  success,
  debug,
  verbose,
  section,
  progress,
  startSpinner,
  stopSpinner,
  logInstallationSummary,
  logUpdateSummary,
  logUninstallSummary,
  logErrorWithSuggestions,
  setLevel,
  close
};
