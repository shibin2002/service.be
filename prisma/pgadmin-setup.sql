-- Run this in pgAdmin Query Tool after connecting to your PostgreSQL server.
-- Creates the application database for Service Center Management.

SELECT 'CREATE DATABASE service_center'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'service_center')\gexec

-- Then connect to service_center and run Prisma migrations:
--   cd backend
--   npx prisma migrate deploy
--   npm run prisma:seed
