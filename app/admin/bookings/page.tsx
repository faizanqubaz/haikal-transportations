"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Bus,
  Users,
  MapPin,
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
  User,
  BookUser,
  UserPlus,
  ShieldCheck,
  Send,
  CheckCircle2,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

// --------------------------------------------------
// SAME MENU ITEMS AS DASHBOARD
// --------------------------------------------------
const menuItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Bookings",
    href: "/admin/bookings",
    icon: CalendarCheck,
  },
  {
    name: "Trips & Buses",
    href: "/admin/trips",
    icon: Bus,
  },
  {
    name: "Custom Ticket",
    href: "/admin/custom-booking",
    icon: BookUser,
  },
  {
    name: "Drivers",
    href: "/admin/drivers",
    icon: UserRoundCog,
  },
];

type Gender = "male" | "female";
type BookingStatus = "pending" | "approved" | "rejected";
type AdminRole = "admin" | "superadmin";

type Booking = {
  _id: string;
  bookingRef: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  gender?: Gender | string;
  route: string;
  bus?: {
    busNumber: string;
  } | null;
  seats: string[];
  travelDate: string;
  travelTime?: string;
  status: BookingStatus;
  emailSent?: boolean;
  whatsappSent?: boolean;
};

type EditForm = {
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  gender: string;
  route: string;
  seats: string;
  travelDate: string;
  travelTime: string;
  status: BookingStatus;
};

type AdminMeResponse = {
  success: boolean;
  user?: {
    id: string;
    username: string;
    role: AdminRole;
  };
  message?: string;
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

function formatGender(gender?: string) {
  if (!gender) return "—";
  const normalized = gender.trim().toLowerCase();
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  return gender;
}

export default function AllBookingsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // --------------------------------------------------
  // CURRENT ADMIN / ROLE (same as dashboard)
  // --------------------------------------------------
  const [currentUser, setCurrentUser] = useState<AdminMeResponse["user"] | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const isSuperAdmin = currentUser?.role === "superadmin";

  // --------------------------------------------------
  // SETTINGS / INVITE ADMIN
  // --------------------------------------------------
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showInviteAdmin, setShowInviteAdmin] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // --------------------------------------------------
  // EDIT / DELETE STATE
  // --------------------------------------------------
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------
  // LOAD CURRENT USER
  // --------------------------------------------------
  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      const data: AdminMeResponse = await res.json().catch(() => ({ success: false }));

      if (!res.ok || !data.success || !data.user) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(data.user);
    } catch (error) {
      console.error("Failed to load current admin:", error);
      setCurrentUser(null);
    } finally {
      setRoleLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // LOAD BOOKINGS
  // --------------------------------------------------
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
    loadBookings();
  }, [loadCurrentUser, loadBookings]);

  // --------------------------------------------------
  // INVITE ADMIN
  // --------------------------------------------------
  function openInviteAdmin() {
    if (!isSuperAdmin) return;
    setSettingsOpen(false);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess("");
    setShowInviteAdmin(true);
  }

  function closeInviteAdmin() {
    if (sendingInvite) return;
    setShowInviteAdmin(false);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess("");
  }

  async function handleSendAdminInvitation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSuperAdmin) {
      setInviteError("Only a super admin can send admin invitations.");
      return;
    }

    setInviteError("");
    setInviteSuccess("");
    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      setInviteError("Please enter an email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInviteError("Please enter a valid email address.");
      return;
    }

    setSendingInvite(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to send admin invitation.");
      }

      setInviteSuccess(data.message || "Admin invitation sent successfully.");
      setInviteEmail("");
    } catch (error) {
      console.error("Failed to send admin invitation:", error);
      setInviteError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setSendingInvite(false);
    }
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  async function handleLogout() {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout request failed");
    } catch (err) {
      console.error("Failed to log out:", err);
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
      router.push("/admin/login");
      router.refresh();
    }
  }

  // --------------------------------------------------
  // FILTERING + PAGINATION
  // --------------------------------------------------
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
          b.route?.toLowerCase().includes(q) ||
          b.gender?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, statusTab, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + ROWS_PER_PAGE);

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

  // --------------------------------------------------
  // EDIT / DELETE
  // --------------------------------------------------
  function openEdit(booking: Booking) {
    setSaveError(null);
    setEditingBooking(booking);
    setEditForm({
      passengerName: booking.passengerName || "",
      passengerEmail: booking.passengerEmail || "",
      passengerPhone: booking.passengerPhone || "",
      gender: booking.gender?.trim().toLowerCase() || "",
      route: booking.route || "",
      seats: (booking.seats || []).join(", "),
      travelDate: toDateInputValue(booking.travelDate),
      travelTime: booking.travelTime || "",
      status: booking.status,
    });
  }

  function closeEdit() {
    if (saving) return;
    setEditingBooking(null);
    setEditForm(null);
    setSaveError(null);
  }

  async function saveEdit() {
    if (!editingBooking || !editForm) return;

    if (!editForm.passengerName.trim()) {
      setSaveError("Passenger name is required.");
      return;
    }
    if (!editForm.passengerEmail.trim()) {
      setSaveError("Passenger email is required.");
      return;
    }
    if (!editForm.passengerPhone.trim()) {
      setSaveError("Passenger phone is required.");
      return;
    }

    const gender = editForm.gender.trim().toLowerCase();
    if (gender !== "male" && gender !== "female") {
      setSaveError("Please select either Male or Female.");
      return;
    }
    if (!editForm.route.trim()) {
      setSaveError("Route is required.");
      return;
    }
    if (!editForm.travelDate) {
      setSaveError("Travel date is required.");
      return;
    }

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
          gender,
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
      if (!res.ok) throw new Error(data.error || "Failed to save changes");

      await loadBookings();
      closeEdit();
    } catch (err) {
      console.error("Failed to save booking:", err);
      setSaveError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

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
      alert(err instanceof Error ? err.message : "Something went wrong deleting this booking.");
    } finally {
      setDeleting(false);
    }
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===================== SIDEBAR (SAME AS DASHBOARD) ===================== */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[270px]
          flex-col bg-gradient-to-b from-[#0b2e33] via-[#0c3238] to-[#082226]
          text-white shadow-2xl transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* LOGO */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400 text-lg font-black text-[#063d43] shadow-lg shadow-teal-500/30">
              H
            </div>
            <div>
              <p className="text-base font-black tracking-wide text-white">HAIKAL</p>
              <p className="text-[9px] font-bold tracking-[0.3em] text-teal-300">
                TOURS ADMIN
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Main Menu
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.name === "Bookings";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group relative flex items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-medium transition
                    ${
                      isActive
                        ? "bg-white/10 font-bold text-teal-300"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal-400" />
                  )}
                  <Icon
                    size={19}
                    className={
                      isActive
                        ? "text-teal-300"
                        : "text-white/40 group-hover:text-teal-300"
                    }
                  />
                  <span>{item.name}</span>

                  {item.name === "Bookings" && counts.pending > 0 && (
                    <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                      {counts.pending}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            System
          </p>

          <nav className="space-y-1">
            {/* SETTINGS DROPDOWN — SUPERADMIN ONLY */}
            {isSuperAdmin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((c) => !c)}
                  className={`
                    group flex w-full items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-medium transition
                    ${
                      settingsOpen
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <Settings
                    size={19}
                    className={
                      settingsOpen
                        ? "text-teal-300"
                        : "text-white/40 group-hover:text-teal-300"
                    }
                  />
                  <span>Settings</span>
                  <ChevronRightIcon
                    size={16}
                    className={`
                      ml-auto transition-transform
                      ${settingsOpen ? "rotate-90 text-teal-300" : "text-white/30"}
                    `}
                  />
                </button>

                {settingsOpen && (
                  <div className="mt-1 overflow-hidden rounded-xl border border-white/10 bg-black/10">
                    <button
                      type="button"
                      onClick={openInviteAdmin}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10">
                        <UserPlus size={16} className="text-teal-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">Invite as Admin</p>
                        <p className="mt-0.5 text-[10px] text-white/30">
                          Send an admin invitation
                        </p>
                      </div>
                    </button>

                    <Link
                      href="/admin/settings"
                      onClick={() => setSidebarOpen(false)}
                      className="group flex items-center gap-3 border-t border-white/5 px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                        <Settings
                          size={16}
                          className="text-white/40 group-hover:text-teal-300"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">General Settings</p>
                        <p className="mt-0.5 text-[10px] text-white/30">
                          Manage dashboard settings
                        </p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* LOGOUT */}
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut
                size={19}
                className="text-white/40 group-hover:text-rose-300"
              />
              Log Out
            </button>
          </nav>
        </div>

        {/* ADMIN USER */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400/90 text-sm font-bold text-[#063d43]">
              {(currentUser?.username || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {currentUser?.username || "Administrator"}
              </p>
              <p className="truncate text-xs text-white/40">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              title="Log out"
              className="text-white/40 transition hover:text-rose-300"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN ===================== */}
      <main className="lg:ml-[270px]">
        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            >
              <Menu size={21} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">
                All Bookings
              </h1>
              <p className="hidden text-xs text-slate-400 sm:block">
                {bookings.length} total reservations
              </p>
            </div>
          </div>

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to dashboard</span>
          </Link>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* TOOLBAR */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`
                    rounded-xl px-4 py-2 text-xs font-bold capitalize transition
                    ${
                      statusTab === tab
                        ? "bg-[#063d43] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }
                  `}
                >
                  {tab}{" "}
                  <span className="opacity-70">({counts[tab]})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 lg:w-72">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ref, phone, route..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="px-5 py-4 font-semibold">Booking</th>
                    <th className="px-5 py-4 font-semibold">Passenger</th>
                    <th className="px-5 py-4 font-semibold">Route</th>
                    <th className="px-5 py-4 font-semibold">Bus / Seats</th>
                    <th className="px-5 py-4 font-semibold">Travel</th>
                    <th className="px-5 py-4 font-semibold">Gender</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center">
                        <Loader2 size={20} className="mx-auto animate-spin text-slate-300" />
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedBookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                        No bookings match your filters.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedBookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-800">
                            {booking.bookingRef}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {booking.passengerPhone}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {booking.passengerName}
                          </p>
                          <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-slate-400">
                            {booking.passengerEmail}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[170px] truncate text-xs text-slate-600">
                            {booking.route}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-700">
                            {booking.bus?.busNumber || "—"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {(booking.seats || []).join(", ") || "-"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-700">
                            {booking.travelDate
                              ? new Date(booking.travelDate).toLocaleDateString()
                              : "—"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {booking.travelTime || "-"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`
                              inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold
                              ${
                                booking.gender?.toLowerCase() === "male"
                                  ? "bg-blue-50 text-blue-600"
                                  : booking.gender?.toLowerCase() === "female"
                                    ? "bg-pink-50 text-pink-600"
                                    : "bg-slate-50 text-slate-500"
                              }
                            `}
                          >
                            <User size={11} />
                            {formatGender(booking.gender)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {booking.status === "approved" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                              <CircleAlert size={12} />
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(booking)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
                              title="Edit booking"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingBooking(booking)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50"
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
            <div className="divide-y divide-slate-100 md:hidden">
              {loading && (
                <div className="p-10 text-center">
                  <Loader2 size={20} className="mx-auto animate-spin text-slate-300" />
                </div>
              )}
              {!loading && paginatedBookings.length === 0 && (
                <p className="p-10 text-center text-sm text-slate-400">
                  No bookings match your filters.
                </p>
              )}
              {!loading &&
                paginatedBookings.map((booking) => (
                  <div key={booking._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-400">
                          {booking.bookingRef}
                        </p>
                        <p className="mt-1 truncate font-bold text-slate-900">
                          {booking.passengerName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {booking.passengerPhone}
                        </p>
                      </div>
                      {booking.status === "approved" && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                          Confirmed
                        </span>
                      )}
                      {booking.status === "pending" && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                          Pending
                        </span>
                      )}
                      {booking.status === "rejected" && (
                        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">
                          Cancelled
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <div>
                        <p className="text-[10px] text-slate-400">Route</p>
                        <p className="truncate font-semibold text-slate-700">
                          {booking.route}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Bus / Seats</p>
                        <p className="truncate font-semibold text-slate-700">
                          {booking.bus?.busNumber || "—"} ·{" "}
                          {(booking.seats || []).join(", ") || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Travel date</p>
                        <p className="font-semibold text-slate-700">
                          {booking.travelDate
                            ? new Date(booking.travelDate).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Time</p>
                        <p className="font-semibold text-slate-700">
                          {booking.travelTime || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Gender</p>
                        <div className="mt-1">
                          <span
                            className={`
                              inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold
                              ${
                                booking.gender?.toLowerCase() === "male"
                                  ? "bg-blue-50 text-blue-600"
                                  : booking.gender?.toLowerCase() === "female"
                                    ? "bg-pink-50 text-pink-600"
                                    : "bg-slate-50 text-slate-500"
                              }
                            `}
                          >
                            <User size={10} />
                            {formatGender(booking.gender)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEdit(booking)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingBooking(booking)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-100 py-2.5 text-xs font-bold text-rose-500 transition hover:bg-rose-50"
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
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
                <p className="text-xs text-slate-400">
                  Showing{" "}
                  <span className="font-bold text-slate-600">
                    {startIndex + 1}-
                    {Math.min(startIndex + ROWS_PER_PAGE, filteredBookings.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-600">
                    {filteredBookings.length}
                  </span>{" "}
                  bookings
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-2 text-xs font-bold text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===================== INVITE ADMIN MODAL ===================== */}
      {showInviteAdmin && isSuperAdmin && (
        <div
          className="fixed inset-0 z-[10010] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeInviteAdmin}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
                    <UserPlus size={21} className="text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Invite as Admin
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Send an invitation to a new administrator.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeInviteAdmin}
                  disabled={sendingInvite}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSendAdminInvitation}>
              <div className="space-y-5 p-6">
                <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                  <ShieldCheck size={19} className="mt-0.5 shrink-0 text-teal-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">How this works</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The person will receive an email with an
                      <span className="font-semibold text-slate-700"> Accept Invitation</span>{" "}
                      button. They can then create their admin password and sign in.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                      autoFocus
                      disabled={sendingInvite}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {inviteError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    <CircleAlert size={17} className="mt-0.5 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}

                {inviteSuccess && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                    <span>{inviteSuccess}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeInviteAdmin}
                    disabled={sendingInvite}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite || !inviteEmail.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#063d43] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingInvite ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT MODAL ===================== */}
      {editingBooking && editForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeEdit}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="font-black text-slate-900">Edit Booking</h3>
                <p className="text-xs text-slate-400">{editingBooking.bookingRef}</p>
              </div>
              <button
                onClick={closeEdit}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Passenger name">
                  <input
                    value={editForm.passengerName}
                    disabled={saving}
                    onChange={(e) =>
                      setEditForm({ ...editForm, passengerName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={editForm.passengerPhone}
                    disabled={saving}
                    onChange={(e) =>
                      setEditForm({ ...editForm, passengerPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                  />
                </Field>
              </div>

              <Field label="Email">
                <input
                  type="email"
                  value={editForm.passengerEmail}
                  disabled={saving}
                  onChange={(e) =>
                    setEditForm({ ...editForm, passengerEmail: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                />
              </Field>

              <Field label="Gender">
                <div className="relative">
                  <User
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={editForm.gender}
                    disabled={saving}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </Field>

              <Field label="Route">
                <input
                  value={editForm.route}
                  disabled={saving}
                  onChange={(e) =>
                    setEditForm({ ...editForm, route: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                />
              </Field>

              <Field label="Seats (comma separated)">
                <input
                  value={editForm.seats}
                  disabled={saving}
                  onChange={(e) =>
                    setEditForm({ ...editForm, seats: e.target.value })
                  }
                  placeholder="e.g. A1, A2"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Travel date">
                  <input
                    type="date"
                    value={editForm.travelDate}
                    disabled={saving}
                    onChange={(e) =>
                      setEditForm({ ...editForm, travelDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                  />
                </Field>
                <Field label="Travel time">
                  <input
                    value={editForm.travelTime}
                    disabled={saving}
                    onChange={(e) =>
                      setEditForm({ ...editForm, travelTime: e.target.value })
                    }
                    placeholder="e.g. 08:30 AM"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                  />
                </Field>
              </div>

              <Field label="Status">
                <select
                  value={editForm.status}
                  disabled={saving}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as BookingStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>

              {saveError && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-xs font-semibold text-rose-600">
                  {saveError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deletingBooking && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeletingBooking(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <Trash2 size={22} className="text-rose-500" />
            </div>
            <h3 className="mt-4 text-center text-lg font-black text-slate-900">
              Delete this booking?
            </h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              <span className="font-bold text-slate-700">
                {deletingBooking.passengerName}
              </span>
              {" · "}
              {deletingBooking.bookingRef}
              {" will be permanently removed. This can't be undone."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingBooking(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== LOGOUT CONFIRMATION ===================== */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !loggingOut && setConfirmLogout(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <LogOut size={22} className="text-rose-500" />
            </div>
            <h3 className="mt-4 text-center text-lg font-black text-slate-900">
              Log out of admin dashboard?
            </h3>
            <p className="mt-1 text-center text-sm text-slate-500">
              You'll need to sign in again to access bookings and trips.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                disabled={loggingOut}
                className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FIELD COMPONENT
// ============================================================
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}