# FlowSwitch - Next Actions & Backlog

**Last Updated:** 2025-10-12
**Status:** Living Document

This document contains the prioritized backlog of features, enhancements, and technical debt organized by domain and impact/effort.

---

## Legend

**Impact:** `H` (High) | `M` (Medium) | `L` (Low)
**Effort:** `S` (Small: <1 day) | `M` (Medium: 1-3 days) | `L` (Large: >3 days)
**Status:** `🎯 Ready` | `🚧 In Progress` | `✅ Done` | `⏸️ Blocked`

---

## 🎨 UI/UX Enhancements

### 1. Complete Float & Vouchers UI
**Impact:** `H` | **Effort:** `L` | **Status:** `🚧 In Progress`

**Description:**
Build out the full Float & Vouchers interface with tables, modals, and interactive forms.

**Components Needed:**
- `FloatAccountsTable` - List all accounts with filters
- `AssignFloatModal` - Atomic float transfer to agents
- `FloatAccountDrawer` - Ledger view with transactions + holds
- `VouchersTable` - List vouchers with status filters
- `CreateVouchersModal` - Issue vouchers with preview
- `RedeemVoucherDrawer` - Scan/enter code, verify, redeem
- `VoucherPrintSheet` - Print QR codes for vouchers

**Files to Touch:**
- `src/pages/Float.tsx` (expand from placeholder)
- `src/components/float/` (new directory)
- `src/lib/floatApi.ts` (already complete)

**Acceptance Criteria:**
- [ ] Float accounts list with balance, available, holds
- [ ] Assign float modal with validation
- [ ] Create vouchers with preview (sample codes, warnings)
- [ ] Redeem vouchers with checksum verification
- [ ] Print layout for QR codes
- [ ] All operations use existing `floatApi` methods

**Priority:** 🔥 **HIGHEST**

---

### 2. Calendar View for Prompt Schedules
**Impact:** `H` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Add a visual calendar view showing all scheduled prompts by agent and date.

**Features:**
- Monthly calendar with day cells
- Color-coded by agent or status
- Click day to see all prompts
- Drag-and-drop to reschedule (future)
- Export calendar to iCal

**Files to Touch:**
- `src/pages/PromptCalendar.tsx` (new)
- `src/components/calendar/` (new directory)
- `src/lib/scheduling.ts` (query helper)

**Dependencies:**
- Consider `@fullcalendar/react` or build custom

**Acceptance Criteria:**
- [ ] Month view with prompt occurrences
- [ ] Day view with hourly breakdown
- [ ] Filter by agent, status, merchant
- [ ] Click prompt to see details
- [ ] Export to iCal format

---

### 3. Bulk Agent Import from CSV
**Impact:** `H` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Allow admins to import hundreds of agents via CSV upload with column mapping and validation.

**Features:**
- CSV file upload with drag-and-drop
- Auto-detect columns or manual mapping
- Preview table with validation errors
- Bulk insert with progress bar
- Error report download

**Files to Touch:**
- `src/pages/AgentImport.tsx` (new)
- `src/lib/import.ts` (new - CSV parsing)
- `src/lib/api.ts` (bulk insert method)

**Libraries:**
- `papaparse` for CSV parsing

**Acceptance Criteria:**
- [ ] Upload CSV (max 10MB)
- [ ] Map columns to Agent fields
- [ ] Validate all rows (phone, email, national ID)
- [ ] Show validation errors before import
- [ ] Import 1000+ agents in <5 seconds
- [ ] Download error report if failures

---

### 4. Advanced Dashboard Analytics
**Impact:** `M` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Enhance dashboard with interactive charts, trend analysis, and drill-down capabilities.

**Features:**
- Time-series charts (verifications over time)
- Agent performance leaderboard
- Merchant distribution map
- Verification success rate by region
- Customizable date range filters

**Files to Touch:**
- `src/pages/Dashboard.tsx` (expand)
- `src/components/charts/` (new directory)
- `src/lib/analytics.ts` (new - aggregations)

**Acceptance Criteria:**
- [ ] Area chart: Verifications over last 30 days
- [ ] Bar chart: Top 10 agents by activity
- [ ] Donut chart: Agent status distribution
- [ ] Map: Verification density heatmap
- [ ] Export charts to PNG/PDF

---

### 5. Dark Mode Refinements
**Impact:** `L` | **Effort:** `S` | **Status:** `🎯 Ready`

**Description:**
Polish dark mode with better contrast ratios and consistent color usage.

**Tasks:**
- [ ] Audit all components for WCAG AA compliance
- [ ] Fix low-contrast text on dark backgrounds
- [ ] Add smooth theme transition animations
- [ ] Persist theme preference to localStorage
- [ ] Add system preference detection on first load

**Files to Touch:**
- `src/index.css` (dark mode Tailwind classes)
- `src/providers/ThemeContext.tsx` (persistence)
- All components (audit pass)

---

## 📊 Data & Backend

### 6. Expand Offline Geocoding Coverage
**Impact:** `M` | **Effort:** `L` | **Status:** `🎯 Ready`

**Description:**
Add more countries to offline geocoding datasets (Kenya, Tanzania, Nigeria).

**Tasks:**
- [ ] Download GeoJSON for KE, TZ, NG admin boundaries
- [ ] Extract major places (cities >10K population)
- [ ] Optimize file sizes (simplify geometries to <1MB per country)
- [ ] Update `detailedGeocoder.ts` to handle new countries
- [ ] Add country detection by lat/lng

**Files to Touch:**
- `public/data/ke_admin.geojson` (new)
- `public/data/tz_admin.geojson` (new)
- `public/data/ng_admin.geojson` (new)
- `src/lib/geo/detailedGeocoder.ts` (extend)

**Data Sources:**
- [Natural Earth Data](https://www.naturalearthdata.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [GeoNames](http://www.geonames.org/)

---

### 7. Database Performance Optimization
**Impact:** `M` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Add indexes and optimize queries for large datasets (100K+ agents).

**Tasks:**
- [ ] Add composite indexes on `(agent_id, created_at)` for verifications
- [ ] Partition `float_transactions` by month (time-series data)
- [ ] Optimize RLS policies (avoid sequential scans)
- [ ] Add EXPLAIN ANALYZE to slow queries
- [ ] Set up query monitoring (pg_stat_statements)

**Files to Touch:**
- `supabase/migrations/add_performance_indexes.sql` (new)
- RLS policies (rewrite if needed)

**Acceptance Criteria:**
- [ ] Agent list loads in <500ms for 10K agents
- [ ] Verification history <1s for 1K records
- [ ] Float ledger <1s for 10K transactions
- [ ] No sequential scans on filtered queries

---

### 8. Field-Level Encryption for PII
**Impact:** `H` | **Effort:** `M` | **Status:** `⏸️ Blocked` (needs key management design)

**Description:**
Encrypt sensitive fields (national IDs, phone numbers) at rest using PostgreSQL pgcrypto.

**Tasks:**
- [ ] Design key management strategy (Supabase Vault)
- [ ] Migrate `national_id` to encrypted column
- [ ] Create encryption/decryption helpers
- [ ] Update all queries to decrypt on SELECT
- [ ] Audit RLS policies for encrypted fields

**Files to Touch:**
- `supabase/migrations/add_encryption.sql` (new)
- `src/lib/encryption.ts` (new)
- All queries accessing PII

**Security Review Required:** ✅

---

## 🤖 AI & Reports

### 9. Multilingual AI Reports
**Impact:** `M` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Support English, Swahili, and Zulu language outputs for AI reports.

**Tasks:**
- [ ] Add i18n library (`react-i18next`)
- [ ] Create translation files for narrative templates
- [ ] Add language selector to report builder
- [ ] Pass language to OpenAI prompt (if used)
- [ ] Translate UI labels and prompts

**Files to Touch:**
- `src/i18n/` (new directory)
- `src/services/aiReportService.ts` (language param)
- `src/pages/AIReportBuilder.tsx` (language selector)

**Languages:**
- English (en)
- Swahili (sw)
- Zulu (zu)
- Afrikaans (af)

---

### 10. Route Analytics & Drift Detection
**Impact:** `H` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Analyze agent movement patterns and detect drift from assigned territories.

**Features:**
- Calculate convex hull of verification points
- Detect outliers (>10km from primary cluster)
- Flag agents working outside assigned districts
- Generate drift score (0-100)
- Alert admins on high drift

**Files to Touch:**
- `src/lib/geo/routeAnalytics.ts` (new)
- `src/pages/AgentDetail.tsx` (add drift score)
- `src/services/aiReportService.ts` (include in report)

**Algorithms:**
- Convex hull (Graham scan)
- DBSCAN clustering (distance-based)
- Statistical outlier detection (z-score)

**Acceptance Criteria:**
- [ ] Drift score calculated for each agent
- [ ] Visual map showing assigned vs actual territory
- [ ] Alert when drift >50
- [ ] Export route history to GPX

---

## 🔐 Security & Compliance

### 11. Audit Log Viewer
**Impact:** `M` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Build admin-only UI to view all data access and mutations.

**Features:**
- Filterable table of all DB operations
- Group by user, table, action type
- Export audit log to CSV
- Retention policy (90 days)
- Real-time updates

**Files to Touch:**
- `src/pages/AuditLog.tsx` (new)
- `supabase/migrations/add_audit_logging.sql` (triggers)
- `src/lib/api.ts` (audit log queries)

**Tables:**
- `audit_log` (user_id, table_name, action, old_data, new_data, timestamp)

**Acceptance Criteria:**
- [ ] Log all INSERT/UPDATE/DELETE on sensitive tables
- [ ] Show user email, action, timestamp
- [ ] Filter by date range, user, table
- [ ] Export to CSV
- [ ] Auto-delete logs older than 90 days

---

### 12. Rate Limiting & DDoS Protection
**Impact:** `H` | **Effort:** `S` | **Status:** `🎯 Ready`

**Description:**
Implement rate limiting on voucher redemption and API endpoints.

**Tasks:**
- [ ] Add Supabase Edge Function middleware for rate limiting
- [ ] Limit voucher redemptions: 30/min per account
- [ ] Limit API calls: 100/min per user
- [ ] Return 429 status with Retry-After header
- [ ] Log rate limit violations

**Files to Touch:**
- `supabase/functions/_shared/rateLimit.ts` (new)
- `src/lib/floatApi.ts` (handle 429 errors)

**Implementation:**
- Use Supabase Edge Functions
- Store rate limit counters in Redis (Upstash)
- Sliding window algorithm

---

## 🛠️ Operations & DevOps

### 13. Supabase Edge Functions for Scheduled Jobs
**Impact:** `H` | **Effort:** `M` | **Status:** `🎯 Ready`

**Description:**
Move scheduled tasks (prompt dispatch, voucher expiry) to Edge Functions.

**Tasks:**
- [ ] Create Edge Function for voucher expiry (runs nightly)
- [ ] Create Edge Function for prompt dispatch (runs every 5 min)
- [ ] Set up cron triggers via Supabase
- [ ] Add error handling + retries
- [ ] Monitor function logs

**Files to Touch:**
- `supabase/functions/expire-vouchers/index.ts` (new)
- `supabase/functions/dispatch-prompts/index.ts` (new)

**Cron Schedule:**
- Expire vouchers: `0 2 * * *` (daily at 2 AM)
- Dispatch prompts: `*/5 * * * *` (every 5 minutes)

---

### 14. Real-Time Updates via Subscriptions
**Impact:** `M` | **Effort:** `S` | **Status:** `🎯 Ready`

**Description:**
Use Supabase real-time subscriptions to auto-refresh data without polling.

**Features:**
- Dashboard KPIs update live
- Agent list refreshes on new agents
- Voucher status updates on redeem
- Notification toasts on background changes

**Files to Touch:**
- `src/providers/RealtimeContext.tsx` (new)
- `src/pages/Dashboard.tsx` (subscribe)

**Example:**
```typescript
supabase
  .channel('agents')
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'agents' },
      (payload) => { /* refresh list */ })
  .subscribe();
```

---

### 15. Performance Monitoring with Sentry
**Impact:** `M` | **Effort:** `S` | **Status:** `🎯 Ready`

**Description:**
Add error tracking, performance monitoring, and user session replay.

**Tasks:**
- [ ] Create Sentry account (free tier)
- [ ] Add `@sentry/react` SDK
- [ ] Configure error boundaries
- [ ] Track custom events (voucher redeem, float assign)
- [ ] Set up alerts for error rate >5%

**Files to Touch:**
- `src/main.tsx` (Sentry init)
- `.env` (add `VITE_SENTRY_DSN`)
- `src/lib/monitoring.ts` (new - custom events)

**Metrics to Track:**
- Error rate
- Page load time
- API latency (p50, p95, p99)
- User session length

---

## 🎯 Priority Matrix

### Must Have (Next Sprint)
1. ✅ **Complete Float & Vouchers UI** (H/L) - Core feature
2. ✅ **Supabase Edge Functions** (H/M) - Reliability
3. ✅ **Bulk Agent Import** (H/M) - User request

### Should Have (Next Quarter)
4. **Calendar View** (H/M) - UX improvement
5. **Advanced Dashboard** (M/M) - Analytics
6. **Audit Log Viewer** (M/M) - Compliance
7. **Database Optimization** (M/M) - Performance
8. **Real-Time Updates** (M/S) - UX improvement

### Nice to Have (Backlog)
9. **Multilingual Reports** (M/M)
10. **Route Analytics** (H/M)
11. **Dark Mode Refinements** (L/S)
12. **Expand Geocoding** (M/L)
13. **Field-Level Encryption** (H/M) - Blocked
14. **Rate Limiting** (H/S)
15. **Sentry Monitoring** (M/S)

---

## 🚀 Quick Wins (High Impact, Low Effort)

| Task | Impact | Effort | Files |
|------|--------|--------|-------|
| **Real-Time Updates** | M | S | `RealtimeContext.tsx` |
| **Rate Limiting** | H | S | Edge Function middleware |
| **Sentry Monitoring** | M | S | `main.tsx` + SDK |
| **Dark Mode Polish** | L | S | CSS audit |

---

## 🧪 Technical Debt

### High Priority
- [ ] Add unit tests for `scheduling.ts` (coverage <20%)
- [ ] Add integration tests for Float API (coverage 0%)
- [ ] Fix TypeScript `any` types in `floatApi.ts` (12 occurrences)
- [ ] Refactor `AgentDetail.tsx` (500+ lines, split into sub-components)
- [ ] Add error boundaries to all top-level routes

### Medium Priority
- [ ] Extract reusable table components (pagination, sorting, filters)
- [ ] Consolidate duplicate API error handling
- [ ] Add Storybook for UI component documentation
- [ ] Set up E2E tests with Playwright
- [ ] Add pre-commit hooks (lint, typecheck)

### Low Priority
- [ ] Upgrade to React 19 (when stable)
- [ ] Migrate to Vite 6 (when released)
- [ ] Replace `clsx` with `tailwind-merge`
- [ ] Add bundle size monitoring (bundlewatch)
- [ ] Set up Renovate for dependency updates

---

## 📝 Documentation Gaps

- [ ] API reference (OpenAPI spec) - **See: `docs/api/README.md`**
- [ ] Runbook for float reconciliation - **See: `runbooks/float-vouchers.md`**
- [ ] Runbook for prompt scheduling - **See: `runbooks/prompts.md`**
- [ ] Contributing guide - **See: `docs/CONTRIBUTING.md`**
- [ ] Security policy - **See: `docs/SECURITY.md`**
- [ ] Component documentation (Storybook)
- [ ] Video walkthrough for new engineers
- [ ] Troubleshooting guide

---

## 🤝 How to Contribute

1. **Pick a task** from "Must Have" or "Quick Wins"
2. **Check status** - Only work on `🎯 Ready` items
3. **Create branch** - `feature/task-name` or `fix/task-name`
4. **Read context** - Check linked files and dependencies
5. **Write tests** - Unit tests for logic, integration tests for APIs
6. **Update docs** - Add JSDoc comments, update README if needed
7. **Submit PR** - Tag relevant reviewers, link to this task

**Questions?** Create a GitHub Discussion or Slack the team.

---

**Document Maintained By:** Engineering Team
**Last Updated:** 2025-10-12
**Next Review:** Weekly during sprint planning
