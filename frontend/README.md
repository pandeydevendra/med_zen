# MedZen Frontend

This directory contains the MedZen frontend application built with React and Vite.

## Requirements

- Node.js 18+ (or a compatible LTS version)
- npm

## Setup

Install the frontend dependencies:

```bash
npm install
```

## Run the frontend

Start the development server:

```bash
npm run dev
```

This launches the Vite development server and makes the app available locally, usually at `http://localhost:5173`. It uses `env/local_dev.env`.

The app talks to the backend at `VITE_API_URL` (`http://127.0.0.1:8000/api` locally), so start the backend in another terminal first:

```bash
cd ../backend
uvicorn main:app --reload
```

To run the frontend against the prod API instead, use `npm run dev:prod`.

## Build for production

To build the frontend for production:

```bash
npm run build
```

## Preview production build

To preview the production build locally:

```bash
npm run preview
```

## Environments

Config lives in [env/](env/) — one file per environment (`local_dev.env`, `prod.env`). [vite.config.js](vite.config.js) loads the file that matches the Vite mode, and only variables starting with `VITE_` are exposed to the app.

| Variable | Purpose |
|---|---|
| `VITE_ENV_NAME` | Environment name (`local_dev` or `prod`) |
| `VITE_API_URL` | API base URL (the app calls `${VITE_API_URL}/v1/...`) |
| `VITE_SAAS_URL` | Base URL of the site |

| Command | Env file used |
|---|---|
| `npm run dev` | `env/local_dev.env` |
| `npm run dev:prod` | `env/prod.env` |
| `npm run build` | `env/prod.env` |
| `npm run build:local` | `env/local_dev.env` |
| `npm run preview` | `env/prod.env` |

Values are baked in at build time, so rebuild after editing an env file. A variable set in your shell overrides the file.
