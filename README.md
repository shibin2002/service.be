# Backend API

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (manage with pgAdmin)

## pgAdmin setup

1. Open pgAdmin → create database `service_center`
2. Update `DATABASE_URL` in `.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/service_center?schema=public"
```

3. Apply schema + seed:

```bash
npm install
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

## Endpoints

| Area | Base path |
|------|-----------|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Customers | `/api/v1/customers` |
| Devices | `/api/v1/devices` |
| Stages | `/api/v1/stages` |
| Jobs | `/api/v1/jobs` |
| Payments | `/api/v1/payments` |
| Attachments | `/api/v1/attachments` |
| Notifications | `/api/v1/notifications` |
| Reports | `/api/v1/reports` |

Swagger UI: `http://localhost:4000/docs`

## Docker

```bash
docker compose up -d --build
```

## Tests

```bash
npm test
```

## Architecture

Controllers → Services → Prisma repositories / client  
JWT middleware, Zod validation, Winston logging, Socket.IO realtime events.
