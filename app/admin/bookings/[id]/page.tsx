
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Bus,
  CalendarCheck,
  Check,
  CircleAlert,
  CircleCheck,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";

type BookingDetail = {
  _id: string;
  bookingRef: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  route: string;
  bus?: { busNumber: string } | null;
  seat?: string;
  seats?: string[];
  travelDate?: string;
  travelTime?: string;
  status: "pending" | "approved" | "rejected";
  emailSent?: boolean;
  whatsappSent?: boolean;
  createdAt?: string;
};

type ActionType = "approve" | "reject" | null;

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // IMPORTANT:
  // Instead of one boolean, track exactly which action is running.
  const [actioning, setActioning] = useState<ActionType>(null);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Booking not found");
      }

      const data = await res.json();

      // Supports either:
      // { booking: {...} }
      // OR
      // { ...booking }
      setBooking(data.booking || data);
    } catch (err) {
      console.error("Failed to load booking:", err);

      setError(
        "Could not load this passenger's booking. It may have been removed."
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function handleAction(action: "approve" | "reject") {
    if (!booking || actioning) return;

    setActioning(action);

    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      // Reload booking so status + notification state is fresh.
      await loadBooking();
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);

      alert(
        `Something went wrong trying to ${
          action === "approve" ? "approve" : "reject"
        } this booking. Please try again.`
      );
    } finally {
      setActioning(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f9]">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={30}
            className="animate-spin text-teal-700"
          />
          <p className="text-sm font-medium text-gray-500">
            Loading booking...
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f9f9] px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <CircleAlert size={24} className="text-red-500" />
        </div>

        <p className="max-w-md text-sm font-bold text-gray-700">
          {error || "Booking not found."}
        </p>

        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-[#063d43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#052f34]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const seats =
    booking.seats && booking.seats.length > 0
      ? booking.seats
      : booking.seat
      ? [booking.seat]
      : [];

  const isPending = booking.status === "pending";
  const isApproving = actioning === "approve";
  const isRejecting = actioning === "reject";

  return (
    <div className="min-h-screen bg-[#f7f9f9] pb-28 sm:pb-0">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-gray-100 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:h-[76px] sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-black text-gray-900 sm:text-xl">
            Passenger Details
          </h1>

          <p className="hidden text-xs text-gray-400 sm:block">
            Booking {booking.bookingRef}
          </p>

          {/* Mobile booking reference */}
          <p className="truncate text-[11px] font-medium text-gray-400 sm:hidden">
            {booking.bookingRef}
          </p>
        </div>

        {/* Header status on mobile */}
        <div className="ml-auto sm:hidden">
          {booking.status === "approved" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1.5 text-[10px] font-bold text-green-600">
              <CircleCheck size={12} />
              Confirmed
            </span>
          )}

          {booking.status === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-600">
              <Clock3 size={12} />
              Pending
            </span>
          )}

          {booking.status === "rejected" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600">
              <CircleAlert size={12} />
              Rejected
            </span>
          )}
        </div>
      </header>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <div className="mx-auto max-w-3xl px-4 py-5 sm:p-6 lg:p-8">
        {/* =======================================================
            STATUS BANNER
        ======================================================= */}
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Booking Reference
            </p>

            <p className="mt-1 truncate text-lg font-black text-teal-700 sm:text-xl">
              {booking.bookingRef}
            </p>
          </div>

          <div className="hidden sm:block">
            {booking.status === "approved" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600">
                <CircleCheck size={14} />
                Confirmed
              </span>
            )}

            {booking.status === "pending" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
                <Clock3 size={14} />
                Pending Approval
              </span>
            )}

            {booking.status === "rejected" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                <CircleAlert size={14} />
                Rejected
              </span>
            )}
          </div>
        </div>

        {/* =======================================================
            PASSENGER INFO
        ======================================================= */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <User size={17} className="text-teal-700" />
            </div>

            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">
              Passenger
            </h3>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-sm text-gray-400">
                Full name
              </span>

              <span className="text-right text-sm font-bold text-gray-900">
                {booking.passengerName}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-start justify-between gap-4">
              <span className="flex shrink-0 items-center gap-1.5 text-sm text-gray-400">
                <Phone size={13} />
                Phone
              </span>

              <a
                href={`tel:${booking.passengerPhone}`}
                className="text-right text-sm font-bold text-teal-700 hover:underline"
              >
                {booking.passengerPhone}
              </a>
            </div>

            {/* Email */}
            {booking.passengerEmail && (
              <div className="flex items-start justify-between gap-4">
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-gray-400">
                  <Mail size={13} />
                  Email
                </span>

                <a
                  href={`mailto:${booking.passengerEmail}`}
                  className="max-w-[210px] truncate text-right text-sm font-bold text-teal-700 hover:underline sm:max-w-[250px]"
                >
                  {booking.passengerEmail}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* =======================================================
            TRIP INFO
        ======================================================= */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <CalendarCheck size={17} className="text-teal-700" />
            </div>

            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">
              Trip Details
            </h3>
          </div>

          <div className="space-y-4">
            {/* Route */}
            <div className="flex items-start gap-3">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-teal-700"
              />

              <div className="min-w-0">
                <p className="text-[10px] text-gray-400">
                  Route
                </p>

                <p className="break-words text-sm font-bold text-gray-900">
                  {booking.route}
                </p>
              </div>
            </div>

            {/* Bus */}
            <div className="flex items-start gap-3">
              <Bus
                size={17}
                className="mt-0.5 shrink-0 text-teal-700"
              />

              <div>
                <p className="text-[10px] text-gray-400">
                  Bus
                </p>

                <p className="text-sm font-bold text-gray-900">
                  {booking.bus?.busNumber || "—"}
                </p>
              </div>
            </div>

            {/* Departure */}
            <div className="flex items-start gap-3">
              <Clock3
                size={17}
                className="mt-0.5 shrink-0 text-teal-700"
              />

              <div className="min-w-0">
                <p className="text-[10px] text-gray-400">
                  Departure
                </p>

                <p className="text-sm font-bold text-gray-900">
                  {booking.travelDate
                    ? new Date(
                        booking.travelDate
                      ).toLocaleDateString()
                    : "—"}
                  {" · "}
                  {booking.travelTime || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================
            SEATS
        ======================================================= */}
        {seats.length > 0 && (
          <div className="mb-5 rounded-2xl bg-teal-50 p-4 sm:mb-6 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Selected Seats
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {seats.map((seat) => (
                <span
                  key={seat}
                  className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-black text-white shadow-sm"
                >
                  Seat {seat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* =======================================================
            NOTIFICATIONS
        ======================================================= */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-gray-500">
            Notifications
          </h3>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                booking.whatsappSent
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              WhatsApp{" "}
              {booking.whatsappSent ? "sent" : "not sent"}
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                booking.emailSent
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              Email{" "}
              {booking.emailSent ? "sent" : "not sent"}
            </span>
          </div>
        </div>

        {/* =======================================================
            DESKTOP ACTIONS
            Hidden on mobile because mobile has sticky actions.
        ======================================================= */}
        {isPending && (
          <div className="hidden grid-cols-2 gap-3 sm:grid">
            {/* REJECT */}
            <button
              type="button"
              disabled={!!actioning}
              onClick={() => handleAction("reject")}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRejecting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Rejecting...
                </>
              ) : (
                <>
                  <X size={17} />
                  Reject Booking
                </>
              )}
            </button>

            {/* APPROVE */}
            <button
              type="button"
              disabled={!!actioning}
              onClick={() => handleAction("approve")}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApproving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Approving...
                </>
              ) : (
                <>
                  <Check size={17} />
                  Approve Booking
                </>
              )}
            </button>
          </div>
        )}

        {/* =======================================================
            MOBILE ACTIONS
            Sticky bottom action bar so admin can always see them.
        ======================================================= */}
      </div>

      {isPending && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:hidden">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Booking requires approval
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* MOBILE REJECT */}
              <button
                type="button"
                disabled={!!actioning}
                onClick={() => handleAction("reject")}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-3 text-sm font-extrabold text-red-600 shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRejecting ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X size={19} strokeWidth={2.5} />
                    Reject
                  </>
                )}
              </button>

              {/* MOBILE APPROVE */}
              <button
                type="button"
                disabled={!!actioning}
                onClick={() => handleAction("approve")}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 text-sm font-extrabold text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApproving ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check size={19} strokeWidth={2.5} />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
