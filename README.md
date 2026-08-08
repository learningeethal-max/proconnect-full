# ProConnect — Talent Directory (with backend)

A full-stack talent directory app: a React frontend (no build step, loaded
via CDN) backed by a small zero-dependency Node.js server with real
persistence to a JSON file.

## Requirements
- [Node.js](https://nodejs.org) 18 or later (uses the built-in `fetch` and
  `http` module — no npm install needed, no external packages).
- An internet connection the first time the page loads, since the frontend
  loads React/ReactDOM/Babel from a CDN.

## How to run

```
node server.js
```

Then open **http://localhost:3000** in your browser.

That's it — no `npm install` step, because the backend has zero external
dependencies.

## Project structure

```
proconnect/
├── server.js          # Node backend: serves the frontend + REST API
├── data/
│   └── db.json         # Persisted data (professionals, students, admins)
├── public/
│   └── index.html      # The React frontend (single file)
└── README.md
```

## API

All endpoints are under `/api`:

| Method | Path                        | Description                    |
|--------|------------------------------|---------------------------------|
| GET    | `/api/professionals`        | List all professionals          |
| POST   | `/api/professionals`        | Create a professional           |
| PUT    | `/api/professionals/:id`    | Update a professional           |
| DELETE | `/api/professionals/:id`    | Delete a professional           |
| GET    | `/api/students`             | List all students               |
| POST   | `/api/students`             | Create a student                |
| PUT    | `/api/students/:id`         | Update a student                |
| DELETE | `/api/students/:id`         | Delete a student                |
| POST   | `/api/auth/login`           | Admin login (`{email,password}`)|

Data is persisted to `data/db.json` — changes survive a server restart.

## Demo admin logins
Only signed-in admins can add, edit, or delete profiles. Two accounts are
seeded in `data/db.json`:

- `deepa.raghavan@proconnect.com` / `admin123`
- `suresh.nathan@proconnect.com` / `admin123`

To add more admins or change passwords, edit the `admins` array in
`data/db.json` directly (there's no admin-management UI by design — see the
app for why).

## What's included
- Dashboard with live stats and recent profiles, pulled from the backend
- Working Professionals & Students directories with search, filters, and
  pagination
- Full profile detail pages
- Add / Edit profile forms with validation — writes go straight to
  `data/db.json` via the API
- Delete confirmation modal — actually deletes from the backend
- Global search across both directories (top bar)
- Admin sign-in gate backed by the real `/api/auth/login` endpoint
- Responsive layout: top nav for guests, sidebar for signed-in admins, bottom
  tab bar on mobile

## Notes / next steps
- This is a demo-grade backend: plaintext passwords in a JSON file, no
  sessions/tokens (the browser just remembers "signed in" in memory until you
  refresh), no HTTPS. Fine for local use or a prototype demo — not for a
  public deployment as-is.
- To deploy for real, you'd want to add password hashing, session tokens or
  JWTs, and swap `data/db.json` for a proper database once you outgrow a
  single JSON file.
