# CivicResolve — Security & Privacy Architecture

> **Comprehensive Security Policy, Threat Mitigation, and Data Protection Standards**  
> *Target Compliance: OWASP Top 10, WCAG 2.1 AA, GDPR / DPDP Privacy Guidelines*

---

## 1. Threat Mitigation Matrix

| Threat Category | Potential Risk | CivicResolve Enforcement Mechanism |
| :--- | :--- | :--- |
| **Broken Object Level Auth (BOLA)** | Citizens tampering with others' grievances | Strict UID ownership verification (`ownerUid === user.uid`) in route guards |
| **Privilege Escalation** | Regular users claiming admin privileges | Hardened role check requiring `decodedToken.admin === true` AND verified email |
| **Cross-Site Scripting (XSS)** | Malicious HTML/JS in grievance titles or notes | Input sanitization using `sanitizeInput` regex stripping `<[^>]*>` + Helmet CSP |
| **Malicious File Upload** | Executables disguised as images (`.exe` as `.jpg`) | Binary header Magic-Byte inspection (`FF D8 FF`, `89 50 4E 47`, `52 49 46 46`) + 5 MB cap |
| **DDoS & Quota Exhaustion** | Flooding Gemini AI or database with requests | Multi-tiered express-rate-limiters (General: 200/15m, Auth: 60/15m, AI: 60/15m) |
| **Cross-Origin Scraping** | Unauthorized third-party web domains accessing API | Strict origin allowlist with HTTP 403 rejection for unlisted origins |
| **PII & Surveillance Leakage** | Citizen phone numbers or home addresses harvested | Automated PII scrubber stripping owner phone, email, and fuzzing GPS to ~11m |

---

## 2. Authentication & Authorization

### 2.1 Token Verification Workflow
Every incoming API request to protected routes (`/api/complaints/*`, `/api/admin/*`) is validated by `requireAuth` middleware (`server/src/middleware/authMiddleware.ts`):
1. **Header Extraction:** Extracts the `Bearer <token>` from the HTTP `Authorization` header.
2. **Cryptographic Validation:** Passes the JWT token to `firebaseAdmin.auth().verifyIdToken(token)`.
3. **Revocation & Expiry:** Rejects expired tokens or revoked sessions immediately with HTTP `401 Unauthorized`.
4. **Context Injection:** Attaches the authenticated user object (`req.user = { uid, email, admin }`) to the Express request.

### 2.2 Administrative Role Security
Administrative endpoints strictly require `requireAdmin` middleware. To prevent token spoofing or email impersonation:
```typescript
const isAdminUser = Boolean(decodedToken.admin) || 
  (decodedToken.email === 'admin@civicresolve.org' && decodedToken.email_verified === true);
```
Unverified emails or regular users receive an explicit HTTP `403 Forbidden` response.

---

## 3. Input Validation & Content Sanitization

All incoming payloads are intercepted and validated against strict **Zod schemas** before reaching any database or business logic:
- **Title & Description:** Required min/max character lengths with automatic HTML stripping:
  ```typescript
  export function sanitizeInput(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim();
  }
  ```
- **Geographic Coordinates:** Strict numeric ranges ensuring latitude is between `-90` and `90`, and longitude is between `-180` and `180`.
- **Enumerations:** Whitelisted categories prevent arbitrary categorization.

---

## 4. Secure File Upload Pipeline

Uploaded grievance images undergo rigorous multi-step inspection in `uploadMiddleware.ts`:
1. **Size Limitation:** Capped strictly at 5 megabytes (5 * 1024 * 1024 bytes).
2. **MIME-Type Whitelist:** Allowed MIME types are limited to `image/jpeg`, `image/png`, and `image/webp`.
3. **Magic-Byte Header Validation:** File contents are inspected at byte offset 0 to verify legitimate image signatures:
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47` (`\x89PNG`)
   - WebP: `52 49 46 46` (`RIFF`) and `57 45 42 50` (`WEBP`)
Files failing magic-byte inspection are rejected with HTTP `400 Bad Request`.

---

## 5. Citizen Privacy & Data Protection

CivicResolve strictly adheres to privacy-by-design principles:
- **Public Feed Scrubber:** The `toPublicComplaint(c)` transformation removes `ownerUid`, `ownerEmail`, `ownerPhone`, `citizenPhone`, and strips specific door numbers from street addresses.
- **Coordinate Fuzzing:** Public geographic coordinates are truncated to 4 decimal places (~11 meters), masking exact residential front doors while maintaining municipal utility.
- **SHA-256 Verifiable Receipts:** Digital receipts provide tamper-evident cryptographic proofs (`SHA-256`) without disclosing citizen identity.

---

## 6. HTTP Security Headers

CivicResolve employs `helmet` to deliver robust HTTP response headers:
```typescript
app.use(
  helmet({
    contentSecurityPolicy: { /* Whitelisted Google & OpenStreetMap origins */ },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xContentTypeOptions: true, // nosniff
    xXssProtection: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
```
