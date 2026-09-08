
"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bus as BusIcon,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Printer,
  Search,
  Users,
  X,
} from "lucide-react";

import type { BusAvailability } from "@/libs/availability";
import SeatMap from "@/components/avaialibility/SeatMap";

type CustomSearch = {
  pickup: string;
  dropoff: string;
  date: string;
  time?: string;
  passengers: number;
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

export default function CustomBookingPage() {
  // =========================================================
  // SEARCH STATE
  // =========================================================

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState(1);

  const [buses, setBuses] = useState<BusAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // BUS / SEAT STATE
  // =========================================================

  const [selectedBus, setSelectedBus] =
    useState<BusAvailability | null>(null);

  const [currentBus, setCurrentBus] =
    useState<BusAvailability | null>(null);

  const [showSeats, setShowSeats] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const [seatError, setSeatError] =
    useState<string | null>(null);

  const [selectedSeats, setSelectedSeats] =
    useState<string[]>([]);

  // =========================================================
  // BOOKING STATE
  // =========================================================

  const [showBookingModal, setShowBookingModal] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);

  const [bookingReference, setBookingReference] =
    useState<string | null>(null);

  // =========================================================
  // PASSENGER
  // =========================================================

  const [passenger, setPassenger] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
  });

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = async () => {
    setError(null);
    setSearched(false);

    if (!pickup.trim()) {
      setError("Please enter pickup location.");
      return;
    }

    if (!destination.trim()) {
      setError("Please enter destination.");
      return;
    }

    if (!date) {
      setError("Please select a travel date.");
      return;
    }

    if (passengers < 1) {
      setError("Passengers must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      const search: CustomSearch = {
        pickup: pickup.trim(),
        dropoff: destination.trim(),
        date,
        time: time || undefined,
        passengers,
      };

      const res = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(search),
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Unable to search for buses."
        );
      }

      setBuses(data.results || []);
      setSearched(true);

      setSelectedBus(null);
      setCurrentBus(null);
      setShowSeats(false);
      setSelectedSeats([]);
      setSeatError(null);
    } catch (err) {
      console.error("BUS SEARCH ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while searching buses."
      );

      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SELECT BUS
  // =========================================================

  const handleSelectBus = (bus: BusAvailability) => {
    setSelectedBus(bus);

    setCurrentBus(null);
    setShowSeats(false);
    setSelectedSeats([]);
    setSeatError(null);
    setSubmitError(null);
  };

  // =========================================================
  // VIEW SEATS
  // =========================================================

  const handleViewSeats = async () => {
    if (!selectedBus) {
      setSeatError("Please select a bus first.");
      return;
    }

    if (showSeats) {
      setShowSeats(false);
      return;
    }

    try {
      setLoadingSeats(true);
      setSeatError(null);
      setSelectedSeats([]);

      const res = await fetch(
        `/api/busses/${selectedBus.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Unable to load latest seat availability."
        );
      }

      if (!data.bus) {
        throw new Error("Bus data was not returned.");
      }

      setCurrentBus(data.bus);
      setSelectedSeats([]);
      setShowSeats(true);
    } catch (err) {
      console.error("VIEW_SEATS_ERROR:", err);

      setSeatError(
        err instanceof Error
          ? err.message
          : "Unable to load seat availability."
      );
    } finally {
      setLoadingSeats(false);
    }
  };

  // =========================================================
  // CONTINUE
  // =========================================================

  const handleContinue = () => {
    if (!selectedBus || !currentBus) {
      setSubmitError("Please select a bus.");
      return;
    }

    if (selectedSeats.length === 0) {
      setSubmitError(
        "Please select at least one available seat."
      );
      return;
    }

    setSubmitError(null);
    setShowBookingModal(true);
  };

  // =========================================================
  // CONFIRM BOOKING
  // =========================================================

  const handleConfirm = async () => {
    if (
      !passenger.name.trim() ||
      !passenger.email.trim() ||
      !passenger.phone.trim() ||
      !passenger.gender
    ) {
      setSubmitError(
        "Please complete all passenger information."
      );
      return;
    }

    if (selectedSeats.length === 0) {
      setSubmitError("Please select at least one seat.");
      return;
    }

    if (!currentBus) {
      setSubmitError("Bus information is missing.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          passenger: {
            name: passenger.name.trim(),
            email: passenger.email.trim(),
            phone: passenger.phone.trim(),
            gender: passenger.gender,
          },

          busId: currentBus.id,
          seats: selectedSeats,
        }),
      });

      const data: BookingResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Unable to create your booking request."
        );
      }

      if (data.booking?.bookingReference) {
        setBookingReference(
          data.booking.bookingReference
        );
      } else if (data.booking?._id) {
        setBookingReference(data.booking._id);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("BOOKING ERROR:", err);

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeBookingModal = () => {
    if (submitting) return;

    setShowBookingModal(false);
    setSubmitted(false);
    setSubmitError(null);
    setBookingReference(null);
  };

  // =========================================================
  // PRINT BOOKING
  // =========================================================

  const handlePrintBooking = () => {
    window.print();
  };

  // =========================================================
  // TOTAL
  // =========================================================

  const totalFare = currentBus
    ? currentBus.price * selectedSeats.length
    : 0;

  // =========================================================
  // FORMAT GENDER
  // =========================================================

  const formattedGender = passenger.gender
    ? passenger.gender.charAt(0).toUpperCase() +
      passenger.gender.slice(1)
    : "N/A";

  return (
    <div className="min-h-full w-full bg-slate-50">
      {/* =====================================================
          PAGE CONTAINER
          ===================================================== */}

      <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        {/* ===================================================
            PAGE HEADER
            =================================================== */}

        <div className="mb-5 sm:mb-7">
          <div className="flex items-start gap-3">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm sm:flex">
              <BusIcon size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                Custom Bus Booking
              </h1>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                Search available buses, choose your seats,
                and create a booking request.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            SEARCH CARD
            =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Search size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Find your bus
                </h2>

                <p className="text-xs text-slate-500">
                  Enter your travel details below
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {/* Pickup */}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Pickup location
                </label>

                <div className="relative">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) =>
                      setPickup(e.target.value)
                    }
                    placeholder="e.g. Islamabad"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />
                </div>
              </div>

              {/* Destination */}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Destination
                </label>

                <div className="relative">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={destination}
                    onChange={(e) =>
                      setDestination(e.target.value)
                    }
                    placeholder="e.g. Lahore"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />
                </div>
              </div>

              {/* Date */}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Travel date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />
                </div>
              </div>

              {/* Time */}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Departure time
                </label>

                <div className="relative">
                  <Clock
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setTime(e.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />
                </div>
              </div>

              {/* Passengers */}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                  Passengers
                </label>

                <div className="relative">
                  <Users
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    min={1}
                    value={passengers}
                    onChange={(e) =>
                      setPassengers(
                        Math.max(
                          1,
                          Number(e.target.value) || 1
                        )
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                  />
                </div>
              </div>
            </div>

            {/* Search error */}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <X
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* Search button */}

            <div className="mt-5 flex">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:min-w-[170px]"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Search Buses
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            SEARCH RESULTS
            =================================================== */}

        {searched && (
          <section className="mt-6 sm:mt-8">
            <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">
                  Available buses
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  {buses.length}{" "}
                  {buses.length === 1
                    ? "bus"
                    : "buses"}{" "}
                  found for your search
                </p>
              </div>

              {buses.length > 0 && (
                <div className="hidden rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 sm:block">
                  {passengers} passenger
                  {passengers !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* No results */}

            {buses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm sm:py-16">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <BusIcon size={28} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
                  No buses found
                </h3>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 sm:text-sm">
                  Try changing your pickup location,
                  destination, date, or departure time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {buses.map((bus) => {
                  const isSelected =
                    selectedBus?.id === bus.id;

                  return (
                    <article
                      key={bus.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                        isSelected
                          ? "border-teal-500 ring-2 ring-teal-100"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      {isSelected && (
                        <div className="flex items-center gap-2 bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
                          <Check size={15} />
                          Bus selected
                        </div>
                      )}

                      <div className="p-4 sm:p-5 lg:p-6">
                        {/* Bus identity */}

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 sm:h-14 sm:w-14">
                              <BusIcon
                                size={24}
                                strokeWidth={1.8}
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                                {bus.busNumber}
                              </h3>

                              <p className="mt-0.5 text-xs text-slate-500">
                                Bus service
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 lg:justify-end">
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              {bus.availableSeats}{" "}
                              seats available
                            </span>
                          </div>
                        </div>

                        {/* Route */}

                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:mt-6 sm:p-5">
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
                            {/* Departure */}

                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                                Departure
                              </p>

                              <p className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
                                {bus.departure}
                              </p>

                              <div className="mt-1 flex items-start gap-1.5">
                                <MapPin
                                  size={13}
                                  className="mt-0.5 shrink-0 text-slate-400"
                                />

                                <p className="truncate text-xs text-slate-500 sm:text-sm">
                                  {bus.pickup}
                                </p>
                              </div>
                            </div>

                            {/* Arrow */}

                            <div className="flex flex-col items-center gap-1">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-white text-teal-700 shadow-sm">
                                <ArrowRight
                                  size={17}
                                />
                              </div>

                              <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
                                Route
                              </span>
                            </div>

                            {/* Arrival */}

                            <div className="min-w-0 text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                                Arrival
                              </p>

                              <p className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
                                {bus.arrival}
                              </p>

                              <div className="mt-1 flex items-start justify-end gap-1.5">
                                <p className="truncate text-xs text-slate-500 sm:text-sm">
                                  {bus.dropoff}
                                </p>

                                <MapPin
                                  size={13}
                                  className="mt-0.5 shrink-0 text-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price + actions */}

                        <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              Fare per seat
                            </p>

                            <p className="mt-0.5 text-xl font-extrabold text-teal-700 sm:text-2xl">
                              Rs.{" "}
                              {bus.price.toLocaleString()}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:flex sm:min-w-[310px] sm:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectBus(bus)
                              }
                              className={`h-11 rounded-xl px-5 text-sm font-bold transition sm:min-w-[140px] ${
                                isSelected
                                  ? "bg-teal-700 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-700"
                              }`}
                            >
                              {isSelected ? (
                                <span className="inline-flex items-center gap-2">
                                  <Check size={16} />
                                  Selected
                                </span>
                              ) : (
                                "Select Bus"
                              )}
                            </button>

                            {isSelected && (
                              <button
                                type="button"
                                onClick={
                                  handleViewSeats
                                }
                                disabled={
                                  loadingSeats
                                }
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[150px]"
                              >
                                {loadingSeats ? (
                                  <>
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                    Loading...
                                  </>
                                ) : showSeats ? (
                                  <>
                                    <X size={17} />
                                    Hide Seats
                                  </>
                                ) : (
                                  <>
                                    <BusIcon
                                      size={17}
                                    />
                                    See Seats
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Seat error */}

                        {isSelected &&
                          seatError && (
                            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700 sm:text-sm">
                              {seatError}
                            </div>
                          )}

                        {/* Seat section */}

                        {isSelected &&
                          showSeats &&
                          currentBus && (
                            <div className="mt-6 border-t border-slate-100 pt-6">
                              <div className="mb-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                                      Choose your seats
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                      Select available seats
                                      for this bus.
                                    </p>
                                  </div>

                                  <div className="shrink-0 rounded-xl bg-teal-50 px-3 py-2 text-center">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">
                                      Selected
                                    </p>

                                    <p className="text-lg font-extrabold text-teal-700">
                                      {
                                        selectedSeats.length
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Seat map */}

                              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
                                <div className="mx-auto min-w-[280px] max-w-full">
                                  <SeatMap
                                    key={`${currentBus.id}-${currentBus.seats
                                      .map(
                                        (seat) =>
                                          `${seat.seatNumber}-${seat.status}-${(seat as any).gender || ""}`
                                      )
                                      .join("|")}`}
                                    seats={
                                      currentBus.seats
                                    }
                                    onSeatChange={
                                      setSelectedSeats
                                    }
                                  />
                                </div>
                              </div>

                              {/* Selected seats summary */}

                              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Selected seats
                                  </p>

                                  <p className="mt-1.5 break-words text-sm font-bold text-slate-900">
                                    {selectedSeats.length >
                                    0
                                      ? selectedSeats.join(
                                          ", "
                                        )
                                      : "No seats selected"}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 sm:min-w-[190px] sm:text-right">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                                    Total fare
                                  </p>

                                  <p className="mt-1 text-xl font-extrabold text-teal-700">
                                    Rs.{" "}
                                    {totalFare.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Continue */}

                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={
                                    handleContinue
                                  }
                                  disabled={
                                    selectedSeats.length ===
                                    0
                                  }
                                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto sm:w-auto sm:min-w-[190px]"
                                >
                                  Continue Booking
                                  <ArrowRight
                                    size={17}
                                  />
                                </button>
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
        )}
      </div>

      {/* =========================================================
          PRINT-ONLY BOOKING RECEIPT
          ========================================================= */}

      {submitted && currentBus && (
        <div
          id="print-booking-receipt"
          className="print-only"
        >
          <div className="print-receipt">
            {/* Header */}

            <div className="print-header">
              <div>
                <h1>Bus Booking Receipt</h1>

                <p>
                  Booking Confirmation
                </p>
              </div>

              <div className="print-status">
                BOOKING REQUEST
              </div>
            </div>

            {/* Reference */}

            <div className="print-reference">
              <span>
                Booking Reference
              </span>

              <strong>
                {bookingReference || "N/A"}
              </strong>
            </div>

            {/* Passenger */}

            <div className="print-section">
              <h2>
                Passenger Information
              </h2>

              <div className="print-grid">
                <div>
                  <span>
                    Passenger Name
                  </span>

                  <strong>
                    {passenger.name || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Gender</span>

                  <strong>
                    {formattedGender}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>

                  <strong>
                    {passenger.phone || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Email</span>

                  <strong>
                    {passenger.email || "N/A"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Journey */}

            <div className="print-section">
              <h2>
                Journey Details
              </h2>

              <div className="print-grid">
                <div>
                  <span>Bus Number</span>

                  <strong>
                    {currentBus.busNumber}
                  </strong>
                </div>

                <div>
                  <span>Travel Date</span>

                  <strong>
                    {date || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Departure</span>

                  <strong>
                    {currentBus.departure ||
                      time ||
                      "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Arrival</span>

                  <strong>
                    {currentBus.arrival || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Pickup Location</span>

                  <strong>
                    {currentBus.pickup ||
                      pickup ||
                      "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Destination</span>

                  <strong>
                    {currentBus.dropoff ||
                      destination ||
                      "N/A"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Seats */}

            <div className="print-section">
              <h2>
                Seat Information
              </h2>

              <div className="print-grid">
                <div>
                  <span>
                    Selected Seats
                  </span>

                  <strong>
                    {selectedSeats.length > 0
                      ? selectedSeats.join(", ")
                      : "N/A"}
                  </strong>
                </div>

                <div>
                  <span>
                    Number of Seats
                  </span>

                  <strong>
                    {selectedSeats.length}
                  </strong>
                </div>
              </div>
            </div>

            {/* Payment */}

            <div className="print-section">
              <h2>
                Payment Information
              </h2>

              <div className="print-grid">
                <div>
                  <span>
                    Fare Per Seat
                  </span>

                  <strong>
                    Rs.{" "}
                    {currentBus.price.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>
                    Total Seats
                  </span>

                  <strong>
                    {selectedSeats.length}
                  </strong>
                </div>

                <div>
                  <span>
                    Total Amount
                  </span>

                  <strong>
                    Rs.{" "}
                    {totalFare.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>
                    Payment Status
                  </span>

                  <strong>
                    Pending
                  </strong>
                </div>
              </div>
            </div>

            {/* Footer */}

            <div className="print-footer">
              <p>
                This booking has been submitted
                for confirmation.
              </p>

              <p>
                Please keep this receipt for
                your records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          BOOKING MODAL
          ========================================================= */}

      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <div className="max-h-[95vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl">
            {!submitted ? (
              <>
                {/* Modal header */}

                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Users size={19} />
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                          Passenger information
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Enter passenger details
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        closeBookingModal
                      }
                      disabled={submitting}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="max-h-[calc(95vh-80px)] overflow-y-auto p-4 sm:max-h-[calc(90vh-90px)] sm:p-6">
                  <div className="space-y-4">
                    {/* Name */}

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Passenger name
                      </label>

                      <input
                        type="text"
                        value={
                          passenger.name
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              name: e.target
                                .value,
                            })
                          )
                        }
                        placeholder="Full name"
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      />
                    </div>

                    {/* Email */}

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Email address
                      </label>

                      <input
                        type="email"
                        value={
                          passenger.email
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              email: e.target
                                .value,
                            })
                          )
                        }
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      />
                    </div>

                    {/* Phone */}

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Phone number
                      </label>

                      <input
                        type="tel"
                        value={
                          passenger.phone
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              phone: e.target
                                .value,
                            })
                          )
                        }
                        placeholder="03XX XXXXXXX"
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      />
                    </div>

                    {/* Gender */}

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
                        Gender
                      </label>

                      <select
                        value={
                          passenger.gender
                        }
                        onChange={(e) =>
                          setPassenger(
                            (prev) => ({
                              ...prev,
                              gender: e.target
                                .value,
                            })
                          )
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                      >
                        <option value="">
                          Select gender
                        </option>

                        <option value="male">
                          Male
                        </option>

                        <option value="female">
                          Female
                        </option>
                      </select>
                    </div>

                    {/* Booking summary */}

                    {currentBus && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <BusIcon
                            size={16}
                            className="text-teal-700"
                          />

                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Booking summary
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Bus
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.busNumber
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Pickup
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.pickup
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Destination
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.dropoff
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Departure
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.departure
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Arrival
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {
                                currentBus.arrival
                              }
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Seats
                            </span>

                            <span className="text-right font-bold text-slate-900">
                              {selectedSeats.join(
                                ", "
                              )}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">
                              Seats count
                            </span>

                            <span className="font-bold text-slate-900">
                              {
                                selectedSeats.length
                              }
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="font-bold text-slate-700">
                              Total
                            </span>

                            <span className="text-xl font-extrabold text-teal-700">
                              Rs.{" "}
                              {totalFare.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error */}

                    {submitError && (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 sm:text-sm">
                        {submitError}
                      </div>
                    )}

                    {/* Confirm */}

                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />

                          Submitting booking...
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          Confirm Booking
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] leading-4 text-slate-400">
                      Your booking request will be
                      submitted for confirmation.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* =================================================
                 SUCCESS
                 ================================================= */

              <div className="px-5 py-10 text-center sm:px-8 sm:py-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2
                    size={34}
                    className="text-emerald-600"
                  />
                </div>

                <h2 className="mt-5 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Booking submitted
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Your booking request has been
                  submitted successfully.
                </p>

                {bookingReference && (
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-teal-100 bg-teal-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                      Booking reference
                    </p>

                    <p className="mt-1 break-all text-lg font-extrabold text-teal-700">
                      {bookingReference}
                    </p>
                  </div>
                )}

                {/* =================================================
                    PRINT + DONE BUTTONS
                    ================================================= */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={
                      handlePrintBooking
                    }
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-teal-600 hover:bg-teal-50 hover:text-teal-700 sm:w-auto sm:min-w-[170px]"
                  >
                    <Printer size={18} />
                    Print Booking
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeBookingModal();
                      setSelectedSeats([]);
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800 sm:w-auto sm:min-w-[140px]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




