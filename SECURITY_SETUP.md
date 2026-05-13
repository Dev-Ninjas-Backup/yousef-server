# 🔒 VPS Post-Deploy Security Setup Guide

## Overview

এই guide টি তোমার yousef-frontend এবং yousef-server project এর জন্য একটি complete security setup describe করে। এটি দুটো layer এ কাজ করে:

1. **GitHub Actions Level** - Code push/PR এর সময় malicious code detect করে
2. **VPS Level** - Deploy হওয়ার পর সার্ভারে malicious file scan করে

---

## 📋 Prerequisites

আপনার VPS এ থাকতে হবে:

- Ubuntu 20.04 / 22.04 LTS
- Node.js 16+ and npm/pnpm
- PM2 (for backend process management)
- Docker & Docker Compose (optional, but recommended)
- Nginx (for reverse proxy)

---

## 🚀 Part 1: GitHub Setup (Already Done)

আমরা দুটো project এর জন্য `.github/workflows/security-cleanup.yml` তৈরি করেছি।

### ✅ What's Included:

1. **yousef-frontend** - React/Next.js specific checks
2. **yousef-server** - NestJS/backend specific checks

### 🔑 Both workflows will:

- ✅ Scan for suspicious filenames (temp_auto_push, config.bat, malware, etc.)
- ✅ Remove .bat, .ps1, .cmd files
- ✅ Detect obfuscated JavaScript (eval, Function, global[...])
- ✅ Scan config files for malicious code
- ✅ Check .gitignore for suspicious entries
- ✅ Generate scan report & upload as artifact
- ✅ Comment on PRs with findings
- ✅ Prevent deployment if malicious code detected

---

## 🛠️ Part 2: VPS Setup

### Step 1: Upload cleanup.sh to VPS

```bash
# From your local machine
scp cleanup.sh ubuntu@YOUR_VPS_IP:/var/www/cleanup.sh

# Or copy the content manually
ssh ubuntu@YOUR_VPS_IP
nano /var/www/cleanup.sh
# Paste the script content and save (Ctrl+X, Y, Enter)
```

### Step 2: Make script executable

```bash
ssh ubuntu@YOUR_VPS_IP
chmod +x /var/www/cleanup.sh
chmod +x /var/www/yousef-server/cleanup.sh  # if yousef-server is there
```

### Step 3: Test the script locally

```bash
# On VPS
bash /var/www/cleanup.sh /var/www/yousef-server

# This will:
# - Scan for malicious files
# - Generate a log file (malware_scan_YYYYMMDD_HHMMSS.log)
# - Ask if you want to restart services
```

---

## 🔧 Part 3: Integrate cleanup into Deployment Process

### Option A: PM2 Post-Deploy Script

If you're using PM2 for your backend:

```bash
# On VPS, edit your PM2 ecosystem file
nano ecosystem.config.js
```

Add this configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'yousef-server',
      script: './dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Post-deploy hook
      'post-deploy':
        'npm install && npm run build && bash /var/www/cleanup.sh /var/www/yousef-server && pm2 restart yousef-server',
    },
  ],
};
```

Then restart PM2:

```bash
pm2 start ecosystem.config.js
```

---

### Option B: Nginx Post-Deploy Script

If you're using Nginx with a deploy script:

Create `/var/www/deploy.sh`:

```bash
#!/bin/bash

cd /var/www/yousef-server

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building project..."
npm run build

echo "🔒 Running security cleanup..."
bash /var/www/cleanup.sh $(pwd)

echo "♻️ Restarting services..."
pm2 restart yousef-server
sudo systemctl reload nginx

echo "✅ Deployment complete!"
```

Make it executable:

```bash
chmod +x /var/www/deploy.sh
```

---

### Option C: GitHub Actions Integration (Recommended)

Create `.github/workflows/deploy.yml` in yousef-server:

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main
      - production

jobs:
  security-cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        run: bash .github/scripts/security-scan.sh

  deploy:
    needs: security-cleanup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ubuntu
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/yousef-server

            echo "📥 Pulling latest code..."
            git fetch origin
            git checkout main
            git reset --hard origin/main

            echo "📦 Installing dependencies..."
            npm ci

            echo "🔨 Building project..."
            npm run build

            echo "🔒 Running post-deploy cleanup..."
            bash /var/www/cleanup.sh $(pwd)

            echo "♻️ Restarting services..."
            pm2 restart all
            sudo systemctl reload nginx

            echo "✅ Deployment complete!"
```

---

## 📊 Part 4: Monitoring & Logs

### View scan logs:

```bash
# Latest scan log
ls -lah /var/www/malware_scan_*.log | tail -1

# View specific log
cat /var/www/malware_scan_20260514_103045.log

# Real-time monitoring
tail -f /var/www/malware_scan_*.log
```

### Check GitHub Actions workflow runs:

1. Go to your GitHub repository
2. Click "Actions" tab
3. Find "Security Cleanup - Malware Detection & Removal"
4. Click on any run to see details
5. Download "malware-scan-report" artifact

### Monitor VPS services:

```bash
# Check PM2 status
pm2 status
pm2 logs

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check system logs
sudo journalctl -u nginx -f
```

---

## 🔐 Part 5: GitHub Account Security Hardening

### Essential Steps:

1. **Change Password**
   - Go to GitHub → Settings → Password and authentication
   - Change password immediately

2. **Enable 2FA**
   - Settings → Password and authentication → Two-factor authentication
   - Choose authenticator app (Google Authenticator, Microsoft Authenticator)
   - Save backup codes

3. **Review & Revoke Tokens**
   - Settings → Developer settings → Personal access tokens
   - Review all tokens
   - Revoke any suspicious ones

4. **Review SSH Keys**
   - Settings → SSH and GPG keys
   - Check for unfamiliar keys
   - Delete suspicious ones

5. **Audit Collaborators**
   - Go to each repository
   - Settings → Collaborators and teams
   - Remove any unfamiliar users

6. **Enable Branch Protection**
   - Settings → Branches
   - Add rule for `main` and `dev` branches
   - Require pull request reviews before merging
   - Dismiss stale pull request approvals when new commits
   - Require status checks to pass (CI/CD)

---

## 🚨 Part 6: Incident Response (If Malicious Code Detected)

### Immediate Actions:

1. **Stop deployment immediately**

   ```bash
   # On VPS
   pm2 stop all
   sudo systemctl stop nginx
   ```

2. **Review the scan report**

   ```bash
   cat /var/www/malware_scan_*.log
   ```

3. **Backup suspicious files**

   ```bash
   # Backups are auto-created in .malware_backup_* folder
   ls -la /var/www/.malware_backup_*/
   ```

4. **Rollback to last known good state**

   ```bash
   cd /var/www/yousef-server
   git log --oneline | head -20
   git revert <suspicious-commit-hash>
   git push origin main
   ```

5. **Run full server audit**

   ```bash
   # Check for suspicious cron jobs
   crontab -l
   sudo crontab -l

   # Check for suspicious users
   cat /etc/passwd | grep -v "nologin\|false"

   # Check .ssh authorized_keys
   cat ~/.ssh/authorized_keys
   sudo cat /root/.ssh/authorized_keys
   ```

6. **Contact GitHub Support**
   - Report the security incident
   - Ask for access log review
   - Request account audit

---

## 📈 Part 7: Best Practices Going Forward

### Code Review Checklist:

Before merging any PR, check:

- [ ] No new `*.bat`, `*.ps1`, `*.cmd` files
- [ ] No obfuscated JavaScript
- [ ] No suspicious imports (`child_process`, `eval`, `exec`)
- [ ] Config files unchanged unexpectedly
- [ ] `.gitignore` not modified suspiciously
- [ ] GitHub Actions workflow didn't detect issues

### Regular Maintenance:

```bash
# Weekly: Check VPS for suspicious files
bash /var/www/cleanup.sh /var/www

# Weekly: Review GitHub Actions logs
# Go to repo → Actions → Check "Security Cleanup" workflow

# Monthly: Audit GitHub collaborators and tokens
# Go to GitHub Settings → Check access

# Monthly: Review VPS logs for suspicious activity
sudo journalctl --since "1 month ago" | grep -i error
```

### Automation:

Set up cron job to run cleanup script weekly:

```bash
# On VPS
sudo crontab -e

# Add this line (runs every Sunday at 2 AM)
0 2 * * 0 bash /var/www/cleanup.sh /var/www/yousef-server >> /var/log/malware_cleanup.log 2>&1
```

---

## ✅ Verification Checklist

- [ ] `.github/workflows/security-cleanup.yml` created in yousef-frontend
- [ ] `.github/workflows/security-cleanup.yml` created in yousef-server
- [ ] `cleanup.sh` uploaded to VPS
- [ ] `cleanup.sh` is executable (chmod +x)
- [ ] Ran cleanup.sh once to test
- [ ] GitHub Actions workflow runs successfully
- [ ] PR comments show security scan results
- [ ] Branch protection enabled on main/dev
- [ ] All suspicious tokens revoked
- [ ] 2FA enabled on GitHub
- [ ] VPS SSH key audited
- [ ] Cron job scheduled for weekly cleanup (optional)

---

## 🆘 Troubleshooting

### Issue: "permission denied" when running cleanup.sh

```bash
chmod +x /var/www/cleanup.sh
```

### Issue: GitHub Actions workflow not running

1. Check if `.github/workflows/security-cleanup.yml` exists
2. Go to repo → Actions → Check if workflow is enabled
3. Push a test commit to trigger workflow

### Issue: "No such file" error in deploy script

Make sure paths are correct:

```bash
ls -la /var/www/yousef-server/
ls -la /var/www/cleanup.sh
```

### Issue: PM2 restart fails

```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs

# Manually restart
pm2 restart all
```

---

## 📞 Support & Questions

If you encounter any issues:

1. Check the log files
2. Review GitHub Issues
3. Run manual scan and check output
4. Contact system administrator

---

**Last Updated:** May 14, 2026
**Script Version:** 1.0
**Status:** Production Ready
