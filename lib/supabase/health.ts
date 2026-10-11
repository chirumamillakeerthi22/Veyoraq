/*
  Interprets a deliberately harmless probe: reading a table that does not exist.
  - "table not found" means the project answered and accepted the key (the good case)
  - 401/403 means the project answered but rejected the key
  - status 0 means nothing answered (wrong URL, project paused, no network)
  The probe creates nothing and reads no data.
*/

export const PROBE_TABLE = "_veyoraq_connectivity_check";

export type ProbeResult = {
  error: { code?: string; message?: string } | null;
  status: number;
};

export type Health = {
  ok: boolean;
  reachable: boolean;
  keyAccepted: boolean;
  detail: string;
};

export function interpretProbe({ error, status }: ProbeResult): Health {
  if (status === 0) {
    return {
      ok: false,
      reachable: false,
      keyAccepted: false,
      detail:
        "No answer from Supabase. Check the project URL, and whether the project is paused.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      ok: false,
      reachable: true,
      keyAccepted: false,
      detail: "Supabase answered but rejected the key. Check the publishable key.",
    };
  }

  const tableMissing =
    error?.code === "PGRST205" || error?.code === "42P01" || status === 404;
  if (!error || tableMissing) {
    return {
      ok: true,
      reachable: true,
      keyAccepted: true,
      detail: "Connected. The project answered and accepted the key.",
    };
  }

  return {
    ok: false,
    reachable: true,
    keyAccepted: false,
    detail: `Unexpected answer from Supabase (status ${status}, code ${error.code || "none"}).`,
  };
}
