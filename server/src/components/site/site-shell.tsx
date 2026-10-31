"use client";

import { AccountLink } from "./account-link";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Code2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { repositoryUrl } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header ref={header} className="site-header">
      <div className="nav-glass">
        <Link
          href="/"
          className="brand"
          onClick={() => setOpen(false)}
          aria-label="Control Nest home"
        >
          <Image
            src="/brand/control-nest.png"
            alt=""
            width={44}
            height={44}
            priority
          />
          <span>
            Control Nest<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav
          id="site-navigation"
          aria-label="Main navigation"
          className={`site-nav ${open ? "is-open" : ""}`}
        >
          <Link href="/#experience" onClick={() => setOpen(false)}>
            App
          </Link>
          <Link href="/#autopihub" onClick={() => setOpen(false)}>
            AutoPiHub
          </Link>
          <Link
            href="/guide"
            aria-current={pathname === "/guide" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            Setup guide
          </Link>
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            My houses
          </Link>
          <a
            href={repositoryUrl}
            className="nav-source"
            onClick={() => setOpen(false)}
          >
            <Code2 size={16} aria-hidden="true" /> Source code
          </a>
        </nav>
        <div className="nav-cta account-nav">
          <AccountLink />
        </div>
        <Button
          ref={menuButton}
          variant="ghost"
          size="icon"
          className="menu-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="site-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer wrap">
      <div className="footer-top">
        <div>
          <Link className="brand" href="/">
            <Image
              src="/brand/control-nest.png"
              alt=""
              width={42}
              height={42}
            />
            <span>Control Nest.</span>
          </Link>
          <p>Home control with AutoPiHub.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/#experience">App</Link>
          <Link href="/#autopihub">AutoPiHub</Link>
          <Link href="/guide">Setup guide</Link>
          <a href={repositoryUrl}>
            GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Control Nest</span>
        <span className="made-by">
          <Image src="/brand/nmt-logo.svg" alt="" width={24} height={24} />{" "}
          Built by NMT Solutions OPC Pvt Ltd
        </span>
      </div>
    </footer>
  );
}
