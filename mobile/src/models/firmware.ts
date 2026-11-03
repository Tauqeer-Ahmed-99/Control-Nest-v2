export type Signed = { keyId: string; payload: string; signature: string };
export type ReleasePolicy = {
  revision: number;
  effectiveAt: string;
  minimumMobile: string;
  minimumController: string;
  latest: string | null;
  apiContracts: number[];
  mobile: Record<
    "android" | "ios",
    {
      runtimes: string[];
      minimumBuild: number | string;
      installUrl: string | null;
    }
  >;
};
export type FirmwareJob = {
  id: string;
  controllerDeviceId: string;
  sourceVersion: string;
  targetVersion: string;
  operation: "update" | "rollback";
  phase: string;
  sequence: number;
  runningVersion: string | null;
  failureCode?: string | null;
  bytes?: number;
  totalBytes?: number;
  updatedAt: string;
  acceptedAt: string | null;
  stale?: boolean;
};
export type FirmwareAvailability = {
  controllerDeviceId: string;
  isAdmin: boolean;
  connection: "online" | "offline" | "bootstrap_required";
  status: {
    installedRelease: string | null;
    previousRelease: string | null;
    updaterVersion: string;
    recoveryRequired: boolean;
    lastOutcome?: {
      jobId: string;
      phase: string;
      targetVersion: string;
      localOnly: boolean;
    } | null;
  } | null;
  stale: boolean;
  observedAt: string | null;
  available: { version: string; githubUrl: string } | null;
  required: boolean;
  minimumController: string;
  job: FirmwareJob | null;
};
export const isTerminal = (phase: string) =>
  ["completed", "failed", "rolled_back", "recovery_required"].includes(phase);
export const phaseLabel: Record<string, string> = {
  queued: "Waiting for acceptance",
  downloading: "Downloading",
  verifying: "Verifying signature",
  preparing: "Preparing dependencies",
  backing_up: "Saving a recovery snapshot",
  switching: "Selecting the release",
  restarting: "Restarting",
  checking: "Checking readiness",
  rolling_back: "Restoring the working release",
  completed: "Update completed",
  failed: "Update failed",
  rolled_back: "Previous release restored",
  recovery_required: "Recovery required",
};
