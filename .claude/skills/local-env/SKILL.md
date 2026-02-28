---
name: local-env
description: Start the local development environment. Spins up SQL Server via Docker Compose, the .NET backend on port 5002, and the Vite frontend on port 3000.
---

# Local Environment Skill

Start all services needed for local development and verify they are healthy.

---

## When to Use

Use this skill when:
- User says "start local", "run local", "spin up", "start env", "start dev"
- Before running E2E tests (services must be running)
- Starting a new dev session and nothing is running

---

## Workflow

### Phase 1: Check Current State

Run these checks in parallel to see what's already running:

```bash
# Check if SQL Server container is running
docker ps --filter "name=syb20" --format "{{.Names}} {{.Status}}"

# Check if backend is responding
curl -sk -o /dev/null -w "%{http_code}" https://localhost:5002/api/leagues

# Check if frontend is responding
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Skip starting any service that is already running and healthy.

### Phase 2: Start SQL Server (Docker)

Only if not already running:

```bash
cd /home/lars.skifjeld/Claude/SYB2.0 && docker compose up -d
```

Wait for the container to be healthy before proceeding:

```bash
for i in $(seq 1 30); do
  if docker exec syb20-sql-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'Password@1' -C -Q "SELECT 1" &>/dev/null; then
    echo "SQL Server ready"; break
  fi
  sleep 2
done
```

If SQL Server doesn't become ready after 60 seconds, report the error and stop.

### Phase 3: Start Backend (.NET API)

Only if not already responding on port 5002:

```bash
cd /home/lars.skifjeld/Claude/SYB2.0 && dotnet run --project API
```

Run this as a **background task** — it's a long-running server process.

Wait for it to be ready:

```bash
for i in $(seq 1 60); do
  if curl -sk -o /dev/null -w "%{http_code}" https://localhost:5002/api/leagues 2>/dev/null | grep -q "200"; then
    echo "Backend ready after ${i}s"; break
  fi
  sleep 2
done
```

The first run will apply EF Core migrations and seed data — this can take up to 60 seconds.

### Phase 4: Start Frontend (Vite)

Only if not already responding on port 3000:

First ensure dependencies are installed:

```bash
ls /home/lars.skifjeld/Claude/SYB2.0/client/node_modules/.bin/vite || (cd /home/lars.skifjeld/Claude/SYB2.0/client && npm install)
```

Then start the dev server as a **background task**:

```bash
cd /home/lars.skifjeld/Claude/SYB2.0/client && npm run dev
```

Wait for it to be ready:

```bash
for i in $(seq 1 15); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    echo "Frontend ready after ${i}s"; break
  fi
  sleep 1
done
```

### Phase 5: Health Report

After all services are started, report the final state:

| Service | URL | Status |
|---------|-----|--------|
| SQL Server | localhost:1433 | Running / Failed |
| Backend API | https://localhost:5002 | Running / Failed |
| Frontend | http://localhost:3000 | Running / Failed |

---

## Service Details

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| SQL Server | `docker compose up -d` | 1433 | SA password: `Password@1` |
| Backend | `dotnet run --project API` | 5002 (HTTPS) | Runs migrations on first start |
| Frontend | `cd client && npm run dev` | 3000 | Proxies `/api` to backend |

---

## Edge Cases

### Docker not running
```
Cannot connect to the Docker daemon. Is the docker daemon running?
```
Tell the user to start Docker first: `sudo systemctl start docker`

### Port already in use
If a port is occupied but the health check fails, something else is using the port. Report which port is blocked and suggest `lsof -i :<port>` to investigate.

### dotnet not found
The .NET 9 SDK must be installed. Tell the user to run: `sudo apt install dotnet-sdk-9.0`

### node_modules missing
Run `cd client && npm install` before starting the frontend. Phase 4 handles this automatically.

### SQL Server container exists but is stopped
`docker compose up -d` will restart it automatically.

---

## Critical Rules

1. **Always check before starting** — Don't restart services that are already healthy
2. **Backend and frontend run in background** — Use `run_in_background: true` for both
3. **Wait for readiness** — Don't report success until health checks pass
4. **Start in order** — DB first, then backend (needs DB), then frontend (independent but start last)
5. **Report final state** — Always show the health table so the user knows what's running

---

## Triggering This Skill

User can invoke with:
- "/local-env"
- "start local env"
- "spin up the dev environment"
- "start the servers"
- "run local"
