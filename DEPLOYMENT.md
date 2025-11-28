# PolAlfa Deployment Guide

Complete step-by-step guide for deploying PolAlfa to production.

## Overview

- **Backend**: Linux VPS (e.g., `/home/app/polalfa`) with nginx reverse proxy
- **Frontend**: Vercel
- **DNS**: Two subdomains needed (e.g., `api-polalfa.yourdomain.com` and `polalfa.yourdomain.com` via Vercel)

## Prerequisites

- Linux VPS with Python 3.10+, nginx, and SSL certificates (Let's Encrypt)
- GitHub account
- Vercel account
- Domain name with DNS access

---

## Part 1: Backend Deployment (VPS)

### 1.1 Clone Repository

```bash
cd /home/app
git clone https://github.com/yourusername/polalfa.git
cd polalfa/backend
```

### 1.2 Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 1.3 Test Locally

```bash
# Run the server
./start.sh
# or
uvicorn main:app --host 0.0.0.0 --port 8000

# In another terminal, test the health endpoint
curl http://localhost:8000/health
```

You should see: `{"status":"healthy"}`

### 1.4 Create Systemd Service

Create `/etc/systemd/system/polalfa.service`:

```ini
[Unit]
Description=PolAlfa FastAPI Backend
After=network.target

[Service]
Type=simple
User=app
Group=app
WorkingDirectory=/home/app/polalfa/backend
Environment="PATH=/home/app/polalfa/backend/venv/bin"
ExecStart=/home/app/polalfa/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10
StandardOutput=append:/var/log/polalfa/uvicorn.log
StandardError=append:/var/log/polalfa/error.log

[Install]
WantedBy=multi-user.target
```

### 1.5 Create Log Directory

```bash
sudo mkdir -p /var/log/polalfa
sudo chown app:app /var/log/polalfa
```

### 1.6 Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable polalfa

# Start service
sudo systemctl start polalfa

# Check status
sudo systemctl status polalfa
```

### 1.7 Configure Nginx

Create `/etc/nginx/sites-available/polalfa`:

```nginx
server {
    listen 80;
    server_name api-polalfa.yourdomain.com;

    # Increase timeouts for long-running analysis
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/polalfa /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 1.8 Add SSL Certificate

```bash
sudo certbot --nginx -d api-polalfa.yourdomain.com
```

Follow prompts to:
- Enter email
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended)

### 1.9 Test Backend API

```bash
# Health check
curl https://api-polalfa.yourdomain.com/health

# API docs
# Visit in browser: https://api-polalfa.yourdomain.com/docs
```

### 1.10 Update CORS for Production

Edit `/home/app/polalfa/backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://polalfa.vercel.app",  # Replace with your actual Vercel domain
        "https://your-custom-domain.com",  # Add custom domain if you have one
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart the service:

```bash
sudo systemctl restart polalfa
```

---

## Part 2: Frontend Deployment (Vercel)

### 2.1 Push to GitHub

If you haven't already:

```bash
cd /home/app/polalfa

# Configure git (if needed)
git config user.email "your@email.com"
git config user.name "Your Name"

# Add all files
git add .
git commit -m "Ready for deployment"

# Create GitHub repo and push
# First create the repo on github.com, then:
git remote add origin https://github.com/yourusername/polalfa.git
git push -u origin main
```

### 2.2 Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository (`polalfa`)
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variable:
   - Click "Environment Variables"
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://api-polalfa.yourdomain.com`
   - Environment: Production (and Preview if you want)

6. Click "Deploy"

7. Wait for deployment to complete

8. Your app will be live at `https://your-project.vercel.app`

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? polalfa
# - Directory? ./
# - Override settings? No

# Add environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL production
# Paste: https://api-polalfa.yourdomain.com

# Deploy to production
vercel --prod
```

### 2.3 Custom Domain (Optional)

If you want to use a custom domain:

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `polalfa.yourdomain.com`)
4. Update your DNS with the records Vercel provides
5. Wait for DNS propagation (can take up to 48 hours)

### 2.4 Update Backend CORS

After deployment, update backend CORS to include your actual Vercel URL:

```bash
# SSH to your VPS
cd /home/app/polalfa/backend

# Edit main.py
nano main.py

# Update allow_origins to include your Vercel domain
# Then restart:
sudo systemctl restart polalfa
```

---

## Part 3: Testing

### 3.1 Test Backend

```bash
# Health check
curl https://api-polalfa.yourdomain.com/health

# Test analysis endpoint
curl -X POST https://api-polalfa.yourdomain.com/api/analyze-wallets \
  -H "Content-Type: application/json" \
  -d '{
    "wallets": ["0x0000000000000000000000000000000000000000"],
    "range": "30d"
  }'
```

### 3.2 Test Frontend

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Enter test wallet addresses (find real ones on polymarket.com)
3. Select time range
4. Click "Analyze Wallets"
5. Verify results display correctly

### 3.3 End-to-End Test

1. Find real Polymarket wallet addresses:
   - Go to polymarket.com
   - Open any market
   - Click on "Trades" tab
   - Copy wallet addresses from recent trades

2. Test with multiple wallets
3. Try different time ranges
4. Expand wallet details
5. Check market history tables

---

## Part 4: Monitoring

### 4.1 Backend Logs

```bash
# View service logs
sudo journalctl -u polalfa -f

# View uvicorn logs
tail -f /var/log/polalfa/uvicorn.log

# View error logs
tail -f /var/log/polalfa/error.log
```

### 4.2 Check Service Status

```bash
# Service status
sudo systemctl status polalfa

# Restart if needed
sudo systemctl restart polalfa
```

### 4.3 Vercel Logs

- Go to Vercel dashboard
- Select your project
- Click "Deployments"
- Click on a deployment to view logs

---

## Part 5: Updates

### 5.1 Update Backend

```bash
# SSH to VPS
cd /home/app/polalfa

# Pull latest changes
git pull origin main

# Restart service
sudo systemctl restart polalfa
```

### 5.2 Update Frontend

Push to GitHub:

```bash
cd /home/app/polalfa
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel will automatically deploy the update.

Or deploy manually:

```bash
cd frontend
vercel --prod
```

---

## Troubleshooting

### Backend Issues

**Service won't start:**
```bash
# Check logs
sudo journalctl -u polalfa -n 50

# Check if port 8000 is in use
sudo lsof -i :8000

# Test manually
cd /home/app/polalfa/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**CORS errors:**
- Verify `allow_origins` in `main.py` includes your frontend domain
- Restart service after changes: `sudo systemctl restart polalfa`

**Rate limiting from Polymarket:**
- Polymarket limits: 100 requests per 60 seconds
- Reduce concurrent wallet analysis
- Add caching layer (future enhancement)

### Frontend Issues

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Verify `package.json` dependencies
- Ensure environment variables are set

**API calls fail:**
- Check `NEXT_PUBLIC_API_BASE_URL` is correct
- Verify backend is accessible: `curl https://api-polalfa.yourdomain.com/health`
- Check browser console for CORS errors
- Verify backend CORS settings

**Environment variables not working:**
- Redeploy after adding env vars
- Variables must start with `NEXT_PUBLIC_` for client-side access
- Check Vercel deployment settings

---

## Security Checklist

- [ ] Backend running as non-root user (`app`)
- [ ] SSL certificates installed and auto-renewing
- [ ] CORS properly configured (not `allow_origins=["*"]`)
- [ ] Nginx timeouts configured
- [ ] Service restarts automatically on failure
- [ ] Logs are being written and rotated
- [ ] No secrets in code (environment variables only)
- [ ] `.gitignore` prevents committing sensitive files

---

## Performance Optimization

### Backend

1. **Add Redis caching** for market metadata
2. **Rate limit requests** to prevent abuse
3. **Use connection pooling** for HTTP client
4. **Add monitoring** (Prometheus + Grafana)

### Frontend

1. **Enable Next.js caching** in production
2. **Optimize images** with Next.js Image component
3. **Add loading skeletons** for better UX
4. **Implement pagination** for large result sets

---

## Maintenance

### Regular Tasks

- **Weekly**: Check logs for errors
- **Monthly**: Review and rotate logs
- **Quarterly**: Update dependencies
- **As needed**: Update SSL certificates (auto with certbot)

### Dependency Updates

Backend:
```bash
cd /home/app/polalfa/backend
source venv/bin/activate
pip list --outdated
pip install --upgrade <package>
sudo systemctl restart polalfa
```

Frontend:
```bash
cd /home/app/polalfa/frontend
npm outdated
npm update
git commit -am "Update dependencies"
git push
```

---

## Support

For issues:
1. Check logs (backend and Vercel)
2. Review this deployment guide
3. Check Polymarket API documentation: https://docs.polymarket.com
4. Open GitHub issue

---

**PolAlfa** - Find the alpha wallets on Polymarket
