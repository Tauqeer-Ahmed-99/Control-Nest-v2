import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Code2,
  Cpu,
  House,
  Layers3,
  Lightbulb,
  Radio,
  ShieldCheck,
  Smartphone,
  Wifi,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomePreview } from "@/components/site/home-preview";
import { FAQ } from "@/components/site/faq";
import { repositoryUrl } from "@/lib/site";

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero wrap">
        <div className="hero-orbits" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="hero-copy enter">
          <span className="hero-kicker">
            <span className="tiny-dot" /> Control Nest
          </span>
          <h1>
            Your home.
            <br />
            <span>In your hands.</span>
          </h1>
          <p>Control lights, fans, and other devices from your phone.</p>
          <div className="hero-actions">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Get started <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#try-it">
                Try the controls <ArrowDown aria-hidden="true" />
              </a>
            </Button>
          </div>
          <div className="hero-notes">
            <span>
              <Smartphone size={14} /> Made for your phone
            </span>
            <span>
              <Cpu size={14} /> Powered by Raspberry Pi
            </span>
            <span>
              <Radio size={14} /> Shared cloud service
            </span>
          </div>
        </div>
        <HomePreview />
      </section>

      <div className="platform-strip wrap">
        <span>Control Nest + AutoPiHub</span>
        <div>
          <Smartphone /> Control Nest <small>Your app</small>
        </div>
        <span className="strip-connector" aria-hidden="true" />
        <div>
          <Radio /> AutoPiHub <small>Your controller</small>
        </div>
        <span className="strip-connector" aria-hidden="true" />
        <div>
          <Image src="/brand/nmt-logo.svg" alt="" width={26} height={26} /> NMT
          Solutions <small>Built by</small>
        </div>
      </div>

      <section id="experience" className="section wrap experience">
        <div className="section-heading">
          <span className="eyebrow">In the app</span>
          <h2>
            Manage devices
            <br />
            in every room.
          </h2>
          <p>Switch devices, set schedules, and check their status.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-art room-art" aria-hidden="true">
              <div>
                <Lightbulb size={24} />
                <span>Living room</span>
                <span className="art-pill">2 on</span>
              </div>
              <div>
                <House size={24} />
                <span>Bedroom</span>
                <span className="art-pill">1 on</span>
              </div>
            </div>
            <span className="feature-label">
              <Layers3 size={17} /> Rooms
            </span>
            <h3>Group devices by room.</h3>
            <p>Find and control devices in the room they belong to.</p>
          </article>
          <article className="feature-card">
            <div className="feature-art schedule-art" aria-hidden="true">
              <div className="schedule-clock">
                18<span>:</span>30
              </div>
              <div className="schedule-line">
                <span className="tiny-dot" /> Living room light turns on
              </div>
              <div className="day-chips">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <span key={index}>{day}</span>
                ))}
              </div>
            </div>
            <span className="feature-label">
              <Clock3 size={17} /> Schedules
            </span>
            <h3>Set on and off times.</h3>
            <p>
              Choose the days and times. AutoPiHub runs the schedule on your Pi.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-art connection-art" aria-hidden="true">
              <div className="connection-node">
                <Smartphone size={26} />
              </div>
              <span className="connection-path" />
              <div className="connection-home">
                <House size={32} />
                <span className="connection-check">
                  <Check size={12} />
                </span>
              </div>
              <span className="connection-caption">
                Control devices away from home.
              </span>
            </div>
            <span className="feature-label">
              <Wifi size={17} /> Remote access
            </span>
            <h3>Connect away from home.</h3>
            <p>
              Pair your controller once. The service sets up remote access for
              you.
            </p>
          </article>
        </div>
      </section>

      <section id="autopihub" className="hub-section section">
        <div className="wrap hub-layout">
          <div
            className="hub-visual"
            aria-label="AutoPiHub connects the Control Nest app to GPIO devices"
          >
            <span className="hub-caption">Your home controller</span>
            <div className="hub-board">
              <div className="board-pins pins-top" aria-hidden="true" />
              <div className="board-chip">
                <Cpu size={45} strokeWidth={1.2} />
                <strong>AutoPiHub</strong>
                <span>RASPBERRY PI CONTROLLER</span>
              </div>
              <div className="board-traces" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <span className="board-status">
                <span className="tiny-dot" /> AutoPiHub service
              </span>
              <div className="board-pins pins-bottom" aria-hidden="true" />
            </div>
            <div className="hub-devices">
              <span>
                <Lightbulb size={16} /> Lights
              </span>
              <span>
                <Zap size={16} /> Devices
              </span>
              <span>
                <Clock3 size={16} /> Schedules
              </span>
            </div>
          </div>
          <div className="hub-copy">
            <span className="eyebrow">AutoPiHub</span>
            <h2>
              Your Pi controls
              <br />
              your devices.
            </h2>
            <p>
              Install AutoPiHub on a Raspberry Pi and pair it with Control Nest.
              We provide the shared API and Cloudflare tunnels.
            </p>
            <ul className="check-list">
              <li>
                <Check /> Controls GPIO-connected relays
              </li>
              <li>
                <Check /> Discovers your Pi on the same network
              </li>
              <li>
                <Check /> Sets up remote access during pairing
              </li>
              <li>
                <Check /> Runs device schedules on your Pi
              </li>
            </ul>
            <Button asChild variant="outline">
              <Link href="/guide#controller">
                Set up AutoPiHub <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section wrap setup-section">
        <div className="section-heading">
          <span className="eyebrow">Setup</span>
          <h2>
            Install. Pair.
            <br />
            Add your devices.
          </h2>
          <p>You need a Raspberry Pi and the Control Nest app.</p>
        </div>
        <div className="setup-steps">
          <article>
            <span className="step-number">01</span>
            <Cpu />
            <h3>Install AutoPiHub.</h3>
            <p>
              Prepare Raspberry Pi OS and install the AutoPiHub controller
              service.
            </p>
            <Link href="/guide#controller">
              Controller setup <ArrowUpRight size={15} />
            </Link>
          </article>
          <article>
            <span className="step-number">02</span>
            <Smartphone />
            <h3>Pair your controller.</h3>
            <p>
              Open Control Nest on the same network and follow the pairing
              steps.
            </p>
            <Link href="/guide#pairing">
              Pair your home <ArrowUpRight size={15} />
            </Link>
          </article>
          <article>
            <span className="step-number">03</span>
            <Lightbulb />
            <h3>Add your devices.</h3>
            <p>
              Create a room, add a device, and select its connected GPIO pin.
            </p>
            <Link href="/guide#first-device">
              Add your first device <ArrowUpRight size={15} />
            </Link>
          </article>
        </div>
        <div className="service-note">
          <ShieldCheck size={21} />
          <div>
            <strong>The cloud service is included.</strong>
            <p>
              We manage the API and remote connections. You set up your Pi and
              devices.
            </p>
          </div>
          <Link href="/guide">
            Setup guide <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="section wrap faq-section">
        <div>
          <span className="eyebrow">Help</span>
          <h2>Common questions.</h2>
          <Link href="/guide" className="text-link">
            <BookOpen size={16} /> Open the setup guide{" "}
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <FAQ />
      </section>

      <section className="closing-section wrap">
        <Image
          src="/brand/control-nest.png"
          alt="Control Nest app icon"
          width={88}
          height={88}
        />
        <span className="eyebrow">Start using Control Nest</span>
        <h2>
          Set up your
          <br />
          home controller.
        </h2>
        <p>Built by NMT Solutions OPC Pvt Ltd.</p>
        <div className="hero-actions">
          <Button asChild size="lg">
            <Link href="/guide">
              Start your setup <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href={repositoryUrl}>
              <Code2 aria-hidden="true" /> Source code
            </a>
          </Button>
        </div>
        <span className="closing-footnote">
          <ShieldCheck size={14} /> Control Nest app + AutoPiHub controller
          service
        </span>
      </section>
    </main>
  );
}
