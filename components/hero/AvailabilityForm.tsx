"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Bus,
  Loader2,
} from "lucide-react";

import {
  DayPicker,
  DayButton,
  type DayButtonProps,
} from "react-day-picker";

import "react-day-picker/style.css";

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

  const [date, setDate] = useState("");

  const [bookedDates, setBookedDates] =
    useState<string[]>([]);

  const [calendarOpen, setCalendarOpen] =
    useState(false);

  const [loadingDates, setLoadingDates] =
    useState(false);

  /*
   * ================================
   * DATE HELPERS
   * ================================
   */

  const parseDate = (dateString: string) => {
    const [year, month, day] =
      dateString.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day
    );
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayString = formatDate(new Date());

  const today = parseDate(todayString);

  /*
   * ================================
   * FETCH BOOKED DATES
   * ================================
   */

  useEffect(() => {
    if (!pickup || !dropoff) {
      setBookedDates([]);
      setDate("");
      return;
    }

    const fetchBookedDates = async () => {
      try {
        setLoadingDates(true);

        setBookedDates([]);

        setDate("");

        const params = new URLSearchParams({
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
        });

        const response = await fetch(
          `/api/busses/booked-dates?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch booked dates"
          );
        }

        console.log(
          "BOOKED DATES:",
          data.bookedDates
        );

        setBookedDates(
          data.bookedDates || []
        );
      } catch (error) {
        console.error(
          "FETCH BOOKED DATES ERROR:",
          error
        );

        setBookedDates([]);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchBookedDates();
  }, [pickup, dropoff]);

  /*
   * ================================
   * BOOKED DATE OBJECTS
   * ================================
   */

  const bookedDateObjects =
    bookedDates.map(parseDate);

  /*
   * ================================
   * DATE SELECTION
   * ================================
   */

  const handleDateSelect = (
    selectedDate: Date | undefined
  ) => {
    if (!selectedDate) {
      return;
    }

    const selected =
      formatDate(selectedDate);

    if (bookedDates.includes(selected)) {
      return;
    }

    setDate(selected);

    setCalendarOpen(false);
  };

  /*
   * ================================
   * SUBMIT
   * ================================
   */

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!pickup || !dropoff || !date) {
      return;
    }

    if (bookedDates.includes(date)) {
      return;
    }

    onSearch({
      pickup,
      dropoff,
      date,
    });
  };

  /*
   * ================================
   * DISPLAY DATE
   * ================================
   */

  const formattedDisplayDate = date
    ? parseDate(date).toLocaleDateString(
        "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      )
    : "Select booking date";

  /*
   * ================================
   * CUSTOM DAY BUTTON
   *
   * This is what displays the bus
   * icon directly inside booked days.
   * ================================
   */

  function CustomDayButton(
    props: DayButtonProps
  ) {
    const dayDate = props.day.date;

    const dateString =
      formatDate(dayDate);

    const booked =
      bookedDates.includes(dateString);

    return (
      <div className="relative flex h-10 w-10 items-center justify-center">

        <DayButton
          {...props}
          className={`
            !m-0
            !flex
            !h-10
            !w-10
            !items-center
            !justify-center
            !rounded-xl
            !text-sm
            !font-medium
            ${
              booked
                ? "!cursor-not-allowed !bg-red-50 !text-red-500"
                : ""
            }
          `}
        />

        {booked && (
          <span
            className="pointer-events-none absolute -right-1 -bottom-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm"
            title="Fully booked"
          >
            <Bus
              size={13}
              strokeWidth={2.5}
              className="text-red-500"
            />
          </span>
        )}

      </div>
    );
  }

  /*
   * ================================
   * CALENDAR COMPONENT
   * ================================
   */

  const Calendar = () => (
    <DayPicker
      mode="single"

      selected={
        date
          ? parseDate(date)
          : undefined
      }

      onSelect={handleDateSelect}

      disabled={[
        {
          before: today,
        },

        ...bookedDateObjects,
      ]}

      showOutsideDays

      fixedWeeks

      components={{
        DayButton: CustomDayButton,

        Chevron: ({
          orientation,
        }) => {
          if (
            orientation === "left"
          ) {
            return (
              <ChevronLeft size={18} />
            );
          }

          return (
            <ChevronRight size={18} />
          );
        },
      }}
    />
  );

  return (
    <div className="absolute bottom-5 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[1450px] -translate-x-1/2 sm:bottom-8 sm:w-[calc(100%-3rem)] lg:bottom-12">

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-5 lg:px-7 lg:py-5"
      >

        {/* ================================= */}
        {/* DESKTOP */}
        {/* ================================= */}

        <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_0.8fr_auto] lg:items-end lg:gap-7">

          {/* PICKUP */}

          <div className="border-b border-gray-200 pb-3">

            <LocationAutocomplete
              label="PICK-UP"
              value={pickup}
              onChange={setPickup}
              placeholder="Choose pick-up"
            />

          </div>

          {/* DROPOFF */}

          <div className="border-b border-gray-200 pb-3">

            <LocationAutocomplete
              label="DROP-OFF"
              value={dropoff}
              onChange={setDropoff}
              placeholder="Choose drop-off"
            />

          </div>

          {/* DATE */}

          <div className="relative border-b border-gray-200 pb-3">

            <label className="mb-2 block text-xs font-semibold tracking-[0.25em] text-gray-400">
              DATE
            </label>

            <button
              type="button"
              onClick={() =>
                setCalendarOpen(
                  !calendarOpen
                )
              }
              disabled={
                !pickup ||
                !dropoff ||
                loadingDates
              }
              className="flex w-full items-center gap-2 bg-transparent text-left text-sm font-medium text-gray-800 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loadingDates ? (
                <Loader2
                  size={18}
                  className="animate-spin text-teal-700"
                />
              ) : (
                <CalendarDays
                  size={18}
                  className="text-teal-700"
                />
              )}

              <span
                className={
                  date
                    ? "text-gray-800"
                    : "text-gray-400"
                }
              >
                {loadingDates
                  ? "Checking availability..."
                  : formattedDisplayDate}
              </span>

            </button>

            {/* CALENDAR */}

            {calendarOpen &&
              pickup &&
              dropoff &&
              !loadingDates && (

                <div className="absolute bottom-[calc(100%+15px)] left-0 z-[100] rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">

                  <Calendar />

                  {/* LEGEND */}

                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">

                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50">
                      <Bus
                        size={13}
                        className="text-red-500"
                      />
                    </span>

                    <span>
                      Fully booked
                    </span>

                  </div>

                </div>
              )}

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              !pickup ||
              !dropoff ||
              !date ||
              loadingDates ||
              bookedDates.includes(date)
            }
            className="flex h-16 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[#063d43] px-8 text-sm font-semibold text-white shadow-lg transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-50"
          >

            Check Availability

            <ArrowRight size={20} />

          </button>

        </div>


        {/* ================================= */}
        {/* MOBILE */}
        {/* ================================= */}

        <div className="space-y-4 lg:hidden">

          {/* PICKUP */}

          <LocationAutocomplete
            label="PICK-UP"
            value={pickup}
            onChange={setPickup}
            placeholder="Where are you leaving from?"
          />

          <div className="h-px bg-gray-100" />

          {/* DROPOFF */}

          <LocationAutocomplete
            label="DROP-OFF"
            value={dropoff}
            onChange={setDropoff}
            placeholder="Where are you going?"
          />

          <div className="h-px bg-gray-100" />

          {/* DATE */}

          <div className="relative">

            <label className="mb-2 block text-[10px] font-bold tracking-[0.25em] text-gray-400">
              DATE
            </label>

            <button
              type="button"
              onClick={() =>
                setCalendarOpen(
                  !calendarOpen
                )
              }
              disabled={
                !pickup ||
                !dropoff ||
                loadingDates
              }
              className="flex h-12 w-full items-center gap-2 rounded-xl border border-gray-200 px-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loadingDates ? (
                <Loader2
                  size={17}
                  className="animate-spin text-teal-700"
                />
              ) : (
                <CalendarDays
                  size={17}
                  className="text-teal-700"
                />
              )}

              <span
                className={
                  date
                    ? "text-sm font-medium text-gray-800"
                    : "text-sm text-gray-400"
                }
              >
                {loadingDates
                  ? "Checking availability..."
                  : formattedDisplayDate}
              </span>

            </button>

            {/* MOBILE CALENDAR */}

            {calendarOpen &&
              pickup &&
              dropoff &&
              !loadingDates && (

                <div className="absolute left-1/2 top-[calc(100%+10px)] z-[100] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl">

                  <Calendar />

                  {/* LEGEND */}

                  <div className="mt-2 flex items-center justify-center gap-2 border-t border-gray-100 pt-2 text-xs text-gray-500">

                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50">
                      <Bus
                        size={12}
                        className="text-red-500"
                      />
                    </span>

                    <span>
                      Fully booked
                    </span>

                  </div>

                </div>
              )}

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              !pickup ||
              !dropoff ||
              !date ||
              loadingDates ||
              bookedDates.includes(date)
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-50"
          >

            Check availability

            <ArrowRight size={17} />

          </button>

        </div>

      </form>

      {/* ================================= */}
      {/* CALENDAR CSS */}
      {/* ================================= */}

      <style jsx global>{`

        .rdp-root {
          --rdp-accent-color: #063d43;
          --rdp-accent-background-color: #e7f5f4;
          font-family: inherit;
        }

        .rdp-month_caption {
          font-weight: 700;
          color: #063d43;
        }

        .rdp-weekday {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
        }

        .rdp-day {
          position: relative;
        }

        .rdp-day_button {
          width: 40px !important;
          height: 40px !important;
          border-radius: 12px !important;
        }

        /*
         * AVAILABLE DATE
         */

        .rdp-day:not(.rdp-disabled)
          .rdp-day_button:hover {
          background: #e7f5f4 !important;
          color: #063d43 !important;
        }

        /*
         * SELECTED DATE
         */

        .rdp-selected
          .rdp-day_button {
          background: #063d43 !important;
          color: white !important;
        }

        /*
         * DISABLED DATES
         */

        .rdp-disabled
          .rdp-day_button {
          cursor: not-allowed !important;
        }

        /*
         * OUTSIDE MONTH
         */

        .rdp-outside {
          opacity: 0.3;
        }

        /*
         * NAVIGATION
         */

        .rdp-chevron {
          fill: #063d43;
        }

      `}</style>

    </div>
  );
}