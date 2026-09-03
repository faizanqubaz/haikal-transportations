"use client";

import { useEffect, useState } from "react";
import { UserRoundCog, Plus, Loader2, Trash2 } from "lucide-react";

type Driver = {
  _id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: "active" | "inactive";
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", licenseNumber: "" });

  async function load() {
    const res = await fetch("/api/drivers");
    const data = await res.json();
    setDrivers(data.drivers || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.licenseNumber) return;
    setSaving(true);
    try {
      await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", phone: "", licenseNumber: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this driver?")) return;
    await fetch(`/api/drivers/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="min-h-screen bg-[#f7f9f9] p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-black text-gray-900">Drivers</h1>

      <form
        onSubmit={handleAdd}
        className="mb-6 grid gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-4"
      >
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <input
          placeholder="Phone (+62...)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <input
          placeholder="License number"
          value={form.licenseNumber}
          onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <button
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#063d43] px-4 py-2 text-sm font-bold text-white hover:bg-[#052f34] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add Driver
        </button>
      </form>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading && <p className="p-6 text-sm text-gray-400">Loading drivers…</p>}
        {!loading && drivers.length === 0 && (
          <p className="p-6 text-sm text-gray-400">No drivers added yet.</p>
        )}
        <div className="divide-y divide-gray-100">
          {drivers.map((d) => (
            <div key={d._id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                  <UserRoundCog size={18} className="text-teal-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-400">
                    {d.phone} · License {d.licenseNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(d._id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
