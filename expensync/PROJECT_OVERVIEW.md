## ExpenSync — Project Overview

A concise, developer-friendly overview of the ExpenSync application: architecture, core flows, data model, integrations, deployment, and recommended next steps.

---

## One-line summary

- ExpenSync is a modern, serverless expense management web application for individuals and small teams that supports manual and AI-assisted transaction entry, recurring transactions, budgets and alerts, and monthly financial reports.

## Key features

- Transaction create/update/delete with account balance consistency
- AI-powered receipt scanning (Google Gemini) to prefill transaction data and suggest categories
- Recurring transaction scheduling and processing (Inngest cron + throttled processing)
- Monthly financial reports with AI-generated insights and email delivery
- Budget monitoring with threshold alerts
- Authentication with Clerk and request protection using Arcjet

## Tech stack

- Frontend: Next.js 15 (app router), React 19, Tailwind CSS, shadcn/ui components
- Backend: Server actions (Next.js), Node runtime for server code
- Database: PostgreSQL with Prisma ORM (`prisma/schema.prisma`)
- Background jobs: Inngest functions (`lib/inngest/functions.js`)
- AI: Google Gemini / Generative API (receipt parsing, insights)
- Auth: Clerk
- Email: Resend (via `actions/send-email`) and server-side email templates (`emails/template.jsx`)
- Security & bot protection: Arcjet integration (`lib/arcjet.js` and usage in `actions/*`)
- Hosting: Serverless (Vercel or similar)

## High-level architecture

- Client (browser): UI under `app/` + `components/`. Includes the ReceiptScanner component to capture images and call the server-side scanner.
- Server actions (`actions/`): business logic like `createTransaction`, `updateTransaction`, `scanReceipt`, `sendEmail`.
- Database: Prisma client (`lib/prisma.js`) interacting with PostgreSQL. Models defined in `prisma/schema.prisma`.
- Background: Inngest functions (`lib/inngest/functions.js`) for recurring processing, report generation, and budget checks.
- External services: Clerk (auth), Google Gemini (AI), Arcjet (rate limiting), Resend (email).

## Data model (summary)

- User: links to Clerk via `clerkUserId`, has accounts and transactions.
- Account: holds `balance` (Decimal), `isDefault`, belongs to a user.
- Transaction: `id`, `type` (INCOME/EXPENSE), `amount` (Decimal), `description`, `date`, `category` (String), `isRecurring`, `recurringInterval`, `nextRecurringDate`, `lastProcessed`, `status`, `accountId`, `userId`.
- Budget: `amount`, `lastAlertSent`, and `userId`.

Note: `Transaction.category` is stored as a plain string in the schema. The UI uses `data/categories.js` as the client-side list of valid category ids and metadata.

## Core flows

1. Transaction creation (manual)
   - User fills the transaction form and submits.
   - Server action `createTransaction` verifies auth (Clerk), uses Arcjet for request protection, then creates the transaction inside a Prisma `$transaction` while updating the account balance atomically.
   - The server revalidates relevant pages (`revalidatePath`) and returns the created transaction.

2. Receipt scanning (AI-assisted)
   - `ReceiptScanner` uploads an image and calls server action `scanReceipt`.
   - `scanReceipt` sends the image to Google Gemini with a strict prompt asking for amount, date, description, merchantName, and a suggested category (restricted to known category ids).
   - The parsed JSON is returned to the client and used to prefill the transaction form; user confirms and saves.

3. Recurring transactions
   - User marks a transaction as recurring and sets an interval.
   - Daily cron (`triggerRecurringTransactions` in Inngest) finds due recurring transactions and emits events.
   - `processRecurringTransaction` is throttled per user and processes events to create a new transaction instance, update balances, and set the next due date.

4. Monthly reports & insights
   - Inngest `generateMonthlyReports` runs monthly, aggregates per-user stats, calls Gemini to generate 3 concise insights, and sends the results by email.

5. Budgets & alerts
   - `checkBudgetAlerts` runs every 6 hours, examines user budgets vs. default account expenses, and sends alerts when usage exceeds thresholds (e.g., 80%).

## How categories are assigned (concise)

- Source: `data/categories.js` holds the list of category ids, labels, colors, and icons used in the UI.
- Assignment:
  - Manual: users pick a category in the transaction form; the selected value is submitted in `createTransaction`/`updateTransaction`.
  - AI-assisted: `scanReceipt` suggests a category from a restricted set that the client can accept/override.
  - Persisted as a string in `Transaction.category` (no DB-level enum currently).

## Security, validation & reliability notes

- Arcjet: used in server actions for rate limiting and bot protection.
- DB transactions: Prisma `$transaction` is used to ensure balance updates and transaction creation are atomic.
- Inngest throttle config prevents user-level spikes during recurring processing.
- Current validation gap: category is stored as a free string; server-side validation is recommended to ensure category values match the canonical list.

## Important files and entry points

- `app/` — Next.js pages and components (UI)
- `components/` — shared UI components (drawer, table, inputs)
- `actions/transaction.js` — transaction server actions and `scanReceipt`
- `app/(main)/transaction/_components/recipt-scanner.jsx` — client receipt scanner UI
- `data/categories.js` — canonical category list used in UI
- `lib/inngest/functions.js` — background cron/event functions
- `prisma/schema.prisma` — data models and Prisma schema
- `lib/prisma.js` — Prisma client helper
- `emails/template.jsx` — email templates for reports and alerts

## Local setup (developer checklist)

1. Copy required environment variables (examples):

```powershell
# Example env vars you will need in PowerShell
$env:DATABASE_URL = "postgresql://..."
$env:DIRECT_URL = "postgresql://..."
$env:GEMINI_API_KEY = "sk_..."
$env:CLERK_* = "..."
$env:ARCJET_* = "..."
$env:RESEND_API_KEY = "..."
```

2. Install dependencies and run migrations:

```powershell
npm install
npx prisma migrate dev
npm run dev
```

Adjust commands to your shell/OS as needed.

## Known limitations and recommended improvements

- Enforce category validity server-side: add a validation step in `createTransaction` and `updateTransaction` to check `category` against `data/categories.js` (or store categories in DB and reference them by id).
- Stronger DB constraints: convert `Transaction.category` to an enum or a foreign key to a `Category` table to prevent invalid values.
- Robust AI parsing: add heuristics/fallback mapping (merchant or description keyword -> category) when Gemini returns invalid/empty values.
- Re-classification job: implement an Inngest function to normalize or re-classify historical transactions using improved heuristics.
- Observability: add logging and metrics around Gemini calls and Inngest function failures to detect regressions.

## Next steps I can implement for you

- Small change: add server-side category validation in `actions/transaction.js` (few-line patch).
- Medium change: migrate categories into DB and update Prisma schema for relations/enums.
- Large change: add automated re-classification pipeline and merchant-based heuristics.

---

If you'd like, I can now implement the small, safe improvement of server-side category validation and an accompanying unit test or quick runtime check — tell me to proceed and I will patch `actions/transaction.js` and run validation checks.
