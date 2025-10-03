/**
 * Uninstaller Module
 *
 * Safely removes Claude Buddy from a project while optionally preserving
 * user customizations through selective removal and backup creation.
 *
 * @module setup/lib/uninstaller
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { createLogger } = require('./logger');

const logger = createLogger('uninstaller');

/**
 * Uninstall Error Class
 */
class UninstallError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'UninstallError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Preservation Error Class
 */
class PreservationError extends Error {
  constructor(message, files, details = {}) {
    super(message);
    this.name = 'PreservationError';
    this.files = files;
    this.details = details;
  }
}

/**
 * Performs complete uninstallation process
 *
 * @param {Object} options - Uninstall options
 * @param {string} options.targetDirectory - Target directory
 * @param {Object} options.metadata - Installation metadata
 * @param {boolean} options.preserveCustomizations - Preserve user files (default: true)
 * @param {boolean} options.purge - Complete removal (default: false)
 * @param {boolean} options.nonInteractive - No prompts (default: false)
 * @param {boolean} options.dryRun - Dry-run mode (default: false)
 * @param {boolean} options.verbose - Verbose logging (default: false)
 * @returns {Promise<Object>} Uninstall result
 */
async function performUninstall(options) {
  const {
    targetDirectory,
    metadata,
    preserveCustomizations = true,
    purge = false,
    nonInteractive = false,
    dryRun = false,
    verbose = false
  } = options;

  const startTime = Date.now();
  const result = {
    success: false,
    removedFiles: [],
    preservedFiles: [],
    removedDirectories: [],
    preservedDirectories: [],
    duration: 0,
    warnings: []
  };

  try {
    logger.section('Uninstallation Process', verbose);
    logger.info(`Target: ${targetDirectory}`, verbose);
    logger.info(`Mode: ${purge ? 'Purge' : 'Standard'}`, verbose);
    logger.info(`Preserve customizations: ${preserveCustomizations && !purge ? 'Yes' : 'No'}`, verbose);

    // Validate installation exists
    const isValid = await validateUninstall(targetDirectory);
    if (!isValid) {
      throw new UninstallError(
        'No Claude Buddy installation found',
        'NOT_INSTALLED',
        { targetDirectory }
      );
    }

    // Get removal plan
    const plan = await getRemovalPlan(
      targetDirectory,
      metadata,
      preserveCustomizations && !purge,
      verbose
    );

    // Confirm uninstallation (unless non-interactive or dry-run)
    if (!nonInteractive && !dryRun) {
      const confirmed = await confirmUninstall(options, plan, verbose);
      if (!confirmed) {
        logger.info('Uninstallation cancelled by user', verbose);
        result.success = false;
        result.duration = Date.now() - startTime;
        return result;
      }
    }

    // Create preservation backup if preserving customizations
    if (preserveCustomizations && !purge && plan.filesToPreserve.length > 0) {
      if (!dryRun) {
        logger.progress('Preserving user data', verbose);
        const preservationPath = await preserveUserData(targetDirectory, metadata, verbose);
        logger.success(`User data preserved at: ${preservationPath}`, verbose);
        result.warnings.push(`User data backed up to: ${preservationPath}`);
      } else {
        logger.info('Would preserve user data', verbose);
      }
    }

    // Remove framework files
    logger.progress('Removing framework files', verbose);
    const removalResult = await removeFiles(
      targetDirectory,
      plan.filesToRemove,
      dryRun,
      verbose
    );

    result.removedFiles = removalResult.removed;
    result.preservedFiles = plan.filesToPreserve;

    if (dryRun) {
      logger.info(`Would remove ${removalResult.removed.length} files`, verbose);
    } else {
      logger.success(`Removed ${removalResult.removed.length} files`, verbose);
    }

    if (removalResult.errors.length > 0) {
      removalResult.errors.forEach(err => {
        result.warnings.push(`Failed to remove ${err.path}: ${err.error}`);
      });
    }

    // Clean up empty directories
    logger.progress('Cleaning up directories', verbose);
    const cleanupResult = await cleanupDirectories(
      targetDirectory,
      [
        '.claude-buddy/personas',
        '.claude-buddy/templates',
        '.claude-buddy/context',
        '.claude-buddy',
        '.claude/hooks',
        '.claude/commands',
        '.claude/agents',
        '.claude',
        'directive'
      ],
      dryRun,
      verbose
    );

    result.removedDirectories = cleanupResult.removed;
    result.preservedDirectories = cleanupResult.preserved;

    if (dryRun) {
      logger.info(`Would remove ${cleanupResult.removed.length} directories`, verbose);
    } else {
      logger.success(`Removed ${cleanupResult.removed.length} directories`, verbose);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    logger.section('Uninstallation Complete', verbose);
    logger.success(`Removed ${result.removedFiles.length} files in ${result.duration}ms`, verbose);

    if (result.preservedFiles.length > 0) {
      logger.info(`Preserved ${result.preservedFiles.length} user customizations`, verbose);
    }

    return result;

  } catch (error) {
    logger.error(`Uninstallation failed: ${error.message}`, verbose);

    result.success = false;
    result.duration = Date.now() - startTime;
    result.warnings.push(`Uninstallation failed: ${error.message}`);

    return result;
  }
}

/**
 * Confirms uninstallation with user
 *
 * @param {Object} options - Uninstall options
 * @param {Object} plan - Removal plan
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<boolean>} True if confirmed
 */
async function confirmUninstall(options, plan, verbose) {
  const { purge } = options;

  if (purge) {
    logger.warn('WARNING: Complete Purge Mode', verbose);
    logger.warn('This will PERMANENTLY remove ALL Claude Buddy files including:', verbose);
    logger.warn('  - Framework files', verbose);
    logger.warn('  - User customizations', verbose);
    logger.warn('  - Custom personas', verbose);
    logger.warn('  - All configurations', verbose);
    logger.warn('', verbose);
    logger.warn('This action CANNOT be undone (even with backup).', verbose);

    // In a real implementation, we would use inquirer here
    // For now, we'll assume confirmation in automated environments
    return true;
  } else {
    logger.warn('Claude Buddy Uninstallation', verbose);
    logger.info('', verbose);
    logger.info('The following will be removed:', verbose);
    logger.info(`  - Framework files (${plan.filesToRemove.length} files)`, verbose);
    logger.info('  - Slash commands and agents', verbose);
    logger.info('  - Hook scripts', verbose);
    logger.info('', verbose);

    if (plan.filesToPreserve.length > 0) {
      logger.info('The following will be preserved:', verbose);
      logger.info(`  - User customizations (${plan.filesToPreserve.length} files)`, verbose);
      logger.info('', verbose);
    }

    // In a real implementation, we would use inquirer here
    return true;
  }
}

/**
 * Removes specified files
 *
 * @param {string} targetDirectory - Base directory
 * @param {Array} filesToRemove - Files to remove
 * @param {boolean} dryRun - Dry-run mode
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Removal result
 */
async function removeFiles(targetDirectory, filesToRemove, dryRun, verbose) {
  const result = {
    removed: [],
    errors: []
  };

  for (const file of filesToRemove) {
    const filePath = path.join(targetDirectory, file);

    try {
      if (dryRun) {
        result.removed.push(file);
        logger.debug(`Would remove: ${file}`, verbose);
        continue;
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, skip
        logger.debug(`File not found, skipping: ${file}`, verbose);
        continue;
      }

      // Remove file
      await fs.unlink(filePath);
      result.removed.push(file);
      logger.debug(`Removed: ${file}`, verbose);

    } catch (error) {
      result.errors.push({
        path: file,
        error: error.message,
        recoverable: true
      });
      logger.error(`Failed to remove ${file}: ${error.message}`, verbose);
    }
  }

  return result;
}

/**
 * Removes empty directories
 *
 * @param {string} targetDirectory - Base directory
 * @param {Array} directories - Directories to check
 * @param {boolean} dryRun - Dry-run mode
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Cleanup result
 */
async function cleanupDirectories(targetDirectory, directories, dryRun, verbose) {
  const result = {
    removed: [],
    preserved: []
  };

  // Process directories in reverse order (deepest first)
  const sortedDirs = [...directories].sort((a, b) => {
    const depthA = a.split('/').length;
    const depthB = b.split('/').length;
    return depthB - depthA;
  });

  for (const dir of sortedDirs) {
    const dirPath = path.join(targetDirectory, dir);

    try {
      // Check if directory exists
      try {
        await fs.access(dirPath);
      } catch {
        // Directory doesn't exist, skip
        logger.debug(`Directory not found: ${dir}`, verbose);
        continue;
      }

      // Check if directory is empty
      const entries = await fs.readdir(dirPath);

      if (entries.length === 0) {
        if (dryRun) {
          result.removed.push(dir);
          logger.debug(`Would remove empty directory: ${dir}`, verbose);
        } else {
          await fs.rmdir(dirPath);
          result.removed.push(dir);
          logger.debug(`Removed empty directory: ${dir}`, verbose);
        }
      } else {
        result.preserved.push(dir);
        logger.debug(`Preserved non-empty directory: ${dir} (${entries.length} items)`, verbose);
      }

    } catch (error) {
      logger.warn(`Failed to remove directory ${dir}: ${error.message}`, verbose);
      result.preserved.push(dir);
    }
  }

  return result;
}

/**
 * Preserves user data before uninstallation
 *
 * @param {string} targetDirectory - Base directory
 * @param {Object} metadata - Installation metadata
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<string>} Preservation path
 */
async function preserveUserData(targetDirectory, metadata, verbose) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const preservationDir = path.join(targetDirectory, `.claude-buddy-preserved-${timestamp}`);

  try {
    // Create preservation directory
    await fs.mkdir(preservationDir, { recursive: true });

    // Preserve user customizations from metadata
    if (metadata && metadata.userCustomizations) {
      for (const customization of metadata.userCustomizations) {
        const sourceFile = path.join(targetDirectory, customization.file);
        const destFile = path.join(preservationDir, customization.file);

        try {
          // Create parent directory
          await fs.mkdir(path.dirname(destFile), { recursive: true });

          // Copy file
          await fs.copyFile(sourceFile, destFile);

          logger.debug(`Preserved: ${customization.file}`, verbose);

        } catch (error) {
          logger.warn(`Failed to preserve ${customization.file}: ${error.message}`, verbose);
        }
      }
    }

    // Preserve specs directory if it exists
    const specsDir = path.join(targetDirectory, 'specs');
    try {
      await fs.access(specsDir);
      const destSpecsDir = path.join(preservationDir, 'specs');
      await copyDirectory(specsDir, destSpecsDir);
      logger.debug('Preserved specs directory', verbose);
    } catch {
      // Specs directory doesn't exist
    }

    // Create preservation info file
    const infoFile = path.join(preservationDir, 'PRESERVATION_INFO.txt');
    const infoContent = `
Claude Buddy User Data Preservation
Created: ${new Date().toISOString()}
Original Location: ${targetDirectory}

This directory contains your user customizations that were preserved
during Claude Buddy uninstallation.

To restore these files:
  cp -r ${preservationDir}/* ${targetDirectory}/

To reinstall Claude Buddy:
  claude-buddy install

To delete this backup:
  rm -rf ${preservationDir}
`.trim();

    await fs.writeFile(infoFile, infoContent, 'utf8');

    return preservationDir;

  } catch (error) {
    throw new PreservationError(
      `Failed to preserve user data: ${error.message}`,
      [],
      { error: error.message }
    );
  }
}

/**
 * Validates that directory has Claude Buddy installation
 *
 * @param {string} targetDirectory - Directory to validate
 * @returns {Promise<boolean>} True if valid installation
 */
async function validateUninstall(targetDirectory) {
  try {
    // Check for .claude-buddy directory
    const buddyDir = path.join(targetDirectory, '.claude-buddy');
    await fs.access(buddyDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets detailed removal plan
 *
 * @param {string} targetDirectory - Base directory
 * @param {Object} metadata - Installation metadata
 * @param {boolean} preserveCustomizations - Preserve user files
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Removal plan
 */
async function getRemovalPlan(targetDirectory, metadata, preserveCustomizations, verbose) {
  const plan = {
    filesToRemove: [],
    filesToPreserve: [],
    directoriesToRemove: [],
    directoriesToPreserve: [],
    estimatedDuration: 2000,
    backupRequired: preserveCustomizations
  };

  // Framework directories to process
  const frameworkDirs = [
    { dir: '.claude-buddy', patterns: ['**/*'] },
    { dir: '.claude', patterns: ['**/*'] },
    { dir: 'directive', patterns: ['foundation.md'] }
  ];

  // Collect all files
  for (const { dir, patterns } of frameworkDirs) {
    const baseDir = path.join(targetDirectory, dir);

    try {
      await fs.access(baseDir);

      for (const pattern of patterns) {
        try {
          const files = await glob(pattern, {
            cwd: baseDir,
            nodir: true,
            dot: true
          });

          for (const file of files) {
            const relativeFile = path.join(dir, file);

            // Check if file is a user customization
            if (preserveCustomizations && isUserCustomization(relativeFile, metadata)) {
              plan.filesToPreserve.push(relativeFile);
            } else {
              plan.filesToRemove.push(relativeFile);
            }
          }
        } catch (error) {
          logger.debug(`Failed to scan ${dir} with pattern ${pattern}: ${error.message}`, verbose);
        }
      }
    } catch {
      // Directory doesn't exist, skip
      logger.debug(`Directory not found: ${dir}`, verbose);
    }
  }

  return plan;
}

/**
 * Checks if file is a user customization
 *
 * @param {string} filePath - File path to check
 * @param {Object} metadata - Installation metadata
 * @returns {boolean} True if user customization
 */
function isUserCustomization(filePath, metadata) {
  // Check if file is in metadata customizations
  if (metadata && metadata.userCustomizations) {
    const isCustom = metadata.userCustomizations.some(custom =>
      custom.file === filePath && custom.preserveOnUpdate
    );

    if (isCustom) {
      return true;
    }
  }

  // Check for custom personas
  if (filePath.includes('personas/') && (filePath.includes('custom-') || filePath.includes('user-'))) {
    return true;
  }

  // Check for specs directory
  if (filePath.startsWith('specs/')) {
    return true;
  }

  return false;
}

/**
 * Copies directory recursively
 *
 * @param {string} source - Source directory
 * @param {string} dest - Destination directory
 * @returns {Promise<void>}
 */
async function copyDirectory(source, dest) {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

module.exports = {
  performUninstall,
  confirmUninstall,
  removeFiles,
  cleanupDirectories,
  preserveUserData,
  validateUninstall,
  getRemovalPlan,
  isUserCustomization,
  UninstallError,
  PreservationError
};
