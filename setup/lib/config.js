/**
 * Configuration Loader for Claude Buddy Installation Script
 *
 * Handles loading and merging configuration from multiple sources with proper precedence:
 * CLI flags > Environment variables > Project config > User config > Defaults
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { ValidationError, VALIDATION_ERROR_CODES } = require('./errors');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  installation: {
    targetDir: process.cwd(),
    skipHooks: false,
    force: false
  },
  update: {
    preserveAll: false,
    mergeConfig: true,
    createBackup: true
  },
  uninstall: {
    preserveCustomizations: true,
    purge: false
  },
  logging: {
    level: 'info',
    verbose: false,
    quiet: false,
    jsonOutput: false,
    logFile: null
  },
  execution: {
    dryRun: false,
    nonInteractive: false,
    timeout: 300000 // 5 minutes
  },
  environment: {
    requireGit: false,
    requireUV: false,
    requirePython: false,
    minDiskSpace: 52428800 // 50MB in bytes
  }
};

/**
 * Configuration schema for validation
 */
const CONFIG_SCHEMA = {
  installation: {
    type: 'object',
    properties: {
      targetDir: { type: 'string' },
      skipHooks: { type: 'boolean' },
      force: { type: 'boolean' }
    }
  },
  update: {
    type: 'object',
    properties: {
      preserveAll: { type: 'boolean' },
      mergeConfig: { type: 'boolean' },
      createBackup: { type: 'boolean' }
    }
  },
  uninstall: {
    type: 'object',
    properties: {
      preserveCustomizations: { type: 'boolean' },
      purge: { type: 'boolean' }
    }
  },
  logging: {
    type: 'object',
    properties: {
      level: { type: 'string', enum: ['error', 'warn', 'info', 'debug', 'verbose'] },
      verbose: { type: 'boolean' },
      quiet: { type: 'boolean' },
      jsonOutput: { type: 'boolean' },
      logFile: { type: ['string', 'null'] }
    }
  },
  execution: {
    type: 'object',
    properties: {
      dryRun: { type: 'boolean' },
      nonInteractive: { type: 'boolean' },
      timeout: { type: 'number', min: 0 }
    }
  },
  environment: {
    type: 'object',
    properties: {
      requireGit: { type: 'boolean' },
      requireUV: { type: 'boolean' },
      requirePython: { type: 'boolean' },
      minDiskSpace: { type: 'number', min: 0 }
    }
  }
};

/**
 * Load configuration from a JSON file
 *
 * @param {string} filePath - Path to configuration file
 * @returns {Promise<Object|null>} Configuration object or null if file doesn't exist
 */
async function loadConfigFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw new ValidationError(
      `Failed to load configuration file: ${filePath}`,
      VALIDATION_ERROR_CODES.INVALID_CONFIG,
      { filePath, error: error.message }
    );
  }
}

/**
 * Get user-level configuration file path
 *
 * @returns {string} Path to user config file
 */
function getUserConfigPath() {
  return path.join(os.homedir(), '.claude-buddy-rc.json');
}

/**
 * Get project-level configuration file path
 *
 * @param {string} projectDir - Project directory
 * @returns {string} Path to project config file
 */
function getProjectConfigPath(projectDir) {
  return path.join(projectDir, '.claude-buddy-rc.json');
}

/**
 * Load configuration from environment variables
 *
 * @returns {Object} Configuration from environment variables
 */
function loadEnvConfig() {
  const config = {};

  // Installation settings
  if (process.env.CLAUDE_BUDDY_HOME) {
    config.installation = config.installation || {};
    config.installation.targetDir = process.env.CLAUDE_BUDDY_HOME;
  }

  // Logging settings
  if (process.env.CLAUDE_BUDDY_VERBOSE === 'true') {
    config.logging = config.logging || {};
    config.logging.verbose = true;
  }

  if (process.env.CLAUDE_BUDDY_NO_COLOR === 'true') {
    config.logging = config.logging || {};
    config.logging.noColor = true;
  }

  if (process.env.CLAUDE_BUDDY_LOG_LEVEL) {
    config.logging = config.logging || {};
    config.logging.level = process.env.CLAUDE_BUDDY_LOG_LEVEL;
  }

  // Execution settings
  if (process.env.CLAUDE_BUDDY_NON_INTERACTIVE === 'true') {
    config.execution = config.execution || {};
    config.execution.nonInteractive = true;
  }

  return config;
}

/**
 * Deep merge two configuration objects
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Validate configuration value against schema
 *
 * @param {*} value - Value to validate
 * @param {Object} schema - Schema definition
 * @param {string} path - Path to value (for error messages)
 * @throws {ValidationError} If validation fails
 */
function validateValue(value, schema, path) {
  // Type validation
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    const valueIsNull = value === null;

    if (!types.includes(actualType) && !(valueIsNull && types.includes('null'))) {
      throw new ValidationError(
        `Invalid type for ${path}: expected ${types.join(' or ')}, got ${actualType}`,
        VALIDATION_ERROR_CODES.INVALID_FIELD_TYPE,
        { path, expectedTypes: types, actualType, value }
      );
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    throw new ValidationError(
      `Invalid value for ${path}: must be one of ${schema.enum.join(', ')}`,
      VALIDATION_ERROR_CODES.INVALID_FIELD_VALUE,
      { path, allowedValues: schema.enum, value }
    );
  }

  // Min/max validation for numbers
  if (typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      throw new ValidationError(
        `Value for ${path} is too small: minimum is ${schema.min}`,
        VALIDATION_ERROR_CODES.INVALID_FIELD_VALUE,
        { path, min: schema.min, value }
      );
    }
    if (schema.max !== undefined && value > schema.max) {
      throw new ValidationError(
        `Value for ${path} is too large: maximum is ${schema.max}`,
        VALIDATION_ERROR_CODES.INVALID_FIELD_VALUE,
        { path, max: schema.max, value }
      );
    }
  }

  // Nested object validation
  if (schema.properties && typeof value === 'object' && value !== null) {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const propertySchema = schema.properties[key];
        if (propertySchema) {
          validateValue(value[key], propertySchema, `${path}.${key}`);
        }
      }
    }
  }
}

/**
 * Validate configuration against schema
 *
 * @param {Object} config - Configuration to validate
 * @throws {ValidationError} If validation fails
 */
function validateConfig(config) {
  for (const section in CONFIG_SCHEMA) {
    if (config[section]) {
      validateValue(config[section], CONFIG_SCHEMA[section], section);
    }
  }
}

/**
 * Load and merge configuration from all sources
 *
 * Configuration precedence (highest to lowest):
 * 1. CLI flags (passed as options)
 * 2. Environment variables
 * 3. Project-level config file (.claude-buddy-rc.json in project dir)
 * 4. User-level config file (.claude-buddy-rc.json in home dir)
 * 5. Default configuration
 *
 * @param {Object} options - Options from CLI flags
 * @param {string} options.projectDir - Project directory for project config
 * @returns {Promise<Object>} Merged configuration
 */
async function loadConfig(options = {}) {
  const projectDir = options.projectDir || process.cwd();

  // Start with defaults
  let config = { ...DEFAULT_CONFIG };

  // Layer 4: User-level config file
  const userConfig = await loadConfigFile(getUserConfigPath());
  if (userConfig) {
    config = deepMerge(config, userConfig);
  }

  // Layer 3: Project-level config file
  const projectConfig = await loadConfigFile(getProjectConfigPath(projectDir));
  if (projectConfig) {
    config = deepMerge(config, projectConfig);
  }

  // Layer 2: Environment variables
  const envConfig = loadEnvConfig();
  config = deepMerge(config, envConfig);

  // Layer 1: CLI flags (highest precedence)
  config = deepMerge(config, options);

  // Validate final configuration
  validateConfig(config);

  return config;
}

/**
 * Save configuration to file
 *
 * @param {Object} config - Configuration to save
 * @param {string} filePath - Path to save configuration
 * @returns {Promise<void>}
 */
async function saveConfig(config, filePath) {
  // Validate before saving
  validateConfig(config);

  try {
    await fs.writeFile(
      filePath,
      JSON.stringify(config, null, 2),
      'utf8'
    );
  } catch (error) {
    throw new ValidationError(
      `Failed to save configuration file: ${filePath}`,
      VALIDATION_ERROR_CODES.INVALID_CONFIG,
      { filePath, error: error.message }
    );
  }
}

/**
 * Export configuration functions
 */
module.exports = {
  loadConfig,
  saveConfig,
  validateConfig,
  getUserConfigPath,
  getProjectConfigPath,
  deepMerge,
  DEFAULT_CONFIG,
  CONFIG_SCHEMA
};
