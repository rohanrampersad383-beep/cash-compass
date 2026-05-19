# Financial Tracks

Financial Tracks is a full-stack personal finance tracker built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Recharts, and Framer Motion.

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

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```
