"use client";

import { useEffect, useState } from "react";
import {
  Armchair,
  Clock3,
} from "lucide-react";

import {
  FaFemale,
  FaMale,
} from "react-icons/fa";

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

  // ============================================================
  // NOTIFY PARENT WHEN SELECTED SEATS CHANGE
  // ============================================================

  useEffect(() => {
    onSeatChange?.(selected);
  }, [selected, onSeatChange]);

  // ============================================================
  // HANDLE SEAT CLICK
  // ============================================================

  const handleSeatClick = (seat: Seat) => {
    // Booked and pending seats cannot be selected
    if (
      seat.status === "booked" ||
      seat.status === "pending"
    ) {
      return;
    }

    setSelected((previous) => {
      const exists = previous.includes(seat.seatNumber);

      if (exists) {
        return previous.filter(
          (item) => item !== seat.seatNumber
        );
      }

      return [...previous, seat.seatNumber];
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="rounded-2xl bg-gray-50 p-4 sm:p-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            Select your seats
          </h4>

          <p className="mt-1 text-xs text-gray-500">
            Choose available seats
          </p>
        </div>

        <div className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
          {selected.length} selected
        </div>
      </div>

      {/* ======================================================
          BUS FRONT
      ====================================================== */}

      <div className="mx-auto mb-5 max-w-[320px] rounded-t-[50%] border-b-2 border-gray-300 bg-white py-3 text-center text-[10px] font-bold tracking-[0.25em] text-gray-400">
        FRONT
      </div>

      {/* ======================================================
          SEATS
      ====================================================== */}

      <div className="mx-auto grid max-w-[320px] grid-cols-5 gap-2 sm:gap-3">
        {seats.map((seat, index) => {
          const isAisle = index % 4 === 2;

          const isSelected = selected.includes(
            seat.seatNumber
          );

          const isBooked =
            seat.status === "booked";

          const isPending =
            seat.status === "pending";

          const isFemale =
            seat.gender === "female";

          const isMale =
            seat.gender === "male";

          const isOccupied =
            isBooked || isPending;

          return (
            <div
              key={seat.seatNumber}
              className={
                isAisle
                  ? "col-start-4"
                  : ""
              }
            >
              <button
                type="button"
                disabled={isOccupied}
                onClick={() =>
                  handleSeatClick(seat)
                }
                title={
                  isFemale
                    ? `Seat ${seat.seatNumber} • Female passenger`
                    : isMale
                      ? `Seat ${seat.seatNumber} • Male passenger`
                      : isPending
                        ? `Seat ${seat.seatNumber} • Pending`
                        : isBooked
                          ? `Seat ${seat.seatNumber} • Booked`
                          : `Seat ${seat.seatNumber} • Available`
                }
                className={`
                  group
                  relative
                  flex
                  h-14
                  w-full
                  flex-col
                  items-center
                  justify-center
                  gap-0.5
                  rounded-xl
                  border
                  transition-all
                  duration-200
                  sm:h-16

                  ${
                    isSelected
                      ? `
                        scale-[1.03]
                        border-teal-700
                        bg-teal-700
                        text-white
                        shadow-lg
                        shadow-teal-700/20
                        ring-2
                        ring-teal-200
                      `
                      : isFemale
                        ? `
                          cursor-not-allowed
                          border-pink-200
                          bg-pink-50
                          text-pink-600
                          shadow-sm
                        `
                        : isMale
                          ? `
                            cursor-not-allowed
                            border-blue-200
                            bg-blue-50
                            text-blue-600
                            shadow-sm
                          `
                          : isPending
                            ? `
                              cursor-not-allowed
                              border-amber-200
                              bg-amber-50
                              text-amber-500
                            `
                            : `
                              border-gray-200
                              bg-white
                              text-gray-700
                              hover:-translate-y-0.5
                              hover:border-teal-500
                              hover:bg-teal-50
                              hover:text-teal-700
                              hover:shadow-md
                            `
                  }
                `}
              >

                {/* ==================================================
                    GENDER / SEAT ICON
                ================================================== */}

                {isFemale ? (
                  <FaFemale
                    size={19}
                    className="shrink-0"
                  />
                ) : isMale ? (
                  <FaMale
                    size={19}
                    className="shrink-0"
                  />
                ) : isPending ? (
                  <Clock3
                    size={18}
                    strokeWidth={2.5}
                    className="shrink-0"
                  />
                ) : (
                  <Armchair
                    size={18}
                    strokeWidth={2}
                    className="shrink-0"
                  />
                )}

                {/* ==================================================
                    SEAT NUMBER
                ================================================== */}

                <span
                  className={`
                    text-[9px]
                    font-bold
                    leading-none

                    ${
                      isSelected
                        ? "text-white"
                        : isFemale
                          ? "text-pink-700"
                          : isMale
                            ? "text-blue-700"
                            : isPending
                              ? "text-amber-600"
                              : "text-gray-700"
                    }
                  `}
                >
                  {seat.seatNumber}
                </span>

                {/* ==================================================
                    GENDER LABEL
                ================================================== */}

                {(isFemale || isMale) && (
                  <span
                    className={`
                      text-[7px]
                      font-semibold
                      uppercase
                      tracking-wide

                      ${
                        isFemale
                          ? "text-pink-500"
                          : "text-blue-500"
                      }
                    `}
                  >
                    {isFemale
                      ? "Female"
                      : "Male"}
                  </span>
                )}

                {/* ==================================================
                    PENDING LABEL
                ================================================== */}

                {isPending && (
                  <span className="text-[7px] font-semibold uppercase tracking-wide text-amber-500">
                    Pending
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ======================================================
          LEGEND
      ====================================================== */}

      <div className="mt-7 grid grid-cols-2 gap-3 text-xs text-gray-500 sm:flex sm:flex-wrap sm:justify-center sm:gap-5">

        {/* Available */}

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-500 ring-1 ring-gray-200">
            <Armchair size={14} />
          </span>

          <span>Available</span>
        </div>

        {/* Selected */}

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Armchair size={14} />
          </span>

          <span>Selected</span>
        </div>

        {/* Female */}

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600 ring-1 ring-pink-200">
            <FaFemale size={14} />
          </span>

          <span>Female</span>
        </div>

        {/* Male */}

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-200">
            <FaMale size={14} />
          </span>

          <span>Male</span>
        </div>

        {/* Pending */}

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500 ring-1 ring-amber-200">
            <Clock3 size={14} />
          </span>

          <span>Pending</span>
        </div>
      </div>

      {/* ======================================================
          INFO MESSAGE
      ====================================================== */}

      <div className="mt-5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-center">
        <p className="text-[11px] leading-5 text-gray-500">
          <span className="font-semibold text-pink-600">
            Pink
          </span>{" "}
          seats are occupied by female passengers and{" "}
          <span className="font-semibold text-blue-600">
            blue
          </span>{" "}
          seats are occupied by male passengers.
        </p>
      </div>
    </div>
  );
}