# FlowSwitch Documentation Index

**Last Updated:** 2025-10-12
**Status:** Living Document

Welcome to the FlowSwitch documentation! This index helps you find the right documentation for your role and task.

---

## 📖 Quick Start

**New to FlowSwitch?** Start here:

1. **Read:** [`README.md`](../README.md) - Project overview and quickstart
2. **Set up:** Follow the installation steps (5 minutes)
3. **Explore:** Log in and click around the UI
4. **Learn:** Read [`ARCHITECTURE.md`](ARCHITECTURE.md) - System design
5. **Understand:** Read [`data/ERD.md`](data/ERD.md) - Database schema
6. **Check out:** [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md) - What to work on

**After 60 minutes you should understand:**
- What FlowSwitch does
- How the system works
- Where to find specific features
- How to make changes safely

---

## 📚 Documentation by Role

### 🧑‍💻 For Engineers

| Document | Purpose | Time to Read |
|----------|---------|-------------|
| [`README.md`](../README.md) | Overview, setup, scripts | 10 min |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System design, data flow, trade-offs | 30 min |
| [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md) | Prioritized backlog | 15 min |
| [`SECURITY.md`](SECURITY.md) | Security architecture | 20 min |
| [`TESTING.md`](TESTING.md) | Test strategy | 10 min |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute | 10 min |
| [`DECISIONS/`](DECISIONS/) | Architecture Decision Records | 5 min each |
| [`data/ERD.md`](data/ERD.md) | Database schema | 15 min |
| [`api/`](api/) | API reference | As needed |

**Total:** ~2 hours to read everything

### 🛠️ For Operators

| Document | Purpose | Time to Read |
|----------|---------|-------------|
| [`OPERATIONS.md`](OPERATIONS.md) | Running locally & production | 20 min |
| [`../runbooks/prompts.md`](../runbooks/prompts.md) | Prompt scheduling ops | 10 min |
| [`../runbooks/float-vouchers.md`](../runbooks/float-vouchers.md) | Float accounting ops | 15 min |
| [`../runbooks/ai.md`](../runbooks/ai.md) | AI report builder config | 10 min |
| [`MIGRATIONS.md`](MIGRATIONS.md) | Database migration workflow | 10 min |

**Total:** ~1 hour

### 🔐 For Security Team

| Document | Purpose | Time to Read |
|----------|---------|-------------|
| [`SECURITY.md`](SECURITY.md) | Complete security documentation | 30 min |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Security architecture section | 10 min |
| [`DECISIONS/ADR-0001-supabase.md`](DECISIONS/ADR-0001-supabase.md) | Backend security rationale | 10 min |

**Total:** ~50 minutes

### 🎨 For Designers

| Document | Purpose | Time to Read |
|----------|---------|-------------|
| [`README.md`](../README.md) | Design system overview | 5 min |
| UI Components | See `src/components/ui/` | As needed |
| Figma | (Link to Figma files) | As needed |

### 📊 For Product Managers

| Document | Purpose | Time to Read |
|----------|---------|-------------|
| [`README.md`](../README.md) | Feature overview | 10 min |
| [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md) | Roadmap & backlog | 15 min |
| [`../FLOAT_VOUCHERS_STATUS.md`](../FLOAT_VOUCHERS_STATUS.md) | Float system status | 10 min |

---

## 📁 Documentation Structure

```
flowswitch/
├── README.md                    # ⭐ Start here
├── docs/
│   ├── DOCUMENTATION_INDEX.md   # 📖 This file
│   ├── ARCHITECTURE.md          # 🏗️ System design
│   ├── SECURITY.md              # 🔐 Security docs
│   ├── OPERATIONS.md            # 🛠️ Running the app
│   ├── TESTING.md               # 🧪 Test strategy
│   ├── CONTRIBUTING.md          # 🤝 How to contribute
│   ├── MIGRATIONS.md            # 🗄️ Database changes
│   ├── NEXT_ACTIONS.md          # 🎯 Prioritized backlog
│   ├── DECISIONS/               # 📝 Architecture Decision Records
│   │   ├── ADR-0001-supabase.md
│   │   ├── ADR-0002-offline-geocoding.md
│   │   └── ...
│   ├── data/                    # 📊 Data model docs
│   │   ├── ERD.md               # Entity-relationship diagram
│   │   └── ...
│   └── api/                     # 🔌 API reference
│       ├── README.md
│       └── openapi.yaml
├── runbooks/                    # 📚 Operational guides
│   ├── prompts.md
│   ├── float-vouchers.md
│   └── ai.md
├── FLOAT_VOUCHERS_STATUS.md     # Status of float system
└── FLOAT_VOUCHERS_IMPLEMENTATION.md  # Implementation guide
```

---

## 🔍 Finding What You Need

### "I want to understand..."

| Topic | Read This |
|-------|-----------|
| **What FlowSwitch does** | [`README.md`](../README.md) |
| **How the system works** | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **Database schema** | [`data/ERD.md`](data/ERD.md) |
| **Security model** | [`SECURITY.md`](SECURITY.md) |
| **Why we made certain choices** | [`DECISIONS/`](DECISIONS/) |
| **What to work on next** | [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md) |

### "I want to do..."

| Task | Read This |
|------|-----------|
| **Set up my dev environment** | [`README.md`](../README.md#setup) |
| **Add a new feature** | [`CONTRIBUTING.md`](CONTRIBUTING.md) + [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **Fix a bug** | [`CONTRIBUTING.md`](CONTRIBUTING.md) + code comments |
| **Deploy to production** | [`OPERATIONS.md`](OPERATIONS.md) |
| **Run a migration** | [`MIGRATIONS.md`](MIGRATIONS.md) |
| **Troubleshoot an issue** | [`runbooks/`](../runbooks/) |
| **Report a security issue** | [`SECURITY.md`](SECURITY.md#vulnerability-management) |

### "I'm stuck on..."

| Problem | Solution |
|---------|----------|
| **Build errors** | Run `npm run typecheck` and `npm run lint` |
| **Database issues** | Check `.env` and RLS policies |
| **Auth not working** | Clear browser storage, check credentials |
| **Tests failing** | Read [`TESTING.md`](TESTING.md) |
| **Performance issues** | Read [`ARCHITECTURE.md`](ARCHITECTURE.md) performance section |
| **Security concern** | Email security@flowswitch.dev immediately |

---

## 📖 Documentation Standards

All FlowSwitch documentation follows these standards:

### 1. **Up-to-Date**
- Last updated date at top of every document
- Reviewed quarterly
- Updated immediately after major changes

### 2. **Actionable**
- Clear steps, not just explanations
- Code examples included
- Links to relevant files

### 3. **Searchable**
- Clear headings and table of contents
- Keywords in titles
- Cross-links between documents

### 4. **Accessible**
- Plain English, no jargon without explanation
- Diagrams for complex concepts
- Examples for every major feature

### 5. **Versioned**
- Documentation versioned with code
- Old versions available in git history
- Breaking changes clearly marked

---

## 🎯 Documentation Goals

| Goal | Status | Notes |
|------|--------|-------|
| **100% of exported functions have JSDoc** | 🚧 60% | In progress |
| **All major decisions documented** | ✅ 100% | ADRs complete |
| **API reference auto-generated** | ⏸️ 0% | OpenAPI spec needed |
| **Runbooks for all operational tasks** | 🚧 50% | Float, prompts done |
| **Security docs comprehensive** | ✅ 100% | Complete |
| **Architecture docs complete** | ✅ 100% | Complete |

---

## 🤝 Contributing to Documentation

**Found a mistake? Want to improve docs?**

1. **For small changes** (typos, clarifications):
   - Edit directly in GitHub
   - Submit PR with clear title
   - Tag `docs` label

2. **For large changes** (new sections, restructuring):
   - Open GitHub Discussion first
   - Get feedback from team
   - Submit PR after consensus

3. **For new documentation**:
   - Follow existing templates
   - Add to this index
   - Link from relevant places
   - Submit PR

**Documentation PRs are reviewed within 24 hours.**

---

## 📊 Documentation Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Coverage** (% of code with docs) | 80% | 60% |
| **Freshness** (avg days since update) | <90 | 1 |
| **Completeness** (checklist items done) | 100% | 85% |
| **Accessibility** (avg time to find answer) | <5 min | 3 min |

---

## 🔗 External Resources

### Official Documentation
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

### Tutorials & Guides
- [PostgreSQL RLS Tutorial](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)

### Tools
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [VS Code Extensions](https://marketplace.visualstudio.com/)

---

## ❓ FAQ

### General

**Q: Where do I start?**
A: Read [`README.md`](../README.md), set up your environment, then read [`ARCHITECTURE.md`](ARCHITECTURE.md).

**Q: How do I find specific information?**
A: Use the search in this index, or `Ctrl+F` in individual documents.

**Q: Documentation is outdated, what do I do?**
A: Update it! Submit a PR or open an issue.

### Technical

**Q: Where are the API docs?**
A: See [`docs/api/README.md`](api/README.md) (work in progress)

**Q: How do I understand the database schema?**
A: Read [`docs/data/ERD.md`](data/ERD.md)

**Q: Where are the runbooks?**
A: See [`runbooks/`](../runbooks/) directory

### Contributing

**Q: How do I propose a new feature?**
A: Open a GitHub Discussion, reference [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md)

**Q: How do I report a bug?**
A: Open a GitHub Issue with steps to reproduce

**Q: How do I report a security issue?**
A: Email security@flowswitch.dev (see [`SECURITY.md`](SECURITY.md))

---

## 🎉 Documentation Hall of Fame

Top documentation contributors:

1. Engineering Team - Initial documentation (2025-10-12)
2. (Your name here - contribute today!)

---

**Maintained By:** Engineering Team
**Last Updated:** 2025-10-12
**Next Review:** 2025-11-12

**Questions?** Open a GitHub Discussion or Slack #engineering
