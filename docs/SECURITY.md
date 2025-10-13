# FlowSwitch Security Documentation

**Last Updated:** 2025-10-12
**Version:** 1.0
**Classification:** Internal

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Network Security](#network-security)
5. [Secrets Management](#secrets-management)
6. [Audit & Compliance](#audit--compliance)
7. [Vulnerability Management](#vulnerability-management)
8. [Incident Response](#incident-response)
9. [Security Checklist](#security-checklist)

---

## Security Overview

FlowSwitch implements **defense-in-depth** security with multiple layers:

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Network (HTTPS, CORS, CSP)          │
├─────────────────────────────────────────────────┤
│  Layer 2: Authentication (JWT, Session)        │
├─────────────────────────────────────────────────┤
│  Layer 3: Authorization (RLS, RBAC)            │
├─────────────────────────────────────────────────┤
│  Layer 4: Data (Encryption, Hashing, PII)      │
├─────────────────────────────────────────────────┤
│  Layer 5: Audit (Logging, Monitoring, Alerts)  │
└─────────────────────────────────────────────────┘
```

### Security Principles

1. **Least Privilege** - Users can only access what they need
2. **Defense in Depth** - Multiple security layers
3. **Fail Secure** - Errors default to deny access
4. **Auditability** - All sensitive actions logged
5. **Privacy by Design** - PII protection built-in

---

## Authentication & Authorization

### 1. Authentication (Supabase Auth)

**Method:** Email + Password with JWT tokens

**Flow:**
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'SecurePass123!'
});

// Supabase returns JWT + refresh token
// JWT stored in localStorage (httpOnly not possible in SPA)
// Auto-refresh on expiry
```

**Token Structure:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "iat": 1697000000,
  "exp": 1697003600,
  "app_metadata": {
    "role": "ADMIN"
  }
}
```

**Security Controls:**
- ✅ Password hashing with bcrypt (cost: 10)
- ✅ JWT signed with HS256 (HMAC-SHA256)
- ✅ Token expiry: 1 hour (configurable)
- ✅ Refresh token rotation
- ✅ Session invalidation on logout
- ✅ Rate limiting: 5 login attempts per minute

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### 2. Authorization (Row Level Security)

**All tables enforce RLS.** PostgreSQL evaluates policies before returning rows.

**Example: Agents Table**
```sql
-- Policy 1: Users can view agents they have access to
CREATE POLICY "users_view_assigned_agents"
  ON agents FOR SELECT
  TO authenticated
  USING (
    -- Admins see all
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    OR
    -- Merchants see their assigned agents
    id IN (
      SELECT agent_id FROM agent_merchants
      WHERE merchant_id IN (
        SELECT merchant_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy 2: Only admins can create agents
CREATE POLICY "admins_create_agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Policy 3: Only admins can update agents
CREATE POLICY "admins_update_agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Policy 4: No one can delete agents (soft delete only)
-- (No DELETE policy = no one can delete)
```

**Key Points:**
- ✅ RLS enforced at database level (impossible to bypass)
- ✅ Policies use `auth.uid()` to get current user
- ✅ USING clause: Filter visible rows
- ✅ WITH CHECK clause: Validate mutations
- ✅ No policy = no access (secure by default)

### 3. Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| **ADMIN** | Full access to all features |
| **MERCHANT** | View/edit assigned agents, vouchers, float |
| **AGENT_READONLY** | View-only access to own data |

**Implementation:**
- Role stored in `users.role` column
- JWT includes role in `app_metadata`
- RLS policies check role before granting access
- UI components conditionally render based on role

---

## Data Protection

### 1. Data Classification

| Category | Examples | Protection |
|----------|----------|------------|
| **Public** | Agent names, merchant names | None |
| **Internal** | Verification locations, schedules | RLS |
| **Confidential** | Phone numbers, national IDs | Encryption + RLS |
| **Secret** | Passwords, API keys, HMAC secrets | Hashed/encrypted, never logged |

### 2. Encryption

#### At Rest
- **Database:** PostgreSQL encrypted at rest (Supabase default)
- **Storage:** File storage encrypted at rest (Supabase default)
- **Passwords:** bcrypt hash (cost: 10)
- **National IDs:** `pgcrypto` encryption (future enhancement)

#### In Transit
- **HTTPS:** All traffic TLS 1.3
- **WebSockets:** WSS for real-time subscriptions
- **API calls:** HTTPS only (HSTS enabled)

#### Field-Level Encryption (Future)

```sql
-- Encrypt national ID on insert
CREATE OR REPLACE FUNCTION encrypt_national_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.national_id_encrypted = pgp_sym_encrypt(
    NEW.national_id,
    current_setting('app.encryption_key')
  );
  NEW.national_id = NULL; -- Clear plaintext
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrypt on select (RLS + encryption)
CREATE POLICY "view_national_id"
  ON agents FOR SELECT
  USING (auth.uid() = owner_id)
  WITH (
    national_id = pgp_sym_decrypt(
      national_id_encrypted::bytea,
      current_setting('app.encryption_key')
    )
  );
```

### 3. PII Handling

**Personally Identifiable Information (PII):**
- National IDs
- Phone numbers
- Email addresses
- Geolocation data
- Verification photos

**Controls:**
- ✅ PII fields marked in TypeScript types
- ✅ Access logged in audit trail
- ✅ Phone numbers normalized to E.164
- ✅ Geolocation rounded to 6 decimal places (~0.1m)
- ✅ Photos stored in private storage buckets (RLS enforced)
- ✅ No PII in logs or error messages
- ✅ GDPR right-to-delete implemented (future)

### 4. Data Retention

| Data Type | Retention | Justification |
|-----------|-----------|---------------|
| **Agents** | Indefinite | Core business data |
| **Verifications** | 7 years | Regulatory compliance |
| **Transactions** | 7 years | Financial audit trail |
| **Audit logs** | 90 days | Operational needs |
| **Session tokens** | 1 hour | Security best practice |
| **Refresh tokens** | 30 days | User convenience |

---

## Network Security

### 1. HTTPS & TLS

**Configuration:**
- TLS 1.3 only (1.2 fallback)
- HSTS enabled (max-age: 31536000)
- HTTPS redirect enforced
- No mixed content allowed

### 2. CORS (Cross-Origin Resource Sharing)

**Supabase Configuration:**
```json
{
  "allowed_origins": [
    "https://app.flowswitch.dev",
    "http://localhost:5173"
  ],
  "allowed_methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
  "allowed_headers": [
    "Content-Type",
    "Authorization",
    "X-Client-Info",
    "apikey"
  ],
  "max_age": 3600
}
```

**Edge Functions:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Restrict in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};
```

### 3. Content Security Policy (CSP)

**Recommended Headers:**
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
```

**Note:** `unsafe-inline` and `unsafe-eval` required for Vite HMR in dev.

### 4. Rate Limiting

| Endpoint | Limit | Window | Action |
|----------|-------|--------|--------|
| `POST /auth/login` | 5 | 1 minute | Return 429 |
| `POST /vouchers/redeem` | 30 | 1 minute | Return 429 |
| `POST /vouchers/create` | 100 | 1 hour | Return 429 |
| All other endpoints | 1000 | 1 hour | Return 429 |

**Implementation:**
- Supabase Edge Functions with Upstash Redis
- Sliding window algorithm
- Per-user or per-IP tracking
- `Retry-After` header in 429 response

---

## Secrets Management

### 1. Environment Variables

**Client-Side (.env):**
```bash
# Safe to expose (RLS enforces security)
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... # Public key

# Optional (user-provided)
VITE_OPENAI_API_KEY=sk-proj-... # Optional
```

**Server-Side (Supabase Secrets):**
```bash
# NEVER expose to client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Admin key
VOUCHER_HMAC_SECRET=random-256-bit-key
ENCRYPTION_KEY=another-random-256-bit-key
```

### 2. Secret Rotation

**Schedule:**
- JWT signing key: Every 90 days
- HMAC secrets: Every 180 days
- Database passwords: Every 365 days
- API keys: On revocation or compromise

**Process:**
1. Generate new secret
2. Deploy new secret alongside old (dual-running)
3. Rotate clients to new secret
4. Decommission old secret after 30 days

### 3. Secret Storage

**Never commit secrets to git:**
```bash
# .gitignore
.env
.env.local
.env.production
*.key
*.pem
secrets/
```

**Use Supabase Vault for server secrets:**
```sql
-- Store secret
SELECT vault.create_secret('my-secret-key', 'value');

-- Retrieve secret
SELECT decrypted_secret FROM vault.decrypted_secrets
WHERE name = 'my-secret-key';
```

---

## Audit & Compliance

### 1. Audit Logging

**What to Log:**
- ✅ All authentication events (login, logout, failed attempts)
- ✅ All PII access (view national ID, phone number)
- ✅ All mutations (create, update, delete)
- ✅ All privilege escalations (role changes)
- ✅ All float/voucher operations (issue, redeem, void)

**What NOT to Log:**
- ❌ Passwords (even hashed)
- ❌ JWT tokens (contain sensitive claims)
- ❌ HMAC secrets
- ❌ Full PII values (log masked: `+27******8901`)

**Log Format:**
```json
{
  "timestamp": "2025-10-12T14:35:00Z",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "action": "voucher.redeem",
  "resource_type": "voucher",
  "resource_id": "voucher-uuid",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "status": "success",
  "details": {
    "voucher_code": "FS-XXXX-YYYY",
    "redeemer": "merchant-uuid",
    "amount": 100.00
  }
}
```

### 2. Compliance

**Data Protection Regulations:**
- **GDPR** (EU): Right to access, delete, export
- **POPIA** (South Africa): Lawful data processing
- **NDPR** (Nigeria): Consent and notification

**Implementation:**
```typescript
// GDPR: Right to access
async function exportUserData(userId: string) {
  const agents = await getAgents({ userId });
  const verifications = await getVerifications({ userId });
  const transactions = await getTransactions({ userId });
  return { agents, verifications, transactions };
}

// GDPR: Right to delete
async function deleteUserData(userId: string) {
  // Soft delete (retain for audit)
  await updateUser(userId, { status: 'deleted', deletedAt: new Date() });
  // Anonymize PII
  await anonymizeUserPII(userId);
}
```

### 3. Security Audits

**Schedule:**
- Internal audit: Quarterly
- External audit: Annually
- Penetration test: Annually

**Checklist:**
- [ ] Review all RLS policies
- [ ] Scan for SQL injection vulnerabilities
- [ ] Test authentication bypass attempts
- [ ] Verify encryption at rest and in transit
- [ ] Check for exposed secrets in git history
- [ ] Audit third-party dependencies (npm audit)
- [ ] Review access control logs

---

## Vulnerability Management

### 1. Dependency Scanning

**Tools:**
- `npm audit` (built-in)
- Dependabot (GitHub)
- Snyk (CI/CD integration)

**Process:**
```bash
# Check for vulnerabilities
npm audit

# Auto-fix non-breaking vulnerabilities
npm audit fix

# Review breaking changes
npm audit fix --force # Use with caution
```

**Policy:**
- **Critical:** Fix within 24 hours
- **High:** Fix within 7 days
- **Medium:** Fix within 30 days
- **Low:** Fix in next release

### 2. Secure Coding Practices

**Input Validation:**
```typescript
// Always validate inputs with Zod
const AgentSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164
  email: z.string().email(),
  national_id: z.string().regex(/^[A-Z0-9]{6,20}$/),
});

// Validate before using
const agent = AgentSchema.parse(input);
```

**SQL Injection Prevention:**
```typescript
// ✅ GOOD: Parameterized queries (Supabase client)
const { data } = await supabase
  .from('agents')
  .select('*')
  .eq('id', agentId); // Parameterized

// ❌ BAD: String concatenation
const query = `SELECT * FROM agents WHERE id = '${agentId}'`; // NEVER DO THIS
```

**XSS Prevention:**
```typescript
// ✅ GOOD: React auto-escapes
<div>{agentName}</div>

// ❌ BAD: dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD: Sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 3. Responsible Disclosure

**How to Report:**
1. Email: security@flowswitch.dev
2. Include: Description, steps to reproduce, impact
3. Do NOT disclose publicly until patched

**Response Timeline:**
- Acknowledgment: Within 24 hours
- Initial assessment: Within 7 days
- Fix deployed: Within 30 days (critical), 90 days (non-critical)
- Public disclosure: After fix deployed + 30 days

**Rewards:**
- Critical: $500 - $5,000
- High: $200 - $1,000
- Medium: $100 - $500
- Low: Recognition in Hall of Fame

---

## Incident Response

### 1. Incident Types

| Type | Examples | Severity |
|------|----------|----------|
| **P0 (Critical)** | Data breach, service outage | Alert CTO immediately |
| **P1 (High)** | XSS vulnerability, auth bypass | Fix within 24 hours |
| **P2 (Medium)** | CSRF, rate limit bypass | Fix within 7 days |
| **P3 (Low)** | UI bug, slow query | Fix in next release |

### 2. Response Playbook

**1. Detection**
- Monitoring alerts (Sentry, Supabase logs)
- User report
- Security scan (npm audit, Snyk)

**2. Containment**
- Disable affected feature (feature flag)
- Revoke compromised credentials
- Block malicious IPs

**3. Investigation**
- Review audit logs
- Identify root cause
- Assess impact (users affected, data exposed)

**4. Remediation**
- Deploy fix
- Verify fix in staging
- Deploy to production
- Monitor for regressions

**5. Communication**
- Notify affected users (within 72 hours for GDPR)
- Post-mortem report (internal)
- Security advisory (public, if applicable)

**6. Prevention**
- Add tests to prevent regression
- Update documentation
- Train team on lessons learned

### 3. Contact List

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Security Lead** | security@flowswitch.dev | Overall incident response |
| **CTO** | cto@flowswitch.dev | Decision-maker for P0/P1 |
| **DevOps** | devops@flowswitch.dev | Infrastructure access |
| **Legal** | legal@flowswitch.dev | GDPR compliance |

---

## Security Checklist

### Development

- [ ] All inputs validated with Zod
- [ ] No SQL concatenation (use parameterized queries)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No secrets in code (use environment variables)
- [ ] All RLS policies tested
- [ ] All API endpoints require authentication
- [ ] All mutations logged in audit trail

### Pre-Deployment

- [ ] `npm audit` clean (no critical/high vulnerabilities)
- [ ] TypeScript `strict` mode enabled
- [ ] ESLint clean (no warnings)
- [ ] All tests passing
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info

### Production

- [ ] HTTPS enforced (HSTS enabled)
- [ ] Database backups enabled (daily)
- [ ] Monitoring alerts configured (Sentry)
- [ ] Audit logs enabled
- [ ] Incident response plan documented
- [ ] Security contact published
- [ ] Vulnerability disclosure policy published

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [GDPR Compliance Guide](https://gdpr.eu/)

---

**Document Maintained By:** Security Team
**Last Review:** 2025-10-12
**Next Review:** 2025-11-12
