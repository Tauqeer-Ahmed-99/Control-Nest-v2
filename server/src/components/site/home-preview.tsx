"use client";

import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BedDouble,
  Check,
  Clock3,
  Fan,
  House,
  LampDesk,
  Lightbulb,
  Power,
  Radio,
  ShieldCheck,
  Sofa,
  Sun,
  Wifi,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const rooms = [
  {
    id: "living",
    name: "Living room",
    icon: Sofa,
    devices: [
      { id: "ceiling", name: "Ceiling light", icon: Lightbulb, on: true },
      { id: "fan", name: "Ceiling fan", icon: Fan, on: true },
      { id: "lamp", name: "Reading lamp", icon: LampDesk, on: false },
      { id: "socket", name: "Wall socket", icon: Power, on: false },
    ],
  },
  {
    id: "bedroom",
    name: "Bedroom",
    icon: BedDouble,
    devices: [
      { id: "bedlight", name: "Bedroom light", icon: Lightbulb, on: false },
      { id: "bedfan", name: "Bedroom fan", icon: Fan, on: true },
      { id: "bedlamp", name: "Bedside lamp", icon: LampDesk, on: true },
      { id: "bedsocket", name: "Wall socket", icon: Power, on: false },
    ],
  },
];

export function HomePreview() {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(
      rooms.flatMap((room) =>
        room.devices.map((device) => [device.id, device.on]),
      ),
    ),
  );
  const [message, setMessage] = useState(
    "Try a switch to turn a sample device on or off.",
  );
  const active = Object.values(states).filter(Boolean).length;
  return (
    <div className="preview-wrap" id="try-it">
      <div className="preview-label">
        <span className="tiny-dot" /> INTERACTIVE PREVIEW{" "}
        <span>
          Try a switch <ArrowUpRight size={13} aria-hidden="true" />
        </span>
      </div>
      <div className="home-preview">
        <aside className="preview-sidebar" aria-label="Preview overview">
          <div className="preview-home-icon">
            <House size={24} />
          </div>
          <span className="eyebrow">Sample home</span>
          <h3>The Nest</h3>
          <p>2 rooms, 8 devices</p>
          <div className="sidebar-selected">
            <House size={17} /> Home overview
          </div>
          <div className="preview-sidebar-note">
            <Radio size={20} />
            <strong>AutoPiHub</strong>
            <span>
              <span className="tiny-dot" /> Connected in this demo
            </span>
            <div className="signal-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="sidebar-footnote">
            <ShieldCheck size={14} /> Demo only
          </span>
        </aside>
        <div className="preview-main">
          <div className="preview-greeting">
            <div>
              <span className="eyebrow">Home overview</span>
              <h2>
                Your devices<span>.</span>
              </h2>
            </div>
            <div className="weather-demo">
              <Sun size={24} />
              <span>
                26°<small>Sample weather</small>
              </span>
            </div>
          </div>
          <div className="preview-summary">
            <span>
              <Zap size={16} />
              <strong>{active}</strong> devices on
            </span>
            <span>
              <House size={16} />
              <strong>2</strong> rooms
            </span>
            <span>
              <Wifi size={16} /> Connected
            </span>
          </div>
          <Tabs defaultValue="living" className="room-tabs">
            <TabsList aria-label="Preview rooms">
              {rooms.map((room) => (
                <TabsTrigger key={room.id} value={room.id}>
                  <room.icon size={15} aria-hidden="true" />
                  {room.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {rooms.map((room) => (
              <TabsContent
                key={room.id}
                value={room.id}
                className="device-grid"
              >
                {room.devices.map((device) => (
                  <div
                    key={device.id}
                    className={`device-tile ${states[device.id] ? "device-on" : ""}`}
                  >
                    <div className="device-tile-top">
                      <div className="device-icon">
                        <device.icon size={24} aria-hidden="true" />
                      </div>
                      <Switch
                        aria-label={`${device.name} in ${room.name}`}
                        checked={states[device.id]}
                        onCheckedChange={(checked) => {
                          setStates((previous) => ({
                            ...previous,
                            [device.id]: checked,
                          }));
                          setMessage(
                            `${room.name}: ${device.name} turned ${checked ? "on" : "off"}.`,
                          );
                        }}
                      />
                    </div>
                    <strong>{device.name}</strong>
                    <span>{states[device.id] ? "On" : "Off"}</span>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
          <div className="preview-feedback" role="status">
            <Check size={14} aria-hidden="true" />
            <span>{message}</span>
          </div>
        </div>
        <aside className="preview-routines">
          <div className="routine-heading">
            <Clock3 size={18} />
            <h3>Schedules</h3>
          </div>
          <p>Set when devices turn on and off.</p>
          <div className="routine-item">
            <span className="routine-time">
              18:30 <span>EVERY DAY</span>
            </span>
            <strong>Living room light</strong>
            <span>Living room light turns on</span>
            <span className="routine-status">
              <Check size={12} /> Example schedule
            </span>
          </div>
          <div className="routine-item">
            <span className="routine-time">
              23:00 <span>EVERY DAY</span>
            </span>
            <strong>Bedroom light</strong>
            <span>Bedroom light turns off</span>
            <span className="routine-status">
              <Clock3 size={12} /> Example schedule
            </span>
          </div>
          <div className="preview-demo-note">
            <Activity size={14} />
            <span>No real devices connected.</span>
          </div>
        </aside>
      </div>
      <p className="preview-caption">This preview uses sample devices.</p>
    </div>
  );
}
