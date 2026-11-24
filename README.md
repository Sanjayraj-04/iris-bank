# Iris Bank — Firebase-only role and KYC workflow

This variant uses the supplied Firebase project directly from the React client through Firebase Authentication and Cloud Firestore. It does not add Cloud Functions, Cloudflare Workers, or a separate backend. Existing `LiveBank.jsx`, `live-api.js`, `cloudflare-config.js`, bank name, bank ID and IFSC configuration are retained in the project source.

## Setup

1. In Firebase Console, enable **Authentication → Email/Password**.
2. In Firestore, apply the included `firestore.rules`. These rules retain client denial for existing `accounts` and `ledger_entries`.
3. Create the first Admin user in Firebase Authentication.
4. In Firestore Console, manually create `users/{ADMIN_UID}` with:
   - `uid`: the Admin's Firebase Auth UID
   - `email`: the Admin email
   - `name`: Admin display name
   - `role`: `ADMIN`
5. Run:

```bash
npm install
npm run dev
```

Do not allow public Admin registration. Customer registration creates a `CUSTOMER` profile and a `customer_applications` record. Admin can review and set application status to APPROVED, HOLD or REJECTED.

## What this Firebase-only version implements

- Firebase Email/Password sign-in.
- Customer self-registration.
- Admin/customer role routing based on Firestore `users/{uid}`.
- Customer application record with personal details and KYC declaration.
- Admin application review and status updates.
- Customer view of application status.
- The original Iris Bank identity and existing transfer-related source files are retained.

## Important limitations (no server-side code)

This is an educational client-side workflow, not a production-ready bank:

- Firestore-only client code cannot securely verify identity documents. This prototype collects a document type and only the last four characters of a test reference; it does not upload or verify KYC documents. Do not enter real Aadhaar/PAN details.
- Firebase Storage or a secure document provider is required for actual document uploads.
- Email delivery with NodeMailer requires a server-side mail process. This client-only version does not send email.
- Approving an application updates its status only. It does not create an account or post the opening ₹1,000 balance.
- Direct browser code must not create deposits, withdrawals, interest credits, loan disbursements or edit `postedBalanceMinor`. Such operations require trusted server-side authorization and atomic ledger posting.
- Existing `accounts` and `ledger_entries` remain denied to client reads/writes by the included rules. Existing Worker transfer integration remains in source, but this new Firebase login does not mint the Worker session token.

## Firestore rules

The included `firestore.rules` is a proposed ruleset for this workflow. The first Admin role must be provisioned manually in the Firebase Console. Keep Admin credentials private. Review the rules against your deployed database before publishing.
