#!/bin/bash
# PolAlfa Installation Script
# Run with: sudo bash /home/app/polalfa/install-services.sh

set -e  # Exit on error

echo "==================================="
echo "PolAlfa Installation Script"
echo "==================================="
echo ""

# Step 1: Install systemd services
echo "Step 1: Installing systemd services..."
cp /home/app/polalfa/polalfa.service /etc/systemd/system/
cp /home/app/polalfa/polalfa-frontend.service /etc/systemd/system/
echo "✓ Service files copied"

# Reload systemd
systemctl daemon-reload
echo "✓ Systemd reloaded"

# Enable services
systemctl enable polalfa
systemctl enable polalfa-frontend
echo "✓ Services enabled (will start on boot)"

# Start services
systemctl start polalfa
systemctl start polalfa-frontend
echo "✓ Services started"

# Wait a moment for services to start
sleep 3

# Check status
echo ""
echo "Backend status:"
systemctl status polalfa --no-pager | head -10

echo ""
echo "Frontend status:"
systemctl status polalfa-frontend --no-pager | head -10

echo ""
echo "==================================="
echo "Step 2: Installing nginx configuration..."

# Install nginx config
cp /home/app/polalfa/nginx-polalfa.conf /etc/nginx/sites-available/polalfa

# Enable site (create symlink if it doesn't exist)
if [ ! -L /etc/nginx/sites-enabled/polalfa ]; then
    ln -s /etc/nginx/sites-available/polalfa /etc/nginx/sites-enabled/
    echo "✓ Nginx site enabled"
else
    echo "✓ Nginx site already enabled"
fi

# Test nginx configuration
echo ""
echo "Testing nginx configuration..."
nginx -t

# Reload nginx
systemctl reload nginx
echo "✓ Nginx reloaded"

echo ""
echo "==================================="
echo "Step 3: Verifying services..."

# Test backend
echo ""
echo "Testing backend (localhost:8001)..."
sleep 2
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    echo "✓ Backend is healthy!"
else
    echo "⚠ Backend health check failed"
fi

# Test frontend
echo ""
echo "Testing frontend (localhost:3000)..."
if curl -s http://localhost:3000 | grep -q "PolAlfa"; then
    echo "✓ Frontend is running!"
else
    echo "⚠ Frontend check failed"
fi

echo ""
echo "==================================="
echo "Installation Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Make sure DNS is configured (A record pointing to this server)"
echo "2. Run SSL setup: sudo certbot --nginx -d polalfa.fun -d www.polalfa.fun"
echo ""
echo "Your site will be available at:"
echo "  http://polalfa.fun (once DNS propagates)"
echo "  https://polalfa.fun (after SSL is set up)"
echo ""
echo "Logs:"
echo "  Backend: tail -f /home/app/polalfa/logs/uvicorn.log"
echo "  Frontend: tail -f /home/app/polalfa/logs/frontend.log"
echo ""
