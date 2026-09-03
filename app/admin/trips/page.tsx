"use client";

import { useEffect, useState } from "react";
import {
  Bus as BusIcon,
  Plus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

type Bus = {
  _id: string;
  busNumber: string;
  company: string;
  driverPhone?: string;
  route?: string;
  pickup: string;
  dropoff: string;
  date: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  seats: {
    seatNumber: string;
    status: "available" | "booked";
  }[];
};

const emptyForm = {
  busNumber: "",
  company: "",
  driverPhone: "",
  route: "",
  pickup: "",
  dropoff: "",
  date: "",
  departure: "",
  arrival: "",
  duration: "",
  price: "",
  capacity: "40",
};

export default function TripsPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);

  async function loadBuses() {
    try {
      setLoading(true);

      const res = await fetch("/api/busses");
      const data = await res.json();

      setBuses(data.buses || []);
    } catch {
      setError("Failed to load buses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBuses();
  }, []);

  function update(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    setSaving(true);

    try {
      const res = await fetch("/api/busses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          busNumber: form.busNumber,
          company: form.company,
          driverPhone: form.driverPhone,
          route:
            form.route ||
            `${form.pickup} → ${form.dropoff}`,
          pickup: form.pickup,
          dropoff: form.dropoff,
          date: form.date,
          departure: form.departure,
          arrival: form.arrival,
          duration: form.duration,
          price: Number(form.price),
          capacity: Number(form.capacity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to add bus"
        );
      }

      setSuccess("Bus added successfully.");

      setForm(emptyForm);
      setShowForm(false);

      await loadBuses();
    } catch (err: any) {
      setError(
        err.message || "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this bus?")) {
      return;
    }

    try {
      const res = await fetch(`/api/busses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error();
      }

      setBuses((prev) =>
        prev.filter((bus) => bus._id !== id)
      );
    } catch {
      setError("Failed to delete bus");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9f9] p-4 sm:p-6 lg:p-8">

      {/* HEADER */}

      <div className="mb-8 flex items-center justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-teal-700">
            <BusIcon size={16} />
            TRANSPORT
          </div>

          <h1 className="text-3xl font-black text-gray-900">
            Trips & Buses
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add and manage your available buses.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="flex items-center gap-2 rounded-xl bg-[#063d43] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#052f34]"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">
              Add Bus
            </span>
          </button>
        )}
      </div>

      {/* SUCCESS */}

      {success && (
        <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ADD FORM */}

      {showForm && (
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm">

          {/* FORM HEADER */}

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">

            <div>
              <h2 className="font-bold text-gray-900">
                Add New Bus
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Enter the bus and journey details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleAdd}
            className="p-5 sm:p-6"
          >

            <div className="grid gap-5 md:grid-cols-2">

              <Input
                label="Bus Number"
                placeholder="HT-102"
                value={form.busNumber}
                onChange={(v) =>
                  update("busNumber", v)
                }
                required
              />

              <Input
                label="Company"
                placeholder="Haikal Transport"
                value={form.company}
                onChange={(v) =>
                  update("company", v)
                }
                required
              />

              <Input
                label="Pickup"
                placeholder="Gilgit"
                value={form.pickup}
                onChange={(v) =>
                  update("pickup", v)
                }
                required
              />

              <Input
                label="Dropoff"
                placeholder="Hunza"
                value={form.dropoff}
                onChange={(v) =>
                  update("dropoff", v)
                }
                required
              />

              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(v) =>
                  update("date", v)
                }
                required
              />

              <Input
                label="Price"
                type="number"
                placeholder="2500"
                value={form.price}
                onChange={(v) =>
                  update("price", v)
                }
                required
              />

              <Input
                label="Departure"
                type="time"
                value={form.departure}
                onChange={(v) =>
                  update("departure", v)
                }
                required
              />

              <Input
                label="Arrival"
                type="time"
                value={form.arrival}
                onChange={(v) =>
                  update("arrival", v)
                }
                required
              />

              <Input
                label="Duration"
                placeholder="3h 30m"
                value={form.duration}
                onChange={(v) =>
                  update("duration", v)
                }
                required
              />

              <Input
                label="Seat Capacity"
                type="number"
                placeholder="40"
                value={form.capacity}
                onChange={(v) =>
                  update("capacity", v)
                }
                required
              />

              <Input
                label="Driver Phone"
                placeholder="+92 300 1234567"
                value={form.driverPhone}
                onChange={(v) =>
                  update("driverPhone", v)
                }
              />

              <Input
                label="Route"
                placeholder="Gilgit → Hunza"
                value={form.route}
                onChange={(v) =>
                  update("route", v)
                }
              />

            </div>

            {/* ACTIONS */}

            <div className="mt-7 flex justify-end gap-3 border-t border-gray-100 pt-5">

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#063d43] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052f34] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Bus
                  </>
                )}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* BUS LIST */}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-5 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-bold text-gray-900">
                Buses
              </h2>

              <p className="text-xs text-gray-400">
                {buses.length} bus
                {buses.length !== 1 ? "es" : ""} registered
              </p>
            </div>

          </div>

        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-400">
            <Loader2
              size={18}
              className="animate-spin"
            />
            Loading...
          </div>
        ) : buses.length === 0 ? (
          <div className="p-12 text-center">

            <BusIcon
              size={30}
              className="mx-auto mb-3 text-gray-300"
            />

            <p className="font-semibold text-gray-700">
              No buses added yet
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Click “Add Bus” to create your first bus.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-gray-100">

            {buses.map((bus) => (
              <div
                key={bus._id}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <BusIcon size={18} />
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-gray-900">
                      {bus.busNumber}
                    </p>

                    <p className="truncate text-xs text-gray-500">
                      {bus.company} · {bus.pickup} →{" "}
                      {bus.dropoff}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    handleDelete(bus._id)
                  }
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Delete bus"
                >
                  <Trash2 size={17} />
                </button>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

/* INPUT */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
      />

    </label>
  );
}