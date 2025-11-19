import { useEffect, useMemo, useRef, useState } from "react";

export type LiveTimes = { etd?: string; eta?: string; source?: "mock"|"api"; loading: boolean; error?: string };

type Opts = {
  flightNo: string;    // e.g. "LS123"
  pollMs?: number;     // default 60s
};

// MOCK adapter for now. Replace body with real fetch later.
async function fetchLiveTimesMock(flightNo: string): Promise<Pick<LiveTimes,"etd"|"eta"|"source">> {
  // pretend we look up the flight; return stable-but-changing-ish times
  const base = new Date();
  const pad = (n:number)=>String(n).padStart(2,"0");
  const plus = (m:number)=>`${pad(base.getHours())}:${pad((base.getMinutes()+m+flightNo.length)%60)}`;
  return { etd: plus(5), eta: plus(35), source: "mock" };
}

export function useLiveTimes({ flightNo, pollMs = 60000 }: Opts): LiveTimes {
  const [state, setState] = useState<LiveTimes>({ loading: true });
  const mounted = useRef(true);

  const fetcher = useMemo(() => async () => {
    try {
      // swap this mock call with your real adapter later
      const data = await fetchLiveTimesMock(flightNo);
      if (!mounted.current) return;
      setState({ ...data, loading: false });
    } catch (e:any) {
      if (!mounted.current) return;
      setState({ loading: false, error: e?.message || "Live times unavailable" });
    }
  }, [flightNo]);

  useEffect(() => {
    mounted.current = true;
    fetcher();                     // initial fetch
    const id = setInterval(fetcher, pollMs);  // poll
    return () => { mounted.current = false; clearInterval(id); };
  }, [fetcher, pollMs]);

  return state;
}

/* === HOW TO SWITCH TO REAL API LATER ===
1) Replace fetchLiveTimesMock with your FR24/OpenSky adapter:
   async function fetchLiveTimesFR24(flightNo: string) {
     const r = await fetch(`https://.../flights/${flightNo}`, { headers: { 'x-api-key': import.meta.env.VITE_FR24_KEY }});
     const j = await r.json();
     return { etd: j.scheduled_departure || j.off_block, eta: j.estimated_arrival, source: "api" };
   }
2) Call that instead of the mock in fetcher().
*/
