
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
  X,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import SeatMap from "@/components/avaialibility/SeatMap";



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

type BookingResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  booking?: {
    _id?: string;
    bookingReference?: string;
    status?: string;
  };
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
     SEAT STATES
  ======================================================= */

  const [expandedBusId, setExpandedBusId] = useState<string | null>(
    null
  );

  const [loadingSeatsBusId, setLoadingSeatsBusId] = useState<
    string | null
  >(null);

  const [selectedSeats, setSelectedSeats] = useState<
    Record<string, string[]>
  >({});

  /* =======================================================
     BOOKING MODAL STATES
  ======================================================= */

  const [showBookingModal, setShowBookingModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(
    null
  );

  const [submitted, setSubmitted] = useState(false);

  const [bookingReference, setBookingReference] = useState<
    string | null
  >(null);

  const [passenger, setPassenger] = useState({
    name: "",
    email: "",
    phone: "",
  });

  /* =======================================================
     CURRENT BOOKING BUS
  ======================================================= */

  const bookingBus = useMemo(() => {
    if (!expandedBusId) return null;

    return (
      buses.find((bus) => bus._id === expandedBusId) ?? null
    );
  }, [buses, expandedBusId]);

  const bookingSelectedSeats = bookingBus
    ? selectedSeats[bookingBus._id] ?? []
    : [];

  const totalFare = bookingBus
    ? bookingBus.price * bookingSelectedSeats.length
    : 0;

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

    /*
     * Close any previously opened seat map
     */
    setExpandedBusId(null);

    setSelectedSeats({});

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

      console.log("BUS SEARCH RESPONSE:", data);

      setBuses(data.buses ?? []);
    } catch (err) {
      console.error("BUS SEARCH ERROR:", err);

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
     VIEW / HIDE SEATS
  ======================================================= */


async function handleViewSeats(bus: Bus) {
  /*
   * If this bus is already expanded,
   * hide the seat map.
   */
  if (expandedBusId === bus._id) {
    setExpandedBusId(null);

    setSelectedSeats((current) => ({
      ...current,
      [bus._id]: [],
    }));

    return;
  }

  try {
    setLoadingSeatsBusId(bus._id);
    setSubmitError(null);

    console.log(
      "FETCHING LATEST BUS:",
      bus._id
    );

    const res = await fetch(
      `/api/busses/${bus._id}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await res.json();

    console.log(
      "LATEST BUS RESPONSE:",
      data
    );

    if (!res.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Unable to load latest seat availability."
      );
    }

    if (!data.bus) {
      throw new Error(
        "Bus data was not returned."
      );
    }

    /*
     * IMPORTANT:
     *
     * Your API returns:
     *
     * {
     *   id: "6a9...",
     *   busNumber: "ht-101",
     *   seats: [...]
     * }
     *
     * But the BookingPage uses `_id`.
     *
     * Normalize `id` -> `_id`.
     */
    const latestBus: Bus = {
      ...data.bus,
      _id: data.bus._id ?? data.bus.id,
    };

    /*
     * Make sure we actually received an ID.
     */
    if (!latestBus._id) {
      throw new Error(
        "Bus ID was not returned by the server."
      );
    }

    console.log(
      "NORMALIZED BUS:",
      latestBus
    );

    console.log(
      "NORMALIZED BUS ID:",
      latestBus._id
    );

    /*
     * Update the bus inside the search results.
     */
    setBuses((currentBuses) =>
      currentBuses.map((currentBus) =>
        currentBus._id === latestBus._id
          ? latestBus
          : currentBus
      )
    );

    /*
     * Clear previously selected seats
     * for this bus.
     */
    setSelectedSeats((current) => ({
      ...current,
      [latestBus._id]: [],
    }));

    /*
     * NOW expand the correct bus.
     */
    setExpandedBusId(latestBus._id);
  } catch (err) {
    console.error(
      "VIEW_SEATS_ERROR:",
      err
    );

    setSubmitError(
      err instanceof Error
        ? err.message
        : "Unable to load seat availability."
    );
  } finally {
    setLoadingSeatsBusId(null);
  }
}



  /* =======================================================
     SEAT SELECTION
  ======================================================= */

  function handleSeatChange(
    busId: string,
    seats: string[]
  ) {
    setSelectedSeats((current) => ({
      ...current,
      [busId]: seats,
    }));
  }

  /* =======================================================
     CONTINUE TO BOOKING
  ======================================================= */

  function handleContinue(bus: Bus) {
    const seats = selectedSeats[bus._id] ?? [];

    if (seats.length === 0) {
      return;
    }

    setSubmitError(null);

    setExpandedBusId(bus._id);

    setShowBookingModal(true);
  }

  /* =======================================================
     CONFIRM BOOKING
  ======================================================= */

  async function handleConfirm() {
    if (
      !passenger.name.trim() ||
      !passenger.email.trim() ||
      !passenger.phone.trim()
    ) {
      setSubmitError(
        "Please complete all passenger information."
      );

      return;
    }

    if (!bookingBus) {
      setSubmitError(
        "Bus information is missing."
      );

      return;
    }

    const seats =
      selectedSeats[bookingBus._id] ?? [];

    if (seats.length === 0) {
      setSubmitError(
        "Please select at least one seat."
      );

      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(
        "/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            passenger: {
              name: passenger.name.trim(),
              email: passenger.email.trim(),
              phone: passenger.phone.trim(),
            },

            busId: bookingBus._id,

            seats,
          }),
        }
      );

      const data: BookingResponse =
        await res.json();

      console.log(
        "BOOKING RESPONSE:",
        data
      );

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to create your booking request."
        );
      }

      if (
        data.booking?.bookingReference
      ) {
        setBookingReference(
          data.booking.bookingReference
        );
      } else if (
        data.booking?._id
      ) {
        setBookingReference(
          data.booking._id
        );
      }

      /*
       * Mark booking as successfully submitted.
       */
      setSubmitted(true);
    } catch (error) {
      console.error(
        "BOOKING ERROR:",
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your booking."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     CLOSE SUCCESS
  ======================================================= */

  function handleCloseSuccess() {
    setShowBookingModal(false);

    setSubmitted(false);

    setBookingReference(null);

    setPassenger({
      name: "",
      email: "",
      phone: "",
    });

    if (bookingBus) {
      setSelectedSeats((current) => ({
        ...current,
        [bookingBus._id]: [],
      }));
    }

    setSubmitError(null);

    setExpandedBusId(null);

    /*
     * Refresh search results so the latest seat
     * information is displayed.
     */
    if (pickup && dropoff && date) {
      runSearch(
        pickup,
        dropoff,
        date
      );
    }
  }

  /* =======================================================
     CLOSE BOOKING MODAL
  ======================================================= */

  function closeBookingModal() {
    if (submitting) return;

    setShowBookingModal(false);

    setSubmitError(null);
  }

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

            {/* FROM */}

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

            {/* DESKTOP SWAP */}

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

            {/* TO */}

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

            {/* DATE */}

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

            {/* SEARCH */}

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

          {/* MOBILE SWAP */}

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

        {/* SEARCH SUMMARY */}

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

        {/* LOADING */}

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

          /* ERROR */

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

          /* BEFORE SEARCH */

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

          /* NO RESULTS */

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

              const busSelectedSeats =
                selectedSeats[bus._id] ?? [];

              const isExpanded =
                expandedBusId === bus._id;

              const isLoadingSeats =
                loadingSeatsBusId === bus._id;

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

                          <div className="min-w-[75px]">

                            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                              {bus.departure}
                            </p>

                            <p className="mt-1 text-xs font-bold text-gray-500">
                              {bus.pickup}
                            </p>

                          </div>

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

                      {/* AVAILABLE */}

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
                        SEAT STATUS
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

                    {/* =========================================
                        VIEW / HIDE + CONTINUE
                    ========================================= */}

                    <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        {busSelectedSeats.length > 0 ? (
                          <p className="text-sm font-semibold text-teal-700">

                            {busSelectedSeats.length}{" "}
                            {busSelectedSeats.length === 1
                              ? "seat"
                              : "seats"}{" "}
                            selected

                            <span className="ml-2 text-gray-400">
                              ({busSelectedSeats.join(", ")})
                            </span>

                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">
                            Select your seats to continue
                          </p>
                        )}

                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">

                        {/* VIEW / HIDE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleViewSeats(bus)
                          }
                          disabled={
                            soldOut ||
                            isLoadingSeats
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          {isLoadingSeats ? (
                            <>
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />

                              Loading seats...
                            </>
                          ) : isExpanded ? (
                            <>
                              <Users size={17} />

                              Hide seats
                            </>
                          ) : (
                            <>
                              <Users size={17} />

                              View seats
                            </>
                          )}

                        </button>

                        {/* CONTINUE */}

                        <button
                          type="button"
                          disabled={
                            busSelectedSeats.length ===
                              0 ||
                            soldOut
                          }
                          onClick={() =>
                            handleContinue(bus)
                          }
                          className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >

                          Continue

                          <ArrowRight
                            size={17}
                          />

                        </button>

                      </div>

                    </div>

                    {/* =========================================
                        SEAT MAP
                    ========================================= */}

                    {isExpanded && (
                      <div className="mt-6 border-t border-gray-100 pt-6">

                        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <h4 className="text-base font-extrabold text-gray-900">
                              Select your seats
                            </h4>

                            <p className="mt-1 text-xs text-gray-500">
                              Choose one or more available seats.
                            </p>

                          </div>

                          {busSelectedSeats.length >
                            0 && (
                            <div className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">

                              {busSelectedSeats.length} selected

                            </div>
                          )}

                        </div>

                        <SeatMap
                          key={`${bus._id}-${bus.seats
                            .map(
                              (seat) =>
                                `${seat.seatNumber}-${seat.status}`
                            )
                            .join("|")}`}
                          seats={bus.seats}
                          onSeatChange={(seats) =>
                            handleSeatChange(
                              bus._id,
                              seats
                            )
                          }
                        />

                        {/* SEAT MAP BOTTOM CONTINUE */}

                        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                              Your selection
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-900">

                              {busSelectedSeats.length ===
                              0
                                ? "No seats selected"
                                : busSelectedSeats.join(
                                    ", "
                                  )}

                            </p>

                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                            {busSelectedSeats.length >
                              0 && (
                              <div className="text-left sm:text-right">

                                <p className="text-xs text-gray-500">
                                  Total fare
                                </p>

                                <p className="text-xl font-extrabold text-teal-800">
                                  {formatPKR(
                                    bus.price *
                                      busSelectedSeats.length
                                  )}
                                </p>

                              </div>
                            )}

                            <button
                              type="button"
                              disabled={
                                busSelectedSeats.length ===
                                0
                              }
                              onClick={() =>
                                handleContinue(
                                  bus
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >

                              Continue to booking

                              <ArrowRight
                                size={17}
                              />

                            </button>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>

      {/* =====================================================
          BOOKING MODAL
      ===================================================== */}

      {showBookingModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 backdrop-blur-md sm:p-6"
          onClick={() => {
            if (!submitting) {
              closeBookingModal();
            }
          }}
        >

          {/* =================================================
              SUCCESS
          ================================================= */}

          {submitted ? (

            <div
              onClick={(e) =>
                e.stopPropagation()
              }
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            >

              <div className="h-2 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500" />

              <div className="p-6 text-center sm:p-8">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">

                    <CheckCircle2
                      size={32}
                      className="text-teal-700"
                    />

                  </div>

                </div>

                <p className="mt-6 text-xs font-bold tracking-[0.2em] text-teal-700">
                  HAIKAL TOURS
                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Booking Request Sent
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                  Thank you for choosing Haikal Tours.
                  Your booking request has been successfully
                  received.
                </p>

                <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-amber-50 px-4 py-2">

                  <Clock
                    size={16}
                    className="text-amber-600"
                  />

                  <span className="text-sm font-bold text-amber-700">
                    Booking Pending
                  </span>

                </div>

                {bookingReference && (
                  <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">

                    <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400">
                      BOOKING REFERENCE
                    </p>

                    <p className="mt-1 text-lg font-bold tracking-wider text-gray-900">
                      {bookingReference}
                    </p>

                  </div>
                )}

                {bookingBus && (
                  <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-left">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">

                        <BusIcon
                          size={19}
                          className="text-teal-700"
                        />

                      </div>

                      <div>

                        <p className="text-sm font-bold text-gray-900">
                          {bookingBus.busNumber}
                        </p>

                        <p className="text-xs text-gray-500">
                          {bookingBus.company}
                        </p>

                      </div>

                    </div>

                    <div className="mt-5 flex items-center gap-3">

                      <MapPin
                        size={17}
                        className="shrink-0 text-teal-700"
                      />

                      <div>

                        <p className="text-xs text-gray-400">
                          ROUTE
                        </p>

                        <p className="text-sm font-bold text-gray-900">
                          {bookingBus.pickup} →{" "}
                          {bookingBus.dropoff}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 flex items-center gap-3">

                      <Users
                        size={17}
                        className="shrink-0 text-teal-700"
                      />

                      <div>

                        <p className="text-xs text-gray-400">
                          SELECTED SEATS
                        </p>

                        <p className="text-sm font-bold text-gray-900">
                          {bookingSelectedSeats.join(
                            ", "
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 flex items-center gap-3">

                      <Calendar
                        size={17}
                        className="shrink-0 text-teal-700"
                      />

                      <div>

                        <p className="text-xs text-gray-400">
                          TRAVEL DATE
                        </p>

                        <p className="text-sm font-bold text-gray-900">
                          {formatShortDate(
                            bookingBus.date
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 flex items-center gap-3">

                      <Clock
                        size={17}
                        className="shrink-0 text-teal-700"
                      />

                      <div>

                        <p className="text-xs text-gray-400">
                          DEPARTURE
                        </p>

                        <p className="text-sm font-bold text-gray-900">
                          {bookingBus.departure}
                        </p>

                      </div>

                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4">

                      <span className="text-sm font-medium text-gray-500">
                        Total Fare
                      </span>

                      <span className="text-xl font-bold text-teal-700">
                        {formatPKR(
                          totalFare
                        )}
                      </span>

                    </div>

                  </div>
                )}

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left">

                  <Clock
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <p className="text-xs leading-5 text-amber-800">
                    Your booking is currently pending.
                    Haikal Tours will review your request
                    and approve it before your seats are
                    confirmed.
                  </p>

                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">

                  <ShieldCheck size={14} />

                  Your booking information has been
                  securely submitted.

                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseSuccess
                  }
                  className="mt-6 w-full rounded-xl bg-[#063d43] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#052f34]"
                >
                  Done
                </button>

              </div>

            </div>

          ) : (

            /* =================================================
               PASSENGER FORM
            ================================================= */

            <div
              onClick={(e) =>
                e.stopPropagation()
              }
              className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[90vh]"
            >

              {/* HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-7 sm:py-5">

                <div>

                  <p className="text-xs font-bold tracking-[0.2em] text-teal-700">
                    BOOK YOUR TRIP
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                    Passenger Information
                  </h2>

                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={
                    closeBookingModal
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <X size={20} />

                </button>

              </div>

              {/* BODY */}

              <div className="overflow-y-auto p-5 sm:p-7">

                <div className="grid gap-6 lg:grid-cols-2">

                  {/* =========================================
                      PASSENGER
                  ========================================= */}

                  <div>

                    <div className="mb-5">

                      <h3 className="text-lg font-bold text-gray-900">
                        Your Information
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Please enter your basic information.
                      </p>

                    </div>

                    <div className="space-y-4">

                      {/* NAME */}

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Full Name
                        </label>

                        <input
                          type="text"
                          value={
                            passenger.name
                          }
                          disabled={
                            submitting
                          }
                          onChange={(e) =>
                            setPassenger({
                              ...passenger,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter your full name"
                          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                        />

                      </div>

                      {/* EMAIL */}

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Email Address
                        </label>

                        <input
                          type="email"
                          value={
                            passenger.email
                          }
                          disabled={
                            submitting
                          }
                          onChange={(e) =>
                            setPassenger({
                              ...passenger,
                              email: e.target.value,
                            })
                          }
                          placeholder="you@example.com"
                          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                        />

                      </div>

                      {/* PHONE */}

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Phone Number
                        </label>

                        <input
                          type="tel"
                          value={
                            passenger.phone
                          }
                          disabled={
                            submitting
                          }
                          onChange={(e) =>
                            setPassenger({
                              ...passenger,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+92 300 1234567"
                          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                        />

                      </div>

                      {submitError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                          <p className="text-sm font-medium text-red-700">
                            {submitError}
                          </p>

                        </div>
                      )}

                    </div>

                  </div>

                  {/* =========================================
                      TRIP DETAILS
                  ========================================= */}

                  {bookingBus && (
                    <div className="rounded-2xl bg-gray-50 p-4 sm:p-5">

                      <div className="mb-5 flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">

                          <BusIcon
                            size={20}
                            className="text-teal-700"
                          />

                        </div>

                        <div>

                          <h3 className="font-bold text-gray-900">
                            Trip Details
                          </h3>

                          <p className="text-xs text-gray-500">
                            Your selected trip
                          </p>

                        </div>

                      </div>

                      <div className="space-y-3">

                        {/* BUS */}

                        <div>

                          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                            BUS NUMBER
                          </label>

                          <input
                            disabled
                            value={
                              bookingBus.busNumber
                            }
                            className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                          />

                        </div>

                        {/* DRIVER */}

                        <div>

                          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                            DRIVER PHONE
                          </label>

                          <input
                            disabled
                            value={
                              bookingBus.driverPhone ||
                              "Not available"
                            }
                            className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                          />

                        </div>

                        {/* SEATS */}

                        <div>

                          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                            BOOKED SEAT
                            {bookingSelectedSeats.length >
                            1
                              ? "S"
                              : ""}
                          </label>

                          <input
                            disabled
                            value={bookingSelectedSeats.join(
                              ", "
                            )}
                            className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                          />

                        </div>

                        {/* ROUTE */}

                        <div>

                          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                            ROUTE
                          </label>

                          <input
                            disabled
                            value={`${bookingBus.pickup} → ${bookingBus.dropoff}`}
                            className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                          />

                        </div>

                        {/* DATE */}

                        <div>

                          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                            TRAVEL DATE
                          </label>

                          <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3">

                            <Calendar
                              size={15}
                              className="text-teal-700"
                            />

                            <span className="text-sm font-semibold text-gray-600">
                              {formatShortDate(
                                bookingBus.date
                              )}
                            </span>

                          </div>

                        </div>

                        {/* DEPARTURE */}

                        <div>

                          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                            DEPARTURE
                          </label>

                          <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3">

                            <Clock
                              size={15}
                              className="text-teal-700"
                            />

                            <span className="text-sm font-semibold text-gray-600">
                              {bookingBus.departure}
                            </span>

                          </div>

                        </div>

                        {/* FARE */}

                        <div className="border-t border-gray-200 pt-3">

                          <div className="flex items-center justify-between">

                            <span className="text-sm font-medium text-gray-500">
                              Total Fare
                            </span>

                            <span className="text-xl font-bold text-teal-700">
                              {formatPKR(
                                totalFare
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">

                <p className="text-center text-xs text-gray-400 sm:text-left">
                  Your information will be securely sent
                  to Haikal Tours.
                </p>

                <div className="flex w-full gap-3 sm:w-auto">

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={
                      closeBookingModal
                    }
                    className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      !passenger.name.trim() ||
                      !passenger.email.trim() ||
                      !passenger.phone.trim() ||
                      bookingSelectedSeats.length ===
                        0 ||
                      submitting
                    }
                    onClick={
                      handleConfirm
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:bg-gray-300 sm:flex-none"
                  >

                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Sending Request...
                      </>
                    ) : (
                      <>
                        Confirm Booking

                        <ArrowRight
                          size={17}
                        />
                      </>
                    )}

                  </button>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </main>
  );
}

