# FlowSwitch

**Agent Management & Field Operations Platform**

FlowSwitch is a production-ready platform for managing field agents, merchants, float accounts, and voucher systems across emerging markets. Built for reliability, offline-first workflows, and regulatory compliance.

---

## 🎯 What It Does

FlowSwitch enables organizations to:
- **Manage field agents** with verification workflows, geolocation tracking, and performance analytics
- **Schedule intelligent prompts** for data collection with quiet-hour avoidance and agent fatigue prevention
- **Operate float accounts** with double-entry accounting, holds, and transaction audit trails
- **Issue & redeem vouchers** with checksums, purpose-binding, and closed-network security
- **Build AI-powered reports** with offline-first deterministic fallbacks and optional OpenAI refinement
- **Track merchant relationships** with many-to-many agent assignments and territory mapping

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + TypeScript | Type safety, modern hooks, excellent ecosystem |
| **Backend** | Supabase (PostgreSQL) | Managed DB, auth, RLS, real-time subscriptions |
| **UI Framework** | Tailwind CSS + Lucide Icons | Utility-first, minimal bundle, consistent design |
| **Charts** | Recharts | Lightweight, React-native, customizable |
| **Maps** | Leaflet + GeoJSON | Offline-capable, no API keys required |
| **Forms** | Zod validation | Type-safe schemas, runtime validation |
| **Phone** | libphonenumber-js | International format handling |
| **Build** | Vite | Fast HMR, optimized production builds |

### Repository Structure

```
flowswitch/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── chat/         # Prompt builder & context panels
│   │   └── ui/           # Design system (Card, Button, Modal, etc.)
│   ├── contexts/         # React contexts (Auth, Theme)
│   ├── lib/              # Core utilities & services
│   │   ├── api.ts        # API client & error handling
│   │   ├── supabase.ts   # Supabase client singleton
│   │   ├── floatApi.ts   # Float & voucher operations
│   │   ├── voucherCode.ts # Code generation & checksums
│   │   ├── scheduling.ts  # Prompt scheduling algorithms
│   │   └── geo/          # Geocoding & clustering
│   ├── pages/            # Route components
│   ├── services/         # Business logic services
│   │   ├── aiReportService.ts  # Offline-first AI builder
│   │   └── reportBuilder.ts     # Report generation
│   └── types/            # TypeScript type definitions
├── supabase/
│   └── migrations/       # Database schema & seed data
├── public/
│   └── data/            # Offline geocoding datasets (GeoJSON)
├── docs/                # Deep technical documentation
└── .env                 # Environment configuration (not in git)
```

---

## 🚀 Quickstart

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)

### Setup

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd flowswitch
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Database Setup**
   - All migrations are managed via Supabase
   - Migrations auto-apply on first connection
   - System float account seeded with R1,000,000

4. **Start Development**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

5. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

### First Login

Use these test credentials to explore:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@flowswitch.dev | Admin123! |
| Merchant | merchant@flowswitch.dev | Merchant123! |

---

## 📋 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | ✅ | - | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | - | Public anon key (safe for client) |
| `VITE_OPENAI_API_KEY` | ⏸️ | - | Optional: Enables AI report refinement |

**Security Notes:**
- NEVER commit `.env` to git
- All secrets are client-side only (Supabase RLS enforces server-side security)
- OpenAI key is optional; system works offline without it

---

## 🗄️ Database

### Schema Overview

**15 Tables** across 5 domains:

#### 1. **Users & Auth** (Supabase managed)
- `users` - Authentication & profile

#### 2. **Agents** (4 tables)
- `agents` - Field agent profiles
- `agent_verifications` - ID verification records
- `verification_points` - Known verification locations

#### 3. **Merchants** (2 tables)
- `merchants` - Merchant/shop profiles
- `agent_merchants` - Many-to-many assignments

#### 4. **Float & Vouchers** (5 tables)
- `float_accounts` - Account balances by owner
- `float_transactions` - Immutable ledger
- `float_holds` - Temporary reserves for vouchers
- `vouchers` - Issued voucher codes
- `voucher_redeems` - Redemption history

#### 5. **Prompts** (3 tables)
- `prompt_schedules` - Recurring schedules
- `prompt_occurrences` - Materialized instances
- `prompt_dispatches` - Delivery records

**See:** `docs/data/ERD.md` for detailed entity-relationship diagram

### Migrations

All migrations in `supabase/migrations/` with timestamps:
```
20251011083112_create_core_schema.sql
20251011084014_setup_auth_users.sql
20251012120000_create_float_vouchers_system.sql
...
```

**See:** `docs/MIGRATIONS.md` for migration workflow

---

## 🔐 Security

### Row Level Security (RLS)

**All tables have RLS enabled.** Policies enforce:
- Users can only see/edit their own data
- Agents can only see assigned merchants
- Float operations check ownership
- Voucher redemptions verify eligibility

### Secrets Management

- ✅ `.env` excluded from git
- ✅ Supabase keys are safe for client-side (RLS enforces security)
- ✅ No API keys hardcoded
- ✅ Service role key NEVER exposed to frontend

### Data Protection

- Phone numbers normalized to E.164
- National IDs stored encrypted (future: field-level encryption)
- Geolocation data rounded to 6 decimal places (~0.1m precision)
- PII access logged in audit trail

**See:** `docs/SECURITY.md` for comprehensive security documentation

---

## 📚 Documentation

### For Engineers

| Document | Purpose |
|----------|---------|
| `docs/ARCHITECTURE.md` | System design, data flow, trade-offs |
| `docs/DECISIONS/` | Architecture Decision Records (ADRs) |
| `docs/data/ERD.md` | Entity-relationship diagram & invariants |
| `docs/api/` | OpenAPI spec + curl examples |
| `docs/TESTING.md` | Test strategy & how to run tests |
| `docs/MIGRATIONS.md` | Database change workflow |

### For Operators

| Document | Purpose |
|----------|---------|
| `docs/OPERATIONS.md` | Running locally & in production |
| `runbooks/prompts.md` | Scheduling, quiet hours, retries |
| `runbooks/float-vouchers.md` | Float accounting, reconciliation |
| `runbooks/ai.md` | AI report builder config |

### For Contributors

| Document | Purpose |
|----------|---------|
| `docs/CONTRIBUTING.md` | Branching, commits, PR process |
| `docs/NEXT_ACTIONS.md` | Prioritized backlog by domain |

---

## 🎨 Design System

FlowSwitch uses a custom design system built on Tailwind:

### Brand Colors

```css
--brand-green: #10b981 (emerald-500)
--brand-cyan: #06b6d4 (cyan-500)
--gradient-brand: linear-gradient(135deg, #10b981, #06b6d4)
```

### Key Components

- **Card** - Glass-morphism container with shadow-soft
- **Button** - Gradient variants with shadow-glow on hover
- **Modal** - Backdrop blur with smooth slide-in
- **Badge** - Status indicators with gradient borders
- **KPICard** - Dashboard metric display with icons

**See:** `src/components/ui/` for full component library

---

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build verification
npm run build
```

**See:** `docs/TESTING.md` for test strategy

---

## 📊 Key Features

### 1. Agent Management
- ✅ Full CRUD with verification workflows
- ✅ Geolocation tracking with offline reverse-geocode
- ✅ Performance analytics & KPIs
- ✅ Merchant assignments (M2M)

### 2. Prompt Scheduling
- ✅ Even-spacing algorithm with 5-minute rounding
- ✅ Quiet-hour avoidance (22:00-06:00)
- ✅ Weekend skip with Monday rollover
- ✅ Preview before creation
- ✅ DST-aware calculations

### 3. Float & Vouchers
- ✅ Double-entry accounting (balance = sum of transactions)
- ✅ Hold system prevents over-issuance
- ✅ Single-use vouchers with HMAC checksums
- ✅ Purpose-bound redemptions
- ✅ Expiry tracking & auto-release
- ✅ Geolocation logging on redeem

### 4. AI Report Builder
- ✅ Offline deterministic summarization
- ✅ Optional OpenAI refinement
- ✅ Context-aware prompt building
- ✅ Export to PDF/CSV

### 5. Offline-First Geocoding
- ✅ GeoJSON datasets for ZA & UG
- ✅ Haversine distance calculations
- ✅ Hierarchical clustering (site/block/area)
- ✅ Nearest major place fallback

---

## 🔧 Development

### Scripts

```bash
npm run dev          # Start dev server (auto-reload)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript validation
```

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** with React hooks plugin
- **Prettier** (via editor integration)
- **Conventional Commits** for changelog generation

### Branching Strategy

```
main              # Production-ready code
├── develop       # Integration branch
├── feature/*     # New features
├── fix/*         # Bug fixes
└── docs/*        # Documentation updates
```

**See:** `docs/CONTRIBUTING.md` for detailed guidelines

---

## 📈 Performance

### Bundle Size

```
index.html           0.48 kB
index.css           55.33 kB (gzip: 13.66 kB)
index.js           585.66 kB (gzip: 167.07 kB)
```

### Optimizations

- ✅ Route-based code splitting (future)
- ✅ Tree-shaking via Vite
- ✅ CSS purging via Tailwind
- ✅ Offline GeoJSON (no API calls)
- ✅ Debounced search inputs
- ✅ Virtualized long lists (future)

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `VITE_SUPABASE_URL` to production Supabase
- [ ] Set `VITE_SUPABASE_ANON_KEY` to production key
- [ ] Run `npm run build`
- [ ] Verify build output in `dist/`
- [ ] Deploy to CDN/static host (Vercel, Netlify, etc.)
- [ ] Configure CORS in Supabase dashboard
- [ ] Run smoke tests on live environment

**See:** `docs/OPERATIONS.md` for deployment guide

---

## 🤝 Contributing

We welcome contributions! Please see:

1. **Code:** `docs/CONTRIBUTING.md`
2. **Next Actions:** `docs/NEXT_ACTIONS.md`
3. **Architecture:** `docs/ARCHITECTURE.md`

### Quick Contribution Flow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes with tests
# 3. Commit with conventional format
git commit -m "feat: add bulk agent import"

# 4. Push and create PR
git push origin feature/my-feature
```

---

## 📞 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Security:** See `docs/SECURITY.md` for responsible disclosure

---

## 📄 License

Proprietary - All rights reserved

---

## 🎉 Built By

**Aever** - People Powered Platforms
[https://aever.com](https://aever.co.za)

---

## 📖 First 60 Minutes Checklist

New to the codebase? Start here:

- [ ] Read this README
- [ ] Set up environment (`.env` from `.env.example`)
- [ ] Run `npm install && npm run dev`
- [ ] Log in and explore the UI
- [ ] Read `docs/ARCHITECTURE.md` for system design
- [ ] Read `docs/data/ERD.md` for database schema
- [ ] Browse `src/pages/` to understand routes
- [ ] Check `docs/NEXT_ACTIONS.md` for open tasks
- [ ] Read ADRs in `docs/DECISIONS/` for context
- [ ] Run `npm run build` to verify everything compiles

**After 60 minutes you should understand:**
- What FlowSwitch does (agent management + float + vouchers)
- How data flows (React → Supabase → RLS)
- Where to find specific features (pages/ and lib/)
- How to make changes safely (migrations, RLS, types)

---

## 🗺️ Roadmap

**Current Version: 1.0 (75% Complete)**

### ✅ Complete
- Core agent management
- Merchant M2M relationships
- Float & voucher backend (100%)
- Prompt scheduling
- AI report builder
- Offline geocoding
- Authentication & RLS

### 🚧 In Progress
- Float & voucher UI (accounts table, modals)
- Voucher creation wizard
- Redemption interface

### 📋 Planned
- Calendar view for schedules
- Bulk CSV imports
- Advanced analytics dashboard
- Multilingual support
- Mobile app (React Native)

**See:** `docs/NEXT_ACTIONS.md` for detailed backlog

---

**FlowSwitch** - Empowering field operations with reliable, offline-first technology.
