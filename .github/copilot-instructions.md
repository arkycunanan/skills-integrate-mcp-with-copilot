# Copilot Instructions

## Project Overview

**Mergington High School Activities API** — a FastAPI backend with a vanilla JS/HTML/CSS frontend that lets students view and sign up for extracurricular activities.

## Running the App

From the repository root:

```bash
pip install fastapi uvicorn
uvicorn src.app:app --reload
```

Or use VS Code's **Run and Debug** panel → **Launch Mergington WebApp** (uses `launch.json`).

App runs at `http://localhost:8000`. Root (`/`) redirects to `/static/index.html`.

## Architecture

- **`src/app.py`** — FastAPI app. Serves the API and mounts static files at `/static`.
- **`src/static/`** — Frontend: `index.html`, `app.js` (vanilla JS), `styles.css`.
- No database — all activity data is an **in-memory dict** in `app.py`. Data resets on server restart.

### API Endpoints

| Method   | Path                                           | Description                  |
|----------|------------------------------------------------|------------------------------|
| `GET`    | `/activities`                                  | List all activities           |
| `POST`   | `/activities/{activity_name}/signup?email=...` | Sign a student up             |
| `DELETE` | `/activities/{activity_name}/unregister?email=...` | Remove a student          |

### Data Model

Activities are stored as a dict keyed by **activity name** (string). Each value has:
- `description`, `schedule`, `max_participants` (int), `participants` (list of email strings)

Student emails follow the pattern `name@mergington.edu`.

## MCP Configuration

`.vscode/mcp.json` configures the **GitHub MCP server** (`https://api.githubcopilot.com/mcp/`), enabling Copilot Agent mode to interact with GitHub issues, PRs, and repo data directly.

## Key Conventions

- Activity names are used as URL path parameters — encode them with `encodeURIComponent` on the frontend.
- The frontend refreshes the full activities list after every signup or unregister action (no partial updates).
- HTTPException with `status_code=404` for missing activities, `400` for duplicate signup or missing participant.
- No authentication layer — all endpoints are public.
