# CIVICRESOLVE — FIREBASE PRODUCTION SETUP & RULES GUIDE

## 1. Firebase Project Overview

- **Firebase Project ID:** `civicresolve-969d3`
- **Current Plan:** Spark (Free Tier)
- **Zero Cost Guarantee:** Designed to run 100% within the Spark free tier.

---

## 2. Authentication Provider Setup

1. **Email/Password:**
   - Provider: **Enabled**
   - Email verification optional; default citizen role assigned upon registration.
2. **Phone Authentication:**
   - Provider: **Enabled**
   - Free tier SMS quota: 10 carrier SMS/day.
   - Whitelisted test numbers configured for unlimited testing:
     - `+91 9999999999` with code `123456`
     - `+91 9888888888` with code `654321`

---

## 3. Firestore Security Rules

Deployable via `firebase deploy --only firestore:rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Citizen profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || isAdmin();
    }

    // Civic complaints
    match /complaints/{complaintId} {
      allow read: if true; // Public transparency
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();

      // Status history subcollection (append-only ledger)
      match /statusHistory/{historyId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update, delete: if false; // Immutable ledger
      }
    }
  }
}
```
