const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  // Only emails on this domain can register. Set to "" to allow any domain (not recommended).
  ALLOWED_EMAIL_DOMAIN: z.string().default("srmist.edu.in"),
  // Students below this attendance % are flagged on HOD and faculty dashboards.
  LOW_ATTENDANCE_THRESHOLD: z.coerce.number().min(0).max(100).default(75),
  LOGIN_RATE_LIMIT: z.coerce.number().int().positive().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = { env: parsed.data };
