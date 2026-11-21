# REFERENCE_ANALYSIS.md — Reverse Engineering Public Reference Portal

**Reference Website:** `https://portal.e-yantra.org/`  
**Inspection Method:** Autonomous Browser Subagent (Non-invasive public inspection)  
**Host Facts Verified:** Visited origins: `https://portal.e-yantra.org`, `https://auth.e-yantra.org`. No blocked origins.  
**Date:** 2026-11-21

---

## 1. Page and Route Inventory

| Route | Page Purpose | Key UI Elements | Verification Status |
|---|---|---|---|
| `/` | Landing / Competition overview | - Navigation header (How it Works, Themes, Timeline, Fees, Prizes, FAQ)<br>- Hamburger toggle for mobile<br>- "Register your team →" CTA button<br>- Multi-section informational breakdown with status badges<br>- Footer links (About, Resources, Social, Contact) | **OBSERVED** |
| `/faq` | Public knowledge base / FAQ | - Categorized Q&A accordion/heading list (`h3`)<br>- Global navigation & footer<br>- Read-only informational content | **OBSERVED** |
| `/technical-sessions` | Webinar catalogue & schedule | - Webinar session cards with date, time, topic<br>- "View details →" links and "Watch Recording" actions<br>- Global navigation | **OBSERVED** |
| `/register/notify-me` | Lead collection / Pre-registration form | - Form inputs: Full Name, Email, Country, State/Region, College/Institute dropdowns<br>- reCAPTCHA integration<br>- Submit button "Notify Me When Registration Opens"<br>- Required field indicators (`*`) | **OBSERVED** |
| `/login` (`auth.e-yantra.org`) | Identity provider sign-in | - Email, Password (masked) fields<br>- "Remember me" checkbox, "Forgot Password?" link<br>- Redirect to registration<br>- Keycloak-backed authentication endpoint | **OBSERVED** |

---

## 2. Behavioral & Workflow Patterns Learned

1. **Structured Entry Workflow**:
   - *OBSERVED*: Public users see clean value proposition, category breakdown, and clear CTA before entering.
   - *CivicResolve Adaptation*: CivicResolve landing page provides dual immediate CTAs: "Report an Issue" (for citizens) and "Track a Complaint" (for quick public tracking without login).
2. **Progress & Timeline Communication**:
   - *OBSERVED*: Timeline stages are communicated via clean step progression indicators on e-Yantra.
   - *CivicResolve Adaptation*: The complaint lifecycle will feature a transparent visual timeline showing: `SUBMITTED` → `AI_ANALYSED` → `UNDER_REVIEW` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CITIZEN_VERIFIED`.
3. **Form Validation & Guidance**:
   - *OBSERVED*: Cascading dependent dropdowns (e.g. State selection unlocks College selection), required asterisks (`*`).
   - *CivicResolve Adaptation*: In our report form, selecting or detecting a category immediately provides guidance, map selection provides immediate pin-dropping and coordinate preview, and file upload provides instant thumbnail previews with size validation (< 5 MB).
4. **Separation of Authentication**:
   - *OBSERVED*: Authentication is delegated to a dedicated auth provider.
   - *CivicResolve Adaptation*: Firebase Authentication handles user identity securely, while backend custom claims enforce the separation between standard citizen roles and administrative roles (`token.admin == true`).
5. **Mobile Responsiveness**:
   - *INFERRED*: Breakpoint triggers at ≤768px collapsing navigation into a sliding drawer/hamburger menu and reflowing multi-column forms into single-column vertical stacks.
   - *CivicResolve Adaptation*: Strict mobile-first styling (360px and 390px support) using Tailwind CSS with touch-friendly tap targets (minimum 44x44px).

---

## 3. What CivicResolve Will NOT Copy

- **Branding & Visual Identity**: No e-Yantra logos, color schemes, or assets. CivicResolve adopts a bespoke, modern civic-tech identity featuring deep emerald green (`#16845B`), mint accents (`#36B889`), crisp white surfaces, and refined typography.
- **Academic Competition Constraints**: e-Yantra is tailored for student robotics teams; CivicResolve is a mission-critical municipal grievance and public accountability platform.
- **Complex Multi-step Team Registration**: CivicResolve keeps citizen onboarding friction minimal (name, email, password, preferred language) to maximize civic participation.
