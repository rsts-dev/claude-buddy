/**
 * Custom Error Classes for Claude Buddy Installation Script
 *
 * Provides specialized error classes with error codes and contextual information
 * for better error handling and user feedback.
 */

/**
 * Transaction Error Codes
 */
const TRANSACTION_ERROR_CODES = {
  LOCK_EXISTS: 'TRANSACTION_LOCK_EXISTS',
  LOCK_STALE: 'TRANSACTION_LOCK_STALE',
  INTERRUPTED: 'TRANSACTION_INTERRUPTED',
  ROLLBACK_FAILED: 'TRANSACTION_ROLLBACK_FAILED',
  CHECKPOINT_INVALID: 'TRANSACTION_CHECKPOINT_INVALID',
  ACTION_FAILED: 'TRANSACTION_ACTION_FAILED',
  COMMIT_FAILED: 'TRANSACTION_COMMIT_FAILED'
};

/**
 * Environment Error Codes
 */
const ENVIRONMENT_ERROR_CODES = {
  UNSUPPORTED_PLATFORM: 'ENV_UNSUPPORTED_PLATFORM',
  PERMISSION_DENIED: 'ENV_PERMISSION_DENIED',
  DISK_SPACE_LOW: 'ENV_DISK_SPACE_LOW',
  DEPENDENCY_MISSING: 'ENV_DEPENDENCY_MISSING',
  DEPENDENCY_VERSION_MISMATCH: 'ENV_DEPENDENCY_VERSION_MISMATCH',
  DIRECTORY_NOT_WRITABLE: 'ENV_DIRECTORY_NOT_WRITABLE',
  DIRECTORY_NOT_READABLE: 'ENV_DIRECTORY_NOT_READABLE',
  GIT_REPO_INVALID: 'ENV_GIT_REPO_INVALID'
};

/**
 * Validation Error Codes
 */
const VALIDATION_ERROR_CODES = {
  INVALID_VERSION: 'VALIDATION_INVALID_VERSION',
  INVALID_MANIFEST: 'VALIDATION_INVALID_MANIFEST',
  INVALID_CONFIG: 'VALIDATION_INVALID_CONFIG',
  INVALID_METADATA: 'VALIDATION_INVALID_METADATA',
  MISSING_REQUIRED_FIELD: 'VALIDATION_MISSING_REQUIRED_FIELD',
  INVALID_FIELD_TYPE: 'VALIDATION_INVALID_FIELD_TYPE',
  INVALID_FIELD_VALUE: 'VALIDATION_INVALID_FIELD_VALUE',
  SCHEMA_MISMATCH: 'VALIDATION_SCHEMA_MISMATCH'
};

/**
 * TransactionError - Errors related to transaction management
 *
 * @extends Error
 */
class TransactionError extends Error {
  /**
   * Create a transaction error
   *
   * @param {string} message - Error message
   * @param {string} code - Error code from TRANSACTION_ERROR_CODES
   * @param {Object} context - Additional context information
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'TransactionError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransactionError);
    }
  }

  /**
   * Convert error to JSON format
   *
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message
   *
   * @returns {string} User-friendly message
   */
  getUserMessage() {
    const messages = {
      [TRANSACTION_ERROR_CODES.LOCK_EXISTS]: 'Another installation is currently in progress. Please wait for it to complete or remove the lock file if it\'s stale.',
      [TRANSACTION_ERROR_CODES.LOCK_STALE]: 'A stale installation lock was detected. The lock file will be cleaned up automatically.',
      [TRANSACTION_ERROR_CODES.INTERRUPTED]: 'The installation was interrupted. You can resume, rollback, or abort the operation.',
      [TRANSACTION_ERROR_CODES.ROLLBACK_FAILED]: 'Failed to rollback the transaction. Manual cleanup may be required.',
      [TRANSACTION_ERROR_CODES.CHECKPOINT_INVALID]: 'Transaction checkpoint is invalid or corrupted.',
      [TRANSACTION_ERROR_CODES.ACTION_FAILED]: 'Transaction action failed to execute.',
      [TRANSACTION_ERROR_CODES.COMMIT_FAILED]: 'Failed to commit the transaction.'
    };

    return messages[this.code] || this.message;
  }
}

/**
 * EnvironmentError - Errors related to environment validation
 *
 * @extends Error
 */
class EnvironmentError extends Error {
  /**
   * Create an environment error
   *
   * @param {string} message - Error message
   * @param {string} code - Error code from ENVIRONMENT_ERROR_CODES
   * @param {Object} context - Additional context information
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'EnvironmentError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.suggestions = [];

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvironmentError);
    }

    // Add actionable suggestions based on error code
    this._addSuggestions();
  }

  /**
   * Add actionable suggestions based on error code
   *
   * @private
   */
  _addSuggestions() {
    const suggestionMap = {
      [ENVIRONMENT_ERROR_CODES.UNSUPPORTED_PLATFORM]: [
        'Claude Buddy supports macOS, Linux, and Windows.',
        'Check the documentation for platform-specific requirements.'
      ],
      [ENVIRONMENT_ERROR_CODES.PERMISSION_DENIED]: [
        'Run the installation with appropriate permissions.',
        'On Unix systems, you may need to use sudo or change directory ownership.',
        'On Windows, run as Administrator if needed.'
      ],
      [ENVIRONMENT_ERROR_CODES.DISK_SPACE_LOW]: [
        'Free up disk space before attempting installation.',
        'At least 50MB of free space is required.',
        'Clean up temporary files or move data to another location.'
      ],
      [ENVIRONMENT_ERROR_CODES.DEPENDENCY_MISSING]: [
        'Install the required dependency before proceeding.',
        'Check the documentation for installation instructions.',
        'Some features may work without optional dependencies.'
      ],
      [ENVIRONMENT_ERROR_CODES.DEPENDENCY_VERSION_MISMATCH]: [
        'Update the dependency to the required version.',
        'Check the documentation for minimum version requirements.'
      ],
      [ENVIRONMENT_ERROR_CODES.DIRECTORY_NOT_WRITABLE]: [
        'Ensure you have write permissions for the target directory.',
        'Change directory permissions or choose a different location.'
      ],
      [ENVIRONMENT_ERROR_CODES.DIRECTORY_NOT_READABLE]: [
        'Ensure you have read permissions for the directory.',
        'Change directory permissions or choose a different location.'
      ],
      [ENVIRONMENT_ERROR_CODES.GIT_REPO_INVALID]: [
        'Ensure the directory is a valid Git repository.',
        'Initialize a Git repository with: git init'
      ]
    };

    this.suggestions = suggestionMap[this.code] || [];
  }

  /**
   * Convert error to JSON format
   *
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message with suggestions
   *
   * @returns {string} User-friendly message
   */
  getUserMessage() {
    let message = this.message;

    if (this.suggestions.length > 0) {
      message += '\n\nSuggestions:\n';
      this.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }

    return message;
  }
}

/**
 * ValidationError - Errors related to data validation
 *
 * @extends Error
 */
class ValidationError extends Error {
  /**
   * Create a validation error
   *
   * @param {string} message - Error message
   * @param {string} code - Error code from VALIDATION_ERROR_CODES
   * @param {Object} context - Additional context information
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.fieldErrors = [];

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Add a field-specific validation error
   *
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @param {*} value - Invalid value
   */
  addFieldError(field, message, value) {
    this.fieldErrors.push({ field, message, value });
  }

  /**
   * Check if validation has field errors
   *
   * @returns {boolean} True if field errors exist
   */
  hasFieldErrors() {
    return this.fieldErrors.length > 0;
  }

  /**
   * Get all field errors
   *
   * @returns {Array} Array of field errors
   */
  getFieldErrors() {
    return this.fieldErrors;
  }

  /**
   * Convert error to JSON format
   *
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      fieldErrors: this.fieldErrors,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message with field errors
   *
   * @returns {string} User-friendly message
   */
  getUserMessage() {
    let message = this.message;

    if (this.fieldErrors.length > 0) {
      message += '\n\nValidation Errors:\n';
      this.fieldErrors.forEach((error) => {
        message += `- ${error.field}: ${error.message}\n`;
      });
    }

    return message;
  }
}

/**
 * Export error classes and error code constants
 */
module.exports = {
  // Error classes
  TransactionError,
  EnvironmentError,
  ValidationError,

  // Error code constants
  TRANSACTION_ERROR_CODES,
  ENVIRONMENT_ERROR_CODES,
  VALIDATION_ERROR_CODES
};
