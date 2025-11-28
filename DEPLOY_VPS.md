# PolAlfa VPS Deployment Guide

Deploy both frontend and backend on your VPS with nginx.

## Quick Summary

- **Backend**: FastAPI on port 8001 (internal)
- **Frontend**: Next.js on port 3000 (internal)
- **Nginx**: Reverse proxy on port 80/443 (public)
- **Domain**: Single domain serves both frontend and backend

## Prerequisites

- ✅ Code is ready in `/home/app/polalfa/`
- ✅ Frontend built (`npm run build` completed)
- ✅ Backend dependencies installed
- ⏳ Need sudo access for systemd and nginx
- ⏳ Need a domain or subdomain pointing to your VPS

---

## Step 1: Set Up Systemd Services

### 1.1 Install Backend Service

```bash
# Copy service file
sudo cp /home/app/polalfa/polalfa.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable polalfa

# Start service
sudo systemctl start polalfa

# Check status
sudo systemctl status polalfa
```

### 1.2 Install Frontend Service

```bash
# Copy service file
sudo cp /home/app/polalfa/polalfa-frontend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable polalfa-frontend

# Start service
sudo systemctl start polalfa-frontend

# Check status
sudo systemctl status polalfa-frontend
```

### 1.3 Verify Services are Running

```bash
# Check backend
curl http://localhost:8001/health
# Should return: {"status":"healthy"}

# Check frontend
curl http://localhost:3000
# Should return HTML
```

---

## Step 2: Configure Nginx

### 2.1 Update nginx-polalfa.conf

Edit `/home/app/polalfa/nginx-polalfa.conf` and replace `polalfa.yourdomain.com` with your actual domain.

```bash
nano /home/app/polalfa/nginx-polalfa.conf
```

Change this line:
```nginx
server_name polalfa.yourdomain.com;  # Replace with your domain
```

To your actual domain, for example:
```nginx
server_name polalfa.example.com;
```

### 2.2 Install Nginx Configuration

```bash
# Copy to nginx sites-available
sudo cp /home/app/polalfa/nginx-polalfa.conf /etc/nginx/sites-available/polalfa

# Create symlink to enable
sudo ln -s /etc/nginx/sites-available/polalfa /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

## Step 3: DNS Configuration

Point your domain to your VPS IP address:

**A Record:**
```
polalfa.yourdomain.com  →  YOUR_VPS_IP
```

Wait for DNS propagation (can take a few minutes to a few hours).

Test DNS:
```bash
nslookup polalfa.yourdomain.com
```

---

## Step 4: Add SSL Certificate (Optional but Recommended)

```bash
# Install certbot if not already installed
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d polalfa.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Certbot will auto-renew. Test renewal:
sudo certbot renew --dry-run
```

---

## Step 5: Test the Deployment

### 5.1 Test Backend

```bash
curl http://polalfa.yourdomain.com/health
# or with SSL:
curl https://polalfa.yourdomain.com/health
```

Should return: `{"status":"healthy"}`

### 5.2 Test Frontend

Open in browser:
```
http://polalfa.yourdomain.com
```
or
```
https://polalfa.yourdomain.com
```

You should see the PolAlfa interface.

### 5.3 Test Full Integration

1. Enter a Polymarket wallet address
2. Select time range
3. Click "Analyze Wallets"
4. Verify results display

---

## Monitoring & Logs

### View Logs

```bash
# Backend logs
tail -f /home/app/polalfa/logs/uvicorn.log
tail -f /home/app/polalfa/logs/error.log

# Frontend logs
tail -f /home/app/polalfa/logs/frontend.log
tail -f /home/app/polalfa/logs/frontend-error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Service Status

```bash
# Backend
sudo systemctl status polalfa

# Frontend
sudo systemctl status polalfa-frontend

# Nginx
sudo systemctl status nginx
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart polalfa

# Restart frontend
sudo systemctl restart polalfa-frontend

# Restart nginx
sudo systemctl restart nginx
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
tail -50 /home/app/polalfa/logs/error.log

# Test manually
cd /home/app/polalfa/backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8001
```

### Frontend Won't Start

```bash
# Check logs
tail -50 /home/app/polalfa/logs/frontend-error.log

# Test manually
cd /home/app/polalfa/frontend
npm start
```

### Nginx Errors

```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -50 /var/log/nginx/error.log
```

### Port Already in Use

```bash
# Find what's using port 8001
sudo lsof -i :8001

# Find what's using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

---

## Updates

### Update Backend Code

```bash
cd /home/app/polalfa
git pull origin main
sudo systemctl restart polalfa
```

### Update Frontend Code

```bash
cd /home/app/polalfa
git pull origin main
cd frontend
npm run build
sudo systemctl restart polalfa-frontend
```

---

## Architecture

```
Internet
   ↓
Nginx (port 80/443)
   ├─→ Frontend (localhost:3000) - Next.js
   └─→ Backend (localhost:8001) - FastAPI
```

**URLs:**
- `https://polalfa.yourdomain.com/` → Frontend
- `https://polalfa.yourdomain.com/api/*` → Backend API
- `https://polalfa.yourdomain.com/health` → Backend health check
- `https://polalfa.yourdomain.com/docs` → Backend API docs

---

## Security Checklist

- [ ] Services run as non-root user (`app`)
- [ ] SSL certificate installed
- [ ] CORS configured (only same domain)
- [ ] Firewall allows only ports 80, 443, 22
- [ ] Services auto-restart on failure
- [ ] Logs are being written
- [ ] DNS points to correct IP

---

## Quick Commands Reference

```bash
# Start everything
sudo systemctl start polalfa polalfa-frontend nginx

# Stop everything
sudo systemctl stop polalfa polalfa-frontend

# Restart everything
sudo systemctl restart polalfa polalfa-frontend nginx

# Check status
sudo systemctl status polalfa polalfa-frontend nginx

# View all logs
tail -f /home/app/polalfa/logs/*.log
```

---

## What Domain Do You Have?

Replace `polalfa.yourdomain.com` with your actual domain in:
1. `/home/app/polalfa/nginx-polalfa.conf`
2. Your DNS records

Then follow the steps above to deploy!

---

**PolAlfa** - Self-hosted on your VPS 🚀
