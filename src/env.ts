import { z } from "zod";

const envSchema = z.object({
  TESTMO_BASE_URL: z.string().url("TESTMO_BASE_URL must be a valid URL"),
  TESTMO_ACCESS_TOKEN: z.string().min(10, "TESTMO_ACCESS_TOKEN appears invalid (too short)"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  process.stderr.write(
    `[testmo] Invalid config:\n${JSON.stringify(parsed.error.format(), null, 2)}\n`
  );
  process.exit(1);
}

export const env = parsed.data;
