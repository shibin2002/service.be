/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register technician
 *     security: []
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List service jobs
 *   post:
 *     tags: [Jobs]
 *     summary: Create service job
 * /jobs/dashboard/stats:
 *   get:
 *     tags: [Jobs]
 *     summary: Dashboard cards and charts
 * /customers:
 *   get:
 *     tags: [Customers]
 *     summary: List customers
 * /stages:
 *   get:
 *     tags: [Stages]
 *     summary: List workflow stages
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments
 */
export {};
