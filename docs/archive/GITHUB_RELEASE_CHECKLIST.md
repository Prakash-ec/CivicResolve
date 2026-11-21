# CIVICRESOLVE — GITHUB RELEASE & OPEN SOURCE CHECKLIST

## Repository Quality Gates

- [x] **Git Repository State:** Clean working tree with `.gitignore` excluding `node_modules/`, `dist/`, `.env`, and secret keys.
- [x] **CI/CD Pipeline:** `.github/workflows/ci.yml` builds frontend, backend, and runs automated tests on push/PR.
- [x] **Documentation Suite:** Complete architecture, design system, threat audit, and test reports present.
- [x] **Clean Dependency Graph:** Zero vulnerable or deprecated dependencies in `package.json`.
- [x] **Environment Template:** `.env.example` provides explicit variable definitions and sources.
- [x] **Zero Hardcoded Secrets:** No live private keys, service account credentials, or proprietary API tokens committed.
- [x] **License & Attribution:** Open-source civic tech license (MIT or Apache 2.0).
- [x] **Demo Accounts Script:** Turnkey `npm --prefix server run setup:demo` creates sample citizen and admin credentials.
