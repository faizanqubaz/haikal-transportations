
"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bus,
  Clock3,
  MapPin,
  Users,
  X,
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";

import type { BusAvailability } from "@/libs/availability";
import SeatMap from "./SeatMap";

const haikal_bus = "/images/route-terraces.jpg";

type Props = {
  bus: BusAvailability;
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

export default function AvailabilityCard({ bus }: Props) {
  const [showSeats, setShowSeats] = useState(false);

  // Latest bus data from MongoDB
  const [currentBus, setCurrentBus] = useState<BusAvailability>(bus);

  const [loadingSeats, setLoadingSeats] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);

  const [bookingReference, setBookingReference] = useState<string | null>(
    null
  );

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const [passenger, setPassenger] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const totalFare = currentBus.price * selectedSeats.length;

  // --------------------------------------------------
  // LOAD LATEST SEAT DATA
  // --------------------------------------------------


const handleViewSeats = async () => {
  if (showSeats) {
    setShowSeats(false);
    return;
  }

  try {
    setLoadingSeats(true);
    setSubmitError(null);
    setSelectedSeats([]);

    console.log("FETCHING LATEST BUS:", bus.id);

    const res = await fetch(`/api/busses/${bus.id}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    console.log("LATEST BUS RESPONSE:", data);

    if (!res.ok) {
      throw new Error(
        data.error || "Unable to load latest seat availability."
      );
    }

    if (!data.bus) {
      throw new Error("Bus data was not returned.");
    }

    setCurrentBus(data.bus);
    setSelectedSeats([]);
    setShowSeats(true);
  } catch (error) {
    console.error("VIEW_SEATS_ERROR:", error);

    setSubmitError(
      error instanceof Error
        ? error.message
        : "Unable to load seat availability."
    );
  } finally {
    setLoadingSeats(false);
  }
};



  // --------------------------------------------------
  // CONTINUE TO BOOKING MODAL
  // --------------------------------------------------

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;

    setSubmitError(null);
    setShowBookingModal(true);
  };

  // --------------------------------------------------
  // CONFIRM BOOKING
  // --------------------------------------------------

  const handleConfirm = async () => {
    if (
      !passenger.name.trim() ||
      !passenger.email.trim() ||
      !passenger.phone.trim()
    ) {
      setSubmitError("Please complete all passenger information.");
      return;
    }

    if (selectedSeats.length === 0) {
      setSubmitError("Please select at least one seat.");
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
          },

          busId: currentBus.id,

          seats: selectedSeats,
        }),
      });

      const data: BookingResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Unable to create your booking request."
        );
      }

      if (data.booking?.bookingReference) {
        setBookingReference(data.booking.bookingReference);
      } else if (data.booking?._id) {
        setBookingReference(data.booking._id);
      }

      setSubmitted(true);
    } catch (error) {
      console.error("BOOKING ERROR:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // CLOSE SUCCESS SCREEN
  // --------------------------------------------------

  const handleCloseSuccess = () => {
    setShowBookingModal(false);
    setSubmitted(false);
    setBookingReference(null);

    setPassenger({
      name: "",
      email: "",
      phone: "",
    });

    setSelectedSeats([]);
    setSubmitError(null);

    // Close seat map as well
    setShowSeats(false);
  };

  return (
    <>
      {/* ==================================================
          BUS CARD
      ================================================== */}

      <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-xl">
        {/* ==================================================
            BUS IMAGE
        ================================================== */}

        <div className="relative h-52 overflow-hidden sm:h-64">
          <img
            src={haikal_bus}
            alt={currentBus.busNumber}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <div className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow-lg">
            {currentBus.busNumber}
          </div>

          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-xs font-bold text-white">
            <Users size={14} />

            {currentBus.availableSeats} seats available
          </div>

          <div className="absolute bottom-5 left-5 text-white">
            <p className="text-xs font-medium text-white/70">
              {currentBus.company}
            </p>

            <h3 className="mt-1 text-xl font-bold sm:text-2xl">
              {currentBus.route}
            </h3>
          </div>
        </div>

        {/* ==================================================
            DETAILS
        ================================================== */}

        <div className="p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {/* Departure */}

            <div>
              <p className="text-xs font-semibold text-gray-400">
                DEPARTURE
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {currentBus.departure}
              </p>

              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />

                {currentBus.pickup}
              </div>
            </div>

            {/* Duration */}

            <div>
              <p className="text-xs font-semibold text-gray-400">
                DURATION
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {currentBus.duration}
              </p>

              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Clock3 size={12} />

                Direct journey
              </div>
            </div>

            {/* Arrival */}

            <div>
              <p className="text-xs font-semibold text-gray-400">
                ARRIVAL
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {currentBus.arrival}
              </p>

              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />

                {currentBus.dropoff}
              </div>
            </div>
          </div>

          {/* ==================================================
              PRICE / SEATS
          ================================================== */}

          <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Fare per passenger
              </p>

              <p className="text-2xl font-bold text-gray-900">
                Rs. {currentBus.price.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleViewSeats}
                disabled={loadingSeats}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSeats
                  ? "Loading seats..."
                  : showSeats
                    ? "Hide seats"
                    : "View seats"}
              </button>

              <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={handleContinue}
                className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Continue

                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* ==================================================
              SEAT MAP
          ================================================== */}

          {showSeats && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <SeatMap
                key={`${currentBus.id}-${currentBus.seats
                  .map((seat) => `${seat.seatNumber}-${seat.status}`)
                  .join("|")}`}
                seats={currentBus.seats}
                onSeatChange={setSelectedSeats}
              />
            </div>
          )}
        </div>
      </article>

      {/* ==================================================
          BOOKING MODAL
      ================================================== */}

      {showBookingModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 backdrop-blur-md sm:p-6"
          onClick={() => {
            if (!submitting) {
              setShowBookingModal(false);
            }
          }}
        >
          {/* ==================================================
              PENDING / SUCCESS SCREEN
          ================================================== */}

          {submitted ? (
            <div
              onClick={(e) => e.stopPropagation()}
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
                  Thank you for choosing Haikal Tours. Your booking
                  request has been successfully received.
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

                <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                      <Bus
                        size={19}
                        className="text-teal-700"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {currentBus.busNumber}
                      </p>

                      <p className="text-xs text-gray-500">
                        {currentBus.company}
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
                        {currentBus.pickup} → {currentBus.dropoff}
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
                        {selectedSeats.join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <CalendarDays
                      size={17}
                      className="shrink-0 text-teal-700"
                    />

                    <div>
                      <p className="text-xs text-gray-400">
                        DEPARTURE
                      </p>

                      <p className="text-sm font-bold text-gray-900">
                        {currentBus.departure}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4">
                    <span className="text-sm font-medium text-gray-500">
                      Total Fare
                    </span>

                    <span className="text-xl font-bold text-teal-700">
                      Rs. {totalFare.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left">
                  <Clock
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <p className="text-xs leading-5 text-amber-800">
                    Your booking is currently pending. Haikal Tours
                    will review your request and approve it before
                    your seats are confirmed.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <ShieldCheck size={14} />

                  Your booking information has been securely submitted.
                </div>

                <button
                  type="button"
                  onClick={handleCloseSuccess}
                  className="mt-6 w-full rounded-xl bg-[#063d43] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#052f34]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[90vh]"
            >
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
                  onClick={() => setShowBookingModal(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-5 sm:p-7">
                <div className="grid gap-6 lg:grid-cols-2">
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
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Full Name
                        </label>

                        <input
                          type="text"
                          value={passenger.name}
                          disabled={submitting}
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

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Email Address
                        </label>

                        <input
                          type="email"
                          value={passenger.email}
                          disabled={submitting}
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

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Phone Number
                        </label>

                        <input
                          type="tel"
                          value={passenger.phone}
                          disabled={submitting}
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

                  <div className="rounded-2xl bg-gray-50 p-4 sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                        <Bus
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
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                          BUS NUMBER
                        </label>

                        <input
                          disabled
                          value={currentBus.busNumber}
                          className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                          DRIVER PHONE
                        </label>

                        <input
                          disabled
                          value={currentBus.driverPhone}
                          className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                          BOOKED SEAT
                          {selectedSeats.length > 1 ? "S" : ""}
                        </label>

                        <input
                          disabled
                          value={selectedSeats.join(", ")}
                          className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                          ROUTE
                        </label>

                        <input
                          disabled
                          value={`${currentBus.pickup} → ${currentBus.dropoff}`}
                          className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400">
                          DEPARTURE
                        </label>

                        <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3">
                          <CalendarDays
                            size={15}
                            className="text-teal-700"
                          />

                          <span className="text-sm font-semibold text-gray-600">
                            {currentBus.departure}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">
                            Total Fare
                          </span>

                          <span className="text-xl font-bold text-teal-700">
                            Rs. {totalFare.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-center text-xs text-gray-400 sm:text-left">
                  Your information will be securely sent to Haikal Tours.
                </p>

                <div className="flex w-full gap-3 sm:w-auto">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowBookingModal(false)}
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
                      selectedSeats.length === 0 ||
                      submitting
                    }
                    onClick={handleConfirm}
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

                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

