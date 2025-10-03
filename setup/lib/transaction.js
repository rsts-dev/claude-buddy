/**
 * Transaction Module for Claude Buddy Installation Script
 * Provides transactional installation operations with rollback capability
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createLogger } = require('./logger');

const logger = createLogger();

// Transaction timeout (5 minutes) - Reserved for future use
// const TRANSACTION_TIMEOUT = 5 * 60 * 1000;

// Lock file timeout (30 seconds)
const LOCK_TIMEOUT = 30 * 1000;

/**
 * Create a new installation transaction
 * @param {Object} options - Transaction options
 * @param {string} options.operation - Operation type ('install', 'update', 'uninstall', 'repair')
 * @param {string} options.targetDirectory - Target installation directory
 * @param {string} options.toVersion - Target version
 * @param {string} options.fromVersion - Source version (for updates)
 * @returns {Promise<Object>} Transaction object
 */
async function createTransaction(options) {
  const transactionId = uuidv4();
  const startTime = new Date().toISOString();

  logger.debug(`Creating transaction ${transactionId} for ${options.operation}`);

  const transaction = {
    transactionId,
    startTime,
    endTime: null,
    status: 'pending',
    operation: options.operation,
    targetDirectory: options.targetDirectory,
    fromVersion: options.fromVersion || null,
    toVersion: options.toVersion,
    checkpoints: [],
    plannedActions: [],
    executedActions: [],
    errors: [],
    rollbackPoint: null,
    lockFile: path.join(options.targetDirectory, '.claude-buddy', 'install.lock')
  };

  // Create initial checkpoint
  const preInstallCheckpoint = await createCheckpoint(transaction, 'pre-install');
  transaction.checkpoints.push(preInstallCheckpoint);
  transaction.rollbackPoint = preInstallCheckpoint.snapshot;

  return transaction;
}

/**
 * Create a checkpoint with file state snapshot
 * @param {Object} transaction - Transaction object
 * @param {string} phase - Checkpoint phase
 * @returns {Promise<Object>} Checkpoint object
 */
async function createCheckpoint(transaction, phase) {
  logger.verbose(`Creating checkpoint: ${phase}`);

  const timestamp = new Date().toISOString();
  const snapshot = await captureSnapshot(transaction.targetDirectory);

  const checkpoint = {
    phase,
    snapshot,
    timestamp
  };

  logger.debug(`Checkpoint created: ${phase} with ${snapshot.files.length} files`);

  return checkpoint;
}

/**
 * Capture a snapshot of the current file system state
 * @param {string} targetDirectory - Target directory
 * @returns {Promise<Object>} Snapshot object
 */
async function captureSnapshot(targetDirectory) {
  const files = [];

  // Capture state of key directories and files
  const pathsToCapture = [
    '.claude-buddy',
    '.claude',
    'directive'
  ];

  for (const relativePath of pathsToCapture) {
    const fullPath = path.join(targetDirectory, relativePath);

    try {
      await capturePathRecursive(fullPath, relativePath, files);
    } catch (err) {
      // Path doesn't exist, which is fine for snapshots
      logger.verbose(`Path not found during snapshot: ${relativePath}`);
    }
  }

  // Try to read metadata file if it exists
  let metadata = null;
  try {
    const metadataPath = path.join(targetDirectory, '.claude-buddy', 'install-metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    metadata = JSON.parse(metadataContent);
  } catch (err) {
    // Metadata doesn't exist or is corrupted
  }

  return {
    files,
    metadata,
    timestamp: new Date().toISOString()
  };
}

/**
 * Recursively capture file information
 * @param {string} fullPath - Full file path
 * @param {string} relativePath - Relative path from target directory
 * @param {Array} files - Array to collect file information
 */
async function capturePathRecursive(fullPath, relativePath, files) {
  const stats = await fs.stat(fullPath);

  if (stats.isDirectory()) {
    // Capture directory
    files.push({
      path: relativePath,
      exists: true,
      isDirectory: true,
      permissions: stats.mode.toString(8).slice(-3),
      lastModified: stats.mtime.toISOString()
    });

    // Recursively capture contents
    const entries = await fs.readdir(fullPath);
    for (const entry of entries) {
      const entryFullPath = path.join(fullPath, entry);
      const entryRelativePath = path.join(relativePath, entry);

      await capturePathRecursive(entryFullPath, entryRelativePath, files);
    }
  } else {
    // Capture file
    // Only store content for small files (< 100KB)
    let content = null;
    if (stats.size < 100 * 1024) {
      try {
        content = await fs.readFile(fullPath, 'utf-8');
      } catch (err) {
        // Binary file or read error, don't store content
      }
    }

    files.push({
      path: relativePath,
      exists: true,
      isDirectory: false,
      content,
      size: stats.size,
      permissions: stats.mode.toString(8).slice(-3),
      lastModified: stats.mtime.toISOString()
    });
  }
}

/**
 * Plan an action to be executed
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Action details
 * @returns {Object} Planned action
 */
function planAction(transaction, action) {
  const actionId = uuidv4();

  const plannedAction = {
    actionId,
    type: action.type, // 'create', 'update', 'delete', 'skip', 'backup'
    path: action.path,
    component: action.component || null,
    reason: action.reason,
    status: 'pending',
    sourceContent: action.sourceContent || null,
    targetPermissions: action.targetPermissions || '644'
  };

  transaction.plannedActions.push(plannedAction);
  logger.debug(`Planned action: ${action.type} ${action.path}`);

  return plannedAction;
}

/**
 * Execute a planned action
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Action to execute
 * @returns {Promise<Object>} Executed action with result
 */
async function executeAction(transaction, action) {
  const startTime = Date.now();
  action.status = 'in_progress';

  logger.verbose(`Executing: ${action.type} ${action.path}`);

  try {
    let result;

    switch (action.type) {
    case 'create':
    case 'create_directory':
      result = await executeCreateAction(transaction, action);
      break;
    case 'update':
      result = await executeUpdateAction(transaction, action);
      break;
    case 'delete':
      result = await executeDeleteAction(transaction, action);
      break;
    case 'skip':
      result = await executeSkipAction(transaction, action);
      break;
    case 'backup':
      result = await executeBackupAction(transaction, action);
      break;
    default:
      throw new Error(`Unknown action type: ${action.type}`);
    }

    action.status = result.success ? (result.skipped ? 'skipped' : 'completed') : 'failed';
    action.executionTime = new Date().toISOString();
    action.duration = Date.now() - startTime;
    action.result = result;

    if (result.success) {
      transaction.executedActions.push(action);
      if (result.skipped) {
        logger.debug(`Action skipped: ${action.type} ${action.path} - ${result.message}`);
      } else {
        logger.debug(`Action completed: ${action.type} ${action.path}`);
      }
    } else {
      logger.error(`Action failed: ${action.type} ${action.path} - ${result.message}`);
    }

    return action;
  } catch (err) {
    action.status = 'failed';
    action.executionTime = new Date().toISOString();
    action.duration = Date.now() - startTime;
    action.result = {
      success: false,
      message: err.message
    };

    transaction.errors.push({
      errorId: uuidv4(),
      actionId: action.actionId,
      timestamp: new Date().toISOString(),
      phase: 'execution',
      errorType: 'unknown',
      message: err.message,
      technicalDetails: err.stack,
      recoverable: true
    });

    logger.error(`Action failed with exception: ${action.type} ${action.path} - ${err.message}`);

    throw err;
  }
}

/**
 * Execute a create action
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Create action
 * @returns {Promise<Object>} Action result
 */
async function executeCreateAction(transaction, action) {
  const targetPath = path.join(transaction.targetDirectory, action.path);

  try {
    // Check if target already exists
    let exists = false;
    let isDirectory = false;
    try {
      const stats = await fs.stat(targetPath);
      exists = true;
      isDirectory = stats.isDirectory();
    } catch (err) {
      // File doesn't exist, proceed with creation
    }

    if (exists) {
      // For directories, treat as success (idempotent)
      if (isDirectory && action.type === 'create_directory') {
        return {
          success: true,
          message: `Directory already exists: ${action.path}`,
          skipped: true
        };
      }

      // For files, check if we should overwrite
      // During updates or with --force, this would use update action instead
      // For now, treat as skipped success to avoid noise
      return {
        success: true,
        message: `File already exists: ${action.path}`,
        skipped: true
      };
    }

    // Handle directory creation vs file creation
    if (action.isDirectory || action.type === 'create_directory') {
      // Create directory
      await fs.mkdir(targetPath, { recursive: true });

      // Set permissions (Unix only)
      if (process.platform !== 'win32' && action.targetPermissions) {
        await fs.chmod(targetPath, parseInt(action.targetPermissions, 8));
      }
    } else {
      // Create parent directory if needed
      const parentDir = path.dirname(targetPath);
      await fs.mkdir(parentDir, { recursive: true });

      // Write file content
      if (action.sourceContent) {
        await fs.writeFile(targetPath, action.sourceContent, 'utf-8');
      } else {
        // Create empty file
        await fs.writeFile(targetPath, '', 'utf-8');
      }

      // Set permissions (Unix only)
      if (process.platform !== 'win32' && action.targetPermissions) {
        await fs.chmod(targetPath, parseInt(action.targetPermissions, 8));
      }
    }

    return {
      success: true,
      message: `Created: ${action.path}`
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to create ${action.path}: ${err.message}`
    };
  }
}

/**
 * Execute an update action
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Update action
 * @returns {Promise<Object>} Action result
 */
async function executeUpdateAction(transaction, action) {
  const targetPath = path.join(transaction.targetDirectory, action.path);

  try {
    // Read existing content for rollback
    let previousContent = null;
    try {
      previousContent = await fs.readFile(targetPath, 'utf-8');
      action.previousContent = previousContent;
    } catch (err) {
      // File doesn't exist, treat as create
      return await executeCreateAction(transaction, action);
    }

    // Write new content
    if (action.sourceContent) {
      await fs.writeFile(targetPath, action.sourceContent, 'utf-8');
    }

    // Set permissions (Unix only)
    if (process.platform !== 'win32' && action.targetPermissions) {
      await fs.chmod(targetPath, parseInt(action.targetPermissions, 8));
    }

    return {
      success: true,
      message: `Updated: ${action.path}`
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to update ${action.path}: ${err.message}`
    };
  }
}

/**
 * Execute a delete action
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Delete action
 * @returns {Promise<Object>} Action result
 */
async function executeDeleteAction(transaction, action) {
  const targetPath = path.join(transaction.targetDirectory, action.path);

  try {
    // Check if file/directory exists
    const stats = await fs.stat(targetPath);

    // Store content for rollback
    if (stats.isFile()) {
      try {
        const content = await fs.readFile(targetPath, 'utf-8');
        action.previousContent = content;
      } catch (err) {
        // Binary file or read error
      }
    }

    // Delete file or directory
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.unlink(targetPath);
    }

    return {
      success: true,
      message: `Deleted: ${action.path}`
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        success: true,
        message: `Already deleted: ${action.path}`
      };
    }

    return {
      success: false,
      message: `Failed to delete ${action.path}: ${err.message}`
    };
  }
}

/**
 * Execute a skip action
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Skip action
 * @returns {Promise<Object>} Action result
 */
async function executeSkipAction(transaction, action) {
  logger.info(`Skipping: ${action.path} - ${action.reason}`);

  return {
    success: true,
    message: `Skipped: ${action.path}`,
    warning: action.reason
  };
}

/**
 * Execute a backup action
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Backup action
 * @returns {Promise<Object>} Action result
 */
async function executeBackupAction(transaction, action) {
  const sourcePath = path.join(transaction.targetDirectory, action.path);
  const backupDir = path.join(transaction.targetDirectory, '.claude-buddy', 'backups', transaction.transactionId);
  const backupPath = path.join(backupDir, action.path);

  try {
    // Create backup directory
    await fs.mkdir(path.dirname(backupPath), { recursive: true });

    // Copy file to backup location
    await fs.copyFile(sourcePath, backupPath);

    return {
      success: true,
      message: `Backed up: ${action.path}`
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        success: true,
        message: `File not found, backup skipped: ${action.path}`
      };
    }

    return {
      success: false,
      message: `Failed to backup ${action.path}: ${err.message}`
    };
  }
}

/**
 * Commit the transaction
 * @param {Object} transaction - Transaction object
 * @returns {Promise<void>}
 */
async function commitTransaction(transaction) {
  logger.debug(`Committing transaction ${transaction.transactionId}`);

  transaction.status = 'completed';
  transaction.endTime = new Date().toISOString();

  // Create final checkpoint
  const postInstallCheckpoint = await createCheckpoint(transaction, 'post-install');
  transaction.checkpoints.push(postInstallCheckpoint);

  // Save transaction log for audit trail
  await saveTransactionLog(transaction);

  // Clean up lock file
  await releaseLock(transaction.lockFile);

  logger.success(`Transaction ${transaction.transactionId} committed successfully`);
}

/**
 * Rollback the transaction
 * @param {Object} transaction - Transaction object
 * @param {string} reason - Reason for rollback
 * @returns {Promise<void>}
 */
async function rollbackTransaction(transaction, reason) {
  logger.warn(`Rolling back transaction ${transaction.transactionId}: ${reason}`);

  transaction.status = 'rolled_back';
  transaction.endTime = new Date().toISOString();

  if (!transaction.rollbackPoint) {
    logger.error('No rollback point available');
    throw new Error('Cannot rollback: no rollback point');
  }

  // Reverse executed actions in LIFO order
  const reversedActions = [...transaction.executedActions].reverse();

  for (const action of reversedActions) {
    try {
      await reverseAction(transaction, action);
    } catch (err) {
      logger.error(`Failed to reverse action: ${err.message}`);
      // Continue with other reversals
    }
  }

  // Restore from snapshot if needed
  await restoreFromSnapshot(transaction, transaction.rollbackPoint);

  // Save transaction log
  await saveTransactionLog(transaction);

  // Clean up lock file
  await releaseLock(transaction.lockFile);

  logger.success('Transaction rolled back successfully');
}

/**
 * Reverse a single action
 * @param {Object} transaction - Transaction object
 * @param {Object} action - Action to reverse
 * @returns {Promise<void>}
 */
async function reverseAction(transaction, action) {
  logger.verbose(`Reversing action: ${action.type} ${action.path}`);

  const targetPath = path.join(transaction.targetDirectory, action.path);

  switch (action.type) {
  case 'create':
    // Reverse create = delete
    try {
      await fs.unlink(targetPath);
    } catch (err) {
      // File may already be deleted
    }
    break;

  case 'update':
    // Reverse update = restore previous content
    if (action.previousContent) {
      try {
        await fs.writeFile(targetPath, action.previousContent, 'utf-8');
      } catch (err) {
        logger.error(`Failed to restore ${action.path}: ${err.message}`);
      }
    }
    break;

  case 'delete':
    // Reverse delete = recreate
    if (action.previousContent) {
      try {
        const parentDir = path.dirname(targetPath);
        await fs.mkdir(parentDir, { recursive: true });
        await fs.writeFile(targetPath, action.previousContent, 'utf-8');
      } catch (err) {
        logger.error(`Failed to recreate ${action.path}: ${err.message}`);
      }
    }
    break;

  case 'skip':
  case 'backup':
    // Nothing to reverse
    break;
  }
}

/**
 * Restore from a snapshot
 * @param {Object} transaction - Transaction object
 * @param {Object} snapshot - Snapshot to restore
 * @returns {Promise<void>}
 */
async function restoreFromSnapshot(transaction, snapshot) {
  logger.verbose('Restoring from snapshot');

  // Restore metadata if it existed
  if (snapshot.metadata) {
    const metadataPath = path.join(transaction.targetDirectory, '.claude-buddy', 'install-metadata.json');
    try {
      await fs.mkdir(path.dirname(metadataPath), { recursive: true });
      await fs.writeFile(metadataPath, JSON.stringify(snapshot.metadata, null, 2), 'utf-8');
    } catch (err) {
      logger.error(`Failed to restore metadata: ${err.message}`);
    }
  }
}

/**
 * Get transaction status
 * @param {Object} transaction - Transaction object
 * @returns {Object} Transaction status
 */
function getTransactionStatus(transaction) {
  return {
    transactionId: transaction.transactionId,
    operation: transaction.operation,
    status: transaction.status,
    startTime: transaction.startTime,
    endTime: transaction.endTime,
    plannedActionsCount: transaction.plannedActions.length,
    executedActionsCount: transaction.executedActions.length,
    errorsCount: transaction.errors.length,
    checkpointsCount: transaction.checkpoints.length
  };
}

/**
 * Save transaction log to file
 * @param {Object} transaction - Transaction object
 * @returns {Promise<void>}
 */
async function saveTransactionLog(transaction) {
  const logDir = path.join(transaction.targetDirectory, '.claude-buddy', 'logs');
  const logPath = path.join(logDir, `${transaction.transactionId}.json`);

  try {
    await fs.mkdir(logDir, { recursive: true });

    // Create a lightweight copy (exclude large snapshots)
    const logData = {
      ...transaction,
      checkpoints: transaction.checkpoints.map(cp => ({
        phase: cp.phase,
        timestamp: cp.timestamp,
        fileCount: cp.snapshot.files.length
      })),
      rollbackPoint: transaction.rollbackPoint ? {
        timestamp: transaction.rollbackPoint.timestamp,
        fileCount: transaction.rollbackPoint.files.length
      } : null
    };

    await fs.writeFile(logPath, JSON.stringify(logData, null, 2), 'utf-8');
    logger.debug(`Transaction log saved: ${logPath}`);
  } catch (err) {
    logger.warn(`Failed to save transaction log: ${err.message}`);
  }
}

/**
 * Acquire installation lock
 * @param {string} lockFile - Lock file path
 * @returns {Promise<void>}
 */
async function acquireLock(lockFile) {
  logger.debug(`Acquiring lock: ${lockFile}`);

  // Check for existing lock
  try {
    const lockContent = await fs.readFile(lockFile, 'utf-8');
    const lock = JSON.parse(lockContent);

    // Check if lock is stale
    const lockAge = Date.now() - new Date(lock.timestamp).getTime();
    if (lockAge > LOCK_TIMEOUT) {
      logger.warn('Stale lock detected, cleaning up');
      await fs.unlink(lockFile);
    } else {
      throw new Error(`Installation already in progress (PID: ${lock.pid})`);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  // Create new lock
  const lock = {
    pid: process.pid,
    timestamp: new Date().toISOString()
  };

  const lockDir = path.dirname(lockFile);
  await fs.mkdir(lockDir, { recursive: true });
  await fs.writeFile(lockFile, JSON.stringify(lock, null, 2), 'utf-8');

  logger.debug('Lock acquired');
}

/**
 * Release installation lock
 * @param {string} lockFile - Lock file path
 * @returns {Promise<void>}
 */
async function releaseLock(lockFile) {
  try {
    await fs.unlink(lockFile);
    logger.debug('Lock released');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Failed to release lock: ${err.message}`);
    }
  }
}

/**
 * Detect and recover from interrupted transactions
 * @param {string} targetDirectory - Target directory
 * @returns {Promise<Object|null>} Interrupted transaction or null
 */
async function detectInterruptedTransaction(targetDirectory) {
  const transactionDir = path.join(targetDirectory, '.claude-buddy', 'logs');

  try {
    const files = await fs.readdir(transactionDir);

    // Find incomplete transactions
    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const transactionPath = path.join(transactionDir, file);
      const content = await fs.readFile(transactionPath, 'utf-8');
      const transaction = JSON.parse(content);

      if (transaction.status === 'pending' || transaction.status === 'in_progress') {
        logger.warn(`Found interrupted transaction: ${transaction.transactionId}`);
        return transaction;
      }
    }
  } catch (err) {
    // No transaction directory or can't read it
  }

  return null;
}

module.exports = {
  createTransaction,
  createCheckpoint,
  planAction,
  executeAction,
  commitTransaction,
  rollbackTransaction,
  getTransactionStatus,
  acquireLock,
  releaseLock,
  detectInterruptedTransaction
};
