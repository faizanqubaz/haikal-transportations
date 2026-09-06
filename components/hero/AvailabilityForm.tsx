"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Bus,
  Loader2,
  X,
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

type CalendarDay = {
  date: Date;
  currentMonth: boolean;
};

export default function AvailabilityForm({ onSearch }: Props) {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState("");

  const [bookedDates, setBookedDates] = useState<string[]>([]);

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [loadingDates, setLoadingDates] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  });

  /*
   * ==========================================
   * DATE HELPERS
   * ==========================================
   */

  const formatDate = (dateValue: Date) => {
    const year = dateValue.getFullYear();

    const month = String(
      dateValue.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      dateValue.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString: string) => {
    const [year, month, day] =
      dateString.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day
    );
  };

  const today = useMemo(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }, []);

  const todayString = formatDate(today);

  /*
   * ==========================================
   * FETCH BOOKED DATES
   * ==========================================
   */

  useEffect(() => {
    if (!pickup || !dropoff) {
      setBookedDates([]);
      setDate("");
      setCalendarOpen(false);
      return;
    }

    const fetchBookedDates = async () => {
      try {
        setLoadingDates(true);

        setBookedDates([]);
        setDate("");
        setCalendarOpen(false);

        const params = new URLSearchParams({
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
        });
console.log('params',params.toString())
        const response = await fetch(
          `/api/busses/booked-dates?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();
console.log('data',data)
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
          Array.isArray(data.bookedDates)
            ? data.bookedDates
            : []
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
   * ==========================================
   * CALENDAR DAYS
   * ==========================================
   */

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();

    const month = calendarMonth.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const firstDayOfWeek =
      firstDay.getDay();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const previousMonthDays =
      new Date(
        year,
        month,
        0
      ).getDate();

    const days: CalendarDay[] = [];

    /*
     * PREVIOUS MONTH
     */

    for (
      let i = firstDayOfWeek - 1;
      i >= 0;
      i--
    ) {
      days.push({
        date: new Date(
          year,
          month - 1,
          previousMonthDays - i
        ),
        currentMonth: false,
      });
    }

    /*
     * CURRENT MONTH
     */

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      days.push({
        date: new Date(
          year,
          month,
          day
        ),
        currentMonth: true,
      });
    }

    /*
     * NEXT MONTH
     */

    const remaining =
      42 - days.length;

    for (
      let day = 1;
      day <= remaining;
      day++
    ) {
      days.push({
        date: new Date(
          year,
          month + 1,
          day
        ),
        currentMonth: false,
      });
    }

    return days;
  }, [calendarMonth]);

  /*
   * ==========================================
   * MONTH NAME
   * ==========================================
   */

  const monthName =
    calendarMonth.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

  /*
   * ==========================================
   * CHECK DATE STATES
   * ==========================================
   */

  const isBooked = (day: Date) => {
    return bookedDates.includes(
      formatDate(day)
    );
  };

  const isPast = (day: Date) => {
    return formatDate(day) < todayString;
  };

  const isSelected = (day: Date) => {
    return (
      date !== "" &&
      formatDate(day) === date
    );
  };

  const isToday = (day: Date) => {
    return (
      formatDate(day) === todayString
    );
  };

  /*
   * ==========================================
   * MONTH NAVIGATION
   * ==========================================
   */

  const goPreviousMonth = () => {
    const previous = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() - 1,
      1
    );

    /*
     * Do not allow going before
     * current month.
     */

    const currentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    if (previous < currentMonth) {
      return;
    }

    setCalendarMonth(previous);
  };

  const goNextMonth = () => {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        1
      )
    );
  };

  /*
   * ==========================================
   * OPEN CALENDAR
   * ==========================================
   */

  const openCalendar = () => {
    if (
      !pickup ||
      !dropoff ||
      loadingDates
    ) {
      return;
    }

    /*
     * If a date already exists,
     * open on that month.
     */

    if (date) {
      const selectedDate =
        parseDate(date);

      setCalendarMonth(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );
    } else {
      setCalendarMonth(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )
      );
    }

    setCalendarOpen(true);
  };

  /*
   * ==========================================
   * DATE SELECTION
   * ==========================================
   */

  const handleDateSelect = (
    selectedDate: Date
  ) => {
    const selected =
      formatDate(selectedDate);

    if (isPast(selectedDate)) {
      return;
    }

    if (isBooked(selectedDate)) {
      return;
    }

    setDate(selected);

    setCalendarOpen(false);
  };

  /*
   * ==========================================
   * SUBMIT
   * ==========================================
   */

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      !pickup ||
      !dropoff ||
      !date
    ) {
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
   * ==========================================
   * DISPLAY DATE
   * ==========================================
   */

  const formattedDisplayDate = date
    ? parseDate(
        date
      ).toLocaleDateString(
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
   * ==========================================
   * CALENDAR COMPONENT
   * ==========================================
   */

  const Calendar = ({
    mobile = false,
  }: {
    mobile?: boolean;
  }) => {
    return (
      <div
        className={
          mobile
            ? "w-full"
            : "w-[290px]"
        }
      >
        {/* HEADER */}

        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={
              goPreviousMonth
            }
            disabled={
              calendarMonth.getFullYear() ===
                today.getFullYear() &&
              calendarMonth.getMonth() ===
                today.getMonth()
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#063d43] transition hover:bg-[#e7f5f4] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft
              size={19}
            />
          </button>

          <div className="text-center">
            <p className="text-sm font-bold text-[#063d43]">
              {monthName}
            </p>
          </div>

          <button
            type="button"
            onClick={
              goNextMonth
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#063d43] transition hover:bg-[#e7f5f4]"
            aria-label="Next month"
          >
            <ChevronRight
              size={19}
            />
          </button>
        </div>

        {/* WEEKDAYS */}

        <div className="mb-2 grid grid-cols-7">
          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((day) => (
            <div
              key={day}
              className="flex h-7 items-center justify-center text-[10px] font-bold uppercase text-gray-400"
            >
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* DAYS */}

        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map(
            ({
              date: day,
              currentMonth,
            }) => {
              const booked =
                isBooked(day);

              const past =
                isPast(day);

              const selected =
                isSelected(day);

              const dayToday =
                isToday(day);

              const disabled =
                past || booked;

              return (
                <div
                  key={formatDate(day)}
                  className="flex h-10 items-center justify-center"
                >
                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    onClick={() =>
                      handleDateSelect(
                        day
                      )
                    }
                    className={[
                      "relative flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition",
                      !currentMonth
                        ? "text-gray-300"
                        : "",
                      currentMonth &&
                      !disabled &&
                      !selected
                        ? "text-gray-700 hover:bg-[#e7f5f4] hover:text-[#063d43]"
                        : "",
                      past
                        ? "cursor-not-allowed text-gray-300"
                        : "",
                      booked
                        ? "cursor-not-allowed bg-red-50 text-red-500"
                        : "",
                      selected
                        ? "bg-[#063d43] text-white shadow-md"
                        : "",
                      dayToday &&
                      !selected &&
                      !booked
                        ? "ring-2 ring-[#063d43]/20"
                        : "",
                    ].join(
                      " "
                    )}
                  >
                    {day.getDate()}

                    {booked && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                        <Bus
                          size={9}
                          strokeWidth={
                            2.5
                          }
                          className="text-red-500"
                        />
                      </span>
                    )}
                  </button>
                </div>
              );
            }
          )}
        </div>

        {/* LEGEND */}

        <div className="mt-4 flex items-center justify-center gap-2 border-t border-gray-100 pt-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50">
            <Bus
              size={12}
              className="text-red-500"
            />
          </span>

          <span className="text-xs font-medium text-gray-500">
            Fully booked
          </span>
        </div>
      </div>
    );
  };

  /*
   * ==========================================
   * RETURN
   * ==========================================
   */

  return (
    <>
      <div className="absolute bottom-5 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[1450px] -translate-x-1/2 sm:bottom-8 sm:w-[calc(100%-3rem)] lg:bottom-12">
        <form
          onSubmit={
            handleSubmit
          }
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
                onChange={
                  setPickup
                }
                placeholder="Choose pick-up"
              />
            </div>

            {/* DROPOFF */}

            <div className="border-b border-gray-200 pb-3">
              <LocationAutocomplete
                label="DROP-OFF"
                value={dropoff}
                onChange={
                  setDropoff
                }
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
                onClick={
                  openCalendar
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

              {/* DESKTOP CALENDAR */}

              {calendarOpen && (
                <div className="absolute bottom-[calc(100%+15px)] left-0 z-[9999] w-[322px] rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#063d43]">
                      Select travel date
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCalendarOpen(
                          false
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-gray-400 hover:bg-gray-100"
                      aria-label="Close calendar"
                    >
                      <X
                        size={16}
                      />
                    </button>
                  </div>

                  <Calendar />
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
                bookedDates.includes(
                  date
                )
              }
              className="flex h-16 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[#063d43] px-8 text-sm font-semibold text-white shadow-lg transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check Availability

              <ArrowRight
                size={20}
              />
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
              onChange={
                setPickup
              }
              placeholder="Where are you leaving from?"
            />

            <div className="h-px bg-gray-100" />

            {/* DROPOFF */}

            <LocationAutocomplete
              label="DROP-OFF"
              value={dropoff}
              onChange={
                setDropoff
              }
              placeholder="Where are you going?"
            />

            <div className="h-px bg-gray-100" />

            {/* DATE */}

            <div>
              <label className="mb-2 block text-[10px] font-bold tracking-[0.25em] text-gray-400">
                DATE
              </label>

              <button
                type="button"
                onClick={
                  openCalendar
                }
                disabled={
                  !pickup ||
                  !dropoff ||
                  loadingDates
                }
                className="flex h-12 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
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
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                !pickup ||
                !dropoff ||
                !date ||
                loadingDates ||
                bookedDates.includes(
                  date
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check availability

              <ArrowRight
                size={17}
              />
            </button>
          </div>
        </form>
      </div>

      {/* ========================================== */}
      {/* MOBILE CALENDAR */}
      {/* ========================================== */}

      {calendarOpen && (
        <div className="fixed inset-0 z-[99999] lg:hidden">
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close calendar"
            onClick={() =>
              setCalendarOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/40"
          />

          {/* CALENDAR CARD */}

          <div className="absolute left-1/2 top-1/2 w-[calc(100vw-24px)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-2xl">
            {/* HEADER */}

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Travel date
                </p>

                <h3 className="mt-1 text-base font-bold text-[#063d43]">
                  Select your date
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCalendarOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
                aria-label="Close calendar"
              >
                <X size={18} />
              </button>
            </div>

            {/* CALENDAR */}

            <Calendar mobile />
          </div>
        </div>
      )}
    </>
  );
}