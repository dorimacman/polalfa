# PolAlfa.fun Deployment Guide

Quick setup guide for deploying PolAlfa on **polalfa.fun**

## Your VPS IP Address

**IPv4:** `217.182.169.42`
**IPv6:** `2001:41d0:305:2100::c24b`

---

## Step 1: Configure DNS on Namecheap

1. Go to Namecheap dashboard: https://ap.www.namecheap.com/
2. Find **polalfa.fun** domain
3. Click **Manage** → **Advanced DNS**
4. Add these records:

**A Record (IPv4):**
```
Type: A Record
Host: @
Value: 217.182.169.42
TTL: Automatic
```

**A Record for www:**
```
Type: A Record
Host: www
Value: 217.182.169.42
TTL: Automatic
```

**AAAA Record (IPv6) - Optional:**
```
Type: AAAA Record
Host: @
Value: 2001:41d0:305:2100::c24b
TTL: Automatic
```

5. **Save all changes**
6. Wait 5-10 minutes for DNS propagation

### Test DNS:
```bash
# From your computer or VPS
nslookup polalfa.fun
# Should return: 217.182.169.42
```

---

## Step 2: Install Systemd Services

Run these commands on your VPS:

```bash
# Copy service files
sudo cp /home/app/polalfa/polalfa.service /etc/systemd/system/
sudo cp /home/app/polalfa/polalfa-frontend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services (start on boot)
sudo systemctl enable polalfa
sudo systemctl enable polalfa-frontend

# Start services
sudo systemctl start polalfa
sudo systemctl start polalfa-frontend

# Check status
sudo systemctl status polalfa
sudo systemctl status polalfa-frontend
```

### Verify services are running:
```bash
# Test backend
curl http://localhost:8001/health
# Should return: {"status":"healthy"}

# Test frontend
curl http://localhost:3000
# Should return HTML
```

---

## Step 3: Install Nginx Configuration

```bash
# Copy nginx config
sudo cp /home/app/polalfa/nginx-polalfa.conf /etc/nginx/sites-available/polalfa

# Enable site
sudo ln -s /etc/nginx/sites-available/polalfa /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

## Step 4: Add SSL Certificate (Let's Encrypt)

Once DNS is propagated:

```bash
# Install certbot if not already installed
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d polalfa.fun -d www.polalfa.fun

# Follow the prompts:
# - Enter your email
# - Agree to terms of service
# - Choose to redirect HTTP to HTTPS (recommended: Yes)
```

Certbot will:
- Get SSL certificates
- Auto-configure nginx
- Set up auto-renewal

### Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 5: Test Your Deployment

After DNS propagates and SSL is set up:

### Visit your site:
```
https://polalfa.fun
```

You should see the PolAlfa interface!

### Test the API:
```bash
curl https://polalfa.fun/health
# Should return: {"status":"healthy"}
```

### Test API docs:
```
https://polalfa.fun/docs
```

---

## Quick Status Check

```bash
# Check all services
sudo systemctl status polalfa polalfa-frontend nginx

# View logs
tail -f /home/app/polalfa/logs/uvicorn.log
tail -f /home/app/polalfa/logs/frontend.log

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### DNS Not Resolving
- Wait longer (can take up to 24 hours, usually 5-10 minutes)
- Check DNS: `nslookup polalfa.fun`
- Verify A record is set correctly in Namecheap

### Services Won't Start
```bash
# Check logs
sudo journalctl -u polalfa -n 50
sudo journalctl -u polalfa-frontend -n 50

# Test manually
cd /home/app/polalfa/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Nginx Errors
```bash
# Test config
sudo nginx -t

# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
```

### Can't Get SSL Certificate
- Make sure DNS is fully propagated first
- Port 80 must be accessible from internet
- Check firewall: `sudo ufw status`

---

## Summary

**Your Domain:** polalfa.fun
**Your IP:** 217.182.169.42

**Services:**
- Backend: localhost:8001 (FastAPI)
- Frontend: localhost:3000 (Next.js)
- Public: https://polalfa.fun (Nginx)

**Next Steps:**
1. ✅ Update nginx config (done)
2. ⏳ Configure DNS on Namecheap
3. ⏳ Install systemd services
4. ⏳ Install nginx config
5. ⏳ Get SSL certificate
6. ⏳ Test at https://polalfa.fun

---

**PolAlfa.fun** - Find the alpha wallets on Polymarket! 🚀
