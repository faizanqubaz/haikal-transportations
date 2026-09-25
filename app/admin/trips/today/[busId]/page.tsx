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
  Printer,
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
  gender?: string;
  passengerCnic?: string;
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

  const [printLoading, setPrintLoading] =
    useState(false);

  // ============================================================
  // FETCH TRIP DATA
  // ============================================================

  const loadTrip = useCallback(
    async (
      page = 1,
      searchValue = ""
    ) => {
      if (!busId) return;

      try {
        setLoading(true);
        setError("");

        const queryParams =
          new URLSearchParams();

        queryParams.set(
          "page",
          String(page)
        );

        queryParams.set(
          "limit",
          "10"
        );

        if (searchValue.trim()) {
          queryParams.set(
            "search",
            searchValue.trim()
          );
        }

        const res = await fetch(
          `/api/trips/today/${busId}?${queryParams.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

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
          data.pagination || null
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
    [busId]
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!busId) return;

    loadTrip(1, "");
  }, [busId, loadTrip]);

  // ============================================================
  // SEARCH
  // ============================================================

  function handleSearch(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const value =
      searchInput.trim();

    setSearch(value);

    loadTrip(1, value);
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
  // BUILD PRINT HTML
  // ============================================================

  function buildPrintHtml(
    busData: BusDetails,
    rows: Booking[]
  ) {
    const escapeHtml = (
      value:
        | string
        | number
        | undefined
        | null
    ) =>
      String(value ?? "-")
        .replace(
          /&/g,
          "&amp;"
        )
        .replace(
          /</g,
          "&lt;"
        )
        .replace(
          />/g,
          "&gt;"
        )
        .replace(
          /"/g,
          "&quot;"
        )
        .replace(
          /'/g,
          "&#039;"
        );

    // ========================================================
    // STATUS
    // ========================================================

    const statusLabel = (
      status: string
    ) => {
      if (
        status === "confirmed" ||
        status === "approved"
      ) {
        return {
          text: "Confirmed",
          bg: "#dcfce7",
          color: "#166534",
        };
      }

      if (status === "pending") {
        return {
          text: "Pending",
          bg: "#fef3c7",
          color: "#92400e",
        };
      }

      return {
        text: "Rejected",
        bg: "#fee2e2",
        color: "#991b1b",
      };
    };

    // ========================================================
    // PASSENGER ROWS
    // ========================================================

    const bodyRows = rows
      .map(
        (booking, index) => {
          const status =
            statusLabel(
              booking.status
            );

          return `
            <tr>
              <td class="number-cell">
                ${index + 1}
              </td>

              <td class="strong">
                ${escapeHtml(
                  booking.passengerName
                )}
              </td>

              <td>
                ${escapeHtml(
                  booking.passengerPhone
                )}
              </td>

              <td class="email-cell">
                ${escapeHtml(
                  booking.passengerEmail
                )}
              </td>

              <td>
                ${escapeHtml(
                  booking.gender
                )}
              </td>

              <td class="cnic-cell strong">
                ${escapeHtml(
                  booking.passengerCnic
                )}
              </td>

              <td class="seats-cell">
                ${escapeHtml(
                  (
                    booking.seats ||
                    []
                  ).join(", ") ||
                    "-"
                )}
              </td>

              <td class="booking-ref-cell">
                ${escapeHtml(
                  booking.bookingRef
                )}
              </td>

              <td>
                <span
                  class="badge"
                  style="
                    background: ${status.bg};
                    color: ${status.color};
                  "
                >
                  ${status.text}
                </span>
              </td>
            </tr>
          `;
        }
      )
      .join("");

    // ========================================================
    // PRINT DOCUMENT
    // ========================================================

    return `
<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    ${escapeHtml(
      busData.busNumber
    )}
    - Passenger Manifest
  </title>

  <style>

    * {
      box-sizing: border-box;
    }

    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      font-family:
        Arial,
        Helvetica,
        sans-serif;

      color: #111827;

      font-size: 12px;
    }

    /* ========================================================
       HEADER
    ======================================================== */

    .header {
      display: flex;

      justify-content: space-between;

      align-items: flex-start;

      gap: 20px;

      border-bottom:
        3px solid #063d43;

      padding-bottom: 12px;

      margin-bottom: 15px;
    }

    .header-left {
      flex: 1;
      min-width: 0;
    }

    .title {
      margin: 0 0 7px 0;

      color: #063d43;

      font-size: 23px;

      font-weight: 900;

      line-height: 1.2;
    }

    .company {
      margin: 0 0 9px 0;

      font-size: 13px;

      font-weight: 700;

      color: #374151;
    }

    .meta {
      display: flex;

      flex-wrap: wrap;

      gap: 7px 20px;

      font-size: 11px;

      color: #374151;
    }

    .meta-item {
      white-space: nowrap;
    }

    .meta-label {
      font-weight: 800;

      color: #111827;
    }

    .summary {
      min-width: 220px;

      text-align: right;

      font-size: 11px;

      line-height: 1.7;

      color: #374151;
    }

    .summary-title {
      margin: 0 0 2px 0;

      font-size: 16px;

      font-weight: 900;

      color: #063d43;
    }

    .summary strong {
      color: #111827;
    }

    /* ========================================================
       TABLE
    ======================================================== */

    table {
      width: 100%;

      border-collapse: collapse;

      table-layout: auto;

      font-size: 11px;
    }

    thead {
      display: table-header-group;
    }

    thead th {
      background: #063d43;

      color: #ffffff;

      text-align: left;

      padding: 8px 7px;

      font-size: 10px;

      font-weight: 800;

      border:
        1px solid #063d43;

      white-space: nowrap;

      -webkit-print-color-adjust: exact;

      print-color-adjust: exact;
    }

    tbody tr {
      page-break-inside: avoid;
    }

    tbody tr:nth-child(even) {
      background: #f7f9f9;

      -webkit-print-color-adjust: exact;

      print-color-adjust: exact;
    }

    tbody td {
      padding: 7px;

      border:
        1px solid #d1d5db;

      vertical-align: middle;

      font-size: 10.5px;

      line-height: 1.35;

      color: #111827;
    }

    .number-cell {
      width: 30px;

      text-align: center;

      font-weight: 800;
    }

    .strong {
      font-weight: 800;
    }

    .email-cell {
      max-width: 190px;

      word-break: break-word;
    }

    .cnic-cell {
      white-space: nowrap;
    }

    .seats-cell {
      white-space: nowrap;

      font-weight: 700;
    }

    .booking-ref-cell {
      white-space: nowrap;

      font-weight: 700;
    }

    /* ========================================================
       STATUS
    ======================================================== */

    .badge {
      display: inline-block;

      padding: 3px 7px;

      border-radius: 999px;

      font-size: 9px;

      font-weight: 800;

      white-space: nowrap;
    }

    /* ========================================================
       EMPTY
    ======================================================== */

    .empty {
      padding: 35px;

      text-align: center;

      color: #6b7280;

      font-size: 13px;
    }

    /* ========================================================
       FOOTER
    ======================================================== */

    .footer {
      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-top: 12px;

      padding-top: 8px;

      border-top:
        1px solid #e5e7eb;

      font-size: 9px;

      color: #6b7280;
    }

    .footer-left {
      font-weight: 700;
    }

    .footer-right {
      text-align: right;
    }

    /* ========================================================
       PRINT
    ======================================================== */

    @media print {

      body {
        -webkit-print-color-adjust: exact;

        print-color-adjust: exact;
      }

      .no-print {
        display: none !important;
      }

      thead th {
        -webkit-print-color-adjust: exact;

        print-color-adjust: exact;
      }

    }

  </style>

</head>

<body>

  <!-- ======================================================
       BUS HEADER
  ======================================================= -->

  <div class="header">

    <div class="header-left">

      <h1 class="title">
        ${escapeHtml(
          busData.busNumber
        )}
        — Passenger Manifest
      </h1>

      <p class="company">
        ${escapeHtml(
          busData.company
        )}
      </p>

      <div class="meta">

        <div class="meta-item">
          <span class="meta-label">
            Route:
          </span>
          ${escapeHtml(
            busData.route
          )}
        </div>

        <div class="meta-item">
          <span class="meta-label">
            Pickup:
          </span>
          ${escapeHtml(
            busData.pickup
          )}
        </div>

        <div class="meta-item">
          <span class="meta-label">
            Dropoff:
          </span>
          ${escapeHtml(
            busData.dropoff
          )}
        </div>

        <div class="meta-item">
          <span class="meta-label">
            Date:
          </span>
          ${escapeHtml(
            busData.date
          )}
        </div>

        <div class="meta-item">
          <span class="meta-label">
            Departure:
          </span>
          ${escapeHtml(
            busData.departure
          )}
        </div>

        <div class="meta-item">
          <span class="meta-label">
            Arrival:
          </span>
          ${escapeHtml(
            busData.arrival
          )}
        </div>

        <div class="meta-item">
          <span class="meta-label">
            Duration:
          </span>
          ${escapeHtml(
            busData.duration
          )}
        </div>

      </div>

    </div>

    <!-- ====================================================
         SUMMARY
    ===================================================== -->

    <div class="summary">

      <p class="summary-title">
        Trip Summary
      </p>

      <div>
        <strong>
          Total Passengers:
        </strong>

        ${rows.length}
      </div>

      <div>
        <strong>
          Capacity:
        </strong>

        ${escapeHtml(
          busData.capacity
        )}
      </div>

      <div>
        <strong>
          Booked Seats:
        </strong>

        ${escapeHtml(
          busData.bookedSeats
        )}
      </div>

      <div>
        <strong>
          Available Seats:
        </strong>

        ${escapeHtml(
          busData.availableSeats
        )}
      </div>

    </div>

  </div>

  <!-- ======================================================
       PASSENGER TABLE
  ======================================================= -->

  ${
    rows.length === 0
      ? `
        <div class="empty">
          No passengers to show for this trip.
        </div>
      `
      : `
        <table>

          <thead>

            <tr>

              <th>#</th>

              <th>
                Passenger Name
              </th>

              <th>
                Phone
              </th>

              <th>
                Email
              </th>

              <th>
                Gender
              </th>

              <th>
                CNIC
              </th>

              <th>
                Seats
              </th>

              <th>
                Booking Ref
              </th>

              <th>
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            ${bodyRows}

          </tbody>

        </table>
      `
  }

  <!-- ======================================================
       FOOTER
  ======================================================= -->

  <div class="footer">

    <div class="footer-left">
      Haikal Tours — Passenger Manifest
    </div>

    <div class="footer-right">
      Printed:
      ${escapeHtml(
        new Date().toLocaleString()
      )}
    </div>

  </div>

</body>

</html>
`;
  }

  // ============================================================
  // PRINT PASSENGERS
  // ============================================================

  function printRows(
    rows: Booking[]
  ) {
    if (!bus) return;

    const html =
      buildPrintHtml(
        bus,
        rows
      );

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1400,height=900"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups for this website to print the passenger list."
      );

      return;
    }

    printWindow.document.open();

    printWindow.document.write(
      html
    );

    printWindow.document.close();

    /*
     * Give the browser enough time
     * to render the table before opening
     * the print dialog.
     */
    setTimeout(() => {
      printWindow.focus();

      printWindow.print();

      /*
       * Close the print window after
       * the user finishes printing.
       */
      printWindow.onafterprint =
        () => {
          printWindow.close();
        };
    }, 500);
  }

  // ============================================================
  // HANDLE PRINT
  // ============================================================

  async function handlePrint() {
    if (!busId || !bus) return;

    try {
      setPrintLoading(true);

      /*
       * IMPORTANT
       *
       * We intentionally DO NOT send the
       * current search value.
       *
       * Print should always contain ALL
       * passengers for this trip.
       */

      const totalBookings =
        pagination?.totalBookings ??
        0;

      const limit = Math.max(
        totalBookings,
        100
      );

      const queryParams =
        new URLSearchParams();

      queryParams.set(
        "page",
        "1"
      );

      queryParams.set(
        "limit",
        String(limit)
      );

      /*
       * Your API should support this.
       */
      queryParams.set(
        "all",
        "true"
      );

      console.log(
        "Printing passengers..."
      );

      const res = await fetch(
        `/api/trips/today/${busId}?${queryParams.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to load passengers for printing"
        );
      }

      const rows: Booking[] =
        data.bookings || [];

      console.log(
        "Passengers received:",
        rows.length
      );

      if (rows.length === 0) {
        alert(
          "No passengers found for this trip."
        );

        return;
      }

      /*
       * Print ALL passengers.
       */
      printRows(rows);
    } catch (err: any) {
      console.error(
        "PRINT ERROR:",
        err
      );

      /*
       * Fallback:
       *
       * If the request for all passengers
       * fails, print whatever is currently
       * visible.
       */
      if (
        bookings.length > 0
      ) {
        printRows(
          bookings
        );
      } else {
        alert(
          err.message ||
            "Unable to prepare passenger list for printing."
        );
      }
    } finally {
      setPrintLoading(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading &&
    !bus
  ) {
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

  if (
    error &&
    !bus
  ) {
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

  if (!bus) {
    return null;
  }

  // ============================================================
  // OCCUPANCY
  // ============================================================

  const occupancy =
    bus.capacity > 0
      ? Math.min(
          (bus.bookedSeats /
            bus.capacity) *
            100,
          100
        )
      : 0;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f7f9f9]">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between gap-4">

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

            {/* MAIN PRINT BUTTON */}

            <button
              type="button"
              onClick={handlePrint}
              disabled={
                printLoading
              }
              className="flex items-center gap-2 rounded-xl bg-[#063d43] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {printLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Printer
                  size={16}
                />
              )}

              {printLoading
                ? "Preparing..."
                : "Print passengers"}

            </button>

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
                {Math.round(
                  occupancy
                )}
                %
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

          {/* PASSENGER HEADER */}

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
                  {(
                    pagination?.totalBookings ||
                    0
                  ) !== 1
                    ? "s"
                    : ""}{" "}
                  for this trip

                </p>

              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">

                {/* SEARCH */}

                <form
                  onSubmit={
                    handleSearch
                  }
                  className="flex w-full max-w-md items-center gap-2"
                >

                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-teal-500">

                    <Search
                      size={17}
                      className="shrink-0 text-gray-400"
                    />

                    <input
                      value={
                        searchInput
                      }
                      onChange={(e) =>
                        setSearchInput(
                          e.target.value
                        )
                      }
                      placeholder="Search passenger, phone, CNIC, email..."
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
                        <X
                          size={15}
                        />
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

          </div>

          {/* ==================================================
              TABLE
          =================================================== */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-262.5 text-left">

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
                    Gender
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    CNIC
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
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >

                      <Loader2
                        size={22}
                        className="mx-auto animate-spin text-gray-300"
                      />

                    </td>

                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>

                    <td
                      colSpan={7}
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

                        {/* GENDER */}

                        <td className="px-5 py-4">

                          <p className="text-xs font-bold text-gray-700">
                            {
                              booking.gender ||
                              "-"
                            }
                          </p>

                        </td>

                        {/* CNIC */}

                        <td className="px-5 py-4">

                          <p className="text-xs font-bold text-gray-700">
                            {
                              booking.passengerCnic ||
                              "-"
                            }
                          </p>

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
                    )}

                    {" - "}

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

                  <span className="min-w-25 text-center text-xs font-bold text-gray-600">

                    Page{" "}

                    {
                      pagination.page
                    }

                    {" of "}

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