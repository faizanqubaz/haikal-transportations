"use client";

import { useEffect, useState } from "react";
import { Armchair, Clock3 } from "lucide-react";

import { FaFemale, FaMale } from "react-icons/fa";

import type { Seat } from "@/libs/availability";

type Props = {
  seats: Seat[];
  maxSeats?: number;
  onSeatChange?: (seats: string[]) => void;
};

export default function SeatMap({
  seats,
  maxSeats,
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
    // Cannot select booked or pending seats
    if (
      seat.status === "booked" ||
      seat.status === "pending"
    ) {
      return;
    }

    setSelected((previous) => {
      const exists = previous.includes(seat.seatNumber);

      // ========================================================
      // UNSELECT SEAT
      // ========================================================

      if (exists) {
        return previous.filter(
          (item) => item !== seat.seatNumber
        );
      }

      // ========================================================
      // MAX SEAT LIMIT
      // Only applies when maxSeats is provided
      // ========================================================

      if (
        typeof maxSeats === "number" &&
        maxSeats > 0 &&
        previous.length >= maxSeats
      ) {
        return previous;
      }

      // ========================================================
      // SELECT SEAT
      // ========================================================

      return [...previous, seat.seatNumber];
    });
  };

  // ============================================================
  // SEAT POSITION
  //
  // RIGHT SIDE FIRST:
  //
  // 1  2 | 3  4
  // 5  6 | 7  8
  // 9 10 |11 12
  //
  // Grid:
  // col 1 + 2 = RIGHT
  // col 3      = AISLE
  // col 4 + 5 = LEFT
  // ============================================================

  const getSeatPosition = (index: number) => {
    const position = index % 4;

    switch (position) {
      // RIGHT SIDE
      case 0:
        return "col-start-1";

      case 1:
        return "col-start-2";

      // LEFT SIDE
      case 2:
        return "col-start-4";

      case 3:
        return "col-start-5";

      default:
        return "";
    }
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
          {selected.length}
          {typeof maxSeats === "number"
            ? ` / ${maxSeats}`
            : ""}{" "}
          selected
        </div>
      </div>

      {/* ======================================================
          BUS FRONT
      ====================================================== */}

      <div className="mx-auto mb-5 grid max-w-[360px] grid-cols-5 items-center gap-2 sm:gap-3">

        {/* RIGHT FRONT */}

        <div className="col-span-2 col-start-1 flex justify-start">
          <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-center shadow-sm">
            <span className="block text-[8px] font-bold tracking-[0.12em] text-gray-400 sm:text-[9px]">
              RIGHT FRONT
            </span>
          </div>
        </div>

        {/* FRONT */}

        <div className="col-start-3 flex justify-center">
          <div className="rounded-t-[50%] border-b-2 border-gray-300 bg-white px-4 py-3 text-center sm:px-6">
            <span className="text-[9px] font-bold tracking-[0.2em] text-gray-400 sm:text-[10px]">
              FRONT
            </span>
          </div>
        </div>

        {/* LEFT FRONT */}

        <div className="col-span-2 col-start-4 flex justify-end">
          <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-center shadow-sm">
            <span className="block text-[8px] font-bold tracking-[0.12em] text-gray-400 sm:text-[9px]">
              LEFT FRONT
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          SEATS
      ====================================================== */}

      <div className="mx-auto grid max-w-[360px] grid-cols-5 gap-2 sm:gap-3">

        {seats.map((seat, index) => {
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

          const seatPosition =
            getSeatPosition(index);

          return (
            <div
              key={seat.seatNumber}
              className={seatPosition}
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
                    SEAT ICON
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

      {/* ======================================================
          MAX SEAT INFO
      ====================================================== */}

      {typeof maxSeats === "number" && maxSeats > 0 && (
        <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-center">
          <p className="text-[11px] font-medium text-teal-700">
            Select exactly {maxSeats} seat
            {maxSeats !== 1 ? "s" : ""} for{" "}
            {maxSeats} passenger
            {maxSeats !== 1 ? "s" : ""}.
          </p>
        </div>
      )}
    </div>
  );
}