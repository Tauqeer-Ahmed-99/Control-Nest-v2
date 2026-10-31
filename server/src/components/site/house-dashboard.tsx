"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  Cpu,
  House,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Home = { id: string; name: string; isAdmin: boolean };
type Controller = {
  id: string;
  name: string;
  paired: boolean;
  apiKeyLastFour: string | null;
  tunnel: { hostname: string } | null;
};

export function HouseDashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [houses, setHouses] = useState<Home[]>([]);
  const [houseId, setHouseId] = useState("");
  const [controllers, setControllers] = useState<Controller[]>([]);
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
    setHouseId((current) => current || data[0]?.id || "");
  }, [api]);
  const loadControllers = useCallback(async () => {
    if (houseId)
      setControllers(
        await api<Controller[]>(`house/controllers?houseId=${houseId}`),
      );
  }, [api, houseId]);
  useEffect(() => {
    let active = true;
    api<Home[]>("houses")
      .then((data) => {
        if (active) {
          setHouses(data);
          setHouseId((current) => current || data[0]?.id || "");
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
          if (active) setControllers(data);
        })
        .catch((e: Error) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [api, houseId]);

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
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
      setControllers([]);
      setName("");
      setNotice("House created. Add your first controller below.");
    });
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
        <h1>
          {houses.length
            ? `Welcome${user?.firstName ? `, ${user.firstName}` : ""}.`
            : "Make yourself at home."}
        </h1>
        <p>
          Create a house, add your controllers, then bring your rooms to life in
          the app.
        </p>
      </div>
      <ol className="setup-progress" aria-label="Setup steps">
        <li>
          <House /> 1. Create a house
        </li>
        <li>
          <Cpu /> 2. Add a controller
        </li>
        <li>
          <Smartphone /> 3. Pair and control
        </li>
      </ol>
      {error && (
        <div className="account-message" role="alert">
          {error}{" "}
          <Button
            variant="ghost"
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
        <section className="account-card">
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
            <Button type="submit" disabled={busy}>
              Save profile & continue
            </Button>
          </form>
        </section>
      )}
      {loading ? (
        <p role="status">Loading your houses…</p>
      ) : (
        <>
          <div className="account-columns" hidden={Boolean(needsProfile)}>
            <section className="account-card">
              <House className="account-icon" />
              <h2>
                {houses.length ? "Your houses" : "First, name your house"}
              </h2>
              <p>
                A house groups your rooms and controllers. You can add more than
                one controller to the same house.
              </p>
              {houses.length > 0 && (
                <label className="account-field">
                  Selected house
                  <select
                    disabled={busy}
                    value={houseId}
                    onChange={(e) => {
                      setHouseId(e.target.value);
                      setControllers([]);
                      setSecret(null);
                    }}
                  >
                    {houses.map((house) => (
                      <option key={house.id} value={house.id}>
                        {house.name}
                        {house.isAdmin ? "" : " · Member"}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <form onSubmit={createHouse}>
                <label className="account-field">
                  {houses.length ? "Create another house" : "House name"}
                  <input
                    required
                    maxLength={100}
                    placeholder="e.g. Our home"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <Button disabled={busy || !name.trim()} type="submit">
                  <Plus /> Create house
                </Button>
              </form>
            </section>
            <section className="account-card">
              <Cpu className="account-icon" />
              <h2>
                {selected
                  ? `Controllers in ${selected.name}`
                  : "Next, add a controller"}
              </h2>
              <p>
                Give each Raspberry Pi a name and its own API key. Each device
                will use the controller you choose in the app.
              </p>
              {selected?.isAdmin && (
                <form onSubmit={addController}>
                  <label className="account-field">
                    Controller name
                    <input
                      required
                      maxLength={100}
                      placeholder="e.g. Ground floor"
                      value={controllerName}
                      onChange={(e) => setControllerName(e.target.value)}
                    />
                  </label>
                  <Button
                    disabled={busy || Boolean(secret) || !controllerName.trim()}
                    type="submit"
                  >
                    <KeyRound /> Add controller & generate key
                  </Button>
                </form>
              )}
              {secret && (
                <p className="account-hint">
                  Save the key shown below before generating another.
                </p>
              )}
              {!selected && (
                <p className="account-hint">
                  Create your house to unlock this step.
                </p>
              )}
              {selected && !selected.isAdmin && (
                <p className="account-hint">
                  A house admin can add controllers and manage keys.
                </p>
              )}
              {controllers.map((controller) => (
                <article key={controller.id} className="controller-row">
                  <div>
                    <h3>{controller.name}</h3>
                    <p>
                      {!controller.apiKeyLastFour
                        ? "Key revoked or setup needed"
                        : controller.paired
                          ? "Paired"
                          : "Waiting for pairing"}
                      {controller.apiKeyLastFour &&
                        ` · Key ending ${controller.apiKeyLastFour}`}
                    </p>
                  </div>
                  {selected?.isAdmin && (
                    <div className="controller-actions">
                      <Button
                        variant="outline"
                        disabled={busy || Boolean(secret)}
                        onClick={() => changeKey(controller, "rotate")}
                      >
                        {controller.apiKeyLastFour
                          ? "Replace key"
                          : "Generate key"}
                      </Button>
                      {controller.apiKeyLastFour && (
                        <Button
                          variant="ghost"
                          disabled={busy || Boolean(secret)}
                          onClick={() => changeKey(controller, "revoke")}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  )}
                </article>
              ))}
              {selected && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void perform(loadControllers)}
                >
                  <RefreshCw /> Refresh pairing status
                </Button>
              )}
            </section>
          </div>
          {secret && (
            <section
              className="account-card key-card"
              aria-labelledby="key-title"
            >
              <ShieldCheck className="account-icon" />
              <h2 id="key-title">Connect {secret.name}</h2>
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
                <Button variant="outline" onClick={() => setSecret(null)}>
                  I’ve saved my key
                </Button>
              </div>
              <ol className="pairing-steps">
                <li>
                  <strong>Using your phone</strong>
                  <p>
                    Sign in to Control Nest with the same email. Open Settings →
                    Houses & controllers, select the Pi on your Wi-Fi, and paste
                    this key.
                  </p>
                </li>
                <li>
                  <strong>Using your Raspberry Pi</strong>
                  <p>
                    After installation, run the command below on the Pi. Paste
                    your key when prompted; it stays out of shell history.
                  </p>
                  <code>bash controller/scripts/setup.sh</code>
                </li>
              </ol>
              <p className="account-hint">
                Lost the key? Choose Replace key above and enter the replacement
                on the same Pi.
              </p>
            </section>
          )}
          <p className="account-help">
            Your next step: open the mobile app to pair your Pi and add rooms
            and devices. <Link href="/guide">Read the setup guide</Link>.
          </p>
        </>
      )}
    </main>
  );
}
