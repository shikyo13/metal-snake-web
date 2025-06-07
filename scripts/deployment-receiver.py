#!/usr/bin/env python3
"""
Simple webhook receiver for GitHub Actions deployment
Runs on your production server and listens for deployment requests
"""

import os
import subprocess
import hashlib
import hmac
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)

# Configuration
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'your-webhook-secret-here')
DEPLOY_PATH = os.environ.get('DEPLOY_PATH', '/home/zero/metal-snake-web')
PORT = int(os.environ.get('PORT', 9001))

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_signature(payload, signature):
    """Verify that the webhook signature matches"""
    if not signature:
        return False
    
    sha_name, signature = signature.split('=')
    if sha_name != 'sha256':
        return False
    
    mac = hmac.new(
        WEBHOOK_SECRET.encode(),
        msg=payload,
        digestmod=hashlib.sha256
    )
    return hmac.compare_digest(mac.hexdigest(), signature)

@app.route('/deploy', methods=['POST'])
def deploy():
    # Verify webhook signature
    signature = request.headers.get('X-Hub-Signature-256')
    if not verify_signature(request.data, signature):
        logger.warning('Invalid signature')
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Check if it's a push to main branch
    payload = request.json
    if payload.get('ref') != 'refs/heads/main':
        return jsonify({'message': 'Not main branch, skipping'}), 200
    
    try:
        logger.info('Starting deployment...')
        
        # Pull latest changes
        subprocess.run(['git', 'pull', 'origin', 'main'], 
                      cwd=DEPLOY_PATH, check=True)
        
        # Rebuild Docker container
        subprocess.run(['docker-compose', 'build', '--no-cache'], 
                      cwd=DEPLOY_PATH, check=True)
        
        # Restart container
        subprocess.run(['docker-compose', 'up', '-d'], 
                      cwd=DEPLOY_PATH, check=True)
        
        logger.info('Deployment completed successfully')
        return jsonify({'message': 'Deployment successful'}), 200
        
    except subprocess.CalledProcessError as e:
        logger.error(f'Deployment failed: {e}')
        return jsonify({'error': 'Deployment failed'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)