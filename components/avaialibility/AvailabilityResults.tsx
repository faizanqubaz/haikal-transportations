"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { AvailabilitySearch } from "@/components/hero/AvailabilityForm";
import type { BusAvailability } from "@/libs/availability";

import AvailabilityCard from "./AvailabilityCard";

type Props = {
  search: AvailabilitySearch | null;
};

export default function AvailabilityResults({ search }: Props) {
  const [buses, setBuses] = useState<BusAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search) return;

    const controller = new AbortController();

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(search),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch availability");
        }

        setBuses(data.results);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();

    return () => controller.abort();
  }, [search]);

  if (!search) return null;

  return (
    <section
      id="availability-results"
      className="bg-[#f7f8f6] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.3em] text-teal-700">
              AVAILABLE JOURNEYS
            </p>

            <h2 className="font-serif text-3xl text-gray-900 sm:text-4xl lg:text-5xl">
              Available buses
            </h2>

            <p className="mt-3 text-sm text-gray-500 sm:text-base">
              {search.pickup} → {search.dropoff}
            </p>
          </div>

          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
            {loading ? "Searching…" : `${buses.length} journeys found`}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            Looking for available buses…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && buses.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No buses found for this route and date. Try a different search.
          </div>
        )}

        {!loading && !error && buses.length > 0 && (
          <div className="space-y-7">
            {buses.map((bus) => (
              <AvailabilityCard key={bus.id} bus={bus} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}