/**
 * Updater Module
 *
 * Handles updating existing Claude Buddy installations while preserving
 * user customizations through intelligent file merging and configuration migration.
 *
 * @module setup/lib/updater
 */

const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('./logger');
const { createTransaction, executeAction, commitTransaction, rollbackTransaction } = require('./transaction');

const logger = createLogger('updater');

/**
 * Update Error Class
 */
class UpdateError extends Error {
  constructor(message, fromVersion, toVersion, details = {}) {
    super(message);
    this.name = 'UpdateError';
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
    this.details = details;
  }
}

/**
 * Migration Error Class
 */
class MigrationError extends Error {
  constructor(message, migrationId, details = {}) {
    super(message);
    this.name = 'MigrationError';
    this.migrationId = migrationId;
    this.details = details;
  }
}

/**
 * Backup Error Class
 */
class BackupError extends Error {
  constructor(message, backupPath, details = {}) {
    super(message);
    this.name = 'BackupError';
    this.backupPath = backupPath;
    this.details = details;
  }
}

/**
 * Migration Registry
 * Maps version transitions to migration functions
 */
const migrations = {
  '1.0.0-to-1.1.0': {
    description: 'Add persona auto-activation settings',
    migrate: async (config) => {
      if (!config.personas) {
        config.personas = {
          autoActivation: true,
          confidenceThreshold: 0.7
        };
      }
      return config;
    }
  }
  // Additional migrations can be added here
};

/**
 * Performs complete update process from one version to another
 *
 * @param {Object} options - Update options
 * @param {string} options.targetDirectory - Target directory
 * @param {string} options.fromVersion - Source version
 * @param {string} options.toVersion - Target version
 * @param {Object} options.manifest - Installation manifest
 * @param {Array} options.components - Components to install
 * @param {Object} options.existingMetadata - Existing installation metadata
 * @param {boolean} options.preserveAll - Preserve all files (default: false)
 * @param {boolean} options.mergeConfig - Merge configurations (default: true)
 * @param {boolean} options.dryRun - Dry-run mode (default: false)
 * @param {boolean} options.verbose - Verbose logging (default: false)
 * @returns {Promise<Object>} Update result
 */
async function performUpdate(options) {
  const {
    targetDirectory,
    fromVersion,
    toVersion,
    // manifest, // Reserved for future use
    components,
    existingMetadata,
    // preserveAll = false, // Reserved for future use
    mergeConfig = true,
    dryRun = false,
    verbose = false
  } = options;

  const startTime = Date.now();
  const result = {
    success: false,
    fromVersion,
    toVersion,
    updatedFiles: [],
    preservedFiles: [],
    migratedConfigs: [],
    backupPath: '',
    duration: 0,
    warnings: [],
    errors: []
  };

  let transaction = null;

  try {
    logger.section('Update Process', verbose);
    logger.info(`From: ${fromVersion}`, verbose);
    logger.info(`To: ${toVersion}`, verbose);
    logger.info(`Target: ${targetDirectory}`, verbose);

    // Check for downgrade
    if (isDowngrade(fromVersion, toVersion)) {
      logger.warn(`Warning: Downgrading from ${fromVersion} to ${toVersion}`, verbose);
      result.warnings.push({
        type: 'downgrade',
        message: `Downgrading from ${fromVersion} to ${toVersion} may cause compatibility issues`
      });
    }

    // Phase 1: Create backup
    if (!dryRun) {
      logger.progress('Creating backup', verbose);
      const backupPath = await createBackup(targetDirectory, existingMetadata, verbose);
      result.backupPath = backupPath;
      logger.success(`Backup created: ${backupPath}`, verbose);
    } else {
      logger.info('Would create backup', verbose);
    }

    // Phase 2: Create transaction
    if (!dryRun) {
      logger.progress('Creating transaction', verbose);
      transaction = await createTransaction({
        operation: 'update',
        fromVersion,
        toVersion,
        targetDirectory
      });
    }

    // Phase 3: Detect user customizations
    logger.progress('Detecting user customizations', verbose);
    const customizations = await detectUserCustomizations(
      targetDirectory,
      existingMetadata,
      verbose
    );

    if (dryRun || verbose) {
      logger.info(`Found ${customizations.length} user customizations`, verbose);
      if (verbose) {
        customizations.forEach(custom => {
          logger.debug(`  - ${custom.file}`, verbose);
        });
      }
    }

    result.preservedFiles = customizations.map(c => c.file);

    // Phase 4: Run migrations
    logger.progress('Running migrations', verbose);
    const migrationResult = await runMigrations(
      fromVersion,
      toVersion,
      targetDirectory,
      dryRun,
      verbose
    );

    if (migrationResult.applied.length > 0) {
      if (dryRun) {
        logger.info(`Would apply ${migrationResult.applied.length} migrations`, verbose);
      } else {
        logger.success(`Applied ${migrationResult.applied.length} migrations`, verbose);
      }
      result.migratedConfigs = migrationResult.applied.map(m => m.id);
    }

    if (migrationResult.errors.length > 0) {
      migrationResult.errors.forEach(error => {
        result.errors.push({
          type: 'migration_error',
          message: error.message,
          migrationId: error.migrationId
        });
      });
    }

    // Phase 5: Update framework files
    logger.progress('Updating framework files', verbose);
    for (const component of components) {
      try {
        const updateResult = await updateComponent(
          component,
          targetDirectory,
          customizations,
          transaction,
          dryRun,
          verbose
        );

        result.updatedFiles.push(...updateResult.updated);

        if (dryRun) {
          logger.info(`Would update ${component.name}: ${updateResult.updated.length} files`, verbose);
        } else {
          logger.success(`Updated ${component.name}: ${updateResult.updated.length} files`, verbose);
        }

        if (updateResult.skipped.length > 0 && verbose) {
          logger.debug(`Skipped ${updateResult.skipped.length} customized files`, verbose);
        }

      } catch (error) {
        if (component.type === 'required') {
          throw error;
        } else {
          result.warnings.push({
            type: 'component_update_failed',
            message: `Failed to update optional component ${component.name}: ${error.message}`,
            component: component.name
          });
          logger.warn(`Skipped ${component.name}: ${error.message}`, verbose);
        }
      }
    }

    // Phase 6: Merge configurations
    if (mergeConfig && !dryRun) {
      logger.progress('Merging configurations', verbose);
      const configFiles = [
        '.claude-buddy/buddy-config.json',
        '.claude/hooks.json'
      ];

      for (const configFile of configFiles) {
        try {
          const configPath = path.join(targetDirectory, configFile);

          // Check if file exists
          try {
            await fs.access(configPath);
          } catch {
            // File doesn't exist, skip
            continue;
          }

          const existingConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));

          // Load new config from component source directory (same logic as updateComponent)
          const componentForConfig = components.find(comp => {
            const fileName = path.basename(configFile);
            return comp.filePatterns.includes(fileName);
          });

          if (!componentForConfig) {
            // No component found for this config, preserve existing
            logger.debug(`No component found for ${configFile}, preserving existing`, verbose);
            continue;
          }

          const setupDir = path.join(__dirname, '..');
          const sourcePath = path.join(setupDir, '..', componentForConfig.source);
          const newConfigPath = path.join(sourcePath, path.basename(configFile));

          let newConfig;
          try {
            newConfig = JSON.parse(await fs.readFile(newConfigPath, 'utf8'));
          } catch {
            // New config doesn't exist in source, preserve existing
            logger.debug(`No source config at ${newConfigPath}, preserving existing`, verbose);
            continue;
          }

          const mergeResult = await mergeConfigurations(
            configFile,
            newConfig,
            existingConfig,
            'shallow_merge',
            verbose
          );

          if (mergeResult.conflicts.length > 0) {
            logger.warn(`Configuration conflicts in ${configFile}:`, verbose);
            mergeResult.conflicts.forEach(conflict => {
              logger.debug(`  ${conflict.path}: keeping user value`, verbose);
            });
          }

          // Write merged configuration
          await fs.writeFile(
            configPath,
            JSON.stringify(mergeResult.mergedContent, null, 2),
            'utf8'
          );

          if (transaction) {
            await executeAction(transaction, {
              type: 'update',
              path: configFile,
              reason: 'Merge configuration'
            });
          }

          logger.success(`Merged ${configFile}`, verbose);

        } catch (error) {
          logger.warn(`Failed to merge ${configFile}: ${error.message}`, verbose);
        }
      }
    } else if (dryRun) {
      logger.info('Would merge configurations', verbose);
    }

    // Phase 7: Update metadata
    if (!dryRun) {
      logger.progress('Updating metadata', verbose);
      await updateMetadata(
        targetDirectory,
        toVersion,
        existingMetadata,
        customizations,
        transaction,
        verbose
      );
      logger.success('Metadata updated', verbose);
    } else {
      logger.info('Would update metadata', verbose);
    }

    // Phase 8: Commit transaction
    if (!dryRun && transaction) {
      logger.progress('Committing transaction', verbose);
      await commitTransaction(transaction);
      logger.success('Transaction committed', verbose);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    logger.section('Update Complete', verbose);
    logger.success(`Updated from ${fromVersion} to ${toVersion} in ${result.duration}ms`, verbose);
    logger.info(`Updated: ${result.updatedFiles.length} files`, verbose);
    logger.info(`Preserved: ${result.preservedFiles.length} customizations`, verbose);

    return result;

  } catch (error) {
    logger.error(`Update failed: ${error.message}`, verbose);

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
      type: 'update_failed',
      message: error.message
    });

    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Detects files modified by users since installation
 *
 * @param {string} targetDirectory - Base directory
 * @param {Object} metadata - Existing installation metadata
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Array>} User customizations
 */
async function detectUserCustomizations(targetDirectory, metadata, verbose) {
  const customizations = [];

  if (!metadata || !metadata.installDate) {
    logger.warn('No installation metadata found, assuming no customizations', verbose);
    return customizations;
  }

  const installTime = new Date(metadata.installDate);

  // Check for user customizations in metadata
  if (metadata.userCustomizations && metadata.userCustomizations.length > 0) {
    customizations.push(...metadata.userCustomizations);
  }

  // Check for custom personas
  const personasDir = path.join(targetDirectory, '.claude-buddy', 'personas');
  try {
    const files = await fs.readdir(personasDir);
    for (const file of files) {
      if (file.startsWith('custom-') || file.includes('user-')) {
        const filePath = path.join(personasDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime > installTime) {
          customizations.push({
            file: path.join('.claude-buddy', 'personas', file),
            createdDate: stats.birthtime?.toISOString() || stats.mtime.toISOString(),
            lastModified: stats.mtime.toISOString(),
            description: 'Custom persona',
            preserveOnUpdate: true
          });
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
    logger.debug(`Could not scan personas directory: ${error.message}`, verbose);
  }

  // Check for modified framework files
  const frameworkFiles = [
    '.claude-buddy/buddy-config.json',
    '.claude/hooks.json'
  ];

  for (const file of frameworkFiles) {
    const filePath = path.join(targetDirectory, file);
    try {
      const stats = await fs.stat(filePath);

      if (stats.mtime > installTime) {
        customizations.push({
          file,
          createdDate: metadata.installDate,
          lastModified: stats.mtime.toISOString(),
          description: 'Modified configuration',
          preserveOnUpdate: true
        });
      }
    } catch (error) {
      // File doesn't exist
      logger.debug(`File not found: ${file}`, verbose);
    }
  }

  return customizations;
}

/**
 * Merges new configuration with existing user configuration
 *
 * @param {string} configFile - Configuration file path
 * @param {Object} newConfig - New configuration
 * @param {Object} existingConfig - Existing configuration
 * @param {string} strategy - Merge strategy
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Merge result
 */
async function mergeConfigurations(configFile, newConfig, existingConfig, strategy, verbose) {
  const result = {
    filePath: configFile,
    strategy,
    isUserModified: true,
    conflicts: [],
    mergedContent: null,
    backupPath: '',
    requiresUserInput: false
  };

  // Detect conflicts
  for (const [key, newValue] of Object.entries(newConfig)) {
    if (Object.prototype.hasOwnProperty.call(existingConfig, key)) {
      const userValue = existingConfig[key];

      if (JSON.stringify(userValue) !== JSON.stringify(newValue)) {
        result.conflicts.push({
          path: key,
          userValue,
          newValue,
          resolution: 'keep_user'
        });
      }
    }
  }

  // Apply merge strategy
  switch (strategy) {
  case 'keep_user':
    result.mergedContent = { ...existingConfig };
    break;

  case 'use_new':
    result.mergedContent = { ...newConfig };
    break;

  case 'shallow_merge':
    // New defaults, overridden by user values
    result.mergedContent = { ...newConfig, ...existingConfig };
    break;

  case 'deep_merge':
    result.mergedContent = deepMerge(newConfig, existingConfig);
    break;

  default:
    throw new Error(`Unknown merge strategy: ${strategy}`);
  }

  logger.debug(`Merged ${configFile} using ${strategy} strategy`, verbose);

  return result;
}

/**
 * Deep merge utility
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key], value);
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Runs version-specific migrations
 *
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @param {string} targetDirectory - Base directory
 * @param {boolean} dryRun - Dry-run mode
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Migration result
 */
async function runMigrations(fromVersion, toVersion, targetDirectory, dryRun, verbose) {
  const result = {
    applied: [],
    skipped: [],
    errors: []
  };

  const migrationPath = getMigrationPath(fromVersion, toVersion);

  for (const migrationId of migrationPath) {
    const migration = migrations[migrationId];

    if (!migration) {
      result.skipped.push({
        id: migrationId,
        description: 'Migration not found',
        applied: false
      });
      logger.debug(`Migration ${migrationId} not found, skipping`, verbose);
      continue;
    }

    try {
      if (dryRun) {
        result.applied.push({
          id: migrationId,
          description: migration.description,
          applied: false
        });
        logger.debug(`Would apply migration: ${migrationId}`, verbose);
        continue;
      }

      // Load configuration
      const configPath = path.join(targetDirectory, '.claude-buddy', 'buddy-config.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

      // Apply migration
      const migratedConfig = await migration.migrate(config, targetDirectory);

      // Save migrated configuration
      await fs.writeFile(configPath, JSON.stringify(migratedConfig, null, 2), 'utf8');

      result.applied.push({
        id: migrationId,
        description: migration.description,
        applied: true
      });

      logger.debug(`Applied migration: ${migrationId}`, verbose);

    } catch (error) {
      result.errors.push({
        migrationId,
        message: error.message
      });
      logger.error(`Migration ${migrationId} failed: ${error.message}`, verbose);
    }
  }

  return result;
}

/**
 * Creates backup of existing installation
 *
 * @param {string} targetDirectory - Base directory
 * @param {Object} metadata - Installation metadata
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<string>} Backup path
 */
async function createBackup(targetDirectory, metadata, verbose) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupDir = path.join(targetDirectory, '.claude-buddy', `backup-${timestamp}`);

  try {
    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true });

    // Backup directories
    const dirsToBackup = [
      '.claude-buddy',
      '.claude',
      'directive'
    ];

    for (const dir of dirsToBackup) {
      const sourcePath = path.join(targetDirectory, dir);
      const destPath = path.join(backupDir, dir);

      try {
        // Check if source exists
        await fs.access(sourcePath);

        // Copy directory recursively
        await copyDirectory(sourcePath, destPath);

        logger.debug(`Backed up ${dir}`, verbose);
      } catch (error) {
        // Directory doesn't exist, skip
        logger.debug(`Directory ${dir} not found, skipping backup`, verbose);
      }
    }

    // Clean old backups (keep last 3)
    await cleanOldBackups(path.join(targetDirectory, '.claude-buddy'), 3, verbose);

    logger.debug(`Backup created: ${backupDir}`, verbose);

    return backupDir;

  } catch (error) {
    throw new BackupError(
      `Failed to create backup: ${error.message}`,
      backupDir,
      { error: error.message }
    );
  }
}

/**
 * Updates a component while preserving customizations
 *
 * @param {Object} component - Component to update
 * @param {string} targetDirectory - Base directory
 * @param {Array} customizations - User customizations
 * @param {Object} transaction - Active transaction
 * @param {boolean} dryRun - Dry-run mode
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<Object>} Update result
 */
async function updateComponent(component, targetDirectory, customizations, transaction, dryRun, verbose) {
  const result = {
    component: component.name,
    updated: [],
    skipped: []
  };

  const { glob } = require('glob');
  const setupDir = path.join(__dirname, '..');
  const sourcePath = path.join(setupDir, '..', component.source);
  const targetPath = path.join(targetDirectory, component.target);

  // Find files in component
  const files = [];
  for (const pattern of component.filePatterns) {
    const matchedFiles = await glob(pattern, {
      cwd: sourcePath,
      nodir: true,
      dot: true
    });
    files.push(...matchedFiles);
  }

  // Update each file if not customized
  for (const file of files) {
    const relativeFilePath = path.join(component.target, file);

    // Check if file is a user customization
    if (shouldUpdateFile(relativeFilePath, customizations)) {
      if (!dryRun) {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);

        // Create parent directory if needed
        const targetDir = path.dirname(targetFile);
        await fs.mkdir(targetDir, { recursive: true });

        // Copy file
        await fs.copyFile(sourceFile, targetFile);

        // Set permissions for executable files (Unix only)
        if (process.platform !== 'win32' && file.endsWith('.py')) {
          await fs.chmod(targetFile, 0o755);
        }

        // Log to transaction
        if (transaction) {
          await executeAction(transaction, {
            type: 'update',
            path: relativeFilePath,
            component: component.name,
            reason: `Update ${component.name} file`
          });
        }
      }

      result.updated.push(relativeFilePath);
    } else {
      result.skipped.push(relativeFilePath);
      logger.debug(`Skipped customized file: ${relativeFilePath}`, verbose);
    }
  }

  return result;
}

/**
 * Updates installation metadata
 *
 * @param {string} targetDirectory - Base directory
 * @param {string} toVersion - Target version
 * @param {Object} existingMetadata - Existing metadata
 * @param {Array} customizations - User customizations
 * @param {Object} transaction - Active transaction
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<void>}
 */
async function updateMetadata(targetDirectory, toVersion, existingMetadata, customizations, transaction, verbose) {
  const metadata = {
    ...existingMetadata,
    version: toVersion,
    lastUpdateDate: new Date().toISOString(),
    userCustomizations: customizations
  };

  // Add transaction record
  if (!metadata.transactionHistory) {
    metadata.transactionHistory = [];
  }

  metadata.transactionHistory.push({
    transactionId: transaction ? transaction.transactionId : 'dry-run',
    operation: 'update',
    version: toVersion,
    timestamp: new Date().toISOString(),
    status: 'completed'
  });

  // Write metadata
  const metadataPath = path.join(targetDirectory, '.claude-buddy', 'install-metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  if (transaction) {
    await executeAction(transaction, {
      type: 'update',
      path: '.claude-buddy/install-metadata.json',
      reason: 'Update installation metadata'
    });
  }

  logger.debug('Updated install-metadata.json', verbose);
}

/**
 * Utility: Compare semantic versions
 *
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
}

/**
 * Utility: Check if update is a downgrade
 *
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {boolean} True if downgrade
 */
function isDowngrade(fromVersion, toVersion) {
  return compareVersions(toVersion, fromVersion) < 0;
}

/**
 * Utility: Check if file should be updated
 *
 * @param {string} filePath - File path
 * @param {Array} customizations - User customizations
 * @returns {boolean} True if should update
 */
function shouldUpdateFile(filePath, customizations) {
  return !customizations.some(custom => custom.file === filePath && custom.preserveOnUpdate);
}

/**
 * Utility: Get migration path
 *
 * @param {string} fromVersion - Source version
 * @param {string} toVersion - Target version
 * @returns {Array<string>} Migration IDs
 */
function getMigrationPath(fromVersion, toVersion) {
  const migrationIds = [];
  const migrationId = `${fromVersion}-to-${toVersion}`;

  if (migrations[migrationId]) {
    migrationIds.push(migrationId);
  }

  return migrationIds;
}

/**
 * Utility: Copy directory recursively
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

/**
 * Utility: Clean old backups
 *
 * @param {string} backupRoot - Backup root directory
 * @param {number} keepCount - Number of backups to keep
 * @param {boolean} verbose - Verbose logging
 * @returns {Promise<void>}
 */
async function cleanOldBackups(backupRoot, keepCount, verbose) {
  try {
    const entries = await fs.readdir(backupRoot, { withFileTypes: true });

    const backups = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('backup-'))
      .map(entry => ({
        name: entry.name,
        path: path.join(backupRoot, entry.name),
        timestamp: entry.name.replace('backup-', '')
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Delete old backups
    for (let i = keepCount; i < backups.length; i++) {
      await fs.rm(backups[i].path, { recursive: true, force: true });
      logger.debug(`Deleted old backup: ${backups[i].name}`, verbose);
    }
  } catch (error) {
    logger.debug(`Failed to clean old backups: ${error.message}`, verbose);
  }
}

module.exports = {
  performUpdate,
  detectUserCustomizations,
  mergeConfigurations,
  deepMerge,
  runMigrations,
  createBackup,
  UpdateError,
  MigrationError,
  BackupError,
  compareVersions,
  isDowngrade,
  shouldUpdateFile,
  getMigrationPath
};
