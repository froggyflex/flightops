import React from "react";

type Props = {
  open: boolean;
  gate: string;
  remark: string;                           // NEW
  onChangeGate: (v: string) => void;        // NEW
  onChangeRemark: (v: string) => void;      // NEW
  onCancel: () => void;
  onConfirm: () => void;
};

export default function GateConfirmModal({
  open, gate, remark, onChangeGate, onChangeRemark, onCancel, onConfirm
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow p-5 w-[90%] max-w-sm">
        <h3 className="text-lg font-bold text-jet2 mb-3">Confirm gate & remarks</h3>

        <label className="text-sm block mb-2">Gate</label>
        <input
          autoFocus
          type="text"
          value={gate}
          onChange={(e) => onChangeGate(e.target.value)}
          className="border rounded w-full p-2 mb-4"
          placeholder="e.g., A5"
        />

        <label className="text-sm block mb-2">Remarks (optional)</label>
        <textarea
          value={remark}
          onChange={(e) => onChangeRemark(e.target.value)}
          className="border rounded w-full p-2 h-24 mb-4"
          placeholder="Anything notable for this flight…"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded bg-slate-200">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded bg-jet2 text-white">Send</button>
        </div>
      </div>
    </div>
  );
}
