# Transaction API Contract

**Module**: `setup/lib/transaction.js`
**Type**: Internal module
**Related**: [data-model.md](../data-model.md), [research.md](../research.md)

---

## Overview

The Transaction module provides checkpoint-based transactional operations with automatic rollback capability. It ensures that installation/update/uninstall operations are atomic and can be safely reverted on failure.

---

## Module Exports

```javascript
module.exports = {
  createTransaction,
  executeAction,
  createCheckpoint,
  commitTransaction,
  rollbackTransaction,
  getTransactionStatus
};
```

---

## API Functions

### 1. createTransaction()

**Description**: Creates a new installation transaction with initial checkpoint.

**Signature**:
```javascript
async function createTransaction(
  operation: TransactionOperation,
  targetDirectory: string,
  version: string,
  fromVersion?: string
): Promise<InstallationTransaction>
```

**Parameters**:
- `operation`: Type of operation ("install", "update", "uninstall", "repair")
- `targetDirectory`: Base directory for transaction
- `version`: Target version
- `fromVersion`: Source version (for updates)

**Returns**: `InstallationTransaction` object (see data-model.md)

**Example**:
```javascript
const { createTransaction } = require('./lib/transaction');

const transaction = await createTransaction(
  'install',
  '/path/to/project',
  '1.0.0'
);

console.log(`Transaction created: ${transaction.transactionId}`);
console.log(`Status: ${transaction.status}`);
```

**Transaction Initialization**:
1. Generate unique transaction ID (UUID v4)
2. Create pre-operation checkpoint (snapshot current state)
3. Initialize planned actions array (empty)
4. Set status to "pending"
5. Save transaction to `.claude-buddy/install-transaction.json`

**Initial Checkpoint**:
```javascript
const initialCheckpoint = {
  phase: 'pre-install',
  snapshot: {
    files: await captureFileState(targetDirectory),
    metadata: await loadMetadata(targetDirectory) || {},
    timestamp: new Date().toISOString()
  },
  timestamp: new Date().toISOString()
};
```

**Error Conditions**:
- Throws `TransactionError` if active transaction already exists
- Throws `TransactionError` if target directory is inaccessible

---

### 2. executeAction()

**Description**: Executes a planned action within the transaction context.

**Signature**:
```javascript
async function executeAction(
  transaction: InstallationTransaction,
  action: PlannedAction
): Promise<ExecutedAction>
```

**Parameters**:
- `transaction`: Active transaction
- `action`: Action to execute

**Returns**: `ExecutedAction` object (see data-model.md)

**Example**:
```javascript
const { executeAction } = require('./lib/transaction');

const action = {
  actionId: 'uuid',
  type: 'create',
  path: '.claude-buddy/buddy-config.json',
  reason: 'Install framework configuration',
  status: 'pending',
  sourceContent: configJson
};

const executed = await executeAction(transaction, action);

if (executed.result.success) {
  console.log(`✓ ${executed.path} created`);
} else {
  console.error(`✗ ${executed.path} failed: ${executed.result.message}`);
}
```

**Action Execution by Type**:

**Create Action**:
```javascript
case 'create':
  const parentDir = path.dirname(action.path);
  await fs.ensureDir(parentDir);
  await fs.writeFile(action.path, action.sourceContent);
  if (action.targetPermissions) {
    await fs.chmod(action.path, action.targetPermissions);
  }
  break;
```

**Update Action**:
```javascript
case 'update':
  const previousContent = await fs.readFile(action.path, 'utf8');
  await fs.writeFile(action.path, action.sourceContent);
  executedAction.previousContent = previousContent;
  break;
```

**Delete Action**:
```javascript
case 'delete':
  const backupContent = await fs.readFile(action.path, 'utf8');
  await fs.unlink(action.path);
  executedAction.previousContent = backupContent;
  break;
```

**Skip Action**:
```javascript
case 'skip':
  executedAction.result = {
    success: true,
    message: action.reason
  };
  break;
```

**Backup Action**:
```javascript
case 'backup':
  const content = await fs.readFile(action.path, 'utf8');
  const backupPath = `${action.path}.backup-${transaction.transactionId}`;
  await fs.writeFile(backupPath, content);
  executedAction.previousContent = content;
  break;
```

**Error Handling**:
- Catches all errors during execution
- Records error in action result
- Updates action status to "failed"
- Preserves transaction for rollback
- Does NOT throw errors (returns failed action)

**Action Logging**:
```javascript
executedAction = {
  ...action,
  status: 'completed',
  executionTime: new Date().toISOString(),
  duration: endTime - startTime,
  result: { success: true, message: 'Action completed' }
};

transaction.executedActions.push(executedAction);
await saveTransaction(transaction);
```

---

### 3. createCheckpoint()

**Description**: Creates a checkpoint at the current transaction phase.

**Signature**:
```javascript
async function createCheckpoint(
  transaction: InstallationTransaction,
  phase: CheckpointPhase
): Promise<Checkpoint>
```

**Parameters**:
- `transaction`: Active transaction
- `phase`: Checkpoint phase identifier

**Returns**: `Checkpoint` object

**Example**:
```javascript
const { createCheckpoint } = require('./lib/transaction');

const checkpoint = await createCheckpoint(transaction, 'directories-created');
console.log(`Checkpoint created: ${checkpoint.phase} at ${checkpoint.timestamp}`);
```

**Checkpoint Phases**:
- `pre-install`: Before any modifications
- `dependencies-checked`: After dependency validation
- `directories-created`: After directory structure creation
- `files-copied`: After component installation
- `post-install`: After configuration and verification

**Checkpoint Creation**:
```javascript
const checkpoint = {
  phase: phase,
  snapshot: {
    files: await captureFileState(targetDirectory),
    metadata: await loadMetadata(targetDirectory),
    timestamp: new Date().toISOString()
  },
  timestamp: new Date().toISOString()
};

transaction.checkpoints.push(checkpoint);
await saveTransaction(transaction);
```

**Snapshot Optimization**:
- Capture only modified files since last checkpoint
- Use file hashes for change detection
- Limit snapshot size (max 100 files)
- Reference large files by path only

**Error Conditions**:
- Never throws errors
- Logs warnings if snapshot fails
- Continues without checkpoint if critical

---

### 4. commitTransaction()

**Description**: Commits the transaction and marks it as successfully completed.

**Signature**:
```javascript
async function commitTransaction(
  transaction: InstallationTransaction
): Promise<void>
```

**Parameters**:
- `transaction`: Transaction to commit

**Returns**: Promise<void>

**Example**:
```javascript
const { commitTransaction } = require('./lib/transaction');

await commitTransaction(transaction);
console.log('Transaction committed successfully');
```

**Commit Process**:
1. Verify all planned actions executed
2. Set transaction status to "completed"
3. Set end time
4. Update metadata with transaction record
5. Clean up transaction log file
6. Remove temporary backups

**Post-Commit Cleanup**:
```javascript
// Delete transaction log
await fs.unlink('.claude-buddy/install-transaction.json');

// Archive transaction record in metadata
metadata.transactionHistory.push({
  transactionId: transaction.transactionId,
  operation: transaction.operation,
  version: transaction.toVersion,
  timestamp: transaction.endTime,
  status: 'completed'
});

// Clean up old backups
await cleanupOldBackups(targetDirectory);
```

**Error Conditions**:
- Throws `TransactionError` if commit fails
- Leaves transaction intact for manual resolution

---

### 5. rollbackTransaction()

**Description**: Rolls back the transaction to the pre-installation state.

**Signature**:
```javascript
async function rollbackTransaction(
  transaction: InstallationTransaction,
  reason?: string
): Promise<RollbackResult>
```

**Parameters**:
- `transaction`: Transaction to rollback
- `reason`: Optional reason for rollback

**Returns**:
```typescript
interface RollbackResult {
  success: boolean;
  restoredFiles: string[];
  errors: RollbackError[];
  duration: number;
}

interface RollbackError {
  path: string;
  error: string;
  critical: boolean;
}
```

**Example**:
```javascript
const { rollbackTransaction } = require('./lib/transaction');

try {
  const result = await rollbackTransaction(
    transaction,
    'Installation failed: permission denied'
  );

  if (result.success) {
    console.log(`✓ Rollback successful, restored ${result.restoredFiles.length} files`);
  } else {
    console.error('Rollback had errors:');
    result.errors.forEach(err => console.error(`  ${err.path}: ${err.error}`));
  }
} catch (err) {
  console.error('Critical rollback failure:', err.message);
}
```

**Rollback Process**:
1. Load rollback point snapshot
2. Reverse executed actions in LIFO order (last-in-first-out)
3. Restore files from snapshot
4. Remove created directories
5. Restore metadata
6. Mark transaction as "rolled_back"

**Action Reversal by Type**:

**Reverse Create**:
```javascript
case 'create':
  if (await fs.pathExists(action.path)) {
    await fs.unlink(action.path);
    restoredFiles.push(action.path);
  }
  break;
```

**Reverse Update**:
```javascript
case 'update':
  if (executedAction.previousContent) {
    await fs.writeFile(action.path, executedAction.previousContent);
    restoredFiles.push(action.path);
  }
  break;
```

**Reverse Delete**:
```javascript
case 'delete':
  if (executedAction.previousContent) {
    await fs.writeFile(action.path, executedAction.previousContent);
    restoredFiles.push(action.path);
  }
  break;
```

**Error Handling**:
- Continues rollback even if some reversals fail
- Logs all errors for manual review
- Distinguishes critical vs non-critical errors
- Returns partial success if some files restored

**Rollback Verification**:
```javascript
async function verifyRollback(snapshot, targetDirectory) {
  const issues = [];

  for (const file of snapshot.files) {
    const exists = await fs.pathExists(file.path);

    if (file.exists && !exists) {
      issues.push({ path: file.path, issue: 'Expected file missing' });
    } else if (!file.exists && exists) {
      issues.push({ path: file.path, issue: 'Unexpected file present' });
    }
  }

  return issues;
}
```

---

### 6. getTransactionStatus()

**Description**: Returns the current status of a transaction.

**Signature**:
```javascript
async function getTransactionStatus(
  targetDirectory: string
): Promise<TransactionStatus | null>
```

**Parameters**:
- `targetDirectory`: Directory to check for active transaction

**Returns**: `TransactionStatus` object or `null` if no active transaction

**Example**:
```javascript
const { getTransactionStatus } = require('./lib/transaction');

const status = await getTransactionStatus('/path/to/project');

if (status) {
  console.log(`Active transaction: ${status.transactionId}`);
  console.log(`Operation: ${status.operation}`);
  console.log(`Status: ${status.status}`);
  console.log(`Progress: ${status.completedActions}/${status.totalActions}`);
} else {
  console.log('No active transaction');
}
```

**Status Information**:
```typescript
interface TransactionStatus {
  transactionId: string;
  operation: TransactionOperation;
  status: TransactionStatus;
  startTime: string;
  completedActions: number;
  totalActions: number;
  currentPhase: CheckpointPhase;
  lastCheckpoint: string;        // Timestamp
}
```

**Use Cases**:
- Check for interrupted transactions on startup
- Display transaction progress
- Detect transaction conflicts
- Resume or cleanup incomplete transactions

---

## Utility Functions

### saveTransaction()
```javascript
async function saveTransaction(transaction: InstallationTransaction): Promise<void>
```
Persists transaction to disk.

### loadTransaction()
```javascript
async function loadTransaction(targetDirectory: string): Promise<InstallationTransaction | null>
```
Loads active transaction from disk.

### captureFileState()
```javascript
async function captureFileState(directory: string): Promise<FileSnapshot[]>
```
Captures current file system state.

### planAction()
```javascript
function planAction(
  type: ActionType,
  path: string,
  options: ActionOptions
): PlannedAction
```
Creates a planned action object.

---

## Error Classes

### TransactionError
```javascript
class TransactionError extends Error {
  constructor(message, transactionId, code, details)
}
```

**Error Codes**:
- `TRANSACTION_ACTIVE`: Active transaction already exists
- `TRANSACTION_NOT_FOUND`: No transaction found
- `CHECKPOINT_FAILED`: Checkpoint creation failed
- `ROLLBACK_FAILED`: Rollback encountered errors
- `COMMIT_FAILED`: Commit failed

---

## Transaction Lifecycle

```
1. Create Transaction
   ↓
2. Create Pre-Install Checkpoint
   ↓
3. Execute Actions (with checkpoints)
   ↓
4. Success? → Commit Transaction
   ↓ Failure? → Rollback Transaction
   ↓
5. Clean Up Transaction Log
```

**Transaction States**:
- **pending**: Created, not yet started
- **in_progress**: Actively executing actions
- **completed**: Successfully completed and committed
- **failed**: Encountered error, awaiting rollback
- **rolled_back**: Rolled back to initial state

---

## Transaction Recovery

### Detecting Interrupted Transactions

```javascript
async function detectInterruptedTransaction(targetDirectory) {
  const status = await getTransactionStatus(targetDirectory);

  if (status && status.status === 'in_progress') {
    const age = Date.now() - new Date(status.startTime).getTime();

    if (age > 300000) {  // 5 minutes
      console.warn('Detected stale transaction');
      return { interrupted: true, transaction: status };
    }
  }

  return { interrupted: false };
}
```

### Resume or Rollback

```javascript
async function handleInterruptedTransaction(transaction) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Interrupted transaction detected. What would you like to do?',
      choices: [
        { name: 'Rollback and retry', value: 'rollback' },
        { name: 'Resume from last checkpoint', value: 'resume' },
        { name: 'Abort', value: 'abort' }
      ]
    }
  ]);

  if (action === 'rollback') {
    await rollbackTransaction(transaction);
    return 'retry';
  } else if (action === 'resume') {
    return 'resume';
  } else {
    return 'abort';
  }
}
```

---

## Performance Optimizations

1. **Incremental Snapshots**: Only capture changed files
2. **Async Operations**: All I/O operations are asynchronous
3. **Batch Writes**: Group transaction log updates
4. **Memory Limits**: Cap snapshot size at 100 files
5. **Lazy Loading**: Load snapshot content only when needed

---

## Lock File Mechanism

To prevent concurrent transactions:

**Lock File**: `.claude-buddy/install.lock`

```javascript
async function acquireLock(targetDirectory) {
  const lockFile = path.join(targetDirectory, '.claude-buddy', 'install.lock');

  if (await fs.pathExists(lockFile)) {
    const lockData = await fs.readJson(lockFile);
    const age = Date.now() - new Date(lockData.timestamp).getTime();

    if (age < 30000) {  // 30 seconds
      throw new Error('Another installation is in progress');
    } else {
      // Stale lock, remove it
      await fs.unlink(lockFile);
    }
  }

  await fs.writeJson(lockFile, {
    pid: process.pid,
    timestamp: new Date().toISOString()
  });
}

async function releaseLock(targetDirectory) {
  const lockFile = path.join(targetDirectory, '.claude-buddy', 'install.lock');
  await fs.unlink(lockFile).catch(() => {});
}
```

---

*This transaction API provides robust, atomic operations with automatic rollback for safe installation.*
