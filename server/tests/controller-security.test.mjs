import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

// Execute the real services/routes with isolated database and provider adapters.
const require = createRequire(import.meta.url);
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src",
);
function load(entry, mocks = {}, globals = {}) {
  const cache = new Map();
  function resolve(name, parent = root) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!name.startsWith("@/") && !name.startsWith(".")) return require(name);
    const filename = `${name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(parent, name)}.ts`;
    if (cache.has(filename)) return cache.get(filename).exports;
    const record = { exports: {} };
    cache.set(filename, record);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(
      code,
      {
        module: record,
        exports: record.exports,
        require: (dependency) => resolve(dependency, path.dirname(filename)),
        Buffer,
        Request,
        Response,
        Headers,
        console,
        process,
        fetch,
        ...globals,
      },
      { filename },
    );
    return record.exports;
  }
  return resolve(entry);
}
const timing = {
  measureRequestTiming: (_name, action) => action(),
  setObservabilityUserId() {},
  setObservabilityControllerId() {},
  getRequestId: () => undefined,
};
const base = {
  "@/env/vars": { variables: {} },
  "@clerk/backend": {
    createClerkClient: () => ({}),
    verifyToken: () => ({ sub: "user" }),
  },
  "./observability-context": timing,
};
const credentials = load("@/services/controller-credentials");
const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const installation = "33333333-3333-4333-8333-333333333333";
const key = credentials.generateControllerKey(firstId);
const row = () => ({
  id: firstId,
  houseId: "house-a",
  apiKeyHash: credentials.hashControllerKey(key),
  installationId: installation,
});
const request = (token = key, identity = installation) =>
  new Request("https://control.test/api", {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Controller-Installation-ID": identity,
    },
  });
const status = (code) => (error) => error.statusCode === code;

test("controller keys are random, parseable, and stored as hashes", () => {
  assert.equal(credentials.controllerIdFromKey(key), firstId);
  assert.notEqual(credentials.generateControllerKey(firstId), key);
  assert.ok(
    credentials.matchesControllerKey(key, credentials.hashControllerKey(key)),
  );
  assert.equal(
    credentials.matchesControllerKey(
      `${key.slice(0, -1)}!`,
      credentials.hashControllerKey(key),
    ),
    false,
  );
  assert.equal(credentials.controllerIdFromKey("cn_invalid"), undefined);
});

test("controller authentication rejects revoked, forged, legacy, and foreign-installation credentials", async () => {
  let controller = row();
  const auth = load("@/services/auth", {
    ...base,
    "@/database": {
      query: {
        controllerDevices: {
          findFirst: ({ where }) =>
            where.id === controller?.id ? controller : undefined,
        },
      },
    },
  });
  assert.equal(
    (await auth.authenticateControllerDevice(request())).id,
    firstId,
  );
  await assert.rejects(
    auth.authenticateControllerDevice(
      request(credentials.generateControllerKey(firstId)),
    ),
    status(401),
  );
  await assert.rejects(
    auth.authenticateControllerDevice(
      request(credentials.generateControllerKey(secondId)),
    ),
    status(401),
  );
  await assert.rejects(
    auth.authenticateControllerDevice(request(key, secondId)),
    status(403),
  );
  await assert.rejects(
    auth.authenticateControllerDevice(
      new Request("https://control.test", {
        headers: { Authorization: "Basic retired" },
      }),
    ),
    status(401),
  );
  controller.apiKeyHash = null;
  await assert.rejects(
    auth.authenticateControllerDevice(request()),
    status(401),
  );
  controller = { ...row(), installationId: null };
  await assert.rejects(
    auth.authenticateControllerDevice(request()),
    status(403),
  );
  assert.equal(
    (
      await auth.authenticateControllerDevice(request(), {
        allowUnpaired: true,
      })
    ).id,
    firstId,
  );
});

test("device data and routing use the explicit controller, including grouped deletion", async () => {
  const calls = [];
  const assigned = [
    { id: "device-a", controllerDeviceId: firstId },
    { id: "device-b", controllerDeviceId: secondId },
  ];
  const db = {
    query: {
      controllerDevices: {
        findFirst: ({ where }) => ({
          id: where.id,
          apiKeyHash: "hash",
          tunnel: { hostname: `${where.id}.test` },
        }),
      },
      devices: {
        findMany: ({ where }) =>
          assigned.filter(
            (device) => device.controllerDeviceId === where.controllerDeviceId,
          ),
      },
    },
  };
  const tx = {
    query: {
      devices: {
        findFirst: ({ where }) => ({
          ...assigned.find((device) => device.id === where.id),
          controllerDevice: {
            apiKeyHash: "hash",
            tunnel: { hostname: "second-pi.test" },
          },
        }),
        findMany: () => assigned,
      },
    },
  };
  const service = load(
    "@/services/controller-device",
    {
      "@/database": db,
      "./cloudflare": {},
      "./password": {},
      "./auth-house": {},
      "./observability-context": timing,
    },
    {
      fetch: async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) });
        return Response.json({ success: true });
      },
    },
  );
  assert.equal(
    (await service.getControllerDeviceData(secondId)).devices[0].id,
    "device-b",
  );
  await service.createPhysicalDevice(tx, { id: "device-b" }, "user-token");
  assert.equal(calls[0].url, "https://second-pi.test/device");
  await service.removePhysicalDevice(
    tx,
    ["device-a", "device-b"],
    "user-token",
  );
  assert.equal(calls.length, 3);
  assert.deepEqual(
    calls.slice(1).map((call) => call.body.deviceIds),
    [["device-a"], ["device-b"]],
  );
});

test("control logs cannot be written for a sibling controller's device", async () => {
  let writes = 0;
  const service = load("@/services/device-control-logs", {
    "@/database": {
      query: {
        devices: {
          findFirst: ({ where }) =>
            where.controllerDeviceId === secondId
              ? { id: "device-b" }
              : undefined,
        },
      },
      insert: () => ({
        values: () => {
          writes++;
        },
      }),
    },
    "./auth-house": {},
    "./observability-context": timing,
  });
  await assert.rejects(
    service.createLog({
      deviceId: "device-b",
      controllerDeviceId: firstId,
      statusFrom: false,
      statusTo: true,
    }),
    status(403),
  );
  assert.equal(writes, 0);
  await service.createLog({
    deviceId: "device-b",
    controllerDeviceId: secondId,
    statusFrom: false,
    statusTo: true,
  });
  assert.equal(writes, 1);
});

test("enrollment retries reuse the tunnel, reject a second Pi, and reject stale keys", async () => {
  let current = { ...row(), installationId: null };
  let tunnel;
  let provisioned = 0;
  const tx = {
    select: () => ({
      from: () => ({ where: () => ({ for: () => [current] }) }),
    }),
    query: {
      tunnels: { findFirst: () => tunnel },
      houses: { findFirst: () => ({ id: "house-a" }) },
    },
    insert: () => ({
      values: (data) => ({
        returning: () => {
          tunnel = data;
          return [data];
        },
      }),
    }),
    update: () => ({
      set: (data) => ({
        where: () => {
          current = { ...current, ...data };
        },
      }),
    }),
  };
  const service = load("@/services/controller-device", {
    "@/database": { transaction: (action) => action(tx) },
    "./cloudflare": {
      createTunnelAndPublishAppService: () => {
        provisioned++;
        return {
          cloudflareTunnel: { id: "tunnel" },
          tunnelName: "pi",
          publishedServiceConfig: { hostname: "pi.test" },
          tunnelToken: "private",
          dnsRecord: { id: "dns" },
        };
      },
    },
    "./password": {},
    "./auth-house": {},
    "./observability-context": timing,
  });
  const first = await service.initControllerDevice(row(), installation);
  const retry = await service.initControllerDevice(row(), installation);
  assert.equal(first.tunnel.id, retry.tunnel.id);
  assert.equal(provisioned, 1);
  assert.equal(first.controllerDevice.apiKeyHash, undefined);
  await assert.rejects(
    service.initControllerDevice(row(), secondId),
    status(409),
  );
  current.apiKeyHash = "replacement";
  await assert.rejects(
    service.initControllerDevice(row(), installation),
    status(401),
  );
});

test("controller read route ignores a forged controller ID in the URL", async () => {
  let readId;
  const route = load("@/app/api/v1/controller-device/route", {
    "@/services/auth": { authenticateControllerDevice: () => row() },
    "@/services/controller-device": {
      getControllerDeviceData: (id) => {
        readId = id;
        return { id };
      },
    },
    "@/services/request-observability": {
      withRequestObservability: (handler) => handler,
    },
  });
  const response = await route.GET(
    new Request(`https://control.test?controllerDeviceId=${secondId}`),
  );
  assert.equal(response.status, 200);
  assert.equal(readId, firstId);
});

test("house admins can create independent controllers; members cannot manage keys", async () => {
  let admin = true;
  const stored = [];
  const models = load("@/models/api");
  const authorize = () => {
    if (!admin)
      throw new models.APIError({ message: "Admin only", statusCode: 403 });
  };
  const service = load("@/services/onboarding", {
    "@/models/api": models,
    "@/database": {
      insert: () => ({
        values: (data) => ({
          returning: () => {
            stored.push(data);
            return [{ id: data.id, houseId: data.houseId, name: data.name }];
          },
        }),
      }),
      update: () => ({
        set: (data) => ({
          where: () => {
            stored[0] = { ...stored[0], ...data };
          },
        }),
      }),
    },
    "./auth-house": {
      authorizeHouse: authorize,
      authorizeHouseByControllerDevice: authorize,
    },
  });
  const first = await service.createController(
    { houseId: "house-a", name: "Floor 1" },
    "owner",
  );
  const second = await service.createController(
    { houseId: "house-a", name: "Floor 2" },
    "owner",
  );
  assert.notEqual(first.controllerDevice.id, second.controllerDevice.id);
  assert.equal(stored[0].houseId, stored[1].houseId);
  assert.equal(
    stored[0].apiKeyHash,
    credentials.hashControllerKey(first.apiKey),
  );
  assert.equal(stored[0].apiKey, undefined);
  assert.equal(stored[0].apiKeyLastFour, first.apiKey.slice(-4));
  await service.changeControllerKey(
    { controllerDeviceId: first.controllerDevice.id, action: "revoke" },
    "owner",
  );
  assert.equal(stored[0].apiKeyHash, null);
  admin = false;
  await assert.rejects(
    service.createController({ houseId: "house-a", name: "Foreign" }, "member"),
    status(403),
  );
  await assert.rejects(
    service.changeControllerKey(
      { controllerDeviceId: second.controllerDevice.id, action: "rotate" },
      "member",
    ),
    status(403),
  );
  assert.equal(stored.length, 2);
});

test("database enrollment failures clean up the newly provisioned tunnel", async () => {
  let cleaned = false;
  const tx = {
    select: () => ({ from: () => ({ where: () => ({ for: () => [row()] }) }) }),
    query: { tunnels: { findFirst: () => undefined } },
    insert: () => ({
      values: () => ({
        returning: () => {
          throw new Error("database unavailable");
        },
      }),
    }),
  };
  const service = load("@/services/controller-device", {
    "@/database": { transaction: (action) => action(tx) },
    "./cloudflare": {
      createTunnelAndPublishAppService: () => ({
        cloudflareTunnel: { id: "new-tunnel" },
        dnsRecord: { id: "new-dns" },
        publishedServiceConfig: { hostname: "pi.test" },
      }),
      cleanupControllerTunnel: (id, dnsId) => {
        assert.equal(id, "new-tunnel");
        assert.equal(dnsId, "new-dns");
        cleaned = true;
      },
    },
    "./auth-house": {},
    "./observability-context": timing,
  });
  await assert.rejects(
    service.initControllerDevice(row(), installation),
    /Unable to pair/,
  );
  assert.equal(cleaned, true);
});
