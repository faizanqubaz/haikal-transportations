"use client";

import { SearchX } from "lucide-react";

import {
  availableBuses,
} from "@/libs/availability";

import type {
  AvailabilitySearch,
} from "@/components/hero/AvailabilityForm";

import AvailabilityCard from "./AvailabilityCard";

type Props = {
  search: AvailabilitySearch | null;
};

export default function AvailabilityResults({
  search,
}: Props) {
  if (!search) {
    return null;
  }

  /*
    For now we're showing mock data.

    Later this should be replaced with:

    fetch("/api/availability", {
      method: "POST",
      body: JSON.stringify(search)
    })
  */

  const results = availableBuses.filter(
    (bus) =>
      bus.pickup
        .toLowerCase()
        .includes(search.pickup.toLowerCase()) &&
      bus.dropoff
        .toLowerCase()
        .includes(search.dropoff.toLowerCase())
  );

  /*
    Demo fallback so you can see the UI.
  */

  const buses =
    results.length > 0
      ? results
      : availableBuses;

  return (
    <section
      id="availability-results"
      className="bg-[#f7f8f6] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >

      <div className="mx-auto max-w-7xl">

        {/* Header */}

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
            {buses.length} journeys found
          </div>

        </div>


        {/* Results */}

        <div className="space-y-7">

          {buses.map((bus) => (
            <AvailabilityCard
              key={bus.id}
              bus={bus}
            />
          ))}

        </div>

      </div>

    </section>
  );
}