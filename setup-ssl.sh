#!/bin/bash
# PolAlfa SSL Setup Script
# Run with: sudo bash /home/app/polalfa/setup-ssl.sh

set -e  # Exit on error

echo "==================================="
echo "PolAlfa SSL Certificate Setup"
echo "==================================="
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install certbot python3-certbot-nginx -y
    echo "✓ Certbot installed"
else
    echo "✓ Certbot already installed"
fi

echo ""
echo "Getting SSL certificate for polalfa.fun and www.polalfa.fun..."
echo ""

# Get certificate
certbot --nginx -d polalfa.fun -d www.polalfa.fun

echo ""
echo "==================================="
echo "SSL Setup Complete!"
echo "==================================="
echo ""
echo "Your site is now available at:"
echo "  https://polalfa.fun"
echo "  https://www.polalfa.fun"
echo ""
echo "SSL certificates will auto-renew."
echo "Test renewal with: sudo certbot renew --dry-run"
echo ""
