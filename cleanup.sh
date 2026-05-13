#!/bin/bash

################################################################################
# VPS Post-Deploy Malware Detection & Cleanup Script
# 
# This script should be run on VPS after deployment
# Save as: /var/www/cleanup.sh
# Run: bash /var/www/cleanup.sh
#
# Usage:
#   bash cleanup.sh              # Run in current directory
#   bash cleanup.sh /var/www     # Run in specific directory
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_DIR="${1:-.}"
LOGFILE="${TARGET_DIR}/malware_scan_$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="${TARGET_DIR}/.malware_backup_$(date +%Y%m%d_%H%M%S)"

# Define suspicious patterns
declare -a SUSPICIOUS_PATTERNS=(
    "temp_auto_push"
    "config.bat"
    "malware"
    "virus"
    "backdoor"
    "trojan"
    "exploit"
    "payload"
    "cryptominer"
    "shell.js"
    "reverse_shell"
)

# Define suspicious keywords in code
declare -a SUSPICIOUS_KEYWORDS=(
    "eval("
    "Function("
    "child_process"
    "require.*fs"
    "process.exit"
    "global\["
    "exec("
    "spawn("
)

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOGFILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOGFILE"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1" | tee -a "$LOGFILE"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$LOGFILE"
}

print_header() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOGFILE"
    echo -e "${BLUE}$1${NC}" | tee -a "$LOGFILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOGFILE"
}

################################################################################
# Main Scanning & Cleanup Functions
################################################################################

scan_suspicious_filenames() {
    print_header "🔎 SCANNING FOR SUSPICIOUS FILENAMES"
    
    FOUND_COUNT=0
    
    for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
        log_info "Checking for pattern: '$pattern'"
        
        # Find suspicious files (exclude common directories)
        found=$(find "$TARGET_DIR" \
            -type f \
            -iname "*$pattern*" \
            -not -path "*/node_modules/*" \
            -not -path "*/.git/*" \
            -not -path "*/dist/*" \
            -not -path "*/.next/*" \
            -not -path "*/build/*" \
            2>/dev/null || true)
        
        if [ ! -z "$found" ]; then
            while IFS= read -r file; do
                log_warning "FOUND SUSPICIOUS FILE: $file"
                echo "$file" >> "$LOGFILE"
                
                # Backup before deleting
                mkdir -p "$BACKUP_DIR"
                cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
                
                # Delete suspicious file
                rm -f "$file"
                log_success "Deleted: $file"
                ((FOUND_COUNT++))
            done <<< "$found"
        fi
    done
    
    if [ $FOUND_COUNT -gt 0 ]; then
        log_warning "Found and removed $FOUND_COUNT suspicious files"
        return 1
    else
        log_success "No suspicious filenames found"
        return 0
    fi
}

remove_batch_scripts() {
    print_header "🧹 REMOVING BATCH/SHELL SCRIPTS"
    
    FOUND_COUNT=0
    
    # Remove .bat, .ps1, .cmd files from root and first 2 levels
    for ext in "bat" "ps1" "cmd"; do
        found=$(find "$TARGET_DIR" \
            -maxdepth 3 \
            -type f \
            -name "*.$ext" \
            -not -path "*/node_modules/*" \
            -not -path "*/.git/*" \
            2>/dev/null || true)
        
        if [ ! -z "$found" ]; then
            while IFS= read -r file; do
                log_warning "FOUND BATCH SCRIPT: $file"
                
                # Backup before deleting
                mkdir -p "$BACKUP_DIR"
                cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
                
                # Delete
                rm -f "$file"
                log_success "Deleted: $file"
                ((FOUND_COUNT++))
            done <<< "$found"
        fi
    done
    
    if [ $FOUND_COUNT -gt 0 ]; then
        log_warning "Found and removed $FOUND_COUNT batch/shell scripts"
        return 1
    else
        log_success "No batch/shell scripts found"
        return 0
    fi
}

scan_obfuscated_code() {
    print_header "🔎 SCANNING FOR OBFUSCATED/MALICIOUS CODE"
    
    FOUND_MALWARE=0
    
    # Scan config files
    log_info "Checking config files..."
    
    config_files=(
        "eslint.config.mjs"
        "eslint.config.js"
        "next.config.js"
        "next.config.ts"
        "tailwind.config.js"
        "postcss.config.js"
        "nest-cli.json"
        "tsconfig.json"
        "prisma.config.ts"
    )
    
    for config in "${config_files[@]}"; do
        if [ -f "$TARGET_DIR/$config" ]; then
            log_info "Scanning: $config"
            
            # Check for suspicious patterns
            for keyword in "${SUSPICIOUS_KEYWORDS[@]}"; do
                if grep -q "$keyword" "$TARGET_DIR/$config" 2>/dev/null; then
                    log_warning "SUSPICIOUS CODE DETECTED in $config: $keyword"
                    grep -n "$keyword" "$TARGET_DIR/$config" >> "$LOGFILE" 2>/dev/null || true
                    FOUND_MALWARE=1
                fi
            done
        fi
    done
    
    # Scan .gitignore for suspicious entries
    if [ -f "$TARGET_DIR/.gitignore" ]; then
        log_info "Scanning .gitignore..."
        if grep -qE "(temp_auto_push|config\.bat|virus|malware)" "$TARGET_DIR/.gitignore" 2>/dev/null; then
            log_warning "SUSPICIOUS ENTRIES in .gitignore"
            grep "temp_auto_push\|config\.bat\|virus\|malware" "$TARGET_DIR/.gitignore" >> "$LOGFILE" 2>/dev/null || true
            FOUND_MALWARE=1
        fi
    fi
    
    # Scan source files for suspicious imports/requires
    if [ -d "$TARGET_DIR/src" ]; then
        log_info "Scanning src/ directory for suspicious imports..."
        
        # Search for dangerous require() patterns
        suspicious_requires=$(find "$TARGET_DIR/src" \
            -type f \( -name "*.ts" -o -name "*.js" \) \
            -exec grep -l "require.*child_process\|require.*fs\|require.*exec" {} \; \
            2>/dev/null || true)
        
        if [ ! -z "$suspicious_requires" ]; then
            log_warning "SUSPICIOUS REQUIRES FOUND:"
            echo "$suspicious_requires" | tee -a "$LOGFILE"
            FOUND_MALWARE=1
        fi
    fi
    
    if [ $FOUND_MALWARE -eq 1 ]; then
        log_warning "Suspicious code patterns detected!"
        return 1
    else
        log_success "No obfuscated/malicious code detected"
        return 0
    fi
}

scan_env_files() {
    print_header "🔎 SCANNING ENVIRONMENT FILES"
    
    for env_file in ".env" ".env.local" ".env.production" ".env.development"; do
        if [ -f "$TARGET_DIR/$env_file" ]; then
            log_info "Checking $env_file for suspicious content..."
            
            # Check for suspicious patterns
            if grep -qE "(eval|Function|exec|spawn|child_process)" "$TARGET_DIR/$env_file" 2>/dev/null; then
                log_warning "SUSPICIOUS content in $env_file"
                grep -n "eval\|Function\|exec\|spawn\|child_process" "$TARGET_DIR/$env_file" >> "$LOGFILE" 2>/dev/null || true
                return 1
            fi
        fi
    done
    
    log_success "Environment files clean"
    return 0
}

check_processes() {
    print_header "🔎 CHECKING RUNNING PROCESSES"
    
    log_info "Checking for suspicious processes..."
    
    suspicious_processes=0
    
    # Check for malicious processes
    if ps aux | grep -E "crypto|miner|malware|virus|backdoor" | grep -v grep > /dev/null 2>&1; then
        log_warning "SUSPICIOUS PROCESS DETECTED"
        ps aux | grep -E "crypto|miner|malware|virus|backdoor" | grep -v grep | tee -a "$LOGFILE"
        suspicious_processes=1
    fi
    
    if [ $suspicious_processes -eq 1 ]; then
        log_warning "Consider killing suspicious processes manually"
        return 1
    else
        log_success "No suspicious processes detected"
        return 0
    fi
}

print_summary() {
    print_header "📊 SCAN SUMMARY"
    
    log_info "Scan Location: $TARGET_DIR"
    log_info "Scan Time: $(date)"
    log_info "Log File: $LOGFILE"
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR")" ]; then
        log_warning "Backup created at: $BACKUP_DIR"
        log_info "Backed up $(ls "$BACKUP_DIR" | wc -l) file(s)"
    fi
    
    log_info ""
    log_info "Recommended next steps:"
    log_info "1. Review the scan log: cat $LOGFILE"
    log_info "2. Restart services: pm2 restart all && sudo systemctl reload nginx"
    log_info "3. Monitor logs for errors: tail -f /var/log/nginx/error.log"
}

restart_services() {
    print_header "♻️ RESTARTING SERVICES"
    
    # Restart PM2 if available
    if command -v pm2 &> /dev/null; then
        log_info "Restarting PM2 applications..."
        pm2 restart all 2>&1 | tee -a "$LOGFILE"
        log_success "PM2 services restarted"
    fi
    
    # Restart Docker if running
    if command -v docker-compose &> /dev/null && [ -f "$TARGET_DIR/docker-compose.yaml" ]; then
        log_info "Restarting Docker services..."
        cd "$TARGET_DIR"
        docker-compose up -d 2>&1 | tee -a "$LOGFILE"
        log_success "Docker services restarted"
    fi
    
    # Reload Nginx
    if command -v nginx &> /dev/null; then
        log_info "Reloading Nginx..."
        sudo systemctl reload nginx 2>&1 | tee -a "$LOGFILE" || true
        log_success "Nginx reloaded"
    fi
    
    log_success "Services restarted successfully"
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "🔒 VPS MALWARE DETECTION & CLEANUP"
    
    log_info "Target Directory: $TARGET_DIR"
    log_info "Starting scan at $(date)"
    echo ""
    
    # Initialize log file
    {
        echo "Malware Detection & Cleanup Report"
        echo "Date: $(date)"
        echo "Target: $TARGET_DIR"
        echo "Script Version: 1.0"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    } > "$LOGFILE"
    
    # Run all scans
    OVERALL_STATUS=0
    
    scan_suspicious_filenames || OVERALL_STATUS=1
    echo "" | tee -a "$LOGFILE"
    
    remove_batch_scripts || OVERALL_STATUS=1
    echo "" | tee -a "$LOGFILE"
    
    scan_obfuscated_code || OVERALL_STATUS=1
    echo "" | tee -a "$LOGFILE"
    
    scan_env_files || OVERALL_STATUS=1
    echo "" | tee -a "$LOGFILE"
    
    check_processes || OVERALL_STATUS=1
    echo "" | tee -a "$LOGFILE"
    
    # Print summary
    print_summary
    
    # Restart services
    echo ""
    read -p "Restart services now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restart_services
    fi
    
    echo ""
    if [ $OVERALL_STATUS -eq 0 ]; then
        log_success "Scan completed - No issues found"
        exit 0
    else
        log_warning "Scan completed - Issues were found and cleaned"
        exit 1
    fi
}

# Run main function
main "$@"
