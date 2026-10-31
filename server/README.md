This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Existing database pin migration

Before deploying this schema to an existing database, run
`src/database/migrations/convert-device-pin-number-to-header-pin.sql` once
against that database. It moves each stored BCM GPIO value into `gpioPinNumber`
and converts `pinNumber` to the physical Raspberry Pi header position. New,
empty databases can use `npm run db-push` as usual.

## Request observability migration

Before deploying request history to an existing database, run
`src/database/migrations/add-observability-logs.sql` once against that database.
New, empty databases can use `npm run db-push` to create the table from the
Drizzle schema.

API requests carry an `X-Request-ID` UUID from the mobile app through the server
and controller. The server stores structured request, response, and error
records in `observability_logs`; the controller also appends local JSONL records
under its persistent `stores` directory. `Authorization`, cookies, passwords,
tokens, credentials, and API keys are redacted before storage. Signed-in users
can inspect traces for their own requests and controllers in **Settings →
Request history** in the mobile app.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
