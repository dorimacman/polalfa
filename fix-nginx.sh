#!/bin/bash
# Fix nginx to use PolAlfa config instead of default

echo "Removing default nginx site..."
rm -f /etc/nginx/sites-enabled/default

echo "Reloading nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "✅ Done! PolAlfa should now be live at:"
echo "   https://polalfa.fun"
echo ""
