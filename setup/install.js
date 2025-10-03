#!/usr/bin/env node

/**
 * Claude Buddy Installation Script
 *
 * Main CLI entry point for Claude Buddy installation, update, and uninstallation operations.
 * Provides a comprehensive command-line interface with argument parsing, command routing,
 * and graceful error handling.
 *
 * Usage:
 *   claude-buddy [command] [options] [target-directory]
 *
 * Commands:
 *   install     Fresh installation or update (default)
 *   update      Explicit update of existing installation
 *   uninstall   Remove Claude Buddy from target directory
 *   verify      Verify installation integrity
 *
 * @module setup/install
 */

const path = require('path');
const fs = require('fs-extra');
const { createLogger } = require('./lib/logger');
const { detectEnvironment, validateEnvironment } = require('./lib/environment');
const { getManifest } = require('./lib/manifest');
// const { createTransaction } = require('./lib/transaction'); // TODO: Implement transaction handling
const { performInstallation } = require('./lib/installer');
const { performUpdate } = require('./lib/updater');
const { performUninstall } = require('./lib/uninstaller');

// Package version from package.json
const packageJson = require('./package.json');
const VERSION = packageJson.version;

/**
 * Exit codes for different error scenarios
 */
const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENTS: 2,
  PERMISSION_DENIED: 3,
  DEPENDENCY_MISSING: 4,
  INSTALLATION_CORRUPTED: 5,
  USER_CANCELLED: 10,
  NETWORK_ERROR: 20,
  DISK_SPACE_INSUFFICIENT: 30,
  UNKNOWN_ERROR: 99
};

/**
 * Parse command-line arguments into structured options
 * @param {string[]} args - Process arguments (process.argv)
 * @returns {Object} Parsed options and command
 */
function parseArguments(args) {
  // Skip 'node' and 'install.js'
  const cliArgs = args.slice(2);

  const options = {
    command: 'install', // Default command
    targetDirectory: process.cwd(),

    // Global flags
    dryRun: false,
    verbose: false,
    quiet: false,
    nonInteractive: false,
    help: false,
    version: false,
    json: false,

    // Installation-specific flags
    force: false,
    skipHooks: false,

    // Update-specific flags
    preserveAll: false,
    mergeConfig: false,

    // Uninstall-specific flags
    preserveCustomizations: false,
    purge: false
  };

  let positionalArgs = [];

  for (let i = 0; i < cliArgs.length; i++) {
    const arg = cliArgs[i];

    // Check for flags
    if (arg.startsWith('--')) {
      const flag = arg.substring(2);

      switch (flag) {
      // Global flags
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'verbose':
        options.verbose = true;
        break;
      case 'quiet':
        options.quiet = true;
        break;
      case 'non-interactive':
        options.nonInteractive = true;
        break;
      case 'help':
        options.help = true;
        break;
      case 'version':
        options.version = true;
        break;
      case 'json':
        options.json = true;
        break;

        // Installation-specific flags
      case 'force':
        options.force = true;
        break;
      case 'skip-hooks':
        options.skipHooks = true;
        break;
      case 'target':
        // Next argument is the target directory
        if (i + 1 < cliArgs.length) {
          options.targetDirectory = path.resolve(cliArgs[i + 1]);
          i++; // Skip next argument
        } else {
          throw new Error('--target flag requires a directory path');
        }
        break;

        // Update-specific flags
      case 'preserve-all':
        options.preserveAll = true;
        break;
      case 'merge-config':
        options.mergeConfig = true;
        break;

        // Uninstall-specific flags
      case 'preserve-customizations':
        options.preserveCustomizations = true;
        break;
      case 'purge':
        options.purge = true;
        break;

      default:
        throw new Error(`Unknown flag: --${flag}`);
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short flags
      const flag = arg.substring(1);

      switch (flag) {
      case 'v':
        options.verbose = true;
        break;
      case 'q':
        options.quiet = true;
        break;
      case 'h':
        options.help = true;
        break;
      case 'V':
        options.version = true;
        break;
      case 'f':
        options.force = true;
        break;
      case 't':
        // Next argument is the target directory
        if (i + 1 < cliArgs.length) {
          options.targetDirectory = path.resolve(cliArgs[i + 1]);
          i++; // Skip next argument
        } else {
          throw new Error('-t flag requires a directory path');
        }
        break;
      default:
        throw new Error(`Unknown flag: -${flag}`);
      }
    } else {
      // Positional arguments
      positionalArgs.push(arg);
    }
  }

  // First positional argument could be a command or target directory
  if (positionalArgs.length > 0) {
    const firstArg = positionalArgs[0];
    const validCommands = ['install', 'update', 'uninstall', 'verify'];

    if (validCommands.includes(firstArg)) {
      options.command = firstArg;
      // Second positional argument is target directory
      if (positionalArgs.length > 1) {
        options.targetDirectory = path.resolve(positionalArgs[1]);
      }
    } else {
      // First positional argument is target directory
      options.targetDirectory = path.resolve(firstArg);
    }
  }

  return options;
}

/**
 * Load environment variables and merge with options
 * @param {Object} options - Parsed command-line options
 * @returns {Object} Options with environment variables applied
 */
function applyEnvironmentVariables(options) {
  const merged = { ...options };

  // CLAUDE_BUDDY_HOME overrides target directory
  if (process.env.CLAUDE_BUDDY_HOME) {
    merged.targetDirectory = path.resolve(process.env.CLAUDE_BUDDY_HOME);
  }

  // CLAUDE_BUDDY_VERBOSE enables verbose mode
  if (process.env.CLAUDE_BUDDY_VERBOSE) {
    const value = process.env.CLAUDE_BUDDY_VERBOSE.toLowerCase();
    if (value === 'true' || value === '1' || value === 'yes') {
      merged.verbose = true;
    }
  }

  // CLAUDE_BUDDY_NO_COLOR disables color output
  if (process.env.CLAUDE_BUDDY_NO_COLOR) {
    const value = process.env.CLAUDE_BUDDY_NO_COLOR.toLowerCase();
    if (value === 'true' || value === '1' || value === 'yes') {
      merged.noColor = true;
    }
  }

  // CLAUDE_BUDDY_CONFIG specifies configuration file
  if (process.env.CLAUDE_BUDDY_CONFIG) {
    merged.configFile = path.resolve(process.env.CLAUDE_BUDDY_CONFIG);
  }

  return merged;
}

/**
 * Display ASCII banner
 * @param {Object} logger - Logger instance
 * @param {string} version - Version number
 */
function displayBanner(logger, version) {
  const banner = `
╔═══════════════════════════════════════════╗
║                                           ║
║    ██████╗██╗      █████╗ ██╗   ██╗██████╗███████╗
║   ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
║   ██║     ██║     ███████║██║   ██║██║  ██║█████╗
║   ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝
║   ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
║    ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
║                                           ║
║           ██████╗ ██╗   ██╗██████╗ ██████╗██╗   ██╗
║           ██╔══██╗██║   ██║██╔══██╗██╔══██╗╚██╗ ██╔╝
║           ██████╔╝██║   ██║██║  ██║██║  ██║ ╚████╔╝
║           ██╔══██╗██║   ██║██║  ██║██║  ██║  ╚██╔╝
║           ██████╔╝╚██████╔╝██████╔╝██████╔╝   ██║
║           ╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝    ╚═╝
║                                           ║
║           Installation & Setup Tool       ║
║                 v${version.padEnd(9)}                ║
╚═══════════════════════════════════════════╝
`;

  logger.log(banner);
}

/**
 * Display help text with usage examples
 * @param {Object} logger - Logger instance
 */
function displayHelp(logger) {
  // Display banner first
  displayBanner(logger, VERSION);

  const helpText = `
USAGE:
  claude-buddy [command] [options] [target-directory]

COMMANDS:
  install     Install Claude Buddy (default)
  update      Update existing installation
  uninstall   Remove Claude Buddy
  verify      Verify installation integrity

GLOBAL OPTIONS:
  --dry-run              Preview actions without executing
  --verbose, -v          Enable detailed logging
  --quiet, -q            Suppress all output except errors
  --non-interactive      Disable all user prompts
  --help, -h             Display this help text
  --version, -V          Display version information
  --json                 Output results in JSON format

INSTALLATION OPTIONS:
  --force, -f            Overwrite existing files without prompting
  --skip-hooks           Skip hook installation
  --target, -t <path>    Specify target directory

UPDATE OPTIONS:
  --preserve-all         Preserve all existing files
  --merge-config         Deep merge configuration files

UNINSTALL OPTIONS:
  --preserve-customizations    Keep user customizations
  --purge                      Complete removal including customizations

ENVIRONMENT VARIABLES:
  CLAUDE_BUDDY_HOME      Override default installation location
  CLAUDE_BUDDY_VERBOSE   Enable verbose logging (true/1/yes)
  CLAUDE_BUDDY_NO_COLOR  Disable colored output (true/1/yes)
  CLAUDE_BUDDY_CONFIG    Path to configuration file

EXAMPLES:
  # Fresh installation in current directory
  claude-buddy install

  # Install in specific directory
  claude-buddy install /path/to/project

  # Preview installation without executing
  claude-buddy install --dry-run

  # Update with customization preservation
  claude-buddy update

  # Verify installation
  claude-buddy verify

  # Uninstall with customization preservation
  claude-buddy uninstall --preserve-customizations

  # Silent installation for CI/CD
  claude-buddy install --non-interactive --quiet

EXIT CODES:
  0    Success
  1    General error
  2    Invalid arguments
  3    Permission denied
  4    Dependency missing
  5    Installation corrupted
  10   User cancelled
  30   Disk space insufficient
  99   Unknown error

For more information, visit: https://github.com/claude-buddy/claude-buddy
`;

  logger.log(helpText);
}

/**
 * Display version information
 * @param {Object} logger - Logger instance
 */
function displayVersion(logger) {
  logger.log(`Claude Buddy v${VERSION}`);
}

/**
 * Handle install command
 * @param {Object} options - Command options
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
async function handleInstallCommand(options, logger) {
  try {
    if (!options.quiet) {
      logger.section('🔍 Checking system requirements...', true);
    }

    // Detect environment
    const environment = await detectEnvironment(options.targetDirectory);

    // Validate environment
    const validation = await validateEnvironment(environment, options.targetDirectory);
    if (!validation.valid) {
      logger.error('Environment validation failed:');
      validation.errors.forEach(err => logger.error(`  - ${err}`));
      return { success: false, error: 'Environment validation failed' };
    }

    // Display environment info
    if (!options.quiet && !options.json) {
      logger.info(`  ✓ Node.js ${environment.dependencies.node.version}`);
      if (environment.dependencies.python.available) {
        logger.info(`  ✓ Python ${environment.dependencies.python.version}`);
      }
      if (environment.dependencies.uv.available) {
        logger.info(`  ✓ UV ${environment.dependencies.uv.version}`);
      } else {
        logger.warn('  ✗ UV not found');
        logger.warn('    ⚠ Hook functionality will be disabled');
      }
      if (environment.dependencies.git.available) {
        logger.info(`  ✓ Git ${environment.dependencies.git.version}`);
      }
      logger.log('');
    }

    // Load manifest
    const manifest = getManifest();

    // Check if installation already exists
    const metadataPath = path.join(options.targetDirectory, '.claude-buddy', 'install-metadata.json');
    const installationExists = await fs.pathExists(metadataPath);

    if (installationExists && !options.force) {
      // Update existing installation
      if (!options.quiet) {
        logger.info('Existing installation detected. Performing update...');
      }

      // Read existing metadata
      const existingMetadataContent = await fs.readFile(metadataPath, 'utf-8');
      const existingMetadata = JSON.parse(existingMetadataContent);

      return await performUpdate({
        targetDirectory: options.targetDirectory,
        fromVersion: existingMetadata.version || '0.0.0',
        toVersion: manifest.version,
        components: manifest.components,
        existingMetadata,
        manifest,
        environment,
        dryRun: options.dryRun,
        verbose: options.verbose,
        preserveAll: options.preserveAll,
        mergeConfig: options.mergeConfig,
        logger
      });
    } else {
      // Fresh installation
      if (!options.quiet) {
        logger.section('⚙️ Installing components...', true);
      }

      return await performInstallation({
        targetDirectory: options.targetDirectory,
        manifest,
        components: manifest.components,
        environment,
        dryRun: options.dryRun,
        verbose: options.verbose,
        logger
      });
    }
  } catch (error) {
    logger.error(`Installation failed: ${error.message}`);
    if (options.verbose && error.stack) {
      logger.error(error.stack);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Handle update command
 * @param {Object} options - Command options
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
async function handleUpdateCommand(options, logger) {
  try {
    if (!options.quiet) {
      logger.section('🔄 Updating Claude Buddy...', true);
    }

    // Check if installation exists
    const metadataPath = path.join(options.targetDirectory, '.claude-buddy', 'install-metadata.json');
    const installationExists = await fs.pathExists(metadataPath);

    if (!installationExists) {
      logger.error('No existing installation found. Use "install" command for fresh installation.');
      return { success: false, error: 'No existing installation' };
    }

    // Read existing metadata
    const existingMetadataContent = await fs.readFile(metadataPath, 'utf-8');
    const existingMetadata = JSON.parse(existingMetadataContent);

    // Detect environment
    const environment = await detectEnvironment(options.targetDirectory);

    // Load manifest
    const manifest = getManifest();

    // Perform update
    return await performUpdate({
      targetDirectory: options.targetDirectory,
      fromVersion: existingMetadata.version || '0.0.0',
      toVersion: manifest.version,
      components: manifest.components,
      existingMetadata,
      manifest,
      environment,
      dryRun: options.dryRun,
      verbose: options.verbose,
      preserveAll: options.preserveAll,
      mergeConfig: options.mergeConfig,
      logger
    });
  } catch (error) {
    logger.error(`Update failed: ${error.message}`);
    if (options.verbose && error.stack) {
      logger.error(error.stack);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Handle uninstall command
 * @param {Object} options - Command options
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
async function handleUninstallCommand(options, logger) {
  try {
    if (!options.quiet) {
      logger.section('🗑️  Uninstalling Claude Buddy...', true);
    }

    // Check if installation exists
    const metadataPath = path.join(options.targetDirectory, '.claude-buddy', 'install-metadata.json');
    const installationExists = await fs.pathExists(metadataPath);

    if (!installationExists) {
      logger.warn('No installation found in target directory.');
      return { success: true, message: 'Nothing to uninstall' };
    }

    // Confirm if not non-interactive
    if (!options.nonInteractive && !options.dryRun) {
      // In a real implementation, we'd prompt the user here
      // For now, we'll proceed (assuming confirmation)
      if (!options.quiet) {
        logger.warn('Confirmation prompt would appear here in non-interactive mode');
      }
    }

    // Perform uninstallation
    return await performUninstall({
      targetDirectory: options.targetDirectory,
      preserveCustomizations: options.preserveCustomizations,
      purge: options.purge,
      dryRun: options.dryRun,
      verbose: options.verbose,
      logger
    });
  } catch (error) {
    logger.error(`Uninstallation failed: ${error.message}`);
    if (options.verbose && error.stack) {
      logger.error(error.stack);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Handle verify command
 * @param {Object} options - Command options
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
async function handleVerifyCommand(options, logger) {
  try {
    if (!options.quiet) {
      logger.section('🔍 Verifying Claude Buddy Installation...', true);
    }

    const result = {
      success: true,
      components: {},
      configuration: { valid: true, errors: [] },
      dependencies: {},
      recommendations: []
    };

    // Check if installation exists
    const metadataPath = path.join(options.targetDirectory, '.claude-buddy', 'install-metadata.json');
    const installationExists = await fs.pathExists(metadataPath);

    if (!installationExists) {
      if (!options.quiet) {
        logger.error('❌ No Claude Buddy installation found');
        logger.info('');
        logger.info('To install Claude Buddy, run:');
        logger.info('  claude-buddy install');
      }
      return {
        success: false,
        error: 'No installation found',
        recommendations: ['Run: claude-buddy install']
      };
    }

    // Load metadata
    let metadata;
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      if (!options.quiet) {
        logger.error('❌ Failed to read metadata file');
        logger.error(`   ${error.message}`);
      }
      return {
        success: false,
        error: 'Corrupted metadata',
        recommendations: ['Run: claude-buddy install --force']
      };
    }

    if (!options.quiet) {
      logger.info(`📦 Version: ${metadata.version || 'unknown'}`);
      logger.info(`📅 Installed: ${metadata.installDate || 'unknown'}`);
      logger.log('');
    }

    // Component checking (T064)
    if (!options.quiet) {
      logger.info('📂 Checking components...');
    }

    const componentsToCheck = [
      { name: 'Framework Configuration', path: '.claude-buddy/buddy-config.json' },
      { name: 'Document Templates', path: '.claude-buddy/templates' },
      { name: 'AI Personas', path: '.claude-buddy/personas' },
      { name: 'Framework Context Files', path: '.claude-buddy/context' },
      { name: 'Slash Commands', path: '.claude/commands' },
      { name: 'Python Hooks', path: '.claude/hooks', optional: true },
      { name: 'Agents', path: '.claude/agents' }
    ];

    for (const component of componentsToCheck) {
      const componentPath = path.join(options.targetDirectory, component.path);
      const exists = await fs.pathExists(componentPath);

      result.components[component.name] = {
        exists,
        path: component.path,
        optional: component.optional || false
      };

      if (!options.quiet) {
        if (exists) {
          logger.success(`  ✓ ${component.name}`);
        } else if (component.optional) {
          logger.warn(`  ⊘ ${component.name} (optional, not installed)`);
        } else {
          logger.error(`  ✗ ${component.name} (missing)`);
          result.success = false;
          result.recommendations.push(`Repair component: ${component.name}`);
        }
      }
    }

    if (!options.quiet) {
      logger.log('');
    }

    // Configuration validation (T065)
    if (!options.quiet) {
      logger.info('⚙️  Validating configuration...');
    }

    const configPath = path.join(options.targetDirectory, '.claude-buddy', 'buddy-config.json');
    if (await fs.pathExists(configPath)) {
      try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        // Basic validation
        if (!config.version) {
          result.configuration.valid = false;
          result.configuration.errors.push('Missing version field');
        }

        if (!config.personas || typeof config.personas !== 'object') {
          result.configuration.valid = false;
          result.configuration.errors.push('Missing or invalid personas configuration');
        }

        if (!config.features || typeof config.features !== 'object') {
          result.configuration.valid = false;
          result.configuration.errors.push('Missing or invalid features configuration');
        }

        if (!options.quiet) {
          if (result.configuration.valid) {
            logger.success('  ✓ Configuration is valid');
          } else {
            logger.error('  ✗ Configuration has errors');
            result.configuration.errors.forEach(err => {
              logger.error(`    - ${err}`);
            });
            result.success = false;
          }
        }
      } catch (error) {
        result.configuration.valid = false;
        result.configuration.errors.push(`Failed to parse configuration: ${error.message}`);
        if (!options.quiet) {
          logger.error('  ✗ Configuration is invalid');
          logger.error(`    - ${error.message}`);
        }
        result.success = false;
      }
    } else {
      result.configuration.valid = false;
      result.configuration.errors.push('Configuration file not found');
      if (!options.quiet) {
        logger.error('  ✗ Configuration file not found');
      }
      result.success = false;
    }

    if (!options.quiet) {
      logger.log('');
    }

    // Dependency status reporting (T066)
    if (!options.quiet) {
      logger.info('🔧 Checking dependencies...');
    }

    const environment = await detectEnvironment(options.targetDirectory);

    result.dependencies = {
      node: environment.dependencies.node,
      python: environment.dependencies.python,
      uv: environment.dependencies.uv,
      git: environment.dependencies.git
    };

    if (!options.quiet) {
      // Node.js
      if (environment.dependencies.node.available) {
        logger.success(`  ✓ Node.js ${environment.dependencies.node.version}`);
      } else {
        logger.error('  ✗ Node.js not found');
        result.success = false;
      }

      // Python
      if (environment.dependencies.python.available) {
        logger.success(`  ✓ Python ${environment.dependencies.python.version}`);
      } else {
        logger.warn('  ⊘ Python not found (optional)');
      }

      // UV
      if (environment.dependencies.uv.available) {
        logger.success(`  ✓ UV ${environment.dependencies.uv.version}`);
      } else {
        logger.warn('  ⊘ UV not found (hooks unavailable)');
        result.recommendations.push('Install UV for hook functionality: curl -LsSf https://astral.sh/uv/install.sh | sh');
      }

      // Git
      if (environment.dependencies.git.available) {
        logger.success(`  ✓ Git ${environment.dependencies.git.version}`);
      } else {
        logger.warn('  ⊘ Git not found (optional)');
      }

      logger.log('');
    }

    // Repair suggestions (T067)
    if (!result.success && !options.quiet) {
      logger.warn('⚠️  Issues detected. Repair suggestions:');
      logger.log('');

      if (result.recommendations.length > 0) {
        result.recommendations.forEach((rec, idx) => {
          logger.info(`  ${idx + 1}. ${rec}`);
        });
      }

      logger.log('');
      logger.info('To repair the installation, run:');
      logger.info('  claude-buddy install --force');
      logger.log('');
    } else if (result.success && !options.quiet) {
      logger.success('✅ Installation is healthy!');
      logger.log('');

      if (result.recommendations.length > 0) {
        logger.info('💡 Optional improvements:');
        result.recommendations.forEach((rec, idx) => {
          logger.info(`  ${idx + 1}. ${rec}`);
        });
        logger.log('');
      }

      logger.info('Next steps:');
      logger.info('  1. Create foundation: /buddy:foundation');
      logger.info('  2. Create first spec: /buddy:spec');
      logger.log('');
    }

    return result;

  } catch (error) {
    logger.error(`Verification failed: ${error.message}`);
    if (options.verbose && error.stack) {
      logger.error(error.stack);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Main execution function
 */
async function main() {
  let logger;
  let options;

  try {
    // Parse command-line arguments
    options = parseArguments(process.argv);

    // Apply environment variables
    options = applyEnvironmentVariables(options);

    // Create logger with appropriate mode
    const loggerMode = options.quiet ? 'quiet' : options.verbose ? 'verbose' : 'normal';
    logger = createLogger(loggerMode, options.json, options.noColor);

    // Handle --help flag
    if (options.help) {
      displayHelp(logger);
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Handle --version flag
    if (options.version) {
      displayVersion(logger);
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Display banner
    if (!options.quiet && !options.json) {
      displayBanner(logger, VERSION);
      logger.log('');
    }

    // Validate target directory
    if (!options.targetDirectory) {
      logger.error('Target directory not specified');
      process.exit(EXIT_CODES.INVALID_ARGUMENTS);
    }

    // Display target directory
    if (!options.quiet) {
      logger.info(`📍 Target: ${options.targetDirectory}`);
    }

    // Route to appropriate command handler
    let result;
    switch (options.command) {
    case 'install':
      result = await handleInstallCommand(options, logger);
      break;
    case 'update':
      result = await handleUpdateCommand(options, logger);
      break;
    case 'uninstall':
      result = await handleUninstallCommand(options, logger);
      break;
    case 'verify':
      result = await handleVerifyCommand(options, logger);
      break;
    default:
      logger.error(`Unknown command: ${options.command}`);
      process.exit(EXIT_CODES.INVALID_ARGUMENTS);
    }

    // Display result
    if (options.json) {
      logger.log(JSON.stringify(result, null, 2));
    }

    // Exit with appropriate code
    process.exit(result.success ? EXIT_CODES.SUCCESS : EXIT_CODES.GENERAL_ERROR);

  } catch (error) {
    // Error handling
    if (logger) {
      logger.error(`Error: ${error.message}`);
      if (options && options.verbose && error.stack) {
        logger.error(error.stack);
      }
    } else {
      console.error(`Error: ${error.message}`);
    }

    // Determine appropriate exit code
    let exitCode = EXIT_CODES.GENERAL_ERROR;

    if (error.message.includes('Unknown flag') || error.message.includes('requires a directory')) {
      exitCode = EXIT_CODES.INVALID_ARGUMENTS;
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      exitCode = EXIT_CODES.PERMISSION_DENIED;
    } else if (error.code === 'ENOSPC') {
      exitCode = EXIT_CODES.DISK_SPACE_INSUFFICIENT;
    }

    process.exit(exitCode);
  }
}

// Handle signals for graceful shutdown (placeholder for T063)
process.on('SIGINT', () => {
  console.log('\n\nOperation cancelled by user');
  process.exit(EXIT_CODES.USER_CANCELLED);
});

process.on('SIGTERM', () => {
  console.log('\n\nOperation terminated');
  process.exit(EXIT_CODES.USER_CANCELLED);
});

// Execute main function
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  parseArguments,
  applyEnvironmentVariables,
  EXIT_CODES,
  main
};
