import React from "react";

type Props = {
  open: boolean;
  gate: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function GateConfirmModal({ open, gate, onChange, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow p-5 w-[90%] max-w-sm">
        <h3 className="text-lg font-bold text-jet2 mb-3">Confirm gate</h3>
        <label className="text-sm block mb-2">Gate code (e.g., A5)</label>
        <input
          autoFocus
          type="text"
          value={gate}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded w-full p-2 mb-4"
          placeholder="Gate..."
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded bg-slate-200">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded bg-jet2 text-white">Send</button>
        </div>
      </div>
    </div>
  );
}
