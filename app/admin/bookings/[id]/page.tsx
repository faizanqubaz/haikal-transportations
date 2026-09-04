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

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

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
      // Supports either { booking: {...} } or the booking object directly
      setBooking(data.booking || data);
    } catch (err) {
      console.error("Failed to load booking:", err);
      setError("Could not load this passenger's booking. It may have been removed.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function handleAction(action: "approve" | "reject") {
    if (!booking) return;
    setActioning(true);

    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      await loadBooking();
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
      alert(`Something went wrong trying to ${action} this booking. Please try again.`);
    } finally {
      setActioning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f9]">
        <Loader2 size={28} className="animate-spin text-teal-700" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f9f9] px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <CircleAlert size={24} className="text-red-500" />
        </div>
        <p className="text-sm font-bold text-gray-700">{error || "Booking not found."}</p>
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

  const seats = booking.seats && booking.seats.length > 0
    ? booking.seats
    : booking.seat
    ? [booking.seat]
    : [];

  return (
    <div className="min-h-screen bg-[#f7f9f9]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-900 sm:text-xl">Passenger Details</h1>
          <p className="hidden text-xs text-gray-400 sm:block">
            Booking {booking.bookingRef}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
        {/* STATUS BANNER */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Booking Reference
            </p>
            <p className="mt-1 text-xl font-black text-teal-700">{booking.bookingRef}</p>
          </div>

          {booking.status === "approved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600">
              <CircleCheck size={14} />
              Confirmed
            </span>
          )}
          {booking.status === "pending" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
              <Clock3 size={14} />
              Pending
            </span>
          )}
          {booking.status === "rejected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
              <CircleAlert size={14} />
              Cancelled
            </span>
          )}
        </div>

        {/* PASSENGER INFO */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <User size={17} className="text-teal-700" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">
              Passenger
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-400">Full name</span>
              <span className="text-sm font-bold text-gray-900">{booking.passengerName}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <Phone size={13} />
                Phone
              </span>
              <span className="text-sm font-bold text-gray-900">{booking.passengerPhone}</span>
            </div>

            {booking.passengerEmail && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail size={13} />
                  Email
                </span>
                <span className="max-w-[250px] truncate text-sm font-bold text-gray-900">
                  {booking.passengerEmail}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TRIP INFO */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <CalendarCheck size={17} className="text-teal-700" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">
              Trip Details
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin size={17} className="text-teal-700" />
              <div>
                <p className="text-[10px] text-gray-400">Route</p>
                <p className="text-sm font-bold text-gray-900">{booking.route}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Bus size={17} className="text-teal-700" />
              <div>
                <p className="text-[10px] text-gray-400">Bus</p>
                <p className="text-sm font-bold text-gray-900">
                  {booking.bus?.busNumber || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock3 size={17} className="text-teal-700" />
              <div>
                <p className="text-[10px] text-gray-400">Departure</p>
                <p className="text-sm font-bold text-gray-900">
                  {booking.travelDate
                    ? new Date(booking.travelDate).toLocaleDateString()
                    : "—"}
                  {" · "}
                  {booking.travelTime || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEATS */}
        {seats.length > 0 && (
          <div className="mb-6 rounded-2xl bg-teal-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Selected Seats
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {seats.map((seat) => (
                <span
                  key={seat}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-black text-white"
                >
                  Seat {seat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS SENT */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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
              WhatsApp {booking.whatsappSent ? "sent" : "not sent"}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                booking.emailSent
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              Email {booking.emailSent ? "sent" : "not sent"}
            </span>
          </div>
        </div>

        {/* ACTIONS — only relevant while pending */}
        {booking.status === "pending" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={actioning}
              onClick={() => handleAction("reject")}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              {actioning ? <Loader2 size={17} className="animate-spin" /> : <X size={17} />}
              Reject Booking
            </button>

            <button
              type="button"
              disabled={actioning}
              onClick={() => handleAction("approve")}
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
            >
              {actioning ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
              Approve Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}