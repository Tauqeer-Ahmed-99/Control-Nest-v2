# Repository instructions for agents

Follow the conventions already used in this repository. Before editing a component, read its local instructions (`server/AGENTS.md` or `mobile/AGENTS.md`) and inspect nearby implementations of the same kind. Keep changes consistent with those examples.

## Server API conventions

- For a new API, add a Next.js Route Handler under `server/src/app/api/v1/` and export the HTTP method using `NextRequest`.
- Use conventional `try`/`catch` blocks in Route Handlers. Return successful responses with `APIResponse.fromData({ data, message, statusCode? })` and caught errors with `APIResponse.fromError(error)`.
- In service functions, use the shared `tryCatch` utility from `server/src/utils/try-catch.ts` for async error handling; do not add native `try`/`catch` blocks in services.
- Keep route handlers focused on HTTP work: authenticate the request, read and validate request data, call a function from `server/src/services/`, and return the standard API response.
- Put business logic, database work, and external API calls in `server/src/services/`. Keep route files as orchestration code; do not place those operations inline in a handler.
- Authenticate protected endpoints with `authenticate` from `server/src/services/auth`. Validate request inputs with a schema in `server/src/models/` and `validate` from `server/src/services/validation` when the endpoint accepts input.
- Use `APIError` for expected service errors. Do not include credentials, credential-bearing URLs, or upstream secrets in messages or logs.
- Define server environment variables in `server/src/env/vars.ts`. Keep secret values in server-side environment configuration; never use `EXPO_PUBLIC_` variables for secrets.
- Before changing Next.js APIs, follow `server/AGENTS.md` and consult the installed Next.js documentation under `server/node_modules/next/dist/docs/` for the relevant feature.

## Mobile API conventions

- Add API paths to `ApiRoutes` in `mobile/src/routes/routes.ts`.
- Use the existing `useApiQuery` or `useApiMutation` hooks for server requests and the shared API response types in `mobile/src/models/api.ts`.
- Keep provider credentials and private integration details on the server. Mobile environment variables prefixed with `EXPO_PUBLIC_` are bundled into the app and must be treated as public.

## Repository changes

- Update documentation when environment variable ownership or setup changes.
- Avoid unrelated edits and preserve existing user changes.
