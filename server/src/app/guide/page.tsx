import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Cpu,
  Info,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/site/code-block";
import {
  androidDownloadUrl,
  controllerBootstrapCommand,
  installerCommand,
  repositoryUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Setup guide",
  description:
    "Install AutoPiHub on your Raspberry Pi, pair it with Control Nest, and add rooms, devices, and schedules. We provide the shared API and remote access.",
};

const contents = [
  ["before-you-start", "What you need"],
  ["connection-diagram", "Connection diagram"],
  ["controller", "Install AutoPiHub"],
  ["pairing", "Pair in the app"],
  ["first-device", "Add rooms and devices"],
  ["schedules", "Set a schedule"],
  ["maintenance", "Updates and recovery"],
  ["troubleshooting", "Troubleshooting"],
];

function Callout({
  children,
  caution = false,
}: {
  children: React.ReactNode;
  caution?: boolean;
}) {
  return (
    <div className={`guide-callout ${caution ? "caution" : ""}`}>
      {caution ? (
        <TriangleAlert aria-hidden="true" />
      ) : (
        <Info aria-hidden="true" />
      )}
      <div>{children}</div>
    </div>
  );
}

export default function Guide() {
  return (
    <main id="main-content">
      <div className="guide-hero wrap">
        <span className="eyebrow">Setup guide</span>
        <h1>
          Set up
          <br />
          Control Nest.
        </h1>
        <p>
          Install AutoPiHub on your Pi, pair it in the app, and add your
          devices.
        </p>
        <div className="hero-actions">
          <Button asChild>
            <a href="#before-you-start">
              Start here <ArrowRight aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="#pairing">
              Pair a controller <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={androidDownloadUrl}>
              Download Android APK <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
      <div className="guide-layout wrap">
        <aside className="guide-toc">
          <p>On this page</p>
          <nav aria-label="Setup guide contents">
            {contents.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </aside>
        <div className="guide-article">
          <section id="before-you-start">
            <span className="eyebrow">Before you start</span>
            <h2>What you need.</h2>
            <p>
              Control Nest provides the shared API and Cloudflare tunnels. You
              set up the app, your Raspberry Pi, and the devices connected to
              it.
            </p>
            <ul>
              <li>
                A Raspberry Pi running Raspberry Pi OS, with a suitable power
                supply and storage.
              </li>
              <li>
                A Pi user with <code>sudo</code> access, plus <code>curl</code>{" "}
                and <code>tar</code> installed.
              </li>
              <li>
                An Android phone with the{" "}
                <a href={androidDownloadUrl}>Control Nest APK</a> installed.
              </li>
              <li>
                Internet access and the same local network for your phone and Pi
                during pairing.
              </li>
              <li>Relay hardware rated for the devices you want to control.</li>
            </ul>
            <div className="guide-paths">
              <a href="#controller">
                <strong>
                  <Cpu size={20} /> Set up your Pi
                </strong>
                <span>Install the AutoPiHub controller service.</span>
              </a>
              <a href="#pairing">
                <strong>
                  <Smartphone size={20} /> Pi already running?
                </strong>
                <span>Open the app and pair your controller.</span>
              </a>
            </div>
          </section>

          <section id="connection-diagram">
            <span className="eyebrow">Hardware</span>
            <h2>Check your connections.</h2>
            <p>
              Use the original relay diagram as a reference for your hardware.
            </p>
            <figure className="connection-diagram">
              <a
                href="/brand/connection-diagram.jpeg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the full-size relay connection diagram"
              >
                <Image
                  src="/brand/connection-diagram.jpeg"
                  alt="Relay reference diagram showing VCC, GND and GPIO input, COM, NC and NO contacts, a switch, and a bulb."
                  width={2025}
                  height={788}
                  sizes="(max-width: 760px) 100vw, 850px"
                />
              </a>
              <figcaption>
                <a
                  href="/brand/connection-diagram.jpeg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open full-size diagram{" "}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </figcaption>
            </figure>
            <Callout caution>
              <p>
                Do not connect mains voltage to Raspberry Pi GPIO. This diagram
                is a reference, not a complete wiring plan. Have a qualified
                electrician choose the relay ratings and install mains wiring.
              </p>
            </Callout>
          </section>

          <section id="controller">
            <span className="eyebrow">On your Raspberry Pi</span>
            <h2>Install AutoPiHub.</h2>
            <p>
              Connect the Pi to your home network. Open its terminal or connect
              over SSH, then run:
            </p>
            <CodeBlock
              label="Raspberry Pi · install AutoPiHub"
              code={installerCommand}
            />
            <p>
              Run this as your normal Pi user. The installer uses{" "}
              <code>sudo</code> when needed. It installs AutoPiHub and starts it
              as a service that runs on boot. The project goes in{" "}
              <code>~/Control-Nest-v2</code>.
            </p>
            <p>
              When installation finishes, check that the service is running:
            </p>
            <CodeBlock
              label="Raspberry Pi · check the service"
              code="sudo systemctl status autopihub --no-pager"
            />
            <p>
              Look for <code>active (running)</code>. Keep the Pi powered on,
              then create your house and pair it below. After pairing, follow{" "}
              <a href="#maintenance">Updates and recovery</a> to enable signed
              controller updates.
            </p>
          </section>

          <section id="pairing">
            <span className="eyebrow">On your phone</span>
            <h2>Pair your controller.</h2>
            <ol>
              <li>
                On this website, create your account with your email, first
                name, and last name. Verify your email address.
              </li>
              <li>
                Open <Link href="/dashboard">My houses</Link>, create a house,
                and add a named controller. Copy its API key. The full key is
                shown once.
              </li>
              <li>Connect your phone and Pi to the same trusted Wi-Fi network.</li>
              <li>
                In Control Nest, sign in with the same account and choose your
                house.
              </li>
              <li>
                Open Settings &gt; Controllers &gt; Connect a controller, or
                Add &gt; Controller. Allow local network access and select your
                Pi under Nearby controllers.
              </li>
              <li>
                Paste its API key and tap Connect controller, then Done. Choose
                Open house when ready.
              </li>
            </ol>
            <p>
              Create a separate controller entry and key for each Pi. Repeat
              these steps to connect more Pis to the same house. Members use
              their own accounts for everyday control.
            </p>
            <p>
              Prefer to pair on the Pi? After installation, run the command
              below and paste the key at the hidden prompt. The script stops
              AutoPiHub during setup and restarts it afterward.
            </p>
            <CodeBlock
              label="Raspberry Pi · pair this controller"
              code="bash ~/Control-Nest-v2/controller/scripts/setup.sh"
            />
            <Callout>
              <p>
                Pairing sets up your remote connection automatically. To control
                devices away from home, keep the Pi connected to the internet
                and sign in to the app.
              </p>
            </Callout>
          </section>

          <section id="first-device">
            <span className="eyebrow">In Control Nest</span>
            <h2>Add rooms and devices.</h2>
            <ol>
              <li>Tap Add &gt; Room and name a room, such as Living room.</li>
              <li>
                Tap Add &gt; Device, enter its name, and choose its room.
              </li>
              <li>
                Select its controller and an available header pin connected to
                its relay. Match the app selection to your wiring.
              </li>
              <li>
                Optionally add a power rating in watts for energy estimates,
                then save the device.
              </li>
              <li>
                Turn the device on and off in the app. Confirm the connected
                device responds.
              </li>
            </ol>
            <p>
              Physical header numbers and BCM GPIO numbers are different. Use
              the app&apos;s pin mapping to select the correct connection. Test with
              a low-voltage load before connecting other equipment.
            </p>
          </section>

          <section id="schedules">
            <span className="eyebrow">Device settings</span>
            <h2>Set a schedule.</h2>
            <p>
              Open a device, enable its schedule, and select the days and on/off
              times. Save your changes.
            </p>
            <p>
              AutoPiHub runs schedules on the Pi. Keep it powered on and check
              that its time and timezone are correct.
            </p>
          </section>

          <section id="maintenance">
            <span className="eyebrow">Maintenance</span>
            <h2>Updates and recovery.</h2>
            <h3>Enable controller updates once</h3>
            <p>
              From your trusted installation, connect over SSH and run these
              commands as the normal Pi user:
            </p>
            <CodeBlock
              label="Raspberry Pi · enable signed updates"
              code={controllerBootstrapCommand}
            />
            <p>
              This installs the protected updater and preserves the Pi&apos;s
              identity, pairing, and data. If the app reports Bootstrap
              required, complete this step before starting a controller update.
            </p>
            <h3>Update a controller</h3>
            <ol>
              <li>Sign in to Control Nest as a house admin.</li>
              <li>
                Open Settings &gt; Firmware updates and find the controller.
              </li>
              <li>
                Review its available version and release notes. Start the
                update when one is available, then follow its progress here.
              </li>
            </ol>
            <p>
              The updater installs an eligible signed release and snapshots
              persistent data. If activation fails, it restores the recorded
              working release and data. Installation continues if you close the
              app or your phone disconnects. Keep the Pi powered on.
            </p>
            <h3>Update the app</h3>
            <p>
              Open Settings &gt; App updates, tap Check for updates, and restart
              when prompted to apply a downloaded update. Some changes require
              a new app build. Use Install app build when offered, or get the{" "}
              <a href={androidDownloadUrl}>published Android APK</a>.
            </p>
            <h3>Recover a controller</h3>
            <p>
              In Firmware updates, use Restore when a previous release is
              available. For LAN recovery, a house admin must prepare recovery
              access while online. The saved authorization lasts up to 24 hours
              and can restore the recorded working release over the local
              network. Without valid recovery access, use authenticated SSH or
              physical owner recovery.
            </p>
            <p>
              Read the{" "}
              <a href={`${repositoryUrl}/blob/main/docs/ota-operations.md`}>
                recovery instructions
              </a>{" "}
              before attempting restoration. Raspberry Pi OS updates are
              separate maintenance. Get published downloads and installation
              notes from <a href={`${repositoryUrl}/releases`}>GitHub Releases</a>.
            </p>
          </section>

          <section id="troubleshooting">
            <span className="eyebrow">Help</span>
            <h2>Connection not working?</h2>
            <h3>The Pi does not appear in the app</h3>
            <p>
              Check that AutoPiHub is running, your phone and Pi share a local
              network, and the app has local network permission. Guest Wi-Fi and
              VPNs can block discovery.
            </p>
            <h3>Pairing or login fails</h3>
            <p>
              Check the internet connection on both devices. Sign in again and
              retry. Use the complete key for this controller. If it was lost
              or revoked, replace it in My houses and paste the replacement on
              the same Pi.
            </p>
            <h3>Remote control fails</h3>
            <p>
              Check the Pi&apos;s power and internet connection. If the service is
              running and the problem continues, contact NMT Solutions OPC Pvt
              Ltd.
            </p>
            <h3>A device does not switch</h3>
            <p>
              Check the selected header pin, relay power, and wiring. Disconnect
              power before changing connections. Use the device control history
              to check whether the command reached the controller.
            </p>
            <h3>A schedule runs at the wrong time</h3>
            <p>
              Check the selected days, on/off times, and the Pi&apos;s timezone. Run{" "}
              <code>timedatectl status</code> on the Pi to check its clock.
            </p>
            <h3>Check the controller logs</h3>
            <CodeBlock
              label="Raspberry Pi · recent service logs"
              code="sudo journalctl -u autopihub -n 80 --no-pager"
            />
            <p>
              In the app, open Settings, then Request history to inspect a
              failed request.
            </p>
            <div className="guide-complete">
              <CircleCheck size={28} />
              <h2>Ready to add another room?</h2>
              <p>Use Add in the app to add more rooms and devices.</p>
              <div className="hero-actions">
                <Button asChild>
                  <Link href="/">
                    Back to Control Nest <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
