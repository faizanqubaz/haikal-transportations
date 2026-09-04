"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react";

/* =========================================================
   TYPES — mirrors models/bus.ts (client-safe subset,
   no mongoose Document methods)
========================================================= */

type Seat = {
  seatNumber: string;
  status: "available" | "pending" | "booked";
};

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
  image?: string;
  seats: Seat[];
};

function formatPKR(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function seatCounts(seats: Seat[]) {
  const total = seats.length;
  const left = seats.filter((s) => s.status === "available").length;
  return { total, left };
}

function seatBadge(seatsLeft: number) {
  if (seatsLeft === 0)
    return { label: "Sold out", className: "bg-gray-100 text-gray-500" };
  if (seatsLeft <= 4)
    return {
      label: `${seatsLeft} seats left`,
      className: "bg-amber-50 text-amber-700",
    };
  return {
    label: `${seatsLeft} seats left`,
    className: "bg-teal-50 text-teal-700",
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingPage() {
  const today = todayISO();

  const [cities, setCities] = useState<string[]>([]);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState(today);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load the city list once, for the From/To dropdowns.
  useEffect(() => {
    fetch("/api/busses/cities")
      .then((res) => res.json())
      .then((data: { cities?: string[] }) => {
        const list = data.cities ?? [];
        setCities(list);
        if (list.length >= 2) {
          setPickup((p) => p || list[0]);
          setDropoff((d) => d || list[1]);
        }
      })
      .catch(() => {
        // City list is a nice-to-have; searching still works without it.
      });
  }, []);

  async function runSearch(p: string, d: string, dt: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (p) params.set("pickup", p);
      if (d) params.set("dropoff", d);
      if (dt) params.set("date", dt);

      const res = await fetch(`/api/busses?${params.toString()}`);
      if (!res.ok) throw new Error("Request failed");

      const data: { buses?: Bus[] } = await res.json();
      setBuses(data.buses ?? []);
    } catch {
      setError("Couldn't load buses right now. Please try again.");
      setBuses([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }

  // Run an initial search once we know the default pickup/dropoff.
  useEffect(() => {
    if (pickup && dropoff) {
      runSearch(pickup, dropoff, date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup === "" ? null : true]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    runSearch(pickup, dropoff, date);
  }

  function swapCities() {
    setPickup(dropoff);
    setDropoff(pickup);
  }

  const results = useMemo(
    () => [...buses].sort((a, b) => a.departure.localeCompare(b.departure)),
    [buses]
  );

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      {/* ================= HERO / SEARCH ================= */}
      <section className="border-b border-gray-100 bg-teal-700">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Find your bus
          </h1>
          <p className="mt-1 text-sm text-teal-50">
            Search by route and travel date to see what's running.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-lg sm:grid-cols-[1fr_auto_1fr_1fr_auto] sm:items-end sm:gap-3 sm:p-3"
          >
            {/* From */}
            <label className="block">
              <span className="mb-1 block px-1 text-xs font-semibold text-gray-500">
                From
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                <MapPin size={16} className="shrink-0 text-teal-700" />
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
                >
                  {cities.length === 0 && (
                    <option value="">Loading cities…</option>
                  )}
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {/* Swap */}
            <button
              type="button"
              onClick={swapCities}
              aria-label="Swap cities"
              className="hidden h-10 w-10 items-center justify-center self-end rounded-full border border-gray-200 text-gray-500 transition hover:border-teal-600 hover:text-teal-700 sm:flex"
            >
              <ArrowRight size={16} />
            </button>

            {/* To */}
            <label className="block">
              <span className="mb-1 block px-1 text-xs font-semibold text-gray-500">
                To
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                <MapPin size={16} className="shrink-0 text-teal-700" />
                <select
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
                >
                  {cities.length === 0 && (
                    <option value="">Loading cities…</option>
                  )}
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {/* Date */}
            <label className="block">
              <span className="mb-1 block px-1 text-xs font-semibold text-gray-500">
                Travel date
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                <Calendar size={16} className="shrink-0 text-teal-700" />
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
                />
              </div>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ================= RESULTS ================= */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {hasSearched && !loading && (
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-gray-900">
              {pickup} <span className="text-gray-400">→</span> {dropoff}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(date + "T00:00:00").toLocaleDateString("en-PK", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {" · "}
              {results.length} {results.length === 1 ? "bus" : "buses"} found
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-6 py-14 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
            <p className="text-sm font-semibold text-gray-800">
              No buses on this route for {date}.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try a different date, or swap your from and to cities.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {results.map((bus) => {
              const { total, left } = seatCounts(bus.seats);
              const badge = seatBadge(left);
              const soldOut = left === 0;

              return (
                <li
                  key={bus._id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: operator + times */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-bold text-gray-900">
                        {bus.company}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                        {bus.busNumber}
                      </span>
                      {bus.route && (
                        <span className="text-xs text-gray-400">
                          {bus.route}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-400" />
                        <span className="font-semibold">{bus.departure}</span>
                      </div>
                      <span className="h-px w-6 bg-gray-300" />
                      <span className="text-xs text-gray-400">
                        {bus.duration}
                      </span>
                      <span className="h-px w-6 bg-gray-300" />
                      <span className="font-semibold">{bus.arrival}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {total} seats total
                      </span>
                      {bus.driverPhone && (
                        <span className="text-xs text-gray-500">
                          Driver: {bus.driverPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: price + seats + CTA */}
                  <div className="flex flex-row items-center justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-gray-900">
                        {formatPKR(bus.price)}
                      </p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        <Users size={11} />
                        {badge.label}
                      </span>
                    </div>

                    <a
                      href={soldOut ? undefined : `/booking/${bus._id}`}
                      aria-disabled={soldOut}
                      className={`rounded-lg px-5 py-2.5 text-center text-sm font-bold shadow-sm transition ${
                        soldOut
                          ? "pointer-events-none cursor-not-allowed bg-gray-100 text-gray-400"
                          : "bg-teal-700 text-white hover:bg-teal-800 hover:shadow-md"
                      }`}
                    >
                      {soldOut ? "Sold out" : "Select seats"}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}