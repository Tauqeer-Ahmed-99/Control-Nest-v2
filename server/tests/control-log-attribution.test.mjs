import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Exercise the real TypeScript services with database/provider adapters replaced.
function loadSource(path, adapters = {}) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../src/${path}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
  );
  const loadedModule = { exports: {} };
  runInThisContext(`(function(require, module, exports) {${outputText}\n})`)(
    (name) => Object.hasOwn(adapters, name) ? adapters[name] : require(name),
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}

const api = loadSource("models/api");
const tryCatch = loadSource("utils/try-catch");
const timing = { measureRequestTiming: (_name, operation) => operation() };
const baseLog = {
  controllerDeviceId: "12345678-1234-4234-8234-123456789abc",
  deviceId: "22345678-1234-4234-8234-123456789abc",
  statusFrom: false,
  statusTo: true,
};

function logService(findDevice, saveLog) {
  return loadSource("services/device-control-logs", {
    "@/database": { query: { devices: { findFirst: findDevice } }, insert: () => ({ values: saveLog }) },
    "@/database/schema": { deviceControlLogs: {} },
    "@/models/api": api,
    "@/utils/try-catch": tryCatch,
    "./auth-house": {},
    "./observability-context": timing,
  });
}

test("controller callback stores the requesting user as createdBy", async () => {
  let saved;
  const { createLog } = logService(async (query) => {
    assert.deepEqual(query.where, {
      id: baseLog.deviceId, controllerDeviceId: baseLog.controllerDeviceId,
    });
    return { id: baseLog.deviceId };
  }, async (value) => { saved = value; });
  await createLog({ ...baseLog, userId: "user_requester" });
  assert.deepEqual(saved, {
    deviceId: baseLog.deviceId,
    statusChangedFrom: false,
    statusChangedTo: true,
    createdBy: "user_requester",
  });
});

test("legacy and system callbacks keep their controller attribution", async () => {
  const saved = [];
  const { createLog } = logService(async () => ({}), async (value) => saved.push(value));
  await createLog(baseLog);
  await createLog({ ...baseLog, userId: null });
  assert.ok(saved.every((log) => log.createdBy === `CD-${baseLog.controllerDeviceId}`));
  assert.equal(saved.length, 2);
});

test("a controller cannot create logs for another controller's device", async () => {
  const { createLog } = logService(async () => undefined, async () => assert.fail("Unexpected insert"));
  await assert.rejects(createLog({ ...baseLog, userId: "user_requester" }), { statusCode: 403 });
});

test("log insertion failures do not expose upstream details", async () => {
  const { createLog } = logService(async () => ({}), async () => {
    throw new Error("private upstream details");
  });
  await assert.rejects(createLog(baseLog), { message: "Unable to create device control log." });
});

test("callback validation accepts a Clerk ID and rejects empty IDs", () => {
  const { CreateDeviceControlLogSchema: schema } = loadSource("models/device-control-logs");
  assert.equal(schema.parse({ ...baseLog, userId: "user_requester" }).userId, "user_requester");
  assert.ok(schema.safeParse(baseLog).success);
  assert.ok(schema.safeParse({ ...baseLog, userId: null }).success);
  assert.ok(!schema.safeParse({ ...baseLog, userId: "   " }).success);
});

test("callback route forwards the actor and uses the authenticated controller ID", async () => {
  let saved;
  const { POST } = loadSource("app/api/v1/controller-device/device-control-logs/route", {
    "@/models/api": api,
    "@/models/device-control-logs": loadSource("models/device-control-logs"),
    "@/services/auth": { authenticateControllerDevice: async () => ({ id: "authenticated-controller" }) },
    "@/services/device-control-logs": { createLog: async (params) => { saved = params; } },
    "@/services/validation": loadSource("services/validation", { "@/models/api": api }),
    "@/services/request-observability": { withRequestObservability: (handler) => handler },
    "@/services/observability-context": timing,
  });
  const response = await POST({ json: async () => ({ ...baseLog, userId: "user_requester" }) });
  assert.equal(response.status, 200);
  assert.deepEqual(saved, { ...baseLog, userId: "user_requester", controllerDeviceId: "authenticated-controller" });
});

test("switch request sent to the controller includes the requesting user ID", async () => {
  let sent;
  const { switchPhysicalDevice } = loadSource("services/controller-device", {
    "@/database": {},
    "@/database/schema": {},
    "@/models/api": api,
    "@/utils/try-catch": tryCatch,
    "./cloudflare": {},
    "./auth-house": {},
    "./observability-context": { ...timing, getRequestId: () => "request-id" },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, config) => {
    sent = { url, ...config };
    return { json: async () => ({ success: true }) };
  };
  try {
    await switchPhysicalDevice("https://controller.test", {
      deviceId: baseLog.deviceId, status: true, userId: "user_requester",
    }, "session-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(sent.url, "https://controller.test/device/switch");
  assert.deepEqual(JSON.parse(sent.body), {
    deviceId: baseLog.deviceId, status: true, userId: "user_requester",
  });
  assert.equal(sent.headers.authorization, "Bearer session-token");
});

function userService(getUser) {
  return loadSource("services/user", {
    "@/models/api": api,
    "@/utils/try-catch": tryCatch,
    "./auth": { clerk: { users: { getUser } } },
  });
}

test("user lookup returns full name and image URL and omits private Clerk fields", async () => {
  const profile = { id: "user_other", fullName: "Other Member", firstName: "Other", lastName: "Member", username: null, imageUrl: "https://images.clerk.test/user_other.png" };
  const { getUserById } = userService(async (id) => {
    assert.equal(id, profile.id);
    return { ...profile, privateMetadata: { secret: "private" }, emailAddresses: [] };
  });
  assert.deepEqual(await getUserById({ userId: profile.id }), profile);
});

test("user lookup handles missing users and provider failures safely", async () => {
  for (const [status, statusCode, message] of [
    [404, 404, "User not found."],
    [503, 502, "Unable to fetch user."],
  ]) {
    const { getUserById } = userService(async () => {
      throw Object.assign(new Error("private provider details"), { status });
    });
    await assert.rejects(getUserById({ userId: "user_missing" }), { statusCode, message });
  }
});

test("user route authenticates, validates the ID, and returns the standard response", async () => {
  const calls = [];
  const profile = { id: "user_other", fullName: "Other Member" };
  const { GET } = loadSource("app/api/v1/user/route", {
    "@/models/api": api,
    "@/models/user": loadSource("models/user"),
    "@/services/auth": { authenticate: async () => calls.push("auth") },
    "@/services/request-observability": { withRequestObservability: (handler) => handler },
    "@/services/user": { getUserById: async (params) => {
      calls.push(params);
      return profile;
    } },
    "@/services/validation": loadSource("services/validation", { "@/models/api": api }),
  });
  const response = await GET({ nextUrl: new URL("https://control.test/api/v1/user?userId=user_other") });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["auth", { userId: "user_other" }]);
  assert.deepEqual((await response.json()).data, profile);

  const invalid = await GET({ nextUrl: new URL("https://control.test/api/v1/user") });
  assert.equal(invalid.status, 400);
  assert.equal(calls.length, 3); // The invalid request authenticates without calling the service.
});

test("user route stops before lookup when authentication fails", async () => {
  const { GET } = loadSource("app/api/v1/user/route", {
    "@/models/api": api,
    "@/models/user": loadSource("models/user"),
    "@/services/auth": { authenticate: async () => { throw new api.APIError({ message: "Unauthorized", statusCode: 401 }); } },
    "@/services/request-observability": { withRequestObservability: (handler) => handler },
    "@/services/user": { getUserById: async () => assert.fail("Unexpected lookup") },
    "@/services/validation": {},
  });
  assert.equal((await GET({})).status, 401);
});
