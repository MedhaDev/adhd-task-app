# Today

Live: https://medhadev.github.io/adhd-task-app/

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

## Publishing

Every push to `main` runs the style check, tests and build on GitHub, and publishes
to GitHub Pages only if they all pass (`.github/workflows/deploy.yml`). The Supabase URL
and publishable key are stored as repository variables, not secrets, because they are
meant to be public; Row Level Security protects the data.
