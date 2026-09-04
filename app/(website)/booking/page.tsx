
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
  Bus as BusIcon,
  Phone,
  Route,
} from "lucide-react";

/* =========================================================
   TYPES
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

/* =========================================================
   HELPERS
========================================================= */

function formatPKR(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function seatCounts(seats: Seat[] = []) {
  const total = seats.length;

  const available = seats.filter(
    (seat) => seat.status === "available"
  ).length;

  const pending = seats.filter(
    (seat) => seat.status === "pending"
  ).length;

  const booked = seats.filter(
    (seat) => seat.status === "booked"
  ).length;

  return {
    total,
    available,
    pending,
    booked,
  };
}

function todayISO() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  if (!date) return "";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-PK",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatShortDate(date: string) {
  if (!date) return "";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-PK",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BookingPage() {
  const today = todayISO();

  /* =======================================================
     FILTER STATES
  ======================================================= */

  const [cities, setCities] = useState<string[]>([]);

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState(today);

  /* =======================================================
     RESULTS STATES
  ======================================================= */

  const [buses, setBuses] = useState<Bus[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [hasSearched, setHasSearched] = useState(false);

  /* =======================================================
     LOAD CITIES
  ======================================================= */

  useEffect(() => {
    async function loadCities() {
      try {
        const res = await fetch("/api/busses/cities", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load cities");
        }

        const data: {
          cities?: string[];
        } = await res.json();

        const list = data.cities ?? [];

        setCities(list);

        if (list.length >= 2) {
          setPickup((current) => current || list[0]);

          setDropoff((current) => current || list[1]);
        }
      } catch (err) {
        console.error("CITY LOAD ERROR:", err);
      }
    }

    loadCities();
  }, []);

  /* =======================================================
     SEARCH BUSES
  ======================================================= */

  async function runSearch(
    selectedPickup: string,
    selectedDropoff: string,
    selectedDate: string
  ) {
    if (
      !selectedPickup ||
      !selectedDropoff ||
      !selectedDate
    ) {
      setError(
        "Please select From, To, and travel date."
      );

      setBuses([]);

      setHasSearched(true);

      return;
    }

    if (selectedPickup === selectedDropoff) {
      setError(
        "From and To cities cannot be the same."
      );

      setBuses([]);

      setHasSearched(true);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      params.set("pickup", selectedPickup);
      params.set("dropoff", selectedDropoff);
      params.set("date", selectedDate);

      const url = `/api/busses?${params.toString()}`;

      console.log("BUS SEARCH:", url);

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        let message = "Request failed";

        try {
          const errorData = await res.json();

          if (errorData?.message) {
            message = errorData.message;
          }

          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(message);
      }

      const data: {
        buses?: Bus[];
        message?: string;
      } = await res.json();

      console.log(
        "BUS SEARCH RESPONSE:",
        data
      );

      setBuses(data.buses ?? []);
    } catch (err) {
      console.error(
        "BUS SEARCH ERROR:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Couldn't load buses right now. Please try again."
        );
      }

      setBuses([]);
    } finally {
      setLoading(false);

      setHasSearched(true);
    }
  }

  /* =======================================================
     SEARCH BUTTON
  ======================================================= */

  function handleSearch(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    runSearch(
      pickup,
      dropoff,
      date
    );
  }

  /* =======================================================
     SWAP CITIES
  ======================================================= */

  function swapCities() {
    const oldPickup = pickup;

    setPickup(dropoff);

    setDropoff(oldPickup);
  }

  /* =======================================================
     SORT RESULTS
  ======================================================= */

  const results = useMemo(() => {
    return [...buses].sort((a, b) =>
      a.departure.localeCompare(
        b.departure
      )
    );
  }, [buses]);

  /* =======================================================
     DATE DISPLAY
  ======================================================= */

  const formattedDate = useMemo(() => {
    return formatDate(date);
  }, [date]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#FAFAF8]">

      {/* ===================================================
          HERO / SEARCH
      =================================================== */}

      <section className="border-b border-teal-800 bg-teal-700">

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

          {/* HEADER */}

          <div className="max-w-2xl">

            <div className="mb-3 flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">

                <BusIcon
                  size={19}
                  className="text-white"
                />

              </div>

              <span className="text-sm font-bold text-teal-100">
                Haikal Transport
              </span>

            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Bus Schedule & Information
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-teal-50">
              Check available buses, departure times,
              arrival times, fares, and seat availability
              for your journey.
            </p>

          </div>

          {/* =================================================
              SEARCH FORM
          ================================================= */}

          <form
            onSubmit={handleSearch}
            className="mt-7 grid grid-cols-1 gap-3 rounded-3xl bg-white p-4 shadow-xl sm:grid-cols-[1fr_auto_1fr_1fr_auto] sm:items-end sm:p-3"
          >

            {/* ===============================================
                FROM
            =============================================== */}

            <label className="block">

              <span className="mb-1.5 block px-1 text-xs font-bold text-gray-500">
                From
              </span>

              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 transition focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">

                <MapPin
                  size={17}
                  className="shrink-0 text-teal-700"
                />

                <select
                  value={pickup}
                  onChange={(e) =>
                    setPickup(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full cursor-pointer bg-transparent text-sm font-semibold text-gray-800 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {cities.length === 0 ? (
                    <option value="">
                      Loading cities...
                    </option>
                  ) : (
                    <>
                      <option value="">
                        Select departure city
                      </option>

                      {cities.map((city) => (
                        <option
                          key={city}
                          value={city}
                        >
                          {city}
                        </option>
                      ))}
                    </>
                  )}

                </select>

              </div>

            </label>

            {/* ===============================================
                DESKTOP SWAP
            =============================================== */}

            <button
              type="button"
              onClick={swapCities}
              disabled={
                !pickup ||
                !dropoff ||
                loading
              }
              aria-label="Swap cities"
              className="hidden h-11 w-11 items-center justify-center self-end rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 sm:flex"
            >
              <ArrowRight size={17} />
            </button>

            {/* ===============================================
                TO
            =============================================== */}

            <label className="block">

              <span className="mb-1.5 block px-1 text-xs font-bold text-gray-500">
                To
              </span>

              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 transition focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">

                <MapPin
                  size={17}
                  className="shrink-0 text-teal-700"
                />

                <select
                  value={dropoff}
                  onChange={(e) =>
                    setDropoff(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full cursor-pointer bg-transparent text-sm font-semibold text-gray-800 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {cities.length === 0 ? (
                    <option value="">
                      Loading cities...
                    </option>
                  ) : (
                    <>
                      <option value="">
                        Select destination city
                      </option>

                      {cities.map((city) => (
                        <option
                          key={city}
                          value={city}
                        >
                          {city}
                        </option>
                      ))}
                    </>
                  )}

                </select>

              </div>

            </label>

            {/* ===============================================
                DATE
            =============================================== */}

            <label className="block">

              <span className="mb-1.5 block px-1 text-xs font-bold text-gray-500">
                Travel date
              </span>

              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 transition focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">

                <Calendar
                  size={17}
                  className="shrink-0 text-teal-700"
                />

                <input
                  type="date"
                  value={date}
                  min={today}
                  disabled={loading}
                  onChange={(e) =>
                    setDate(
                      e.target.value
                    )
                  }
                  className="w-full cursor-pointer bg-transparent text-sm font-semibold text-gray-800 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

            </label>

            {/* ===============================================
                SEARCH
            =============================================== */}

            <button
              type="submit"
              disabled={
                loading ||
                !pickup ||
                !dropoff ||
                !date
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Searching...
                </>
              ) : (
                <>
                  <Search size={17} />

                  Search
                </>
              )}

            </button>

          </form>

          {/* =================================================
              MOBILE SWAP
          ================================================= */}

          <button
            type="button"
            onClick={swapCities}
            disabled={
              !pickup ||
              !dropoff ||
              loading
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500 bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
          >

            <ArrowRight size={16} />

            Swap From / To

          </button>

        </div>

      </section>

      {/* =====================================================
          RESULTS
      ===================================================== */}

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ===================================================
            SEARCH SUMMARY
        =================================================== */}

        {hasSearched &&
          !loading &&
          !error && (
            <div className="mb-6">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Travel information
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-gray-900 sm:text-2xl">

                    {pickup || "—"}

                    <span className="mx-2 text-gray-300">
                      →
                    </span>

                    {dropoff || "—"}

                  </h2>

                </div>

                <div className="sm:text-right">

                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 sm:justify-end">

                    <Calendar
                      size={15}
                      className="text-teal-700"
                    />

                    {formattedDate}

                  </div>

                  <p className="mt-1 text-xs text-gray-500">

                    {results.length}{" "}

                    {results.length === 1
                      ? "bus"
                      : "buses"}{" "}
                    found

                  </p>

                </div>

              </div>

            </div>
          )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="space-y-4">

            {[0, 1, 2].map((i) => (

              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white"
              >

                <div className="h-16 animate-pulse bg-gray-100" />

                <div className="space-y-4 p-6">

                  <div className="h-8 w-1/3 animate-pulse rounded bg-gray-100" />

                  <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                    <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />

                    <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />

                    <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />

                    <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />

                  </div>

                </div>

              </div>

            ))}

          </div>

        ) : error ? (

          /* =================================================
             ERROR
          ================================================= */

          <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">

              <MapPin
                size={24}
                className="text-red-600"
              />

            </div>

            <h3 className="mt-5 text-base font-extrabold text-red-800">
              Unable to load buses
            </h3>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                runSearch(
                  pickup,
                  dropoff,
                  date
                )
              }
              className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try again
            </button>

          </div>

        ) : !hasSearched ? (

          /* =================================================
             BEFORE SEARCH
          ================================================= */

          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">

              <BusIcon
                size={29}
                className="text-teal-700"
              />

            </div>

            <h3 className="mt-5 text-lg font-extrabold text-gray-900">
              Check bus information
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Select your departure city, destination,
              and travel date above to see available
              transport and journey information.
            </p>

          </div>

        ) : results.length === 0 ? (

          /* =================================================
             NO RESULTS
          ================================================= */

          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">

              <BusIcon
                size={29}
                className="text-gray-400"
              />

            </div>

            <h3 className="mt-5 text-lg font-extrabold text-gray-900">
              No buses available
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">

              There are currently no buses available
              from{" "}

              <span className="font-bold text-gray-700">
                {pickup}
              </span>{" "}

              to{" "}

              <span className="font-bold text-gray-700">
                {dropoff}
              </span>{" "}

              on{" "}

              <span className="font-bold text-gray-700">
                {formattedDate}
              </span>.

            </p>

            <button
              type="button"
              onClick={swapCities}
              className="mt-6 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:border-teal-600 hover:text-teal-700"
            >
              Swap cities
            </button>

          </div>

        ) : (

          /* =================================================
             BUS RESULTS
          ================================================= */

          <div className="space-y-5">

            {results.map((bus) => {

              const {
                total,
                available,
                pending,
                booked,
              } = seatCounts(
                bus.seats
              );

              const soldOut =
                available === 0;

              const limited =
                available > 0 &&
                available <= 4;

              return (

                <article
                  key={bus._id}
                  className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-lg"
                >

                  {/* =========================================
                      COMPANY HEADER
                  ========================================= */}

                  <div className="border-b border-gray-100 px-5 py-4 sm:px-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-3">

                        {/* BUS ICON */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50">

                          <BusIcon
                            size={23}
                            className="text-teal-700"
                          />

                        </div>

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-base font-extrabold text-gray-900">
                              {bus.company}
                            </h3>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                              Bus {bus.busNumber}
                            </span>

                          </div>

                          {bus.route && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">

                              <Route size={12} />

                              {bus.route}

                            </div>
                          )}

                        </div>

                      </div>

                      {/* STATUS */}

                      <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                          soldOut
                            ? "bg-gray-100 text-gray-500"
                            : limited
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >

                        <span
                          className={`h-2 w-2 rounded-full ${
                            soldOut
                              ? "bg-gray-400"
                              : limited
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />

                        {soldOut
                          ? "Sold out"
                          : limited
                          ? "Limited availability"
                          : "Available"}

                      </div>

                    </div>

                  </div>

                  {/* =========================================
                      JOURNEY
                  ========================================= */}

                  <div className="px-5 py-6 sm:px-6">

                    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_auto] lg:items-center">

                      {/* JOURNEY */}

                      <div>

                        <div className="flex items-center gap-3 sm:gap-5">

                          {/* DEPARTURE */}

                          <div className="min-w-[75px]">

                            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                              {bus.departure}
                            </p>

                            <p className="mt-1 text-xs font-bold text-gray-500">
                              {bus.pickup}
                            </p>

                          </div>

                          {/* LINE */}

                          <div className="flex flex-1 items-center gap-2">

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal-700" />

                            <div className="relative flex-1">

                              <div className="h-px w-full bg-gray-200" />

                              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-100 bg-white px-2.5 py-1">

                                <Clock
                                  size={12}
                                  className="text-gray-400"
                                />

                                <span className="text-[10px] font-bold text-gray-400">
                                  {bus.duration}
                                </span>

                              </div>

                            </div>

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal-700" />

                          </div>

                          {/* ARRIVAL */}

                          <div className="min-w-[75px] text-right">

                            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                              {bus.arrival}
                            </p>

                            <p className="mt-1 text-xs font-bold text-gray-500">
                              {bus.dropoff}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* FARE */}

                      <div className="rounded-2xl bg-teal-50 px-5 py-4 lg:min-w-[190px] lg:text-right">

                        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                          Fare per passenger
                        </p>

                        <p className="mt-1 text-2xl font-extrabold text-teal-800">
                          {formatPKR(bus.price)}
                        </p>

                      </div>

                    </div>

                    {/* =========================================
                        INFORMATION GRID
                    ========================================= */}

                    <div className="mt-7 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-4">

                      {/* DATE */}

                      <div className="rounded-2xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2">

                          <Calendar
                            size={16}
                            className="text-teal-700"
                          />

                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Travel date
                          </span>

                        </div>

                        <p className="mt-2 text-sm font-extrabold text-gray-800">
                          {formatShortDate(
                            bus.date
                          )}
                        </p>

                      </div>

                      {/* AVAILABLE SEATS */}

                      <div
                        className={`rounded-2xl p-4 ${
                          soldOut
                            ? "bg-gray-50"
                            : limited
                            ? "bg-amber-50"
                            : "bg-emerald-50"
                        }`}
                      >

                        <div className="flex items-center gap-2">

                          <Users
                            size={16}
                            className={
                              soldOut
                                ? "text-gray-500"
                                : limited
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }
                          />

                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Seats
                          </span>

                        </div>

                        <p
                          className={`mt-2 text-sm font-extrabold ${
                            soldOut
                              ? "text-gray-500"
                              : limited
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >

                          {soldOut
                            ? "Sold out"
                            : `${available} available`}

                        </p>

                      </div>

                      {/* CAPACITY */}

                      <div className="rounded-2xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2">

                          <Users
                            size={16}
                            className="text-teal-700"
                          />

                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Capacity
                          </span>

                        </div>

                        <p className="mt-2 text-sm font-extrabold text-gray-800">
                          {total} passengers
                        </p>

                      </div>

                      {/* DEPARTURE */}

                      <div className="rounded-2xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2">

                          <Clock
                            size={16}
                            className="text-teal-700"
                          />

                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Departure
                          </span>

                        </div>

                        <p className="mt-2 text-sm font-extrabold text-gray-800">
                          {bus.departure}
                        </p>

                      </div>

                    </div>

                    {/* =========================================
                        SEAT STATUS EXPLANATION
                    ========================================= */}

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4">

                      <p className="text-xs font-semibold text-gray-400">
                        Seat information
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        {available} available

                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">

                        <span className="h-2 w-2 rounded-full bg-amber-500" />

                        {pending} pending

                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">

                        <span className="h-2 w-2 rounded-full bg-gray-400" />

                        {booked} booked

                      </div>

                    </div>

                    {/* =========================================
                        DRIVER CONTACT
                    ========================================= */}

                    {bus.driverPhone && (
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">

                            <Phone
                              size={16}
                              className="text-teal-700"
                            />

                          </div>

                          <div>

                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Driver contact
                            </p>

                            <p className="mt-0.5 text-sm font-bold text-gray-800">
                              {bus.driverPhone}
                            </p>

                          </div>

                        </div>

                        <a
                          href={`tel:${bus.driverPhone}`}
                          className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-teal-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-teal-50"
                        >
                          Call
                        </a>

                      </div>
                    )}

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>

    </main>
  );
}

