# Docker Runbook

Run commands from the repository root.

1. Copy environment examples:

   ```bash
   cp .env.example .env
   cp ai-slide-generator/.env.local.example ai-slide-generator/.env.local
   ```

2. Set the public server port in root `.env`:

   ```env
   APP_PORT=3000
   ```

3. Fill application secrets in `ai-slide-generator/.env.local`.

4. Build and start:

   ```bash
   docker compose up -d --build
   ```

The app will be available on `http://localhost:${APP_PORT}`.

Persistent data:

- SQLite database: `aislide-data` Docker volume mounted to `/app/data`
- Uploaded files: `aislide-uploads` Docker volume mounted to `/app/public/uploads`

Useful commands:

```bash
docker compose logs -f
docker compose restart
docker compose down
```
