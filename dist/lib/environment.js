/**
 * Environment Detection Module for Claude Buddy Installation Script
 * Detects platform, dependencies, permissions, disk space, and existing installations
 */

const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const { createLogger } = require('./logger');

const logger = createLogger();

/**
 * Detect the complete environment for installation
 * @param {string} targetDirectory - Target installation directory
 * @returns {Promise<Object>} Environment detection result
 */
async function detectEnvironment(targetDirectory) {
  logger.debug('Starting environment detection');

  const platform = detectPlatform();
  const nodeVersion = detectNodeVersion();
  const dependenciesArray = await detectDependencies();
  const permissions = await checkPermissions(targetDirectory);
  const diskSpace = await checkDiskSpace(targetDirectory);
  const existingInstallation = await detectExistingInstallation(targetDirectory);

  // Convert dependencies array to object for easier access
  const dependencies = {};
  for (const dep of dependenciesArray) {
    dependencies[dep.name] = dep;
  }

  const result = {
    platform,
    nodeVersion,
    dependencies,
    detectedDependencies: dependenciesArray,
    permissions,
    diskSpace,
    existingInstallation
  };

  logger.debug(`Environment detection complete: ${JSON.stringify(result, null, 2)}`);

  return result;
}

/**
 * Detect platform information
 * @returns {Object} Platform details
 */
function detectPlatform() {
  const platformType = os.platform();

  let osType;
  if (platformType === 'win32') {
    osType = 'windows';
  } else if (platformType === 'darwin') {
    osType = 'darwin';
  } else if (platformType === 'linux') {
    osType = 'linux';
  } else {
    osType = 'unknown';
  }

  return {
    os: osType,
    arch: os.arch(),
    osVersion: os.release(),
    shell: detectShell(),
    homedir: os.homedir(),
    tempdir: os.tmpdir()
  };
}

/**
 * Detect the default shell
 * @returns {string} Shell name
 */
function detectShell() {
  const platformType = os.platform();

  if (platformType === 'win32') {
    return process.env.COMSPEC ? 'cmd' : 'powershell';
  }

  if (process.env.SHELL) {
    return path.basename(process.env.SHELL);
  }

  return 'bash'; // Default fallback
}

/**
 * Detect Node.js version
 * @returns {string} Node.js version
 */
function detectNodeVersion() {
  return process.version.replace('v', '');
}

/**
 * Detect all required and optional dependencies
 * @returns {Promise<Array>} Array of detected dependencies
 */
async function detectDependencies() {
  const dependencies = [
    {
      name: 'node',
      required: true,
      detector: detectNode
    },
    {
      name: 'uv',
      required: false,
      detector: detectUV
    },
    {
      name: 'python',
      required: false,
      detector: detectPython
    },
    {
      name: 'git',
      required: false,
      detector: detectGit
    }
  ];

  const results = [];

  for (const dep of dependencies) {
    logger.verbose(`Detecting ${dep.name}...`);
    const result = await dep.detector();
    results.push({
      name: dep.name,
      required: dep.required,
      available: result.available,
      version: result.version,
      location: result.location,
      alternativeLocations: result.alternativeLocations || []
    });

    if (result.available) {
      logger.debug(`${dep.name} found: v${result.version} at ${result.location}`);
    } else {
      logger.debug(`${dep.name} not found`);
    }
  }

  return results;
}

/**
 * Detect Node.js installation
 * @returns {Promise<Object>} Node.js detection result
 */
async function detectNode() {
  return {
    available: true,
    version: detectNodeVersion(),
    location: process.execPath,
    alternativeLocations: []
  };
}

/**
 * Detect UV (Python package manager) installation
 * @returns {Promise<Object>} UV detection result
 */
async function detectUV() {
  const platformType = os.platform();

  // Possible UV locations based on platform
  const possiblePaths = platformType === 'win32'
    ? [
      'uv',
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'uv', 'uv.exe'),
      path.join(os.homedir(), '.cargo', 'bin', 'uv.exe')
    ]
    : [
      'uv',
      path.join(os.homedir(), '.local', 'bin', 'uv'),
      path.join(os.homedir(), '.cargo', 'bin', 'uv'),
      '/usr/local/bin/uv',
      '/opt/homebrew/bin/uv'
    ];

  const alternativeLocations = [];

  for (const uvPath of possiblePaths) {
    try {
      const output = execSync(`"${uvPath}" --version`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 5000
      }).trim();

      // Parse version from output (e.g., "uv 0.1.0")
      const versionMatch = output.match(/uv\s+(\d+\.\d+\.\d+)/i);
      const version = versionMatch ? versionMatch[1] : output;

      return {
        available: true,
        version,
        location: uvPath,
        alternativeLocations
      };
    } catch (err) {
      alternativeLocations.push(uvPath);
    }
  }

  return {
    available: false,
    version: null,
    location: null,
    alternativeLocations
  };
}

/**
 * Detect Python installation
 * @returns {Promise<Object>} Python detection result
 */
async function detectPython() {
  const platformType = os.platform();

  // Try python3 first, then python
  const pythonCommands = platformType === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python'];

  const alternativeLocations = [];

  for (const cmd of pythonCommands) {
    try {
      const output = execSync(`${cmd} --version`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 5000
      }).trim();

      // Parse version from output (e.g., "Python 3.11.0")
      const versionMatch = output.match(/Python\s+(\d+\.\d+\.\d+)/i);
      const version = versionMatch ? versionMatch[1] : output;

      // Get the full path
      let location;
      try {
        location = execSync(platformType === 'win32' ? `where ${cmd}` : `which ${cmd}`, {
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 5000
        }).trim().split('\n')[0];
      } catch (err) {
        location = cmd;
      }

      return {
        available: true,
        version,
        location,
        alternativeLocations
      };
    } catch (err) {
      alternativeLocations.push(cmd);
    }
  }

  return {
    available: false,
    version: null,
    location: null,
    alternativeLocations
  };
}

/**
 * Detect Git installation
 * @returns {Promise<Object>} Git detection result
 */
async function detectGit() {
  const platformType = os.platform();

  try {
    const output = execSync('git --version', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 5000
    }).trim();

    // Parse version from output (e.g., "git version 2.30.0")
    const versionMatch = output.match(/git version (\d+\.\d+\.\d+)/i);
    const version = versionMatch ? versionMatch[1] : output;

    // Get the full path
    let location;
    try {
      location = execSync(platformType === 'win32' ? 'where git' : 'which git', {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 5000
      }).trim().split('\n')[0];
    } catch (err) {
      location = 'git';
    }

    return {
      available: true,
      version,
      location,
      alternativeLocations: []
    };
  } catch (err) {
    return {
      available: false,
      version: null,
      location: null,
      alternativeLocations: ['git']
    };
  }
}

/**
 * Check permissions for the target directory
 * @param {string} targetDirectory - Target directory path
 * @returns {Promise<Object>} Permission check results
 */
async function checkPermissions(targetDirectory) {
  logger.verbose(`Checking permissions for ${targetDirectory}`);

  const result = {
    targetDirectory,
    canRead: false,
    canWrite: false,
    canExecute: false,
    isGitRepo: false,
    gitConfigurable: false
  };

  try {
    // Check if directory exists
    // let dirExists = false; // Reserved for future use
    try {
      await fs.access(targetDirectory);
      // dirExists = true; // Reserved for future use
    } catch (err) {
      // Directory doesn't exist, check parent
      const parentDir = path.dirname(targetDirectory);
      try {
        await fs.access(parentDir);
        targetDirectory = parentDir;
        // dirExists = true; // Not used after this point
      } catch (parentErr) {
        logger.warn(`Target directory and parent do not exist: ${targetDirectory}`);
        return result;
      }
    }

    // Test read permission
    try {
      await fs.access(targetDirectory, fs.constants.R_OK);
      result.canRead = true;
    } catch (err) {
      logger.verbose('No read permission');
    }

    // Test write permission
    try {
      await fs.access(targetDirectory, fs.constants.W_OK);
      result.canWrite = true;
    } catch (err) {
      logger.verbose('No write permission');
    }

    // Test execute permission (directory traversal)
    try {
      await fs.access(targetDirectory, fs.constants.X_OK);
      result.canExecute = true;
    } catch (err) {
      logger.verbose('No execute permission');
    }

    // Check if it's a Git repository
    try {
      const gitDir = path.join(targetDirectory, '.git');
      await fs.access(gitDir);
      result.isGitRepo = true;

      // Check if we can write to .git/config
      try {
        const gitConfig = path.join(gitDir, 'config');
        await fs.access(gitConfig, fs.constants.W_OK);
        result.gitConfigurable = true;
      } catch (err) {
        logger.verbose('Git config not writable');
      }
    } catch (err) {
      logger.verbose('Not a git repository');
    }

  } catch (err) {
    logger.error(`Failed to check permissions: ${err.message}`);
  }

  logger.debug(`Permission check result: ${JSON.stringify(result)}`);
  return result;
}

/**
 * Check available disk space
 * @param {string} targetDirectory - Target directory path
 * @returns {Promise<Object>} Disk space information
 */
async function checkDiskSpace(targetDirectory) {
  logger.verbose(`Checking disk space for ${targetDirectory}`);

  const requiredBytes = 50 * 1024 * 1024; // 50 MB minimum

  try {
    // Try to get actual disk space using df command (Unix-like systems)
    const platformType = os.platform();

    if (platformType === 'win32') {
      // Windows: use fsutil or fallback to reasonable assumption
      try {
        const drive = path.parse(targetDirectory).root;
        const output = execSync(`fsutil volume diskfree ${drive}`, {
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 5000
        });

        // Parse output for available bytes
        const match = output.match(/Total # of avail bytes\s+:\s+(\d+)/);
        if (match) {
          const available = parseInt(match[1], 10);
          return {
            available,
            required: requiredBytes,
            sufficient: available >= requiredBytes
          };
        }
      } catch (err) {
        logger.verbose(`Failed to check Windows disk space: ${err.message}`);
      }
    } else {
      // Unix-like: use df command
      try {
        const output = execSync(`df -k "${targetDirectory}"`, {
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 5000
        });

        // Parse df output (second line, fourth column is available KB)
        const lines = output.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].split(/\s+/);
          if (parts.length >= 4) {
            const availableKB = parseInt(parts[3], 10);
            const available = availableKB * 1024; // Convert to bytes

            return {
              available,
              required: requiredBytes,
              sufficient: available >= requiredBytes
            };
          }
        }
      } catch (err) {
        logger.verbose(`Failed to check disk space: ${err.message}`);
      }
    }

  } catch (err) {
    logger.verbose(`Disk space check failed: ${err.message}`);
  }

  // Fallback: assume sufficient space
  return {
    available: requiredBytes * 10, // Assume 500 MB available
    required: requiredBytes,
    sufficient: true
  };
}

/**
 * Detect existing Claude Buddy installation
 * @param {string} targetDirectory - Target directory path
 * @returns {Promise<Object|null>} Existing installation info or null
 */
async function detectExistingInstallation(targetDirectory) {
  logger.verbose('Checking for existing installation');

  const metadataPath = path.join(targetDirectory, '.claude-buddy', 'install-metadata.json');

  try {
    await fs.access(metadataPath);

    // Read metadata file
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    logger.debug(`Found existing installation: v${metadata.version}`);

    // Check installation integrity
    const corruptionIssues = await checkInstallationIntegrity(targetDirectory, metadata);

    return {
      isInstalled: true,
      version: metadata.version || 'unknown',
      installDate: metadata.installDate || null,
      componentsStatus: metadata.installedComponents || {},
      isCorrupted: corruptionIssues.length > 0,
      corruptionDetails: corruptionIssues.length > 0 ? corruptionIssues : undefined
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      // No existing installation
      logger.debug('No existing installation found');
      return null;
    }

    // Metadata file exists but is corrupted
    logger.warn(`Installation metadata is corrupted: ${err.message}`);

    return {
      isInstalled: true,
      version: 'unknown',
      installDate: null,
      componentsStatus: {},
      isCorrupted: true,
      corruptionDetails: [`Metadata file is corrupted: ${err.message}`]
    };
  }
}

/**
 * Check installation integrity
 * @param {string} targetDirectory - Target directory path
 * @param {Object} metadata - Installation metadata
 * @returns {Promise<Array>} Array of corruption issues found
 */
async function checkInstallationIntegrity(targetDirectory, metadata) {
  const issues = [];

  // Expected core directories
  const expectedDirs = [
    '.claude-buddy',
    '.claude',
    'directive'
  ];

  for (const dir of expectedDirs) {
    const dirPath = path.join(targetDirectory, dir);
    try {
      await fs.access(dirPath);
    } catch (err) {
      issues.push(`Missing directory: ${dir}`);
    }
  }

  // Expected core files based on components
  if (metadata.installedComponents) {
    const components = metadata.installedComponents;

    if (components.configs && components.configs.enabled) {
      const configPath = path.join(targetDirectory, '.claude-buddy', 'buddy-config.json');
      try {
        await fs.access(configPath);
      } catch (err) {
        issues.push('Missing buddy-config.json');
      }
    }

    if (components.foundation && components.foundation.enabled) {
      const foundationPath = path.join(targetDirectory, 'directive', 'foundation.md');
      try {
        await fs.access(foundationPath);
      } catch (err) {
        issues.push('Missing foundation.md');
      }
    }
  }

  return issues;
}

/**
 * Compare versions (semver-compatible)
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Validate environment for installation
 * @param {Object} environment - Environment detection result
 * @returns {Object} Validation result with issues array
 */
function validateEnvironment(environment) {
  const issues = [];
  const warnings = [];

  // Check Node.js version (>= 18.0.0)
  const nodeVersion = environment.nodeVersion;
  const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

  if (majorVersion < 18) {
    issues.push({
      severity: 'error',
      message: `Node.js version ${nodeVersion} is not supported. Required: >= 18.0.0`,
      suggestion: 'Please upgrade Node.js to version 18 or higher'
    });
  }

  // Check write permissions
  if (!environment.permissions.canWrite) {
    issues.push({
      severity: 'error',
      message: 'No write permission to target directory',
      suggestion: 'Run with appropriate permissions or choose a different directory'
    });
  }

  // Check disk space
  if (!environment.diskSpace.sufficient) {
    issues.push({
      severity: 'error',
      message: `Insufficient disk space. Required: ${environment.diskSpace.required} bytes, Available: ${environment.diskSpace.available} bytes`,
      suggestion: 'Free up disk space and try again'
    });
  }

  // Check platform support
  if (environment.platform.os === 'unknown') {
    warnings.push({
      severity: 'warning',
      message: `Unsupported platform: ${os.platform()}`,
      suggestion: 'Installation may not work correctly on this platform'
    });
  }

  // Warn about missing optional dependencies
  const uvDep = environment.detectedDependencies.find(d => d.name === 'uv');
  if (uvDep && !uvDep.available) {
    warnings.push({
      severity: 'warning',
      message: 'UV (Python package manager) not found',
      suggestion: 'Hooks will be disabled. Install UV to enable hook functionality: curl -LsSf https://astral.sh/uv/install.sh | sh'
    });
  }

  const pythonDep = environment.detectedDependencies.find(d => d.name === 'python');
  if (pythonDep && !pythonDep.available) {
    warnings.push({
      severity: 'warning',
      message: 'Python not found',
      suggestion: 'Hooks will be disabled. Install Python 3.8+ to enable hook functionality'
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

module.exports = {
  detectEnvironment,
  detectPlatform,
  detectNodeVersion,
  detectDependencies,
  detectNode,
  detectUV,
  detectPython,
  detectGit,
  checkPermissions,
  checkDiskSpace,
  detectExistingInstallation,
  checkInstallationIntegrity,
  compareVersions,
  validateEnvironment
};
