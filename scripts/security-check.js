#!/usr/bin/env node

/**
 * Local Security Cleanup Script
 * Run: npm run security:check (detect malware)
 * Run: npm run security:fix (remove + fix)
 *
 * This script:
 * 1. Scans for malicious files
 * 2. Detects obfuscated code
 * 3. Removes suspicious files OR alerts for manual fix
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MODE = process.argv[2] || 'check'; // 'check' or 'fix'
const PROJECT_ROOT = process.cwd();
const LOG_FILE = path.join(PROJECT_ROOT, 'security_scan.log');
const BACKUP_DIR = path.join(
  PROJECT_ROOT,
  `.security_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
);

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Logger
const log = {
  info: (msg) => {
    const line = `[INFO] ${msg}`;
    console.log(`${colors.blue}${line}${colors.reset}`);
    fs.appendFileSync(LOG_FILE, `${line}\n`);
  },
  success: (msg) => {
    const line = `[✓] ${msg}`;
    console.log(`${colors.green}${line}${colors.reset}`);
    fs.appendFileSync(LOG_FILE, `${line}\n`);
  },
  warning: (msg) => {
    const line = `[⚠] ${msg}`;
    console.log(`${colors.yellow}${line}${colors.reset}`);
    fs.appendFileSync(LOG_FILE, `${line}\n`);
  },
  error: (msg) => {
    const line = `[✗] ${msg}`;
    console.log(`${colors.red}${line}${colors.reset}`);
    fs.appendFileSync(LOG_FILE, `${line}\n`);
  },
};

const print_header = (title) => {
  const header = `\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`;
  console.log(`${colors.blue}${header}${colors.reset}`);
  fs.appendFileSync(LOG_FILE, `${header}\n`);
};

// Initialize log
fs.writeFileSync(
  LOG_FILE,
  `Security Scan Report - ${new Date().toISOString()}\nMode: ${MODE}\n\n`,
);

let hasIssues = false;

/**
 * Scan for suspicious filenames
 */
function scanSuspiciousFiles() {
  print_header('🔎 SCANNING FOR SUSPICIOUS FILENAMES');

  const patterns = [
    'temp_auto_push',
    'config.bat',
    'malware',
    'virus',
    'backdoor',
    'trojan',
    'exploit',
    'payload',
    'shell',
    'cryptominer',
  ];

  const excludeDirs = ['node_modules', '.git', 'dist', '.next', 'build'];
  let foundFiles = [];

  const walkDir = (dir) => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        // Skip excluded directories
        if (stat.isDirectory()) {
          if (!excludeDirs.some((d) => fullPath.includes(d))) {
            walkDir(fullPath);
          }
          return;
        }

        // Check filename against patterns
        patterns.forEach((pattern) => {
          if (file.toLowerCase().includes(pattern.toLowerCase())) {
            foundFiles.push(fullPath);
            log.warning(`FOUND: ${fullPath}`);
            hasIssues = true;
          }
        });
      });
    } catch (err) {
      // Skip permission errors
    }
  };

  walkDir(PROJECT_ROOT);

  if (foundFiles.length === 0) {
    log.success('No suspicious filenames found');
  }

  return foundFiles;
}

/**
 * Scan for batch/PowerShell scripts
 */
function scanBatchScripts() {
  print_header('🧹 SCANNING FOR BATCH/SHELL SCRIPTS');

  const extensions = ['.bat', '.ps1', '.cmd'];
  let foundFiles = [];

  const walkDir = (dir, depth = 0) => {
    if (depth > 3) return; // Limit depth

    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !file.startsWith('.')) {
          walkDir(fullPath, depth + 1);
          return;
        }

        if (extensions.some((ext) => file.endsWith(ext))) {
          // Check if it's legit (e.g., from Windows native files)
          if (
            !fullPath.includes('Windows') &&
            !fullPath.includes('node_modules')
          ) {
            foundFiles.push(fullPath);
            log.warning(`FOUND: ${fullPath}`);
            hasIssues = true;
          }
        }
      });
    } catch (err) {
      // Skip errors
    }
  };

  walkDir(PROJECT_ROOT);

  if (foundFiles.length === 0) {
    log.success('No suspicious batch scripts found');
  }

  return foundFiles;
}

/**
 * Scan for obfuscated code
 */
function scanObfuscatedCode() {
  print_header('🔎 SCANNING FOR OBFUSCATED/MALICIOUS CODE');

  // All config files to check
  const configFiles = [
    'eslint.config.mjs',
    'eslint.config.js',
    'nest-cli.json',
    'tsconfig.json',
    'tsconfig.build.json',
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintignore',
    'jest.config.js',
    'ormconfig.js',
    'ormconfig.json',
    'prisma.config.ts',
    '.env.example',
    '.env.local',
  ];

  const suspiciousPatterns = [
    /global\[/gi,
    /eval\(/gi,
    /Function\(/gi,
    /require\(['"]fs['\"]/gi,
    /require\(['"]child_process['\"]/gi,
    /require\(['"]path['\"]/gi,
    /require\(['"]os['\"]/gi,
    /require\(['"]http['\"]/gi,
    /require\(['"]net['\"]/gi,
    /child_process/gi,
    /process\.exit/gi,
    /exec\(/gi,
    /spawn\(/gi,
    /atob\(/gi,
    /btoa\(/gi,
    /decode/gi,
    /Buffer\(/gi,
    /toString\(['"]hex['\"]\)/gi,
    /setInterval.*eval/gi,
    /setTimeout.*eval/gi,
  ];

  // Scan all config files in root
  log.info('Scanning config files in root directory...');
  configFiles.forEach((file) => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
      checkFileForSuspiciousCode(filePath, file, suspiciousPatterns);
    }
  });

  // Scan all .ts, .js files in src directory recursively
  log.info('Scanning all source files in src/ directory...');
  scanSrcDirectory(suspiciousPatterns);

  // Scan dist, build directories for injected code
  log.info('Scanning build/dist directories...');
  ['dist', 'build', 'out'].forEach((dir) => {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(dirPath)) {
      scanDirectoryRecursive(dirPath, suspiciousPatterns, 'build');
    }
  });
}

/**
 * Check single file for suspicious patterns
 */
function checkFileForSuspiciousCode(filePath, displayName, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let hasIssue = false;

    patterns.forEach((pattern) => {
      if (pattern.test(content)) {
        log.warning(`SUSPICIOUS CODE in ${displayName}: ${pattern}`);
        hasIssues = true;
        hasIssue = true;

        // Show the suspicious line
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (pattern.test(line)) {
            log.warning(`  Line ${idx + 1}: ${line.trim().substring(0, 80)}`);
          }
        });
      }
    });

    if (!hasIssue) {
      log.info(`✓ ${displayName} clean`);
    }
  } catch (err) {
    // Skip read errors
  }
}

/**
 * Recursively scan src directory
 */
function scanSrcDirectory(patterns) {
  const srcPath = path.join(PROJECT_ROOT, 'src');
  if (!fs.existsSync(srcPath)) return;

  const walkDir = (dir, depth = 0) => {
    if (depth > 5) return; // Limit depth

    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        if (file.startsWith('.')) return; // Skip hidden files

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!['node_modules', '.next', 'dist', 'build'].includes(file)) {
            walkDir(fullPath, depth + 1);
          }
          return;
        }

        // Check TypeScript/JavaScript files
        if (/\.(ts|js|tsx|jsx|mjs)$/.test(file)) {
          const relPath = path.relative(PROJECT_ROOT, fullPath);
          checkFileForSuspiciousCode(fullPath, relPath, patterns);
        }
      });
    } catch (err) {
      // Skip errors
    }
  };

  walkDir(srcPath);
}

/**
 * Scan dist/build directories for injected code
 */
function scanDirectoryRecursive(dir, patterns, type) {
  const walkDir = (currentDir, depth = 0) => {
    if (depth > 3) return;

    try {
      const files = fs.readdirSync(currentDir);
      files.forEach((file) => {
        if (file.startsWith('.')) return;

        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath, depth + 1);
          return;
        }

        // Only scan .js files in dist/build
        if (/\.js$/.test(file)) {
          const relPath = path.relative(PROJECT_ROOT, fullPath);
          checkFileForSuspiciousCode(fullPath, relPath, patterns);
        }
      });
    } catch (err) {
      // Skip errors
    }
  };

  walkDir(dir);
}

/**
 * Scan .gitignore for suspicious entries
 */
function scanGitignore() {
  print_header('🔎 SCANNING .gitignore');

  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    log.info('.gitignore not found (OK)');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const suspiciousEntries = [
    'temp_auto_push',
    'config.bat',
    'virus',
    'malware',
  ];

  let found = false;
  suspiciousEntries.forEach((entry) => {
    if (content.includes(entry)) {
      log.warning(`SUSPICIOUS ENTRY in .gitignore: ${entry}`);
      hasIssues = true;
      found = true;
    }
  });

  if (!found) {
    log.success('.gitignore is clean');
  }
}

/**
 * Fix suspicious files
 */
function fixFiles(foundFiles) {
  if (foundFiles.length === 0) return;

  print_header('🔧 FIXING MALICIOUS FILES');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  foundFiles.forEach((file) => {
    try {
      // Backup
      const backupPath = path.join(BACKUP_DIR, path.basename(file));
      fs.copyFileSync(file, backupPath);
      log.info(`Backed up to: ${backupPath}`);

      // Remove
      fs.unlinkSync(file);
      log.success(`DELETED: ${file}`);
    } catch (err) {
      log.error(`Failed to remove ${file}: ${err.message}`);
    }
  });
}

/**
 * Restore files from git
 */
function restoreFromGit(filePath) {
  try {
    log.info(`Restoring ${filePath} from git...`);
    const relPath = path.relative(PROJECT_ROOT, filePath);
    execSync(`git checkout -- ${relPath}`, { cwd: PROJECT_ROOT });
    log.success(`Restored: ${filePath}`);
    return true;
  } catch (err) {
    log.error(`Failed to restore from git: ${err.message}`);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.blue}🔒 SECURITY CLEANUP TOOL${colors.reset}`);
  console.log(`${colors.gray}Mode: ${MODE}${colors.reset}\n`);

  // Run scans
  const suspiciousFiles = scanSuspiciousFiles();
  const batchScripts = scanBatchScripts();

  scanObfuscatedCode();
  scanGitignore();

  // Summary
  print_header('📊 SCAN SUMMARY');
  log.info(`Suspicious Files: ${suspiciousFiles.length}`);
  log.info(`Batch Scripts: ${batchScripts.length}`);
  log.info(`Issues Found: ${hasIssues ? 'YES' : 'NO'}`);
  log.info(`Log saved to: ${LOG_FILE}`);

  // Fix mode
  if (MODE === 'fix') {
    if (hasIssues) {
      print_header('🔧 APPLYING FIXES');
      fixFiles([...suspiciousFiles, ...batchScripts]);
      log.success('Fixes applied');

      // Try to restore clean versions from git
      log.info('Attempting to restore clean versions from git...');
      ['eslint.config.mjs', 'eslint.config.js', '.gitignore'].forEach(
        (file) => {
          const filePath = path.join(PROJECT_ROOT, file);
          if (fs.existsSync(filePath)) {
            restoreFromGit(filePath);
          }
        },
      );
    } else {
      log.success('No issues to fix!');
    }
  } else {
    if (hasIssues) {
      log.warning('Issues detected! Run: npm run security:fix');
      process.exit(1);
    } else {
      log.success('Security check passed ✓');
    }
  }

  print_header('✅ SCAN COMPLETE');
}

main();
