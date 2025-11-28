# PolAlfa Frontend

Next.js + React frontend for analyzing Polymarket trader wallets.

## Overview

PolAlfa is a dashboard that helps you find the most profitable and consistent Polymarket traders. Enter wallet addresses, analyze their performance, and view ranked results.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Features

- **Wallet Input Form**: Enter 1-10 wallet addresses
- **Time Range Selection**: Analyze 7d, 30d, or 90d periods
- **Leaderboard**: Ranked by trader score
- **Expandable Details**: View individual market performance
- **Responsive Design**: Works on desktop and mobile

## Installation

### Prerequisites

- Node.js 18+ and npm

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# For local development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# For production (after deploying backend)
# NEXT_PUBLIC_API_BASE_URL=https://api-polalfa.yourdomain.com
```

## Development

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

### Method 1: Deploy from GitHub (Recommended)

1. **Push code to GitHub**:
   ```bash
   cd /home/app/polalfa
   git add .
   git commit -m "Initial commit: PolAlfa MVP"
   git remote add origin https://github.com/yourusername/polalfa.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory as the root

3. **Configure Build Settings**:
   - Framework Preset: **Next.js**
   - Root Directory: **frontend**
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Set Environment Variable**:
   - Add environment variable:
     - Key: `NEXT_PUBLIC_API_BASE_URL`
     - Value: `https://api-polalfa.yourdomain.com` (your backend URL)

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Deploy from CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```

4. **Add Environment Variable**:
   ```bash
   vercel env add NEXT_PUBLIC_API_BASE_URL
   # Enter: https://api-polalfa.yourdomain.com
   # Select: Production
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Post-Deployment

After deploying to Vercel:

1. **Update Backend CORS**:
   - Edit `backend/main.py`
   - Update `allow_origins` to your Vercel domain:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=["https://your-project.vercel.app"],
         allow_credentials=True,
         allow_methods=["*"],
         allow_headers=["*"],
     )
     ```
   - Restart backend service:
     ```bash
     sudo systemctl restart polalfa
     ```

2. **Test the Integration**:
   - Visit your Vercel URL
   - Enter a wallet address
   - Verify the analysis works

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx             # Main page with state management
│   │   └── globals.css          # Global styles
│   └── components/
│       ├── WalletInputForm.tsx  # Input form component
│       └── Leaderboard.tsx      # Results display component
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── next.config.js               # Next.js configuration
```

## UI Components

### WalletInputForm

- Text area for wallet addresses (comma or newline separated)
- Time range selector (7d, 30d, 90d)
- Validation for 1-10 wallets
- Loading state during analysis

### Leaderboard

- Ranked list of wallets by trader score
- Summary stats: trader score, hit rate, ROI, PnL, volume
- Expandable rows showing:
  - Full wallet address
  - Detailed stats
  - Individual market performance table
- Color-coded metrics:
  - Green: positive performance
  - Red: negative performance
  - Yellow: neutral/moderate

## Customization

### Branding

To customize the branding:

1. **Colors**: Edit `tailwind.config.ts`:
   ```typescript
   colors: {
     primary: {
       // Change these values
       500: '#0ea5e9',
       600: '#0284c7',
     }
   }
   ```

2. **Title**: Edit `src/app/layout.tsx`:
   ```typescript
   export const metadata: Metadata = {
     title: 'Your Custom Title',
     description: 'Your custom description',
   }
   ```

3. **Header**: Edit `src/app/page.tsx`:
   ```tsx
   <h1 className="text-5xl font-bold text-white mb-3">
     Your<span className="text-primary-400">Brand</span>
   </h1>
   ```

### Styling

- Global styles: `src/app/globals.css`
- Tailwind utilities: Used throughout components
- Dark theme by default (can be customized in `globals.css`)

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Check that `NEXT_PUBLIC_API_BASE_URL` is correct
2. Verify backend CORS settings allow your frontend domain
3. Ensure backend is running and accessible

### Build Errors

If build fails:
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Environment Variables Not Working

- In Next.js, public env vars must start with `NEXT_PUBLIC_`
- Restart dev server after changing `.env.local`
- On Vercel, redeploy after adding env vars

## Development Tips

### Type Safety

TypeScript interfaces are defined in `src/app/page.tsx`:
- `WalletAnalysis`
- `MarketDetail`
- `AnalysisResponse`

Import and reuse these types in new components.

### API Calls

API calls use axios in `src/app/page.tsx`. To add new endpoints:

```typescript
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/your-endpoint`,
  { data }
)
```

### Adding New Components

1. Create in `src/components/`
2. Use TypeScript and export default
3. Import in `src/app/page.tsx` or other components

## License

MIT
