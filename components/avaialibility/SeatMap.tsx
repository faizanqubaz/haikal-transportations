
"use client";

import { useEffect, useState } from "react";
import { Armchair } from "lucide-react";

import type { Seat } from "@/libs/availability";

type Props = {
  seats: Seat[];
  onSeatChange?: (seats: string[]) => void;
};

export default function SeatMap({
  seats,
  onSeatChange,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  // Notify parent whenever selected seats change
  useEffect(() => {
    onSeatChange?.(selected);
  }, [selected, onSeatChange]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "booked") {
      return;
    }

    setSelected((previous) => {
      const exists = previous.includes(seat.number);

      if (exists) {
        return previous.filter(
          (item) => item !== seat.number
        );
      }

      return [...previous, seat.number];
    });
  };

  return (
    <div className="rounded-2xl bg-gray-50 p-4 sm:p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">
            Select your seats
          </h4>

          <p className="mt-1 text-xs text-gray-500">
            Choose available seats
          </p>
        </div>

        <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
          {selected.length} selected
        </div>
      </div>

      {/* Bus front */}
      <div className="mx-auto mb-5 max-w-[320px] rounded-t-[50%] border-b-2 border-gray-300 bg-white py-3 text-center text-[10px] font-bold tracking-[0.25em] text-gray-400">
        FRONT
      </div>

      {/* Seats */}
      <div className="mx-auto grid max-w-[320px] grid-cols-5 gap-2 sm:gap-3">
        {seats.map((seat, index) => {
          /*
            Every 4 seats create an aisle.
          */
          const isAisle = index % 4 === 2;

          return (
            <div
              key={seat.number}
              className={isAisle ? "col-start-4" : ""}
            >
              <button
                type="button"
                disabled={seat.status === "booked"}
                onClick={() => handleSeatClick(seat)}
                className={`
                  relative flex h-12 w-full flex-col
                  items-center justify-center
                  rounded-lg border
                  transition
                  sm:h-14

                  ${
                    seat.status === "booked"
                      ? "cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400"
                      : selected.includes(seat.number)
                      ? "border-teal-700 bg-teal-700 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-teal-600 hover:bg-teal-50"
                  }
                `}
              >
                <Armchair size={17} />

                <span className="text-[9px] font-bold">
                  {seat.number}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-7 flex flex-wrap justify-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-white ring-1 ring-gray-200" />
          Available
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-teal-700" />
          Selected
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-gray-200" />
          Booked
        </div>
      </div>
    </div>
  );
}

