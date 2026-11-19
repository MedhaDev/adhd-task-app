# Today

A personal task app designed for ADHD: at most 3 tasks at a time, tiny first steps,
and a 5-minute starter timer that can grow into a focus session.

## Run it

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint    # style check
npm test        # tests
npm run build   # type check and production build
```

## Environment

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and
**publishable** key. Never put a secret key in this app.
