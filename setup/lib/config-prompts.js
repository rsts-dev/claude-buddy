/**
 * Configuration Prompts for Claude Buddy Installation
 *
 * Interactive prompting system for hooks.json configuration during installation.
 * Supports both fresh installations and updates with intelligent defaults.
 */

const prompts = require('prompts');
const chalk = require('chalk');

/**
 * Default hooks.json configuration
 * These values match the framework defaults in dist/.claude/hooks.json
 */
function getDefaultConfig() {
  return {
    file_protection: {
      enabled: true,
      additional_patterns: [],
      whitelist_patterns: [],
      strict_mode: false
    },
    command_validation: {
      enabled: true,
      block_dangerous: true,
      warn_performance: true,
      suggest_best_practices: true,
      additional_dangerous_patterns: [],
      whitelist_patterns: [],
      strict_mode: false
    },
    auto_formatting: {
      enabled: true,
      extensions: ['.py', '.js', '.ts', '.tsx', '.jsx', '.json', '.css', '.scss', '.md'],
      tools: {},
      exclude_patterns: ['node_modules/', '.git/', 'dist/', 'build/', '__pycache__/', '.venv/'],
      create_backup: false
    },
    git: {
      auto_push: true,
      branch_protection: ['main', 'master'],
      commit_validation: true,
      conventional_commits: true,
      sign_commits: false
    },
    features: {
      auto_commit: true,
      safety_hooks: true,
      auto_formatting: true,
      commit_templates: 'conventional',
      documentation_generation: true,
      code_review: true,
      personas: true
    },
    logging: {
      enabled: true,
      level: 'info',
      file_operations: true,
      command_executions: true,
      hook_activities: true
    },
    notifications: {
      desktop_alerts: false,
      protection_events: true,
      formatting_results: false,
      commit_summaries: true
    }
  };
}

/**
 * Core features configuration questions
 */
async function promptCoreFeatures(existingConfig) {
  const defaults = existingConfig || getDefaultConfig();

  console.log(chalk.bold.cyan('\n━━━ CORE FEATURES ━━━'));
  console.log(chalk.dim('Configure the main features of Claude Buddy\n'));

  const questions = [
    {
      type: 'confirm',
      name: 'safety_hooks',
      message: 'Enable safety hooks? (file protection + command validation)',
      initial: defaults.features?.safety_hooks ?? true
    },
    {
      type: 'confirm',
      name: 'auto_formatting',
      message: 'Enable auto-formatting for code files?',
      initial: defaults.features?.auto_formatting ?? true
    },
    {
      type: 'confirm',
      name: 'auto_commit',
      message: 'Enable auto-commit workflows?',
      initial: defaults.features?.auto_commit ?? true
    },
    {
      type: 'confirm',
      name: 'code_review',
      message: 'Enable code review before commits?',
      initial: defaults.features?.code_review ?? true
    },
    {
      type: 'confirm',
      name: 'documentation_generation',
      message: 'Enable documentation generation?',
      initial: defaults.features?.documentation_generation ?? true
    },
    {
      type: 'confirm',
      name: 'personas',
      message: 'Enable persona system?',
      initial: defaults.features?.personas ?? true
    }
  ];

  return await prompts(questions, { onCancel: () => process.exit(0) });
}

/**
 * Git settings configuration questions
 */
async function promptGitSettings(existingConfig) {
  const defaults = existingConfig || getDefaultConfig();

  console.log(chalk.bold.cyan('\n━━━ GIT SETTINGS ━━━'));
  console.log(chalk.dim('Configure git-related behaviors\n'));

  const questions = [
    {
      type: 'confirm',
      name: 'auto_push',
      message: 'Auto-push after commits?',
      initial: defaults.git?.auto_push ?? true
    },
    {
      type: 'list',
      name: 'branch_protection',
      message: 'Protected branches (comma-separated):',
      initial: defaults.git?.branch_protection?.join(',') || 'main,master',
      separator: ','
    },
    {
      type: 'confirm',
      name: 'conventional_commits',
      message: 'Enforce conventional commits?',
      initial: defaults.git?.conventional_commits ?? true
    },
    {
      type: 'confirm',
      name: 'commit_validation',
      message: 'Enable commit message validation?',
      initial: defaults.git?.commit_validation ?? true
    },
    {
      type: 'confirm',
      name: 'sign_commits',
      message: 'Sign commits with GPG?',
      initial: defaults.git?.sign_commits ?? false
    },
    {
      type: 'select',
      name: 'commit_templates',
      message: 'Commit message template style:',
      choices: [
        { title: 'Conventional (type(scope): message)', value: 'conventional' },
        { title: 'Simple (short message)', value: 'simple' },
        { title: 'Detailed (with body and footer)', value: 'detailed' }
      ],
      initial: defaults.features?.commit_templates === 'conventional' ? 0 : defaults.features?.commit_templates === 'simple' ? 1 : 2
    }
  ];

  return await prompts(questions, { onCancel: () => process.exit(0) });
}

/**
 * Advanced settings configuration questions
 */
async function promptAdvancedSettings(existingConfig) {
  const defaults = existingConfig || getDefaultConfig();

  console.log(chalk.bold.cyan('\n━━━ ADVANCED SETTINGS ━━━'));
  console.log(chalk.dim('Optional advanced configuration\n'));

  const questions = [
    {
      type: 'select',
      name: 'logging_level',
      message: 'Logging level:',
      choices: [
        { title: 'Error (only errors)', value: 'error' },
        { title: 'Warn (errors and warnings)', value: 'warn' },
        { title: 'Info (normal operation)', value: 'info' },
        { title: 'Debug (detailed info)', value: 'debug' }
      ],
      initial: defaults.logging?.level === 'error' ? 0 : defaults.logging?.level === 'warn' ? 1 : defaults.logging?.level === 'info' ? 2 : 3
    },
    {
      type: 'confirm',
      name: 'desktop_alerts',
      message: 'Enable desktop notifications?',
      initial: defaults.notifications?.desktop_alerts ?? false
    },
    {
      type: 'confirm',
      name: 'file_protection_strict',
      message: 'Enable strict mode for file protection?',
      initial: defaults.file_protection?.strict_mode ?? false
    },
    {
      type: 'confirm',
      name: 'formatting_backup',
      message: 'Create backups before auto-formatting?',
      initial: defaults.auto_formatting?.create_backup ?? false
    }
  ];

  return await prompts(questions, { onCancel: () => process.exit(0) });
}

/**
 * Prompt user for complete configuration
 *
 * @param {string} mode - 'install' or 'update'
 * @param {Object|null} existingConfig - Existing hooks.json config (for updates)
 * @returns {Promise<Object>} Complete configuration object
 */
async function promptConfiguration(mode, existingConfig = null) {
  console.log(chalk.bold.green('\n🎯 Claude Buddy Configuration'));
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  if (mode === 'update' && existingConfig) {
    console.log(chalk.dim('Updating existing configuration.'));
    console.log(chalk.dim('Press Enter to keep current values shown in [brackets].\n'));
  } else {
    console.log(chalk.dim('Configuring your Claude Buddy installation.'));
    console.log(chalk.dim('Press Enter to accept defaults shown in [brackets].\n'));
  }

  // Core features
  const coreAnswers = await promptCoreFeatures(existingConfig);

  // Git settings
  const gitAnswers = await promptGitSettings(existingConfig);

  // Ask if user wants advanced settings
  const wantAdvanced = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Configure advanced settings?',
    initial: false
  }, { onCancel: () => process.exit(0) });

  let advancedAnswers = {};
  if (wantAdvanced.value) {
    advancedAnswers = await promptAdvancedSettings(existingConfig);
  }

  // Merge all answers into config structure
  return mergeConfigAnswers(coreAnswers, gitAnswers, advancedAnswers, existingConfig);
}

/**
 * Merge user answers into complete config structure
 *
 * @param {Object} coreAnswers - Core features answers
 * @param {Object} gitAnswers - Git settings answers
 * @param {Object} advancedAnswers - Advanced settings answers
 * @param {Object|null} existingConfig - Existing config to merge with
 * @returns {Object} Complete merged configuration
 */
function mergeConfigAnswers(coreAnswers, gitAnswers, advancedAnswers, existingConfig) {
  const base = existingConfig || getDefaultConfig();

  // Merge core features
  base.features = {
    ...base.features,
    safety_hooks: coreAnswers.safety_hooks,
    auto_formatting: coreAnswers.auto_formatting,
    auto_commit: coreAnswers.auto_commit,
    code_review: coreAnswers.code_review,
    documentation_generation: coreAnswers.documentation_generation,
    personas: coreAnswers.personas,
    commit_templates: gitAnswers.commit_templates || base.features.commit_templates
  };

  // Merge git settings
  base.git = {
    ...base.git,
    auto_push: gitAnswers.auto_push,
    branch_protection: Array.isArray(gitAnswers.branch_protection) ? gitAnswers.branch_protection : gitAnswers.branch_protection.split(',').map(b => b.trim()),
    conventional_commits: gitAnswers.conventional_commits,
    commit_validation: gitAnswers.commit_validation,
    sign_commits: gitAnswers.sign_commits
  };

  // Apply safety hooks setting to individual components
  base.file_protection.enabled = coreAnswers.safety_hooks;
  base.command_validation.enabled = coreAnswers.safety_hooks;

  // Apply auto formatting setting
  base.auto_formatting.enabled = coreAnswers.auto_formatting;

  // Merge advanced settings if provided
  if (advancedAnswers.logging_level) {
    base.logging.level = advancedAnswers.logging_level;
  }
  if (advancedAnswers.desktop_alerts !== undefined) {
    base.notifications.desktop_alerts = advancedAnswers.desktop_alerts;
  }
  if (advancedAnswers.file_protection_strict !== undefined) {
    base.file_protection.strict_mode = advancedAnswers.file_protection_strict;
    base.command_validation.strict_mode = advancedAnswers.file_protection_strict;
  }
  if (advancedAnswers.formatting_backup !== undefined) {
    base.auto_formatting.create_backup = advancedAnswers.formatting_backup;
  }

  return base;
}

/**
 * Validate configuration object
 *
 * @param {Object} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
function validateConfigAnswers(config) {
  // Basic structure validation
  const requiredSections = [
    'file_protection',
    'command_validation',
    'auto_formatting',
    'git',
    'features',
    'logging',
    'notifications'
  ];

  for (const section of requiredSections) {
    if (!config[section]) {
      throw new Error(`Missing required configuration section: ${section}`);
    }
  }

  // Validate git branch protection
  if (!Array.isArray(config.git.branch_protection)) {
    throw new Error('git.branch_protection must be an array');
  }

  // Validate logging level
  const validLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLevels.includes(config.logging.level)) {
    throw new Error(`Invalid logging level: ${config.logging.level}`);
  }

  // Validate commit template
  const validTemplates = ['conventional', 'simple', 'detailed'];
  if (!validTemplates.includes(config.features.commit_templates)) {
    throw new Error(`Invalid commit template: ${config.features.commit_templates}`);
  }

  return true;
}

module.exports = {
  promptConfiguration,
  getDefaultConfig,
  mergeConfigAnswers,
  validateConfigAnswers
};
