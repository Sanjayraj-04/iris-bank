# Iris Bank — additive Firestore schema proposal

This document proposes new collections only. It does not create collections or modify the existing database.

## Existing collections to preserve

- `accounts`
- `ledger_entries`

Existing account and ledger document shapes must remain backward compatible. Existing ledger entries are historical records and should be treated as append-only.

## Proposed collections

### `interest_rates/{rateId}`

Suggested fields:
- `productType`: `SAVINGS`, `FIXED_DEPOSIT`, or `LOAN`
- `annualRateBps`: integer basis points (for example, 350 = 3.50%)
- `effectiveFrom`: Firestore Timestamp
- `effectiveTo`: Firestore Timestamp or null
- `status`: `ACTIVE` or `INACTIVE`
- `createdAt`, `updatedAt`: Firestore Timestamps
- `bankId`: bank identifier, if multiple banks share the project

### `interest_history/{interestId}`

- `accountId`
- `periodStart`, `periodEnd`
- `principalMinor`
- `rateBps`
- `interestMinor`
- `status`: `PENDING`, `POSTED`, `REVERSED`
- `ledgerEntryId` (reference to the corresponding immutable `ledger_entries` document)
- `createdAt`, `postedAt`

### `fixed_deposits/{fdId}`

- `accountId`, `customerUid`
- `principalMinor`
- `rateBps`
- `compoundingFrequency`
- `openedAt`, `maturityAt`
- `maturityMinor`
- `status`: `ACTIVE`, `MATURED`, `CLOSED`, `CANCELLED`
- `createdAt`, `updatedAt`

### `beneficiaries/{beneficiaryId}`

- `customerUid`
- `bankId`
- `nickname`
- `destinationBankId` or IFSC
- `destinationAccountNumber` (store/display with appropriate masking)
- `createdAt`, `status`

### `notifications/{notificationId}`

- `customerUid`
- `accountId` (optional)
- `category`
- `title`, `message`
- `readAt` (nullable)
- `createdAt`

### `loans/{loanId}`

- `customerUid`, `accountId`
- `principalMinor`
- `annualRateBps`
- `tenureMonths`
- `emiMinor`
- `outstandingMinor`
- `status`: `APPLIED`, `UNDER_REVIEW`, `APPROVED`, `ACTIVE`, `CLOSED`, `REJECTED`
- `createdAt`, `updatedAt`

### `account_limits/{accountId}`

- `dailyDebitLimitMinor`
- `dailyTransferLimitMinor`
- `perTransactionLimitMinor`
- `effectiveFrom`, `updatedAt`
- `updatedBy`

## Ledger posting conventions

New financial postings should create a new immutable `ledger_entries` document using the existing field conventions:
- `accountId`
- `amountMinor` (paise)
- `currency` (`INR`)
- `direction` (`CREDIT` or `DEBIT`)
- `entryId`
- `entryType`
- `postedAt`
- `transferId` or a unique operation reference

Agree the exact new `entryType` values with the backend owner before deployment. Never rewrite existing ledger entries.

## Security and consistency requirements

1. Keep the current Firestore rules closed to direct client writes.
2. Use authenticated server-side functions with Firebase Admin SDK.
3. Verify Firebase Auth identity and account ownership on every request.
4. Enforce bank isolation on the server; do not trust a `bankId` sent by the browser.
5. Use Firestore transactions/batched writes to update balances and append ledger entries atomically.
6. Enforce idempotency keys to prevent duplicate deposits, withdrawals, interest credits or repayments.
7. Do not allow customers to self-credit cash deposits or self-approve loans. Deposits and withdrawals need authorized channels/roles and audit trails.
8. Do not deploy this schema until the existing backend and exact ownership model have been reviewed.
