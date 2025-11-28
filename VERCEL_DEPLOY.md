# Vercel Deployment Instructions for PolAlfa

Your code is now on GitHub: **https://github.com/dorimacman/polalfa**

## Option 1: Deploy via Vercel Dashboard (Easiest - 2 minutes)

### Step 1: Go to Vercel
1. Open your browser and go to: **https://vercel.com**
2. Click **"Log in"** (or **"Sign Up"** if you don't have an account)
3. Sign in with GitHub (recommended)

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"polalfa"** in the list
4. Click **"Import"**

### Step 3: Configure Project
On the configuration screen:

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:**
- Click **"Edit"**
- Enter: `frontend`
- Click **"Continue"**

**Build and Output Settings:** (leave as default)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables:**
- Click **"Add Environment Variable"**
- Name: `NEXT_PUBLIC_API_BASE_URL`
- Value: `http://localhost:8000` (for now, we'll update after backend is deployed)
- Click **"Add"**

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your deployment URL
4. Your app will be live at: `https://polalfa-xxxx.vercel.app`

### Step 5: Update Backend URL (After Backend is Deployed)

Once your backend is running on your VPS:

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Find `NEXT_PUBLIC_API_BASE_URL`
4. Click **"Edit"**
5. Change value to: `https://api-polalfa.yourdomain.com` (your actual backend URL)
6. Click **"Save"**
7. Go to **"Deployments"** tab
8. Click the **"..."** menu on the latest deployment
9. Click **"Redeploy"**

---

## Option 2: Deploy via Vercel CLI (For Advanced Users)

### Step 1: Get Vercel Token
1. Go to: https://vercel.com/account/tokens
2. Click **"Create"**
3. Name it: "PolAlfa CLI"
4. Click **"Create Token"**
5. Copy the token (starts with `vercel_`)

### Step 2: Set Token and Deploy
```bash
# Set the token as environment variable
export VERCEL_TOKEN="your_token_here"

# Navigate to frontend directory
cd /home/app/polalfa/frontend

# Deploy
vercel --token=$VERCEL_TOKEN --confirm

# Deploy to production
vercel --prod --token=$VERCEL_TOKEN --confirm
```

### Step 3: Set Environment Variables
```bash
# Add environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL production --token=$VERCEL_TOKEN
# When prompted, enter: https://api-polalfa.yourdomain.com

# Redeploy with new env var
vercel --prod --token=$VERCEL_TOKEN --confirm
```

---

## After Deployment

### 1. Get Your Deployment URL
Your app will be deployed at a URL like:
- `https://polalfa.vercel.app` (if project name is available)
- `https://polalfa-xxxx.vercel.app` (with random suffix)
- Or a custom domain if you configure one

### 2. Update Backend CORS
Once you know your Vercel URL, update the backend CORS settings:

On your VPS:
```bash
# Edit the backend main.py
nano /home/app/polalfa/backend/main.py

# Update this section:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://polalfa.vercel.app",  # Your actual Vercel URL
        "https://your-custom-domain.com",  # If you have one
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Save and exit (Ctrl+X, Y, Enter)

# Restart the backend service
sudo systemctl restart polalfa
```

### 3. Test Your Deployment
1. Visit your Vercel URL
2. You should see the PolAlfa interface
3. Try entering test wallet addresses
4. Verify the analysis works

---

## Troubleshooting

### Build Fails
**Error: "Cannot find module"**
- Check that `package.json` is in the frontend directory
- Verify root directory is set to `frontend` in Vercel settings

**Error: "Build exceeded maximum duration"**
- This shouldn't happen with our small project
- Try deploying again

### App Loads But API Calls Fail
**Check these:**
1. Is `NEXT_PUBLIC_API_BASE_URL` set correctly?
2. Is the backend running? Test: `curl https://api-polalfa.yourdomain.com/health`
3. Are CORS settings updated in backend?
4. Check browser console for error messages

### Environment Variable Not Working
- Environment variables must start with `NEXT_PUBLIC_` for client-side access
- After adding/changing env vars, you must redeploy
- Clear your browser cache if needed

---

## Custom Domain (Optional)

To use your own domain (e.g., `polalfa.yourdomain.com`):

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your domain: `polalfa.yourdomain.com`
5. Follow the DNS instructions provided
6. Add the CNAME or A record to your DNS provider
7. Wait for DNS propagation (up to 48 hours, usually faster)

---

## Useful Vercel Commands

```bash
# View deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm polalfa

# View project info
vercel inspect
```

---

## GitHub Integration

Vercel automatically deploys when you push to GitHub:
- **Push to main branch** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

To trigger a new deployment:
```bash
cd /home/app/polalfa
git add .
git commit -m "Update frontend"
git push origin main
# Vercel will automatically deploy in 2-3 minutes
```

---

## Next Steps

1. ✅ Code pushed to GitHub: https://github.com/dorimacman/polalfa
2. 🔜 Deploy to Vercel (follow steps above)
3. 🔜 Deploy backend to VPS (see DEPLOYMENT.md)
4. 🔜 Update environment variables with actual URLs
5. 🔜 Test end-to-end

---

## Quick Reference

**GitHub Repo:** https://github.com/dorimacman/polalfa

**Vercel Dashboard:** https://vercel.com/dashboard

**Project Structure:**
- Backend code: `/backend/`
- Frontend code: `/frontend/`
- Vercel root: `frontend` (IMPORTANT!)

**Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

---

Good luck with deployment! 🚀

If you run into issues, check the logs in the Vercel dashboard or review DEPLOYMENT.md for full instructions.
