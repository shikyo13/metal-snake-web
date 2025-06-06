// Simple deployment webhook server for your production server
// Run this behind your Cloudflare tunnel

const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: '/tmp/deployments/' });

const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN || 'your-secret-token';
const DEPLOY_PATH = process.env.DEPLOY_PATH || '/var/www/metal-snake-web';
const PORT = process.env.PORT || 3001;

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== DEPLOY_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Deployment endpoint
app.post('/deploy', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Starting deployment...`);

    // Extract the archive
    const extractPath = `/tmp/deployments/extract-${Date.now()}`;
    await execPromise(`mkdir -p ${extractPath}`);
    await execPromise(`tar -xzf ${req.file.path} -C ${extractPath}`);

    // Backup current deployment
    const backupPath = `${DEPLOY_PATH}-backup-${Date.now()}`;
    await execPromise(`cp -r ${DEPLOY_PATH} ${backupPath}`);

    // Deploy new files
    await execPromise(`rsync -av --delete ${extractPath}/ ${DEPLOY_PATH}/`);

    // Cleanup
    await execPromise(`rm -rf ${extractPath} ${req.file.path}`);

    console.log(`[${timestamp}] Deployment completed successfully`);
    res.json({ success: true, message: 'Deployment completed' });

  } catch (error) {
    console.error('Deployment failed:', error);
    res.status(500).json({ error: 'Deployment failed', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'deployment-webhook' });
});

// Helper function to promisify exec
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Deployment webhook server running on port ${PORT}`);
});