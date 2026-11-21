# FIREBASE PHONE AUTHENTICATION SETUP & VERIFICATION GUIDE

## Overview

CivicResolve implements an enterprise-grade, anti-spoofing **Phone OTP Authentication and Account Linking** architecture powered by Firebase Authentication.

- **Firebase Project ID:** `civicresolve-969d3`
- **Authentication Providers:** Email/Password (Enabled) + Phone (Enabled)
- **Billing Tier:** Spark Plan (Free)
- **SMS Quota Constraint:** 10 real SMS messages per day on Google Firebase Free Spark tier.

---

## 1. Zero-Cost Test Numbers Workflow (Recommended for Testing & Judging)

Because the Firebase Spark plan strictly enforces a 10 SMS/day limit for real carrier SMS deliveries, Firebase provides a native **Phone Numbers for Testing** facility. Test numbers bypass the SMS gateway entirely, consume **zero SMS quota**, and allow unlimited automated and manual testing.

### Pre-Configured Test Numbers

In the Firebase Console under **Authentication > Sign-in method > Phone > Phone numbers for testing**:

| Test Mobile Number | 6-Digit Verification Code | Purpose |
|:---|:---|:---|
| `+91 9999999999` | `123456` | Primary Demo Citizen Test Account |
| `+91 9888888888` | `654321` | Secondary Verification Test Account |
| `+91 9111111111` | `112233` | Municipal Field Worker Account |

### How to Test in CivicResolve:

1. Log into CivicResolve Citizen Portal at `http://localhost:5173/citizen/login` (or click "Autofill Citizen Demo").
2. Navigate to **Profile & Rewards** (`/citizen/profile`).
3. Under the **Phone OTP Verification** card:
   - Enter `9999999999` in the Indian mobile input (`🇮🇳 +91`).
   - Click **Send 6-Digit Verification Code**.
   - An invisible Google reCAPTCHA v2/v3 token is automatically generated and verified.
   - Enter verification code `123456`.
   - Click **Verify & Secure Account**.
4. The system links the phone credential directly to the active Firebase UID. The profile status immediately reflects **"Phone Verified"** with an emerald shield badge.

---

## 2. Technical Architecture & Security Implementation

### 2.1 Preserving Citizen Identity via `linkWithCredential`

A common anti-pattern in civic applications is treating phone and email as separate accounts, causing citizens to lose access to their submitted grievances and rewards. 

CivicResolve uses Firebase Modular Web SDK `linkWithCredential`:

```typescript
// frontend/src/features/auth/AuthContext.tsx
const credential = PhoneAuthProvider.credential(
  confirmationResult.verificationId,
  otpCode.trim()
);

// Links phone credential to the exact current Firebase UID
const result = await linkWithCredential(auth.currentUser, credential);
```

**Benefits:**
- **Single Firebase UID:** All filed complaints, status notifications, and ResolveRewards™ remain tied to the user.
- **Dual Authentication:** The citizen can sign in with either their email or phone.
- **Account Takeover Prevention:** If a phone number is already attached to another UID, Firebase throws `auth/credential-already-in-use`, preventing spoofing or duplicate account collisions.

### 2.2 Server-Side Token Verification (Zero Client Trust)

The backend Express API **never trusts** client-submitted fields like `{ phoneVerified: true }`. Instead, it extracts the cryptographically signed claims from the Firebase ID token in `server/src/middleware/authMiddleware.ts`:

```typescript
// server/src/middleware/authMiddleware.ts
const decodedToken = await adminAuth.verifyIdToken(token);

req.user = {
  uid: decodedToken.uid,
  email: decodedToken.email,
  phone_number: decodedToken.phone_number,
  phone_verified: Boolean(decodedToken.phone_number),
  role: decodedToken.admin ? 'admin' : 'citizen',
};
```

When a complaint is submitted, `server/src/routes/citizenRoutes.ts` records:
- `phoneVerified: req.user.phone_verified`
- `ownerPhoneNumber: req.user.phone_number`

### 2.3 Quota Protection & Re-Send Throttling

- **60-Second Cooldown:** Prevents citizens or bots from spamming the SMS gateway.
- **Invisible reCAPTCHA:** Bypasses friction for authentic users while intercepting headless bot traffic.
- **Descriptive Error Mapping:** Maps `auth/quota-exceeded`, `auth/invalid-verification-code`, and `auth/too-many-requests` into helpful, non-technical guidance.

---

## 3. Production Deployment Notes (Upgrading to Blaze)

When transitioning to enterprise municipal deployment:
1. Switch Firebase project to the **Blaze (Pay as you go)** plan.
2. In Google Cloud Console, enable the **Cloud Identity Platform / Firebase Auth** quota adjustments for SMS delivery in the India (`+91`) regulatory region (TRAI DLT compliant).
3. Whitelist production domains (e.g., `civicresolve.onrender.com`) under **Authentication > Settings > Authorized domains**.
