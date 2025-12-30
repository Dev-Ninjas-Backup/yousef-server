# GitHub Secrets Configuration

To enable the CI/CD workflow, you need to add the following secrets to your GitHub repository.

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

## Required Secrets

### Docker Hub Credentials

**DOCKER_USERNAME**
```
softvence
```

**DOCKER_PASSWORD**
```
Your Docker Hub password or access token
```

**PACKAGE_NAME**
```
yousef_server
```

### EC2 Server Configuration

**EC2_HOST**
```
ec2-13-50-107-250.eu-north-1.compute.amazonaws.com
```

**EC2_USER**
```
ubuntu
```

**EC2_SSH_PRIVATE_KEY**
```
Copy the contents of your yousef-server.pem file here
```

## Verification

After adding all secrets, you can verify by:

1. Make a commit to the `main` branch
2. Check the **Actions** tab in GitHub
3. The workflow should trigger automatically

## Workflow Steps

1. **CI Check** - Runs on all branches
   - Lint code
   - Build project
   
2. **Build and Push** - Only on `main` branch
   - Builds Docker image
   - Pushes to Docker Hub as `softvence/yousef_server:latest`
   
3. **Deploy** - Only on `main` branch after successful build
   - Copies docker-compose.prod.yaml to EC2
   - Copies .env to EC2
   - Pulls latest image
   - Restarts containers

## Security Notes

- **Never commit** `.env` files with real credentials to GitHub
- Use GitHub secrets for sensitive data
- Rotate EC2 SSH keys regularly
- Use Docker Hub access tokens instead of passwords
- Keep your PEM file secure and never share it

## Troubleshooting

### If deployment fails:
1. Check the Actions tab for error logs
2. Verify all secrets are correctly set
3. Ensure EC2 security groups allow SSH (port 22)
4. Test SSH connection manually:
   ```bash
   ssh -i yousef-server.pem ubuntu@ec2-13-50-107-250.eu-north-1.compute.amazonaws.com
   ```

### Common Issues:
- **Permission denied**: Check SSH key format and EC2_USER
- **Docker login failed**: Verify DOCKER_USERNAME and DOCKER_PASSWORD
- **File not found**: Ensure docker-compose.prod.yaml exists in repo
