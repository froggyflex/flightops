import React, { useState } from 'react';

type Props = {
  label: string;
  value?: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
};

const pad = (n: number) => n.toString().padStart(2, '0');
const nowHHMM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function TimeField({ label, value = '', onChange, disabled }: Props) {
  const [flash, setFlash] = useState(false);

  const setNow = () => {
    const t = nowHHMM();
    onChange(t);
    
    setFlash(true);
    setTimeout(() => setFlash(false), 600); // subtle visual feedback
    // Optional: navigator.vibrate?.(20); // quick haptic if desired
  };

  return (
    <div className="flex items-end gap-2">
        <label className="flex-1 text-sm">
            <span className="block font-semibold mb-1">{label}</span>
            <input
            type="time"
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className={
                "w-full border rounded p-2 transition-shadow " +
                (flash ? "ring-2 ring-green-400" : "")
            }
            />
        </label>

        <button
            type="button"
            onClick={setNow}
            disabled={disabled}
            className="shrink-0 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800
                    text-xs px-3 py-2 rounded font-semibold disabled:opacity-50"
            aria-label={`Set ${label} to current time`}
        >
            Now
        </button>
    </div>
  );
}
