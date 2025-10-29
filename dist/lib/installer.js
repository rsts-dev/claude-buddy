/**
 * Installer Module
 *
 * Performs fresh installation of Claude Buddy components with transactional
 * execution and rollback capability.
 *
 * @module setup/lib/installer
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { createLogger } = require('./logger');
const { createTransaction, executeAction, commitTransaction, rollbackTransaction } = require('./transaction');

const logger = createLogger('installer');

/**
 * Installation Error Class
 */
class InstallationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'InstallationError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Performs complete fresh installation process
 *
 * @param {Object} options - Installation options
 * @param {string} options.targetDirectory - Target directory for installation
 * @param {Object} options.manifest - Installation manifest
 * @param {Array} options.components - Filtered components to install
 * @param {Object} options.environment - Environment detection result
 * @param {boolean} options.dryRun - Dry-run mode (default: false)
 * @param {boolean} options.verbose - Verbose logging (default: false)
 * @returns {Promise<Object>} Installation result
 */
async function performInstallation(options) {
  const {
    targetDirectory,
    manifest,
    components,
    environment,
    dryRun = false,
    verbose = false
  } = options;

  const startTime = Date.now();
  const result = {
    success: false,
    version: manifest.version,
    installedComponents: [],
    skippedComponents: [],
    duration: 0,
    metadata: null,
    warnings: [],
    errors: []
  };

  let transaction = null;

  try {
    logger.section('Installation Process', verbose);
    logger.info(`Target: ${targetDirectory}`, verbose);
    logger.info(`Version: ${manifest.version}`, verbose);
    logger.info(`Components: ${components.length}`, verbose);
    logger.info(`Dry-run: ${dryRun ? 'Yes' : 'No'}`, verbose);

    // Phase 1: Validation
    logger.progress('Validating target directory', verbose);
    const isValid = await validateTargetDirectory(targetDirectory);
    if (!isValid) {
      throw new InstallationError(
        'Target directory validation failed',
        'DIRECTORY_VALIDATION_FAILED',
        { targetDirectory }
      );
    }

    // Phase 2: Create transaction
    if (!dryRun) {
      logger.progress('Creating transaction', verbose);
      transaction = await createTransaction({
        operation: 'install',
        version: manifest.version,
        targetDirectory
      });
    } else {
      logger.info('Dry-run mode: No transaction created', verbose);
    }

    // Phase 3: Create directory structure
    logger.progress('Creating directory structure', verbose);
    const dirResult = await createDirectoryStructure(
      targetDirectory,
      manifest.directories,
      transaction,
      dryRun,
      verbose
    );

    if (dryRun) {
      logger.info(`Would create ${dirResult.created.length} directories`, verbose);
      logger.info(`Would skip ${dirResult.existing.length} existing directories`, verbose);
    } else {
      logger.success(`Created ${dirResult.created.length} directories`, verbose);
    }

    if (dirResult.failed.length > 0) {
      throw new InstallationError(
        `Failed to create ${dirResult.failed.length} directories`,
        'DIRECTORY_CREATION_FAILED',
        { failed: dirResult.failed }
      );
    }

    // Phase 4: Install components
    logger.progress('Installing components', verbose);
    for (const component of components) {
      try {
        const componentResult = await installComponent(
          component,
          targetDirectory,
          transaction,
          dryRun,
          verbose
        );

        result.installedComponents.push(component.name);

        if (dryRun) {
          logger.info(`Would install ${component.name}: ${componentResult.filesInstalled} files`, verbose);
        } else {
          logger.success(`Installed ${component.name}: ${componentResult.filesInstalled} files`, verbose);
        }

        if (componentResult.errors.length > 0) {
          componentResult.errors.forEach(err => {
            result.warnings.push({
              type: 'file_error',
              message: err,
              component: component.name
            });
          });
        }
      } catch (error) {
        if (component.type === 'required') {
          throw error;
        } else {
          // Optional component failed - log warning and continue
          result.skippedComponents.push(component.name);
          result.warnings.push({
            type: 'optional_dependency',
            message: `Failed to install optional component ${component.name}: ${error.message}`,
            component: component.name
          });
          logger.warn(`Skipped optional component ${component.name}: ${error.message}`, verbose);
        }
      }
    }

    // Phase 5: Create default configuration
    if (!dryRun) {
      logger.progress('Creating default configuration', verbose);
      await createDefaultConfiguration(
        targetDirectory,
        manifest,
        result.installedComponents,
        environment,
        transaction,
        verbose
      );
      logger.success('Configuration created', verbose);
    } else {
      logger.info('Would create default configuration', verbose);
    }

    // Phase 6: Create installation metadata
    if (!dryRun) {
      logger.progress('Creating installation metadata', verbose);
      const metadata = await createInstallationMetadata(
        targetDirectory,
        manifest,
        result.installedComponents,
        environment,
        transaction,
        verbose
      );
      result.metadata = metadata;
      logger.success('Metadata created', verbose);
    } else {
      logger.info('Would create installation metadata', verbose);
    }

    // Phase 7: Verify installation
    logger.progress('Verifying installation', verbose);
    const verification = await verifyInstallation(
      targetDirectory,
      manifest,
      result.installedComponents,
      dryRun,
      verbose
    );

    if (!verification.valid) {
      verification.issues.forEach(issue => {
        result.errors.push({
          type: issue.type,
          message: issue.message,
          path: issue.path,
          recoverable: false
        });
      });

      if (verification.issues.some(i => i.severity === 'error')) {
        throw new InstallationError(
          'Installation verification failed',
          'VERIFICATION_FAILED',
          { issues: verification.issues }
        );
      }
    }

    if (dryRun) {
      logger.info(verification.summary, verbose);
    } else {
      logger.success('Installation verified', verbose);
    }

    // Phase 8: Commit transaction
    if (!dryRun && transaction) {
      logger.progress('Committing transaction', verbose);
      await commitTransaction(transaction);
      logger.success('Transaction committed', verbose);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    logger.section('Installation Complete', verbose);
    logger.success(`Installed ${result.installedComponents.length} components in ${result.duration}ms`, verbose);

    return result;

  } catch (error) {
    logger.error(`Installation failed: ${error.message}`, verbose);

    // Rollback transaction on failure
    if (!dryRun && transaction) {
      logger.progress('Rolling back transaction', verbose);
      try {
        await rollbackTransaction(transaction);
        logger.info('Rollback complete', verbose);
      } catch (rollbackError) {
        logger.error(`Rollback failed: ${rollbackError.message}`, verbose);
      }
    }

    result.errors.push({
      type: error.code || 'unknown',
      message: error.message,
      recoverable: false
    });

    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Creates directory structure with proper permissions
 *
 * @param {string} targetDirectory - Base directory
 * @param {Array} directories - Directory specifications
 * @param {Object} transaction - Active transaction
 * @param {boolean} dryRun - Dry-run mode
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Creation result
 */
async function createDirectoryStructure(targetDirectory, directories, transaction, dryRun, verbose) {
  const result = {
    created: [],
    existing: [],
    failed: []
  };

  for (const dirSpec of directories) {
    const dirPath = path.join(targetDirectory, dirSpec.path);

    try {
      // Check if directory exists
      try {
        const stats = await fs.stat(dirPath);
        if (stats.isDirectory()) {
          result.existing.push(dirSpec.path);
          logger.debug(`Directory exists: ${dirSpec.path}`, verbose);
          continue;
        }
      } catch (err) {
        // Directory doesn't exist - will create it
      }

      if (dryRun) {
        result.created.push(dirSpec.path);
        logger.debug(`Would create directory: ${dirSpec.path}`, verbose);
        continue;
      }

      // Create directory through transaction system (or directly if no transaction)
      if (transaction) {
        await executeAction(transaction, {
          type: 'create_directory',
          path: dirSpec.path,
          reason: 'Directory creation',
          isDirectory: true,
          targetPermissions: dirSpec.permissions
        });
      } else {
        // No transaction - create directly
        await fs.mkdir(dirPath, { recursive: true });

        // Set permissions (Unix only)
        if (dirSpec.permissions && process.platform !== 'win32') {
          await fs.chmod(dirPath, parseInt(dirSpec.permissions, 8));
        }
      }

      result.created.push(dirSpec.path);
      logger.debug(`Created directory: ${dirSpec.path}`, verbose);

    } catch (error) {
      result.failed.push(dirSpec.path);
      logger.error(`Failed to create directory ${dirSpec.path}: ${error.message}`, verbose);
    }
  }

  return result;
}

/**
 * Installs a single component by copying files
 *
 * @param {Object} component - Component to install
 * @param {string} targetDirectory - Base directory
 * @param {Object} transaction - Active transaction
 * @param {boolean} dryRun - Dry-run mode
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Component install result
 */
async function installComponent(component, targetDirectory, transaction, dryRun, verbose) {
  const startTime = Date.now();
  const result = {
    component: component.name,
    filesInstalled: 0,
    filesCopied: [],
    errors: [],
    duration: 0
  };

  try {
    // Calculate paths
    const { sourcePath, targetPath } = calculateInstallationPaths(component, targetDirectory);

    logger.debug(`Installing ${component.name} from ${sourcePath} to ${targetPath}`, verbose);

    // Find files matching patterns
    const files = [];
    for (const pattern of component.filePatterns) {
      const matchedFiles = await glob(pattern, {
        cwd: sourcePath,
        nodir: true,
        dot: true
      });
      files.push(...matchedFiles);
    }

    logger.debug(`Found ${files.length} files for ${component.name}`, verbose);

    // Copy each file
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file);
      const targetFile = path.join(targetPath, file);

      try {
        if (dryRun) {
          result.filesCopied.push(file);
          result.filesInstalled++;
          continue;
        }

        // Read source file content
        const sourceContent = await fs.readFile(sourceFile, 'utf-8');
        const permissions = (process.platform !== 'win32' && file.endsWith('.py')) ? '0755' : null;

        // Create file through transaction system (or directly if no transaction)
        if (transaction) {
          await executeAction(transaction, {
            type: 'create',
            path: path.join(component.target, file),
            sourceContent: sourceContent,
            targetPermissions: permissions,
            component: component.name,
            reason: `Install ${component.name} file`
          });
        } else {
          // No transaction - copy directly
          const targetDir = path.dirname(targetFile);
          await fs.mkdir(targetDir, { recursive: true });
          await fs.copyFile(sourceFile, targetFile);

          if (permissions) {
            await fs.chmod(targetFile, parseInt(permissions, 8));
          }
        }

        result.filesCopied.push(file);
        result.filesInstalled++;
        logger.debug(`Copied file: ${file}`, verbose);

      } catch (error) {
        const errorMsg = `Failed to copy ${file}: ${error.message}`;
        result.errors.push(errorMsg);
        logger.error(errorMsg, verbose);
      }
    }

  } catch (error) {
    throw new InstallationError(
      `Component installation failed: ${error.message}`,
      'FILE_COPY_FAILED',
      { component: component.name, error: error.message }
    );
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Creates default configuration files
 *
 * @param {string} targetDirectory - Base directory
 * @param {Object} manifest - Installation manifest
 * @param {Array} installedComponents - List of installed component names
 * @param {Object} environment - Environment detection result
 * @param {Object} transaction - Active transaction
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<void>}
 */
async function createDefaultConfiguration(targetDirectory, manifest, installedComponents, environment, transaction, verbose) {
  // Configuration is now managed in .claude/hooks.json (distributed with hooks component)
  // This function is kept for future use if needed

  // Note: buddy-config.json has been deprecated in v2.2.0
  // All configuration now lives in .claude/hooks.json config section
  // The hooks.json file is distributed from setup/dist/.claude/hooks.json

  logger.debug('Configuration files distributed with components (hooks.json)', verbose);
}

/**
 * Creates installation metadata
 *
 * @param {string} targetDirectory - Base directory
 * @param {Object} manifest - Installation manifest
 * @param {Array} installedComponents - List of installed component names
 * @param {Object} environment - Environment detection result
 * @param {Object} transaction - Active transaction
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Created metadata
 */
async function createInstallationMetadata(targetDirectory, manifest, installedComponents, environment, transaction, verbose) {
  const metadata = {
    version: manifest.version,
    installDate: new Date().toISOString(),
    lastUpdateDate: null,
    installMode: 'project',
    installedComponents: {},
    userCustomizations: [],
    dependencies: {},
    transactionHistory: [
      {
        transactionId: transaction ? transaction.transactionId : 'dry-run',
        operation: 'install',
        version: manifest.version,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    ]
  };

  // Populate installed components
  for (const component of manifest.components) {
    const isInstalled = installedComponents.includes(component.name);
    metadata.installedComponents[component.name] = {
      version: manifest.version,
      enabled: isInstalled,
      reason: isInstalled ? undefined : 'Dependency unavailable'
    };
  }

  // Populate dependencies
  if (environment.detectedDependencies) {
    for (const dep of environment.detectedDependencies) {
      metadata.dependencies[dep.name] = {
        version: dep.version,
        required: dep.name === 'node',
        available: dep.available,
        location: dep.location
      };
    }
  }

  // Write metadata file
  const metadataPath = path.join(targetDirectory, '.claude-buddy', 'install-metadata.json');
  const metadataContent = JSON.stringify(metadata, null, 2);

  if (transaction) {
    await executeAction(transaction, {
      type: 'create',
      path: '.claude-buddy/install-metadata.json',
      sourceContent: metadataContent,
      reason: 'Create installation metadata'
    });
  } else {
    await fs.writeFile(metadataPath, metadataContent, 'utf8');
  }

  logger.debug('Created install-metadata.json', verbose);

  return metadata;
}

/**
 * Verifies installation integrity
 *
 * @param {string} targetDirectory - Base directory
 * @param {Object} manifest - Installation manifest
 * @param {Array} installedComponents - List of installed component names
 * @param {boolean} dryRun - Dry-run mode
 * @param {boolean} _verbose - Verbose logging (unused)
 * @returns {Promise<Object>} Verification result
 */
async function verifyInstallation(targetDirectory, manifest, installedComponents, dryRun, _verbose) {
  const result = {
    valid: true,
    issues: [],
    summary: ''
  };

  if (dryRun) {
    result.summary = 'Installation would complete successfully (dry-run)';
    return result;
  }

  // Check directories
  for (const dirSpec of manifest.directories) {
    const dirPath = path.join(targetDirectory, dirSpec.path);
    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        result.issues.push({
          severity: 'error',
          type: 'missing_directory',
          message: `Expected directory but found file: ${dirSpec.path}`,
          path: dirSpec.path
        });
        result.valid = false;
      }
    } catch (error) {
      result.issues.push({
        severity: 'error',
        type: 'missing_directory',
        message: `Directory not found: ${dirSpec.path}`,
        path: dirSpec.path
      });
      result.valid = false;
    }
  }

  // Check metadata file
  const metadataPath = path.join(targetDirectory, '.claude-buddy', 'install-metadata.json');
  try {
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);

    if (metadata.version !== manifest.version) {
      result.issues.push({
        severity: 'warning',
        type: 'invalid_config',
        message: `Version mismatch: expected ${manifest.version}, found ${metadata.version}`,
        path: 'install-metadata.json'
      });
    }
  } catch (error) {
    result.issues.push({
      severity: 'error',
      type: 'missing_file',
      message: 'Installation metadata file not found or invalid',
      path: metadataPath
    });
    result.valid = false;
  }

  // Check hooks configuration file (replaces buddy-config.json in v2.2.0+)
  const hooksConfigPath = path.join(targetDirectory, '.claude', 'hooks.json');
  try {
    const configContent = await fs.readFile(hooksConfigPath, 'utf8');
    const hooksConfig = JSON.parse(configContent); // Validate JSON
    // Verify config section exists
    if (!hooksConfig.config) {
      result.issues.push({
        severity: 'warning',
        type: 'missing_config_section',
        message: 'hooks.json exists but missing config section',
        path: hooksConfigPath
      });
    }
  } catch (error) {
    result.issues.push({
      severity: 'error',
      type: 'invalid_config',
      message: 'hooks.json not found or invalid JSON',
      path: hooksConfigPath
    });
    result.valid = false;
  }

  if (result.valid) {
    result.summary = `Installation verified: ${installedComponents.length} components installed successfully`;
  } else {
    result.summary = `Verification failed with ${result.issues.filter(i => i.severity === 'error').length} errors`;
  }

  return result;
}

/**
 * Validates target directory
 *
 * @param {string} targetDirectory - Directory to validate
 * @returns {Promise<boolean>} True if valid
 */
async function validateTargetDirectory(targetDirectory) {
  try {
    const stats = await fs.stat(targetDirectory);
    if (!stats.isDirectory()) {
      return false;
    }

    // Check write permissions
    await fs.access(targetDirectory, fs.constants.W_OK);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Calculates installation paths for a component
 *
 * @param {Object} component - Component specification
 * @param {string} targetDirectory - Base target directory
 * @returns {Object} Source and target paths
 */
function calculateInstallationPaths(component, targetDirectory) {
  const { resolveSourcePath, resolveTargetPath } = require('./manifest');

  // Use manifest's path resolution (handles both npm package and dev scenarios)
  const sourcePath = resolveSourcePath(component.source);
  const targetPath = resolveTargetPath(component.target, targetDirectory);

  return { sourcePath, targetPath };
}

/**
 * Estimates installation duration
 *
 * @param {Array} components - Components to install
 * @returns {number} Estimated duration in milliseconds
 */
function estimateInstallDuration(components) {
  // Estimate 100ms per component + 500ms overhead
  return (components.length * 100) + 500;
}

module.exports = {
  performInstallation,
  createDirectoryStructure,
  installComponent,
  createDefaultConfiguration,
  verifyInstallation,
  InstallationError,
  validateTargetDirectory,
  calculateInstallationPaths,
  estimateInstallDuration
};
