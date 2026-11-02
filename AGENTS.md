# Repository instructions for agents

Follow the conventions already used in this repository. Before editing a component, read its local instructions (`controller/AGENTS.md`, `server/AGENTS.md`, or `mobile/AGENTS.md`) and inspect nearby implementations of the same kind. Keep changes consistent with those examples.

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

## Releases

- Read [docs/releases.md](docs/releases.md) before any release-related work. It is the shared release ledger for `mobile/`, `server/`, and `controller/`.
- For implementation of mobile OTA delivery, admin-initiated controller firmware updates, compatibility gates, and disaster recovery, follow [docs/ota-updates-and-recovery.md](docs/ota-updates-and-recovery.md).
- Keep that file to a `# Releases` heading followed by exactly one line per published release, newest first. Each line contains only a version, a short release title, and its GitHub Release link, for example: `- [1.0.0](https://github.com/Tauqeer-Ahmed-99/Control-Nest-v2/releases/tag/v1.0.0) — Initial release`. Do not add planned/published sections or placeholder releases. Store detailed changelogs and release resources on the corresponding GitHub Release.
- Use one shared `MAJOR.MINOR.PATCH` version, such as `1.0.0`, for all three codebases, including components unchanged in that release. Use one repository tag, `v1.0.0`, for that version; do not create component-specific versions or tags. Start with `1.0.0`; increment major for breaking changes, minor for backward-compatible features, and patch for fixes. Do not use version suffixes in the ledger.
- Before tagging, synchronize `server/package.json`, `mobile/package.json`, the root and root-package versions in both `package-lock.json` files, `mobile/app.json` (`expo.version`), and `controller/VERSION` (create this plain-text version file for the first release). Mobile platform build numbers are separate from the shared release version.
- Adding release documentation does not publish a release. Follow the workflow below when a release is requested.

### Release workflow

1. Inspect the ledger, `gh release list`, and remote tags before selecting the next version. Prepare and validate all three components using their local instructions; do not write tests unless requested. Commit the synchronized version metadata and intended release changes, and ensure the exact release commit is on the remote. Preserve unrelated user changes and build release resources from that commit in a clean checkout.
2. Prepare versioned release resources for all three components: installable mobile build artifacts for supported target platforms, a server deployment/source archive, and a controller distribution archive including its requirements and install/update scripts. Include setup or migration notes and a `SHA256SUMS` file for uploaded artifacts. Exclude private environment files, credentials, persistent controller state, and local dependencies. Do not publish until the required artifacts are available and verified.
3. Create an annotated tag at the exact validated release commit and push that tag. Never move or reuse a published tag. The following commands illustrate `1.0.0`; substitute the selected version and actual commit SHA:

   ```sh
   git tag -a v1.0.0 <RELEASE_COMMIT_SHA> -m "Control Nest 1.0.0"
   git push origin refs/tags/v1.0.0
   gh release create v1.0.0 --verify-tag --title "Control Nest 1.0.0" --generate-notes --draft
   ```

   For later releases, also pass `--notes-start-tag <PREVIOUS_PUBLISHED_TAG>` to `gh release create` so generated notes cover the correct release range.

4. Review the generated changelog against the changes since the previous release (or the initial release scope). Cover **Mobile**, **Server**, and **Controller**, including unchanged components, breaking changes, fixes, setup/environment changes, database migrations, and installation/update instructions as applicable. Save the final changelog to a temporary file with actual newlines and apply it with `gh release edit v1.0.0 --notes-file <CHANGELOG_FILE>`.
5. Upload the prepared resources and checksums with `gh release upload v1.0.0 <ARTIFACT_FILES_AND_SHA256SUMS>`. Inspect the draft with `gh release view v1.0.0 --json tagName,isDraft,body,assets,url`. Confirm the tag points to the intended commit, all versions match, the notes are accurate, and uploaded resources match their checksums. Publish with `gh release edit v1.0.0 --draft=false --latest`, then verify the published release with `gh release view v1.0.0 --json tagName,isDraft,publishedAt,assets,url`.
6. Only after publication succeeds, obtain the actual release URL with `gh release view v1.0.0 --json url --jq .url`, prepend its single-line entry below the heading in [docs/releases.md](docs/releases.md), and commit that ledger update. Do not record failed or draft releases. Report the GitHub Release URL and any remaining deployment steps; publishing a release does not deploy the server or install updates on devices.

Use the [GitHub CLI release manual](https://cli.github.com/manual/gh_release_create) for command details. Keep release notes and downloadable resources on GitHub rather than expanding the ledger.

## Tests

- Never write any tests unless the user asks
