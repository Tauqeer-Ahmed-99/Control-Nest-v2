import { readFile } from "node:fs/promises";
import {
  activateReleasePolicy,
  registerRelease,
  revokeRelease,
} from "../src/services/release-catalog";

async function main() {
  const [command, input, ...flags] = process.argv.slice(2);
  if (!["register", "policy", "revoke"].includes(command) || !input) {
    console.log(
      "Usage: npm run ota:catalog -- register <catalog.json> | policy <signed-policy.json> [--activate-minimums] [--controllers <private-rollout.json>] | revoke <version>",
    );
    return;
  }
  const rolloutPath = flags.includes("--controllers")
    ? flags[flags.indexOf("--controllers") + 1]
    : null;
  const rollout = rolloutPath
    ? JSON.parse(await readFile(rolloutPath, "utf8"))
    : [];
  const result =
    command === "revoke"
      ? await revokeRelease(input)
      : command === "register"
        ? await registerRelease(JSON.parse(await readFile(input, "utf8")))
        : await activateReleasePolicy(
            JSON.parse(await readFile(input, "utf8")),
            flags.includes("--activate-minimums"),
            rollout,
          );
  console.log(JSON.stringify(result));
}
main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error(
      "Catalog operation failed. No credentials or upstream responses are logged.",
    );
    process.exit(1);
  });
