"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import LocationAutocomplete from "./LocationAutocomplete";

export type AvailabilitySearch = {
  pickup: string;
  dropoff: string;
  date: string;
};

type Props = {
  onSearch: (search: AvailabilitySearch) => void;
};

export default function AvailabilityForm({
  onSearch,
}: Props) {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const [date, setDate] = useState("2026-09-02");

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!pickup || !dropoff || !date) {
      return;
    }

    onSearch({
      pickup,
      dropoff,
      date,
    });
  };

  return (
    <div className="absolute bottom-5 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[1450px] -translate-x-1/2 sm:bottom-8 sm:w-[calc(100%-3rem)] lg:bottom-12">

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-5 lg:px-7 lg:py-5"
      >

        {/* DESKTOP */}

        <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_0.8fr_auto] lg:items-end lg:gap-7">

          <div className="border-b border-gray-200 pb-3">
            <LocationAutocomplete
              label="PICK-UP"
              value={pickup}
              onChange={setPickup}
              placeholder="Choose pick-up"
            />
          </div>

          <div className="border-b border-gray-200 pb-3">
            <LocationAutocomplete
              label="DROP-OFF"
              value={dropoff}
              onChange={setDropoff}
              placeholder="Choose drop-off"
            />
          </div>

          <div className="border-b border-gray-200 pb-3">

            <label className="mb-2 block text-xs font-semibold tracking-[0.25em] text-gray-400">
              DATE
            </label>

            <div className="flex items-center gap-2">

              <CalendarDays
                size={18}
                className="text-teal-700"
              />

              <input
                type="date"
                value={date}
                min="2026-09-02"
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
              />

            </div>

          </div>

          <button
            type="submit"
            className="flex h-16 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[#063d43] px-8 text-sm font-semibold text-white shadow-lg transition hover:bg-[#052f34]"
          >
            Check Availability
            <ArrowRight size={20} />
          </button>

        </div>


        {/* MOBILE */}

        <div className="space-y-4 lg:hidden">

          <LocationAutocomplete
            label="PICK-UP"
            value={pickup}
            onChange={setPickup}
            placeholder="Where are you leaving from?"
          />

          <div className="h-px bg-gray-100" />

          <LocationAutocomplete
            label="DROP-OFF"
            value={dropoff}
            onChange={setDropoff}
            placeholder="Where are you going?"
          />

          <div className="h-px bg-gray-100" />

          <div>

            <label className="mb-2 block text-[10px] font-bold tracking-[0.25em] text-gray-400">
              DATE
            </label>

            <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 px-3">

              <CalendarDays
                size={17}
                className="text-teal-700"
              />

              <input
                type="date"
                value={date}
                min="2026-09-02"
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full bg-transparent text-sm font-medium outline-none"
              />

            </div>

          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#052f34]"
          >
            Check availability

            <ArrowRight size={17} />

          </button>

        </div>

      </form>

    </div>
  );
}