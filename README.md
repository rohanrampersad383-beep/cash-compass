# Cash Compass

Cash Compass is a full-stack personal finance tracker and rule-based financial guide built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Recharts, Framer Motion, and Anime.js.

## Setup

```bash
npm install
copy .env.example .env
```

Update `DATABASE_URL` in `.env` with a PostgreSQL connection string.

## Database

```bash
npm run prisma:generate
npm run db:migrate -- --name init
npm run db:seed
```

The seed creates:

- Email: `demo@financialtracks.dev`
- Password: `password123`

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## CSV Import

A sample statement is available at `public/sample-statement.csv`. The upload page previews rows before saving and never asks for bank credentials.

## Budgets

Budgets are backed by Prisma and compare monthly category limits against current expenses plus bill reserves for the same category.

## Branding

Current Cash Compass logo and favicon assets live in `public/cash-compass-logo.png`, `public/cash-compass-wordmark.png`, `public/cash-compass-icon.png`, `public/favicon.png`, and `public/apple-touch-icon.png`. These can be replaced with final brand artwork without renaming database tables or internal folders.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```
