"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Bus,
  Users,
  MapPin,
  Hotel,
  Package,
  Navigation,
  UserRoundCog,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CircleCheck,
  CircleAlert,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  Save,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { name: "Trips & Buses", href: "/admin/trips", icon: Bus },
  { name: "Passengers", href: "/admin/passengers", icon: Users },
  { name: "Destinations", href: "/admin/destinations", icon: MapPin },
  { name: "Hotels", href: "/admin/hotels", icon: Hotel },
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Routes", href: "/admin/routes", icon: Navigation },
  { name: "Drivers", href: "/admin/drivers", icon: UserRoundCog },
];

const bottomItems = [{ name: "Settings", href: "/admin/settings", icon: Settings }];

type Booking = {
  _id: string;
  bookingRef: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  route: string;
  bus?: { busNumber: string } | null;
  seats: string[];
  travelDate: string;
  travelTime?: string;
  status: "pending" | "approved" | "rejected";
  emailSent?: boolean;
  whatsappSent?: boolean;
};

type EditForm = {
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  route: string;
  seats: string;
  travelDate: string;
  travelTime: string;
  status: "pending" | "approved" | "rejected";
};

const ROWS_PER_PAGE = 7;
const STATUS_TABS = ["all", "pending", "approved", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function toDateInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function AllBookingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // ---- Filtering ----
  const filteredBookings = useMemo(() => {
    let list = bookings;

    if (statusTab !== "all") {
      list = list.filter((b) => b.status === statusTab);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.passengerName?.toLowerCase().includes(q) ||
          b.bookingRef?.toLowerCase().includes(q) ||
          b.passengerPhone?.toLowerCase().includes(q) ||
          b.route?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, statusTab, search]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusTab]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ROWS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      approved: bookings.filter((b) => b.status === "approved").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
    }),
    [bookings]
  );

  // ---- Edit ----
  function openEdit(booking: Booking) {
    setSaveError(null);
    setEditingBooking(booking);
    setEditForm({
      passengerName: booking.passengerName || "",
      passengerEmail: booking.passengerEmail || "",
      passengerPhone: booking.passengerPhone || "",
      route: booking.route || "",
      seats: (booking.seats || []).join(", "),
      travelDate: toDateInputValue(booking.travelDate),
      travelTime: booking.travelTime || "",
      status: booking.status,
    });
  }

  function closeEdit() {
    setEditingBooking(null);
    setEditForm(null);
    setSaveError(null);
  }

  async function saveEdit() {
    if (!editingBooking || !editForm) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/bookings/${editingBooking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passengerName: editForm.passengerName.trim(),
          passengerEmail: editForm.passengerEmail.trim(),
          passengerPhone: editForm.passengerPhone.trim(),
          route: editForm.route.trim(),
          seats: editForm.seats
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          travelDate: editForm.travelDate,
          travelTime: editForm.travelTime.trim(),
          status: editForm.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      await loadBookings();
      closeEdit();
    } catch (err) {
      console.error("Failed to save booking:", err);
      setSaveError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ---- Delete ----
  async function confirmDelete() {
    if (!deletingBooking) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/bookings/${deletingBooking._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete booking");
      }

      setBookings((prev) => prev.filter((b) => b._id !== deletingBooking._id));
      setDeletingBooking(null);
    } catch (err) {
      console.error("Failed to delete booking:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Something went wrong deleting this booking. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9f9]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[270px]
          flex-col border-r border-gray-100 bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-gray-100 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#063d43] text-lg font-black text-white">
              H
            </div>
            <div>
              <p className="text-base font-black tracking-wide text-gray-900">HAIKAL</p>
              <p className="text-[9px] font-bold tracking-[0.3em] text-teal-700">
                TOURS ADMIN
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Main Menu
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = item.name === "Bookings";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-medium transition
                    ${active
                      ? "bg-teal-50 font-bold text-teal-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-teal-700"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    className={active ? "text-teal-700" : "text-gray-400 group-hover:text-teal-700"}
                  />
                  <span>{item.name}</span>
                  {item.name === "Bookings" && counts.pending > 0 && (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {counts.pending}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            System
          </p>
          <nav className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-teal-700"
                >
                  <Icon size={19} className="text-gray-400 group-hover:text-teal-700" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-800">Administrator</p>
              <p className="truncate text-xs text-gray-400">admin@haikaltours.com</p>
            </div>
            <button className="text-gray-400 hover:text-red-500">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="lg:ml-[270px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 lg:hidden"
            >
              <Menu size={21} />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 sm:text-xl">All Bookings</h1>
              <p className="hidden text-xs text-gray-400 sm:block">
                {bookings.length} total reservations
              </p>
            </div>
          </div>

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to dashboard</span>
          </Link>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* TOOLBAR */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* STATUS TABS */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${
                    statusTab === tab
                      ? "bg-[#063d43] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab} <span className="opacity-70">({counts[tab]})</span>
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 lg:w-72">
              <Search size={16} className="shrink-0 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ref, phone, route..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400">
                    <th className="px-5 py-4 font-semibold">Booking</th>
                    <th className="px-5 py-4 font-semibold">Passenger</th>
                    <th className="px-5 py-4 font-semibold">Route</th>
                    <th className="px-5 py-4 font-semibold">Bus / Seats</th>
                    <th className="px-5 py-4 font-semibold">Travel</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center">
                        <Loader2 size={20} className="mx-auto animate-spin text-gray-300" />
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                        No bookings match your filters.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedBookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="border-b border-gray-50 transition last:border-0 hover:bg-gray-50/60"
                      >
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-gray-800">{booking.bookingRef}</p>
                          <p className="mt-1 text-[11px] text-gray-400">{booking.passengerPhone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-800">{booking.passengerName}</p>
                          <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-gray-400">
                            {booking.passengerEmail}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[170px] truncate text-xs text-gray-600">{booking.route}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-gray-700">
                            {booking.bus?.busNumber || "—"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {(booking.seats || []).join(", ") || "-"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-gray-700">
                            {booking.travelDate
                              ? new Date(booking.travelDate).toLocaleDateString()
                              : "—"}
                          </p>
                          <p className="text-[11px] text-gray-400">{booking.travelTime || "-"}</p>
                        </td>
                        <td className="px-5 py-4">
                          {booking.status === "approved" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600">
                              <CircleCheck size={12} />
                              Confirmed
                            </span>
                          )}
                          {booking.status === "pending" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                              <Clock3 size={12} />
                              Pending
                            </span>
                          )}
                          {booking.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                              <CircleAlert size={12} />
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(booking)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-teal-50 hover:text-teal-700"
                              title="Edit booking"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingBooking(booking)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50"
                              title="Delete booking"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="divide-y divide-gray-100 md:hidden">
              {loading && (
                <div className="p-10 text-center">
                  <Loader2 size={20} className="mx-auto animate-spin text-gray-300" />
                </div>
              )}

              {!loading && paginatedBookings.length === 0 && (
                <p className="p-10 text-center text-sm text-gray-400">
                  No bookings match your filters.
                </p>
              )}

              {!loading &&
                paginatedBookings.map((booking) => (
                  <div key={booking._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-400">{booking.bookingRef}</p>
                        <p className="mt-1 truncate font-bold text-gray-900">
                          {booking.passengerName}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{booking.passengerPhone}</p>
                      </div>

                      {booking.status === "approved" && (
                        <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                          Confirmed
                        </span>
                      )}
                      {booking.status === "pending" && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                          Pending
                        </span>
                      )}
                      {booking.status === "rejected" && (
                        <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                          Cancelled
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <p className="text-[10px] text-gray-400">Route</p>
                        <p className="truncate font-semibold text-gray-700">{booking.route}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Bus / Seats</p>
                        <p className="font-semibold text-gray-700">
                          {booking.bus?.busNumber || "—"} · {(booking.seats || []).join(", ") || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Travel date</p>
                        <p className="font-semibold text-gray-700">
                          {booking.travelDate
                            ? new Date(booking.travelDate).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Time</p>
                        <p className="font-semibold text-gray-700">{booking.travelTime || "-"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEdit(booking)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-bold text-gray-600 transition hover:bg-teal-50 hover:text-teal-700"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingBooking(booking)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-100 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* PAGINATION */}
            {filteredBookings.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row">
                <p className="text-xs text-gray-400">
                  Showing{" "}
                  <span className="font-bold text-gray-600">
                    {startIndex + 1}-{Math.min(startIndex + ROWS_PER_PAGE, filteredBookings.length)}
                  </span>{" "}
                  of <span className="font-bold text-gray-600">{filteredBookings.length}</span>{" "}
                  bookings
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-2 text-xs font-bold text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT MODAL */}
      {editingBooking && editForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeEdit}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="font-black text-gray-900">Edit Booking</h3>
                <p className="text-xs text-gray-400">{editingBooking.bookingRef}</p>
              </div>
              <button
                onClick={closeEdit}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Passenger name">
                  <input
                    value={editForm.passengerName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, passengerName: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={editForm.passengerPhone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, passengerPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </Field>
              </div>

              <Field label="Email">
                <input
                  type="email"
                  value={editForm.passengerEmail}
                  onChange={(e) =>
                    setEditForm({ ...editForm, passengerEmail: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                />
              </Field>

              <Field label="Route">
                <input
                  value={editForm.route}
                  onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                />
              </Field>

              <Field label="Seats (comma separated)">
                <input
                  value={editForm.seats}
                  onChange={(e) => setEditForm({ ...editForm, seats: e.target.value })}
                  placeholder="e.g. A1, A2"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Travel date">
                  <input
                    type="date"
                    value={editForm.travelDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, travelDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </Field>
                <Field label="Travel time">
                  <input
                    value={editForm.travelTime}
                    onChange={(e) =>
                      setEditForm({ ...editForm, travelTime: e.target.value })
                    }
                    placeholder="e.g. 08:30 AM"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </Field>
              </div>

              <Field label="Status">
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as EditForm["status"],
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>

              {saveError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                  {saveError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEdit}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingBooking && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeletingBooking(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="mt-4 text-center text-lg font-black text-gray-900">
              Delete this booking?
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              <span className="font-bold text-gray-700">
                {deletingBooking.passengerName}
              </span>{" "}
              · {deletingBooking.bookingRef} will be permanently removed. This can't
              be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingBooking(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-gray-500">{label}</label>
      {children}
    </div>
  );
}