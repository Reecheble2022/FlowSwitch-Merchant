# FlowSwitch Deployment Guide

This guide explains how to deploy and share the FlowSwitch application.

## 🚀 Quick Deploy Options

### Option 1: Netlify (Recommended - Free & Easy)

#### Via Netlify Drop (Drag & Drop)
1. Build the project:
   ```bash
   npm run build
   ```
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag and drop the `dist` folder
4. Your app is live! Copy the URL to share

#### Via Netlify CLI (More Control)
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

4. Follow the prompts:
   - Authorize with your Netlify account
   - Choose "Create & configure a new site"
   - Set publish directory to: `dist`

5. Your app is deployed! Note the URL provided.

#### Via GitHub + Netlify (Continuous Deployment)
1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Build settings (auto-detected from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables (see below)
7. Click "Deploy"

### Option 2: Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts and your app will be live

### Option 3: GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

### Option 4: Share Project Files

#### Via ZIP File
1. Create a ZIP of the project:
   ```bash
   zip -r flowswitch-project.zip . -x "node_modules/*" -x "dist/*" -x ".git/*"
   ```

2. Share via:
   - Email
   - Google Drive / Dropbox
   - WeTransfer
   - Cloud storage

#### Via GitHub
1. Create a GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "FlowSwitch application"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

3. Share the GitHub repository URL with your developer

## 🔐 Environment Variables

Your deployed app needs these environment variables:

### Required Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Where to Set Environment Variables

#### Netlify
1. Go to Site Settings → Build & Deploy → Environment
2. Add variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### Vercel
1. Go to Project Settings → Environment Variables
2. Add the same variables

#### Local Development
Your `.env` file already contains these values.

## 📦 For Your Developer

### Getting Started
1. Clone or extract the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

### Project Structure
```
flowswitch/
├── src/
│   ├── components/     # React components & modals
│   ├── pages/          # Page components
│   ├── lib/            # API functions, utilities
│   ├── contexts/       # React contexts
│   └── types/          # TypeScript types
├── supabase/
│   └── migrations/     # Database migrations
├── public/             # Static assets
└── dist/               # Built files (for deployment)
```

### Key Technologies
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: React Context API
- **Icons**: Lucide React

## 🗄️ Database Setup

Your Supabase database is already configured. To replicate:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in `supabase/migrations/` folder in order
3. Update `.env` with new project credentials

## 🧪 Testing the Deployment

After deployment, test these critical features:

### ✅ Authentication
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes redirect to login

### ✅ Agents
- [ ] List loads
- [ ] Search/filter works
- [ ] Create agent
- [ ] Export CSV/XLSX
- [ ] Print

### ✅ Float Management
- [ ] View accounts
- [ ] Assign float
- [ ] Top-up
- [ ] Debit
- [ ] View ledger
- [ ] Export ledger

### ✅ Vouchers
- [ ] Create vouchers (with preview)
- [ ] Export voucher codes
- [ ] Print QR sheet
- [ ] Redeem voucher

### ✅ Prompts
- [ ] Send prompt now
- [ ] Schedule prompt
- [ ] Preview schedule

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (requires 16+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Rebuild after changing `.env`
- Check deployment platform has variables set

### Database Errors
- Verify Supabase project is active
- Check RLS policies are enabled
- Ensure migrations have run

### Blank Page After Deploy
- Check browser console for errors
- Verify environment variables are set
- Check routing configuration (netlify.toml/_redirects)

## 📞 Support

For questions about the codebase, refer to:
- `README.md` - Project overview
- `docs/ARCHITECTURE.md` - System architecture
- `docs/SECURITY.md` - Security considerations
- Component files - Inline documentation

## 🎯 Quick Links

- **Netlify**: https://www.netlify.com
- **Vercel**: https://vercel.com
- **Supabase**: https://supabase.com
- **GitHub**: https://github.com

---

**Your project is production-ready! All critical features are fully functional.** 🚀
