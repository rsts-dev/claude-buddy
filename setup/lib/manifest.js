/**
 * Manifest Module for Claude Buddy Installation Script
 * Defines all installable components, their dependencies, and platform-specific configurations
 */

const path = require('path');
const { createLogger } = require('./logger');

const logger = createLogger();

/**
 * Hardcoded installation manifest definition
 * This defines all components that can be installed
 */
const INSTALLATION_MANIFEST = {
  version: '2.0.0',
  components: [
    {
      name: 'hooks',
      displayName: 'Python Safety Hooks',
      type: 'optional',
      source: '.claude/hooks/',
      target: '.claude/hooks/',
      dependencies: ['uv', 'python'],
      filePatterns: ['*.py', '*.json'],
      description: 'Pre-execution validation hooks for safe AI automation',
      affectedFeatures: [
        'Command validation',
        'File protection',
        'Git operation safety'
      ]
    },
    {
      name: 'templates',
      displayName: 'Document Templates',
      type: 'required',
      source: '.claude-buddy/templates/',
      target: '.claude-buddy/templates/',
      dependencies: [],
      filePatterns: ['**/*.md'],
      description: 'Foundation-specific document generation templates',
      affectedFeatures: [
        'Specification generation',
        'Implementation planning',
        'Task breakdown',
        'Documentation generation'
      ]
    },
    {
      name: 'personas',
      displayName: 'AI Personas',
      type: 'required',
      source: '.claude-buddy/personas/',
      target: '.claude-buddy/personas/',
      dependencies: [],
      filePatterns: ['*.md'],
      description: 'Specialized AI expert personas for domain-specific assistance',
      affectedFeatures: [
        'Auto-activation based on context',
        'Manual persona selection',
        'Session memory and context retention'
      ]
    },
    {
      name: 'context',
      displayName: 'Framework Context Files',
      type: 'required',
      source: '.claude-buddy/context/',
      target: '.claude-buddy/context/',
      dependencies: [],
      filePatterns: ['**/*.md'],
      description: 'Framework-specific context and documentation',
      affectedFeatures: [
        'Framework-specific guidance',
        'Technology documentation',
        'Best practices and patterns'
      ]
    },
    {
      name: 'configs',
      displayName: 'Framework Configuration',
      type: 'required',
      source: '.claude-buddy/',
      target: '.claude-buddy/',
      dependencies: [],
      filePatterns: ['buddy-config.json'],
      description: 'Core framework configuration and settings',
      affectedFeatures: [
        'Persona auto-activation settings',
        'Hook configuration',
        'Template selection'
      ]
    },
    {
      name: 'commands',
      displayName: 'Slash Commands',
      type: 'required',
      source: '.claude/commands/',
      target: '.claude/commands/',
      dependencies: [],
      filePatterns: ['**/*.md'],
      description: 'Slash command definitions for /buddy:* commands',
      affectedFeatures: [
        '/buddy:commit',
        '/buddy:spec',
        '/buddy:plan',
        '/buddy:tasks',
        '/buddy:docs',
        '/buddy:foundation',
        '/buddy:persona'
      ]
    },
    {
      name: 'agents',
      displayName: 'Specialized Agents',
      type: 'required',
      source: '.claude/agents/',
      target: '.claude/agents/',
      dependencies: [],
      filePatterns: ['**/*.md'],
      description: 'Agent protocols for complex workflows',
      affectedFeatures: [
        'Feature specification agent',
        'Implementation planning agent',
        'Task generation agent',
        'Documentation agent'
      ]
    }
  ],
  directories: [
    {
      path: '.claude-buddy',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude-buddy/personas',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude-buddy/templates',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude-buddy/context',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude/hooks',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude/commands',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude/commands/buddy',
      permissions: '755',
      createIfMissing: true
    },
    {
      path: '.claude/agents',
      permissions: '755',
      createIfMissing: true
    }
  ],
  platformSpecific: {
    windows: {
      componentOverrides: {
        hooks: {
          filePatterns: ['*.py', '*.json', '*.bat']
        }
      },
      directoryOverrides: {},
      environmentVariables: {
        CLAUDE_BUDDY_SHELL: 'powershell'
      }
    },
    darwin: {
      componentOverrides: {},
      directoryOverrides: {},
      environmentVariables: {
        CLAUDE_BUDDY_SHELL: 'bash'
      }
    },
    linux: {
      componentOverrides: {},
      directoryOverrides: {},
      environmentVariables: {
        CLAUDE_BUDDY_SHELL: 'bash'
      }
    }
  }
};

/**
 * Get the installation manifest
 * @returns {Object} Installation manifest
 */
function getManifest() {
  return JSON.parse(JSON.stringify(INSTALLATION_MANIFEST)); // Deep clone
}

/**
 * Get the manifest with platform-specific overrides applied
 * @param {string} platform - Platform name ('windows', 'darwin', 'linux')
 * @returns {Object} Platform-specific manifest
 */
function getManifestForPlatform(platform) {
  logger.debug(`Getting manifest for platform: ${platform}`);

  const manifest = getManifest();

  // Apply platform-specific overrides
  if (manifest.platformSpecific && manifest.platformSpecific[platform]) {
    const overrides = manifest.platformSpecific[platform];

    // Apply component overrides
    if (overrides.componentOverrides) {
      for (const [componentName, componentOverride] of Object.entries(overrides.componentOverrides)) {
        const component = manifest.components.find(c => c.name === componentName);
        if (component) {
          Object.assign(component, componentOverride);
          logger.verbose(`Applied platform override for component: ${componentName}`);
        }
      }
    }

    // Apply directory overrides
    if (overrides.directoryOverrides) {
      for (const [dirPath, dirOverride] of Object.entries(overrides.directoryOverrides)) {
        const directory = manifest.directories.find(d => d.path === dirPath);
        if (directory) {
          Object.assign(directory, dirOverride);
          logger.verbose(`Applied platform override for directory: ${dirPath}`);
        }
      }
    }

    // Store environment variables for later use
    manifest.environmentVariables = overrides.environmentVariables || {};
  }

  return manifest;
}

/**
 * Validate the manifest structure
 * @param {Object} manifest - Manifest to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
function validateManifest(manifest) {
  const errors = [];

  // Validate version
  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Manifest version is missing or invalid');
  } else {
    // Validate semver format
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(manifest.version)) {
      errors.push(`Invalid semver version: ${manifest.version}`);
    }
  }

  // Validate components array
  if (!Array.isArray(manifest.components)) {
    errors.push('Manifest components must be an array');
  } else {
    for (let i = 0; i < manifest.components.length; i++) {
      const component = manifest.components[i];
      const prefix = `Component ${i} (${component.name || 'unnamed'})`;

      // Required fields
      if (!component.name) {
        errors.push(`${prefix}: name is required`);
      }
      if (!component.type || !['required', 'optional'].includes(component.type)) {
        errors.push(`${prefix}: type must be 'required' or 'optional'`);
      }
      if (!component.source) {
        errors.push(`${prefix}: source path is required`);
      }
      if (!component.target) {
        errors.push(`${prefix}: target path is required`);
      }
      if (!Array.isArray(component.dependencies)) {
        errors.push(`${prefix}: dependencies must be an array`);
      }
      if (!Array.isArray(component.filePatterns)) {
        errors.push(`${prefix}: filePatterns must be an array`);
      }

      // Validate dependencies reference known dependency names
      const knownDependencies = ['node', 'uv', 'python', 'git'];
      for (const dep of component.dependencies || []) {
        if (!knownDependencies.includes(dep)) {
          errors.push(`${prefix}: unknown dependency '${dep}'`);
        }
      }

      // Validate paths are not absolute
      if (component.source && path.isAbsolute(component.source)) {
        errors.push(`${prefix}: source path must be relative, not absolute`);
      }
      if (component.target && path.isAbsolute(component.target)) {
        errors.push(`${prefix}: target path must be relative, not absolute`);
      }
    }
  }

  // Validate directories array
  if (!Array.isArray(manifest.directories)) {
    errors.push('Manifest directories must be an array');
  } else {
    for (let i = 0; i < manifest.directories.length; i++) {
      const directory = manifest.directories[i];
      const prefix = `Directory ${i} (${directory.path || 'unnamed'})`;

      if (!directory.path) {
        errors.push(`${prefix}: path is required`);
      }
      if (directory.path && path.isAbsolute(directory.path)) {
        errors.push(`${prefix}: path must be relative, not absolute`);
      }
      if (typeof directory.createIfMissing !== 'boolean') {
        errors.push(`${prefix}: createIfMissing must be a boolean`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Filter components by available dependencies
 * @param {Object} manifest - Installation manifest
 * @param {Array} availableDependencies - Array of dependency detection results
 * @returns {Object} Filtered manifest with only installable components
 */
function filterComponentsByDependencies(manifest, availableDependencies) {
  logger.debug('Filtering components by available dependencies');

  const filteredManifest = JSON.parse(JSON.stringify(manifest)); // Deep clone
  const dependencyMap = {};

  // Build dependency availability map
  for (const dep of availableDependencies) {
    dependencyMap[dep.name] = dep.available;
  }

  logger.verbose(`Available dependencies: ${JSON.stringify(dependencyMap)}`);

  // Filter components
  filteredManifest.enabledComponents = [];
  filteredManifest.disabledComponents = [];

  for (const component of manifest.components) {
    // Check if all dependencies are available
    const allDepsAvailable = component.dependencies.every(dep => dependencyMap[dep] === true);

    if (component.type === 'required') {
      // Required components are always enabled, but we track dependency issues
      if (!allDepsAvailable) {
        component.dependencyIssues = component.dependencies.filter(dep => !dependencyMap[dep]);
        logger.warn(`Required component '${component.name}' has missing dependencies: ${component.dependencyIssues.join(', ')}`);
      }
      filteredManifest.enabledComponents.push(component);
    } else if (component.type === 'optional') {
      // Optional components are only enabled if dependencies are available
      if (allDepsAvailable) {
        filteredManifest.enabledComponents.push(component);
        logger.debug(`Optional component '${component.name}' enabled`);
      } else {
        const missingDeps = component.dependencies.filter(dep => !dependencyMap[dep]);
        component.disabledReason = `Missing dependencies: ${missingDeps.join(', ')}`;
        filteredManifest.disabledComponents.push(component);
        logger.info(`Optional component '${component.name}' disabled: ${component.disabledReason}`);
      }
    }
  }

  logger.debug(`Enabled components: ${filteredManifest.enabledComponents.length}, Disabled: ${filteredManifest.disabledComponents.length}`);

  return filteredManifest;
}

/**
 * Get component by name
 * @param {Object} manifest - Installation manifest
 * @param {string} componentName - Component name to find
 * @returns {Object|null} Component or null if not found
 */
function getComponent(manifest, componentName) {
  return manifest.components.find(c => c.name === componentName) || null;
}

/**
 * Get all required components
 * @param {Object} manifest - Installation manifest
 * @returns {Array} Array of required components
 */
function getRequiredComponents(manifest) {
  return manifest.components.filter(c => c.type === 'required');
}

/**
 * Get all optional components
 * @param {Object} manifest - Installation manifest
 * @returns {Array} Array of optional components
 */
function getOptionalComponents(manifest) {
  return manifest.components.filter(c => c.type === 'optional');
}

/**
 * Get directory specification by path
 * @param {Object} manifest - Installation manifest
 * @param {string} dirPath - Directory path to find
 * @returns {Object|null} Directory spec or null if not found
 */
function getDirectory(manifest, dirPath) {
  return manifest.directories.find(d => d.path === dirPath) || null;
}

/**
 * Get all directories that should be created
 * @param {Object} manifest - Installation manifest
 * @returns {Array} Array of directory specifications
 */
function getDirectoriesToCreate(manifest) {
  return manifest.directories.filter(d => d.createIfMissing);
}

/**
 * Get installation summary for display
 * @param {Object} manifest - Installation manifest (filtered)
 * @returns {Object} Summary information
 */
function getInstallationSummary(manifest) {
  const summary = {
    totalComponents: manifest.components.length,
    enabledComponents: manifest.enabledComponents ? manifest.enabledComponents.length : 0,
    disabledComponents: manifest.disabledComponents ? manifest.disabledComponents.length : 0,
    totalDirectories: manifest.directories.length,
    requiredDirectories: manifest.directories.filter(d => d.createIfMissing).length
  };

  return summary;
}

/**
 * Resolve source path (relative to package)
 * @param {string} sourcePath - Source path from manifest
 * @returns {string} Absolute source path
 */
function resolveSourcePath(sourcePath) {
  // Source paths are relative to the package root
  // The package root is two levels up from this file (setup/lib/manifest.js -> root)
  const packageRoot = path.resolve(__dirname, '..', '..');
  return path.join(packageRoot, sourcePath);
}

/**
 * Resolve target path (relative to installation directory)
 * @param {string} targetPath - Target path from manifest
 * @param {string} installDirectory - Installation directory
 * @returns {string} Absolute target path
 */
function resolveTargetPath(targetPath, installDirectory) {
  return path.join(installDirectory, targetPath);
}

module.exports = {
  getManifest,
  getManifestForPlatform,
  validateManifest,
  filterComponentsByDependencies,
  getComponent,
  getRequiredComponents,
  getOptionalComponents,
  getDirectory,
  getDirectoriesToCreate,
  getInstallationSummary,
  resolveSourcePath,
  resolveTargetPath
};
