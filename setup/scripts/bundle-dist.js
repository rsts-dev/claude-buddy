#!/usr/bin/env node

/**
 * Bundle Distribution Script
 *
 * Copies source files from repository root to setup/dist/ for npm distribution.
 * This ensures the npm package contains all necessary source files for installation.
 */

const fs = require('fs-extra');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SETUP_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(SETUP_DIR, 'dist');

// Files and directories to exclude from bundling
const EXCLUDE_PATTERNS = [
  'settings.local.json',  // User-specific settings
  'install-metadata.json', // Installation-specific metadata
  '.DS_Store',            // macOS system files
  'Thumbs.db'             // Windows system files
];

/**
 * Check if a file should be excluded from bundling
 */
function shouldExclude(filePath) {
  const basename = path.basename(filePath);
  return EXCLUDE_PATTERNS.some(pattern => basename === pattern);
}

/**
 * Copy directory recursively with exclusions
 */
async function copyDirWithExclusions(src, dest) {
  await fs.ensureDir(dest);

  const entries = await fs.readdir(src, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldExclude(srcPath)) {
      console.log(`  ⊗ Skipping: ${path.relative(ROOT_DIR, srcPath)}`);
      continue;
    }

    if (entry.isDirectory()) {
      const count = await copyDirWithExclusions(srcPath, destPath);
      copiedCount += count;
    } else {
      await fs.copy(srcPath, destPath);
      copiedCount++;
      console.log(`  ✓ Copied: ${path.relative(ROOT_DIR, srcPath)}`);
    }
  }

  return copiedCount;
}

/**
 * Main bundling process
 */
async function bundle() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Claude Buddy Distribution Bundle');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Clean and create dist directory
    console.log('📦 Preparing distribution directory...');
    await fs.remove(DIST_DIR);
    await fs.ensureDir(DIST_DIR);
    console.log(`  ✓ Created: ${path.relative(SETUP_DIR, DIST_DIR)}\n`);

    // Bundle .claude directory
    console.log('📁 Bundling .claude directory...');
    const claudeSrc = path.join(ROOT_DIR, '.claude');
    const claudeDest = path.join(DIST_DIR, '.claude');

    if (await fs.pathExists(claudeSrc)) {
      const claudeCount = await copyDirWithExclusions(claudeSrc, claudeDest);
      console.log(`  ✓ Bundled ${claudeCount} files from .claude/\n`);
    } else {
      console.error(`  ✗ Source not found: ${claudeSrc}`);
      process.exit(1);
    }

    // Bundle .claude-buddy directory
    console.log('📁 Bundling .claude-buddy directory...');
    const buddySrc = path.join(ROOT_DIR, '.claude-buddy');
    const buddyDest = path.join(DIST_DIR, '.claude-buddy');

    if (await fs.pathExists(buddySrc)) {
      const buddyCount = await copyDirWithExclusions(buddySrc, buddyDest);
      console.log(`  ✓ Bundled ${buddyCount} files from .claude-buddy/\n`);
    } else {
      console.error(`  ✗ Source not found: ${buddySrc}`);
      process.exit(1);
    }

    // Verify bundle contents
    console.log('🔍 Verifying bundle...');
    const verifyPaths = [
      path.join(claudeDest, 'agents'),
      path.join(claudeDest, 'commands'),
      path.join(claudeDest, 'hooks'),
      path.join(buddyDest, 'personas'),
      path.join(buddyDest, 'templates'),
      path.join(buddyDest, 'context'),
      path.join(buddyDest, 'buddy-config.json')
    ];

    let allValid = true;
    for (const verifyPath of verifyPaths) {
      const exists = await fs.pathExists(verifyPath);
      const relativePath = path.relative(DIST_DIR, verifyPath);
      if (exists) {
        console.log(`  ✓ Found: ${relativePath}`);
      } else {
        console.error(`  ✗ Missing: ${relativePath}`);
        allValid = false;
      }
    }

    if (!allValid) {
      console.error('\n✗ Bundle verification failed!');
      process.exit(1);
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✓ Distribution bundle created successfully');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n✗ Bundle creation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run bundle if executed directly
if (require.main === module) {
  bundle().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { bundle };
