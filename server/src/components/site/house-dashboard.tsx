"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  Check,
  Cpu,
  House,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { AlertDialog } from "radix-ui";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Home = { id: string; name: string; isAdmin: boolean };
type Controller = {
  id: string;
  name: string;
  paired: boolean;
  deviceCount: number;
  apiKeyLastFour: string | null;
  tunnel: { hostname: string } | null;
};
type Removal =
  | { kind: "house"; house: Home }
  | { kind: "controller"; controller: Controller };

export function HouseDashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [houses, setHouses] = useState<Home[]>([]);
  const [houseId, setHouseId] = useState("");
  const [controllerData, setControllerData] = useState<{
    houseId: string;
    items: Controller[];
    failed?: boolean;
  } | null>(null);
  const [houseSearch, setHouseSearch] = useState("");
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [removalError, setRemovalError] = useState("");
  const removalTrigger = useRef<HTMLButtonElement | null>(null);
  const controllersTitle = useRef<HTMLHeadingElement>(null);
  const [name, setName] = useState("");
  const [controllerName, setControllerName] = useState("");
  const [secret, setSecret] = useState<{ name: string; key: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const needsProfile = user && (!user.firstName || !user.lastName);
  const selected = houses.find((house) => house.id === houseId);
  const controllers =
    controllerData?.houseId === houseId ? controllerData.items : [];
  const controllersLoading =
    Boolean(houseId) && controllerData?.houseId !== houseId;
  const visibleHouses = houses.filter((house) =>
    house.name.toLowerCase().includes(houseSearch.trim().toLowerCase()),
  );

  const api = useCallback(
    async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
      const token = await getToken();
      const response = await fetch(`/api/v1/${path}`, {
        method,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Please try again.");
      return result.data;
    },
    [getToken],
  );

  const loadHouses = useCallback(async () => {
    const data = await api<Home[]>("houses");
    setHouses(data);
    setHouseId((current) =>
      data.some((house) => house.id === current) ? current : data[0]?.id || "",
    );
  }, [api]);
  const loadControllers = useCallback(async () => {
    if (houseId)
      setControllerData({
        houseId,
        items: await api<Controller[]>(`house/controllers?houseId=${houseId}`),
      });
  }, [api, houseId]);
  useEffect(() => {
    let active = true;
    api<Home[]>("houses")
      .then((data) => {
        if (active) {
          setHouses(data);
          setHouseId((current) =>
            data.some((house) => house.id === current)
              ? current
              : data[0]?.id || "",
          );
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);
  useEffect(() => {
    let active = true;
    if (houseId)
      api<Controller[]>(`house/controllers?houseId=${houseId}`)
        .then((data) => {
          if (active) setControllerData({ houseId, items: data });
        })
        .catch((e: Error) => {
          if (active) {
            setControllerData({ houseId, items: [], failed: true });
            setError(e.message);
          }
        });
    return () => {
      active = false;
    };
  }, [api, houseId]);

  async function perform(action: () => Promise<void>, onError = setError) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function createHouse(event: FormEvent) {
    event.preventDefault();
    void perform(async () => {
      const house = await api<Home>("house", "POST", { name });
      await loadHouses();
      setHouseId(house.id);
      setControllerData(null);
      setHouseSearch("");
      setName("");
      setNotice("House created. Add your first controller below.");
    });
  }

  function confirmRemoval() {
    if (!removal) return;
    setRemovalError("");
    void perform(async () => {
      if (removal.kind === "house") {
        await api("house", "DELETE", { houseId: removal.house.id });
        const remaining = houses.filter(
          (house) => house.id !== removal.house.id,
        );
        setHouses(remaining);
        setHouseId(remaining[0]?.id || "");
        setHouseSearch("");
        setControllerData(null);
        setControllerName("");
        setNotice(`${removal.house.name} removed.`);
      } else {
        await api("house/controllers", "DELETE", {
          controllerDeviceId: removal.controller.id,
        });
        setControllerData((current) =>
          current
            ? {
                ...current,
                items: current.items.filter(
                  (controller) => controller.id !== removal.controller.id,
                ),
              }
            : null,
        );
        setNotice(`${removal.controller.name} removed.`);
      }
      setRemoval(null);
    }, setRemovalError);
  }
  function addController(event: FormEvent) {
    event.preventDefault();
    void perform(async () => {
      const result = await api<{ apiKey: string }>(
        "house/controllers",
        "POST",
        { houseId, name: controllerName },
      );
      setSecret({ name: controllerName, key: result.apiKey });
      setControllerName("");
      await loadControllers();
    });
  }
  function changeKey(controller: Controller, action: "rotate" | "revoke") {
    if (
      !window.confirm(
        action === "rotate"
          ? `Replace the API key for ${controller.name}? The old key will stop working. Enter the new key on the same Pi to reconnect.`
          : `Revoke access for ${controller.name}? Requests will be blocked until you generate and install a new key.`,
      )
    )
      return;
    void perform(async () => {
      const result = await api<{ apiKey: string | null }>(
        "house/controllers",
        "PATCH",
        { controllerDeviceId: controller.id, action },
      );
      setSecret(
        result.apiKey ? { name: controller.name, key: result.apiKey } : null,
      );
      setNotice(
        action === "revoke"
          ? "API key revoked."
          : "New key created. Update this controller to reconnect.",
      );
      await loadControllers();
    });
  }

  return (
    <main id="main-content" className="wrap account-page">
      <div className="account-heading">
        <span className="eyebrow">Your Control Nest</span>
        <h1>Houses & controllers</h1>
        <p>Manage your houses, pair controllers, and keep your setup tidy.</p>
      </div>
      {!loading && houses.length === 0 && (
        <ol className="setup-progress" aria-label="Setup steps">
          <li>
            <House aria-hidden="true" /> Create a house
          </li>
          <li>
            <Cpu aria-hidden="true" /> Add a controller
          </li>
          <li>
            <Smartphone aria-hidden="true" /> Pair in the app
          </li>
        </ol>
      )}
      {error && (
        <div className="account-message" role="alert">
          {error}
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              void perform(async () => {
                await loadHouses();
                await loadControllers();
              })
            }
          >
            Retry
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="account-message">
          {notice}
        </p>
      )}
      {needsProfile && (
        <section className="account-card profile-card">
          <h2>What should we call you?</h2>
          <p>Complete your profile before creating your house.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void perform(async () => {
                await user.update({
                  firstName: firstName.trim() || user.firstName || "",
                  lastName: lastName.trim() || user.lastName || "",
                });
              });
            }}
          >
            <label className="account-field">
              First name
              <input
                required
                autoComplete="given-name"
                maxLength={100}
                value={firstName || user.firstName || ""}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="account-field">
              Last name
              <input
                required
                autoComplete="family-name"
                maxLength={100}
                value={lastName || user.lastName || ""}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
            <Button type="submit" size="sm" disabled={busy}>
              Save profile & continue
            </Button>
          </form>
        </section>
      )}
      {loading ? (
        <p role="status">Loading your houses...</p>
      ) : (
        !needsProfile && (
          <>
            <div className="account-columns">
              <section
                className="account-card house-panel"
                aria-labelledby="houses-title"
              >
                <div className="account-section-heading">
                  <h2 id="houses-title">
                    <House aria-hidden="true" /> Houses
                  </h2>
                  <span className="account-count">{houses.length}</span>
                </div>
                {houses.length > 5 && (
                  <label className="account-field house-search">
                    <span className="sr-only">Find a house</span>
                    <Search aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Find a house"
                      value={houseSearch}
                      onChange={(event) => setHouseSearch(event.target.value)}
                    />
                  </label>
                )}
                {houses.length > 0 ? (
                  <nav className="house-list" aria-label="Select a house">
                    {visibleHouses.map((house) => (
                      <button
                        key={house.id}
                        type="button"
                        className="house-option"
                        aria-pressed={house.id === houseId}
                        disabled={busy || Boolean(secret)}
                        onClick={() => {
                          if (house.id === houseId) return;
                          setHouseId(house.id);
                          setControllerData(null);
                          setControllerName("");
                          setError("");
                          setNotice("");
                        }}
                      >
                        <span className="house-option-name">{house.name}</span>
                        <span className="house-role">
                          {house.isAdmin ? "Admin" : "Member"}
                        </span>
                        {house.id === houseId && <Check aria-hidden="true" />}
                      </button>
                    ))}
                    {!visibleHouses.length && (
                      <p className="account-empty">
                        No houses match your search.
                      </p>
                    )}
                  </nav>
                ) : (
                  <p className="account-empty">
                    Create a house to group your rooms and controllers.
                  </p>
                )}
                <details className="account-create" open={houses.length === 0}>
                  <summary>
                    <Plus aria-hidden="true" /> Create house
                  </summary>
                  <form onSubmit={createHouse}>
                    <label className="account-field">
                      House name
                      <input
                        required
                        maxLength={100}
                        placeholder="e.g. Our home"
                        value={name}
                        disabled={busy || Boolean(secret)}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </label>
                    <Button
                      size="sm"
                      disabled={busy || Boolean(secret) || !name.trim()}
                      type="submit"
                    >
                      <Plus aria-hidden="true" /> Create house
                    </Button>
                  </form>
                </details>
                {selected?.isAdmin && (
                  <div className="house-removal">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="account-remove"
                      disabled={
                        busy ||
                        Boolean(secret) ||
                        controllersLoading ||
                        Boolean(controllerData?.failed) ||
                        controllers.length > 0
                      }
                      onClick={(event) => {
                        removalTrigger.current = event.currentTarget;
                        setRemovalError("");
                        setRemoval({ kind: "house", house: selected });
                      }}
                    >
                      <Trash2 aria-hidden="true" /> Remove house
                    </Button>
                    {controllers.length > 0 && (
                      <p className="account-hint">
                        Remove this house&apos;s controllers first.
                      </p>
                    )}
                  </div>
                )}
              </section>
              <section
                className="account-card controller-panel"
                aria-labelledby="controllers-title"
                aria-busy={controllersLoading}
              >
                <div className="account-section-heading">
                  <div>
                    <h2
                      id="controllers-title"
                      ref={controllersTitle}
                      tabIndex={-1}
                    >
                      <Cpu aria-hidden="true" /> Controllers
                      {selected &&
                        !controllersLoading &&
                        !controllerData?.failed && (
                          <span className="account-count">
                            {controllers.length}
                          </span>
                        )}
                    </h2>
                    <p>
                      {selected
                        ? selected.name
                        : "Select or create a house to get started."}
                    </p>
                  </div>
                  {selected && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Refresh pairing status"
                      title="Refresh pairing status"
                      disabled={busy || controllersLoading}
                      onClick={() => void perform(loadControllers)}
                    >
                      <RefreshCw aria-hidden="true" />
                    </Button>
                  )}
                </div>
                {selected?.isAdmin && (
                  <form className="controller-create" onSubmit={addController}>
                    <label className="account-field">
                      Controller name
                      <input
                        required
                        maxLength={100}
                        placeholder="e.g. Ground floor"
                        value={controllerName}
                        disabled={busy || Boolean(secret) || controllersLoading}
                        onChange={(event) =>
                          setControllerName(event.target.value)
                        }
                      />
                    </label>
                    <Button
                      size="sm"
                      disabled={
                        busy ||
                        Boolean(secret) ||
                        controllersLoading ||
                        !controllerName.trim()
                      }
                      type="submit"
                    >
                      <Plus aria-hidden="true" /> Add controller
                    </Button>
                  </form>
                )}
                {secret && (
                  <p className="account-hint">
                    Save the key below to switch houses or manage another
                    controller.
                  </p>
                )}
                {selected && !selected.isAdmin && (
                  <p className="account-hint">
                    A house admin can add or remove controllers and manage keys.
                  </p>
                )}
                {controllersLoading ? (
                  <p className="account-empty" role="status">
                    Loading controllers...
                  </p>
                ) : controllerData?.failed ? (
                  <p className="account-empty">
                    Could not load controllers. Use refresh to try again.
                  </p>
                ) : (
                  selected &&
                  controllers.length === 0 && (
                    <p className="account-empty">
                      No controllers yet. Add a Raspberry Pi to generate its API
                      key.
                    </p>
                  )
                )}
                {controllers.map((controller) => (
                  <article key={controller.id} className="controller-row">
                    <div className="controller-details">
                      <h3>{controller.name}</h3>
                      <p>
                        <span
                          className={`controller-status ${controller.apiKeyLastFour && controller.paired ? "is-paired" : ""}`}
                        >
                          {!controller.apiKeyLastFour
                            ? "Key needed"
                            : controller.paired
                              ? "Paired"
                              : "Not paired"}
                        </span>
                        <span>
                          {controller.deviceCount}{" "}
                          {controller.deviceCount === 1 ? "device" : "devices"}
                        </span>
                        {controller.apiKeyLastFour && (
                          <span>
                            Key &middot;&middot;&middot;&middot;
                            {controller.apiKeyLastFour}
                          </span>
                        )}
                      </p>
                    </div>
                    {selected?.isAdmin && (
                      <div className="controller-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy || Boolean(secret)}
                          onClick={() => changeKey(controller, "rotate")}
                        >
                          <KeyRound aria-hidden="true" />{" "}
                          {controller.apiKeyLastFour
                            ? "Replace key"
                            : "Generate key"}
                        </Button>
                        {controller.apiKeyLastFour && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy || Boolean(secret)}
                            onClick={() => changeKey(controller, "revoke")}
                          >
                            Revoke
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="account-remove"
                          disabled={
                            busy ||
                            Boolean(secret) ||
                            controller.deviceCount > 0
                          }
                          title={
                            controller.deviceCount > 0
                              ? "Remove assigned devices in the app first"
                              : `Remove ${controller.name}`
                          }
                          aria-label={`Remove ${controller.name}`}
                          onClick={(event) => {
                            removalTrigger.current = event.currentTarget;
                            setRemovalError("");
                            setRemoval({ kind: "controller", controller });
                          }}
                        >
                          <Trash2 aria-hidden="true" /> Remove
                        </Button>
                      </div>
                    )}
                    {selected?.isAdmin && controller.deviceCount > 0 && (
                      <p className="controller-removal-hint">
                        Remove assigned devices in the app before removing this
                        controller.
                      </p>
                    )}
                  </article>
                ))}
              </section>
            </div>
            {secret && (
              <section
                className="account-card key-card"
                aria-labelledby="key-title"
              >
                <div className="account-section-heading">
                  <h2 id="key-title">
                    <ShieldCheck aria-hidden="true" /> Connect {secret.name}
                  </h2>
                </div>
                <p>
                  This key is shown once. Keep it private and use it for this
                  controller only.
                </p>
                <label className="account-field">
                  Controller API key
                  <input
                    readOnly
                    value={secret.key}
                    onFocus={(e) => e.target.select()}
                    spellCheck={false}
                  />
                </label>
                <div className="controller-actions">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        await navigator.clipboard.writeText(secret.key);
                        setNotice(
                          "API key copied. Paste it in the controller setup screen.",
                        );
                      })
                    }
                  >
                    Copy API key
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSecret(null)}
                  >
                    I&apos;ve saved my key
                  </Button>
                </div>
                <ol className="pairing-steps">
                  <li>
                    <strong>Using your phone</strong>
                    <p>
                      Sign in with the same email. Open Settings &rarr; Houses &
                      controllers, select the Pi on your Wi-Fi, and paste this
                      key.
                    </p>
                  </li>
                  <li>
                    <strong>Using your Raspberry Pi</strong>
                    <p>
                      After installation, run this command on the Pi and paste
                      your key when prompted.
                    </p>
                    <code>bash controller/scripts/setup.sh</code>
                  </li>
                </ol>
                <p className="account-hint">
                  Lost the key? Choose Replace key and enter the replacement on
                  the same Pi.
                </p>
              </section>
            )}
            <p className="account-help">
              Pair your Pi and manage rooms and devices in the mobile app.{" "}
              <Link href="/guide">Setup guide</Link>
            </p>
          </>
        )
      )}
      <AlertDialog.Root
        open={Boolean(removal)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setRemoval(null);
            setRemovalError("");
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="account-dialog-overlay" />
          <AlertDialog.Content
            className="account-dialog"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (removalTrigger.current?.isConnected)
                removalTrigger.current.focus();
              else controllersTitle.current?.focus();
            }}
            onEscapeKeyDown={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <AlertDialog.Title>
              Remove{" "}
              {removal?.kind === "house"
                ? removal.house.name
                : removal?.controller.name}
              ?
            </AlertDialog.Title>
            <AlertDialog.Description>
              {removal?.kind === "house"
                ? "This permanently removes the house, its empty rooms, and all house memberships. Houses with controllers or configured devices cannot be removed."
                : "This permanently removes the controller and its API key, tunnel, and DNS record. Disconnect the Pi before continuing. You can add it again with a new key."}
            </AlertDialog.Description>
            {removalError && (
              <p className="account-dialog-error" role="alert">
                {removalError}
              </p>
            )}
            <div className="controller-actions">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" size="sm" disabled={busy}>
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={(event) => {
                    event.preventDefault();
                    confirmRemoval();
                  }}
                >
                  {busy
                    ? "Removing..."
                    : removal?.kind === "house"
                      ? "Remove house"
                      : "Remove controller"}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}
