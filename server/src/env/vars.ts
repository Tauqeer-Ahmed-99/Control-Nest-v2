/// <reference types="node" />

import z from "zod";
import "dotenv/config";

const EnvVarsSchema = z.object({
  OTA_JOB_KEY_ID: z
    .string()
    .regex(/^[\w-]{1,64}$/)
    .optional(),
  OTA_JOB_PRIVATE_KEY: z.string().optional(),
  OTA_RELEASE_PUBLIC_KEYS: z.string().default("{}"),
  DB_ENV: z.enum(["development", "production"]).default("development"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .nonempty({ error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required." })
    .nonoptional({ error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required." }),
  CLERK_SECRET_KEY: z
    .string()
    .nonempty({ error: "CLERK_SECRET_KEY is required." })
    .nonoptional({ error: "CLERK_SECRET_KEY is required." }),
  DEV_DATABASE_URL: z
    .string()
    .nonempty({ error: "DEV_DATABASE_URL is required." })
    .nonoptional({ error: "DEV_DATABASE_URL is required." }),
  PROD_DATABASE_URL: z
    .string()
    .nonempty({ error: "PROD_DATABASE_URL is required." })
    .nonoptional({ error: "PROD_DATABASE_URL is required." }),
  CLOUDFLARE_ACCOUNT_ID: z
    .string()
    .nonempty({ error: "CLOUDFLARE_ACCOUNT_ID is required." })
    .nonoptional({ error: "CLOUDFLARE_ACCOUNT_ID is required." }),
  CLOUDFLARE_ACCOUNT_API_TOKEN: z
    .string()
    .nonempty({ error: "CLOUDFLARE_ACCOUNT_API_TOKEN is required." })
    .nonoptional({ error: "CLOUDFLARE_ACCOUNT_API_TOKEN is required." }),
  CLOUDFLARE_ZONE_ID: z
    .string()
    .nonempty({ error: "CLOUDFLARE_ZONE_ID is required." })
    .nonoptional({ error: "CLOUDFLARE_ZONE_ID is required." }),
  WEATHER_API_URL: z
    .url({ error: "WEATHER_API_URL must be a valid URL." })
    .nonempty({ error: "WEATHER_API_URL is required." })
    .nonoptional({ error: "WEATHER_API_URL is required." }),
  WEATHER_API_KEY: z
    .string()
    .nonempty({ error: "WEATHER_API_KEY is required." })
    .nonoptional({ error: "WEATHER_API_KEY is required." }),
});

const {
  success,
  data: variables,
  error,
} = EnvVarsSchema.safeParse(process.env);

if (!success) {
  const errorTree = z.treeifyError(error);
  console.error(errorTree);

  const errorMessages = Object.entries(errorTree.properties ?? {}).map(
    ([key, value]) => {
      const messages = value.errors.map((err) => `${key}: ${err}`);
      return messages.join(", ");
    },
  );

  throw new Error(
    `Invalid environment variables:\n${errorMessages.join("\n")}`,
  );
}

const env = { variables };

export default env;

export type EnvVars = z.infer<typeof EnvVarsSchema>;
