"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
  Loader2,
  XCircle,
  Clock,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type BusDetails = {
  id: string;
  busNumber: string;
  company: string;
  pickup: string;
  dropoff: string;
  route: string;
  date: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  capacity: number;
  availableSeats: number;
  pendingSeats: number;
  bookedSeats: number;
};

type Booking = {
  _id: string;
  bookingRef: string;
  passengerName: string;
  passengerEmail?: string;
  passengerPhone?: string;
  route?: string;
  seats: string[];
  travelDate: string;
  travelTime?: string;
  status: string;
};

type Pagination = {
  page: number;
  limit: number;
  totalBookings: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export default function TodayTripDetailsPage() {
  const params = useParams();

  const busId =
    typeof params.busId === "string"
      ? params.busId
      : "";

  const [bus, setBus] =
    useState<BusDetails | null>(null);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [search, setSearch] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // FETCH DATA
  // ============================================================

  const loadTrip = useCallback(
    async (
      page = 1,
      searchValue = search
    ) => {
      if (!busId) return;

      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set("limit", "10");

        if (searchValue.trim()) {
          params.set(
            "search",
            searchValue.trim()
          );
        }

        const res = await fetch(
          `/api/trips/today/${busId}?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
              "Failed to load trip"
          );
        }

        setBus(data.bus);
        setBookings(
          data.bookings || []
        );
        setPagination(
          data.pagination
        );
      } catch (err: any) {
        console.error(
          "TRIP DETAILS ERROR:",
          err
        );

        setError(
          err.message ||
            "Failed to load trip"
        );
      } finally {
        setLoading(false);
      }
    },
    [busId, search]
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadTrip(1, "");
  }, [busId]);

  // ============================================================
  // SEARCH
  // ============================================================

  function handleSearch(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSearch(searchInput);

    loadTrip(1, searchInput);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");

    loadTrip(1, "");
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  function goToPage(page: number) {
    if (!pagination) return;

    if (
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    loadTrip(page, search);
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading && !bus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f9]">
        <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading trip...
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error && !bus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f9] p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <XCircle
            size={40}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-lg font-black text-gray-900">
            Unable to load trip
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <Link
            href="/admin/dashboard"
            className="mt-5 inline-flex rounded-xl bg-[#063d43] px-5 py-3 text-sm font-bold text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!bus) return null;

  const occupancy =
    bus.capacity > 0
      ? Math.min(
          (bus.bookedSeats /
            bus.capacity) *
            100,
          100
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#f7f9f9]">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <p className="text-xs font-bold text-teal-700">
                Today's Trip
              </p>

              <h1 className="text-xl font-black text-gray-900">
                {bus.busNumber}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* ====================================================
            BUS INFORMATION
        ===================================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                  <Bus
                    size={22}
                    className="text-teal-700"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {bus.busNumber}
                  </h2>

                  <p className="text-xs text-gray-400">
                    {bus.company}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin
                    size={15}
                    className="text-teal-700"
                  />
                  {bus.route}
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-teal-700"
                  />
                  {bus.date}
                </div>

                <div className="flex items-center gap-2">
                  <Clock3
                    size={15}
                    className="text-teal-700"
                  />
                  {bus.departure}
                  {" → "}
                  {bus.arrival}
                </div>
              </div>
            </div>

            {/* SEAT SUMMARY */}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
                <p className="text-lg font-black text-gray-900">
                  {bus.capacity}
                </p>

                <p className="text-[10px] font-bold text-gray-400">
                  Capacity
                </p>
              </div>

              <div className="rounded-xl bg-teal-50 px-4 py-3 text-center">
                <p className="text-lg font-black text-teal-700">
                  {bus.bookedSeats}
                </p>

                <p className="text-[10px] font-bold text-teal-600">
                  Booked
                </p>
              </div>

              <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
                <p className="text-lg font-black text-green-700">
                  {bus.availableSeats}
                </p>

                <p className="text-[10px] font-bold text-green-600">
                  Available
                </p>
              </div>
            </div>
          </div>

          {/* OCCUPANCY */}

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-bold text-gray-500">
                Seat occupancy
              </span>

              <span className="font-black text-gray-700">
                {Math.round(occupancy)}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-teal-700 transition-all"
                style={{
                  width: `${occupancy}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ====================================================
            PASSENGERS
        ===================================================== */}

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* HEADER */}

          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-black text-gray-900">
                  <Users
                    size={19}
                    className="text-teal-700"
                  />
                  Passengers
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  {pagination?.totalBookings ||
                    0}{" "}
                  booking
                  {(pagination?.totalBookings ||
                    0) !== 1
                    ? "s"
                    : ""}{" "}
                  for this trip
                </p>
              </div>

              {/* SEARCH */}

              <form
                onSubmit={handleSearch}
                className="flex w-full max-w-md items-center gap-2"
              >
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-teal-500">
                  <Search
                    size={17}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    value={searchInput}
                    onChange={(e) =>
                      setSearchInput(
                        e.target.value
                      )
                    }
                    placeholder="Search passenger, phone, email..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={
                        clearSearch
                      }
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-[#063d43] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#052f34]"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="px-5 py-4 font-semibold">
                    Passenger
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Contact
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Booking
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Seats
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center"
                    >
                      <Loader2
                        size={22}
                        className="mx-auto animate-spin text-gray-300"
                      />
                    </td>
                  </tr>
                ) : bookings.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center"
                    >
                      <Users
                        size={30}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 text-sm font-bold text-gray-600">
                        {search
                          ? "No passengers found"
                          : "No bookings for this trip"}
                      </p>

                      {search && (
                        <p className="mt-1 text-xs text-gray-400">
                          Try another search.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  bookings.map(
                    (booking) => (
                      <tr
                        key={
                          booking._id
                        }
                        className="border-b border-gray-50 transition hover:bg-teal-50/30"
                      >
                        {/* PASSENGER */}

                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-gray-900">
                            {
                              booking.passengerName
                            }
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">
                            {
                              booking.bookingRef
                            }
                          </p>
                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {booking.passengerPhone && (
                              <p className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone
                                  size={12}
                                />
                                {
                                  booking.passengerPhone
                                }
                              </p>
                            )}

                            {booking.passengerEmail && (
                              <p className="flex max-w-[220px] items-center gap-2 truncate text-xs text-gray-500">
                                <Mail
                                  size={12}
                                />
                                {
                                  booking.passengerEmail
                                }
                              </p>
                            )}
                          </div>
                        </td>

                        {/* BOOKING */}

                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-gray-700">
                            {
                              booking.travelTime ||
                              "-"
                            }
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">
                            {
                              booking.route ||
                              bus.route
                            }
                          </p>
                        </td>

                        {/* SEATS */}

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(
                              booking.seats ||
                              []
                            ).map(
                              (seat) => (
                                <span
                                  key={
                                    seat
                                  }
                                  className="rounded-md bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-700"
                                >
                                  {seat}
                                </span>
                              )
                            )}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          {(
                            booking.status ===
                            "confirmed" ||
                            booking.status ===
                            "approved"
                          ) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-600">
                              <CheckCircle2
                                size={12}
                              />
                              Confirmed
                            </span>
                          ) : booking.status ===
                            "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                              <Clock
                                size={12}
                              />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                              <XCircle
                                size={12}
                              />
                              Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              PAGINATION
          =================================================== */}

          {pagination &&
            pagination.totalBookings >
              0 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-400">
                  Showing{" "}
                  <span className="font-bold text-gray-600">
                    {(
                      (pagination.page -
                        1) *
                        pagination.limit +
                      1
                    )}{" "}
                    -{" "}
                    {Math.min(
                      pagination.page *
                        pagination.limit,
                      pagination.totalBookings
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-600">
                    {
                      pagination.totalBookings
                    }
                  </span>{" "}
                  passengers
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      goToPage(
                        pagination.page -
                          1
                      )
                    }
                    disabled={
                      !pagination.hasPreviousPage ||
                      loading
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  <span className="min-w-[100px] text-center text-xs font-bold text-gray-600">
                    Page{" "}
                    {
                      pagination.page
                    }{" "}
                    of{" "}
                    {
                      pagination.totalPages
                    }
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      goToPage(
                        pagination.page +
                          1
                      )
                    }
                    disabled={
                      !pagination.hasNextPage ||
                      loading
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}