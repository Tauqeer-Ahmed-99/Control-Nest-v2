import assert from "node:assert/strict";
import test from "node:test";
import {
  canRestoreHouse,
  inspectControllerKey,
  selectAvailablePin,
} from "../src/utils/onboarding.ts";

const id = "12345678-1234-4234-8234-123456789abc";
const key = `cn_${id}.${"a".repeat(43)}`;
const controller = { id, houseId: "house-a", name: "Living room Pi" };

test("a complete key resolves the named controller in the chosen house", () => {
  assert.deepEqual(
    inspectControllerKey(`  ${key}\n`, "house-a", [controller]),
    { controller, error: "" },
  );
});
test("a key from another house cannot become a pairing target", () => {
  const result = inspectControllerKey(key, "house-b", [controller]);
  assert.equal(result.controller, null);
  assert.match(result.error, /correct house/);
  assert.ok(!JSON.stringify(result).includes(key));
});
test("truncated, malformed, or extra key text cannot be submitted", () => {
  for (const value of [
    "",
    key.slice(0, -1),
    `${key}extra`,
    key.replace("4234", "7234"),
    `prefix ${key}`,
  ]) {
    assert.equal(
      inspectControllerKey(value, "house-a", [controller]).controller,
      null,
    );
  }
});
test("a newly created controller requires refreshing its house entries", () => {
  assert.equal(inspectControllerKey(key, "house-a", []).controller, null);
  assert.equal(
    inspectControllerKey(key, "house-a", [controller]).controller,
    controller,
  );
});
test("last house is restored only for the account that selected it", () => {
  const config = { house: { id: "house-a" }, userId: "alice" };
  assert.equal(canRestoreHouse(config, "alice"), true);
  assert.equal(canRestoreHouse(config, "bob"), false);
  assert.equal(canRestoreHouse(config, undefined), false);
  assert.equal(
    canRestoreHouse({ house: { id: "legacy-house" } }, "alice"),
    false,
  );
  assert.equal(canRestoreHouse(null, "alice"), false);
});
test("changing controller never carries its previous GPIO selection over", () => {
  const pins = [{ headerPinNumber: 7 }, { headerPinNumber: 11 }];
  assert.equal(
    selectAvailablePin(pins, "pi-b", { controllerId: "pi-a", number: 11 }),
    pins[0],
  );
  assert.equal(
    selectAvailablePin(pins, "pi-b", { controllerId: "pi-b", number: 11 }),
    pins[1],
  );
});
test("a pin no longer available after refresh is replaced with a free pin", () => {
  const pins = [{ headerPinNumber: 7 }];
  assert.equal(
    selectAvailablePin(pins, "pi-a", { controllerId: "pi-a", number: 11 }),
    pins[0],
  );
  assert.equal(
    selectAvailablePin([], "pi-a", { controllerId: "pi-a", number: 11 }),
    undefined,
  );
});
