# Expense Tracker
A personal expense tracking app, born from a need for a customized approach for tracking my budget. Trackers currently available on the market are often an overkill with high granularity and complexity, that don't exactly show where the money leaks.
Expense categories are simplified, and do not allow  too granular expense calssification. Each entry has to be assinged into on of 3 main categories: essetial expense, lifestyle or leakage. Additionally, there's a dimension called 'circumstance', that makes it easy to distinguish a regular expense, from one made on vacation or other non standard situation.

This app is currently **single-user**, **NOK-only** and focused on expense entry.

## What the app specifically does?

The app lets me log expenses through a step-by-step flow:

1. enter amount
2. decide whether to use a different date
3. choose category
4. choose subcategory
5. choose payment type
6. choose circumstance
7. choose money source
8. optionally add a note

Transactions are saved to PostgreSQL.

The allowed values for categories, subcategories, payment types, circumstances, and money sources are stored in separate database tables and loaded by the app. They are **not managed through the UI**. I update them directly in the database.

## Current project status

What works right now:

- local Next.js app runs in browser
- PostgreSQL runs locally in Docker
- expenses can be added from the app UI
- custom `occurred_at` date is supported
- app loads predefined options from the database
- transactions are stored in a `transactions` table

What remains TBD:

- authetication
- subscritpion payments
- deployment
- production security

## Tech stack

### Frontend / app
- Next.js
- React
- TypeScript

### Backend
- Next.js API routes

### Database
- PostreSQL

### Local infrastructure
- Docker / Docker Compose

## Project structure

```text
expense-tracker/
├─ docker-compose.yml         # local PostgreSQL container
├─ web/                       # Next.js app
│  ├─ app/
│  │  ├─ page.tsx             # main expense logging UI
│  │  └─ api/
│  │     ├─ transactions/
│  │     │  └─ route.ts       # GET/POST transactions
│  │     └─ options/
│  │        └─ route.ts       # loads option values from DB
│  ├─ .env.local              # local environment variables (not committed)
│  ├─ package.json
│  └─ ...
```
