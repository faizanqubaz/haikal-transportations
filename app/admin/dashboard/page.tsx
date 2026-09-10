"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

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
  Bell,
  Search,
  ChevronRight,
  ChevronLeft,
  Clock3,
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
  TrendingUp,
  Check,
  Loader2,
  BookUser,
  UserRound,
  Phone,
  Mail,
  Route,
  Eye,
  UsersRound,
  MoreVertical,
  Trash2,
  UserPlus,
  ShieldCheck,
  Send,
  Copy,
  CheckCircle2,
} from "lucide-react";

type TripStatus = "previous" | "today" | "upcoming";

type AdminRole = "admin" | "superadmin";

type TripPassenger = {
  id?: string;
  bookingRef?: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  seats?: string[];
  seatCount?: number;
  status?: string;
  travelDate?: string;
  travelTime?: string;
};

type Trip = {
  busId: string;
  status: TripStatus;
  busNumber?: string;
  busName?: string;
  company?: string;
  route?: string;
  pickup?: string;
  dropoff?: string;
  date?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  driver?: unknown;
  driverName?: string;
  price?: number;
  capacity?: number;
  availableSeats?: number;
  bookedSeats?: number;
  passengerCount?: number;
  bookingCount?: number;
  totalBookings?: number;
  pendingSeats?: number;
  confirmedSeats?: number;
  hasPassengers?: boolean;
  hasBookings?: boolean;
  passengers?: TripPassenger[];
};

type Stats = {
  bookedSeats?: number;
  todaysBookedSeats?: number;
  totalBuses?: number;
  [key: string]: unknown;
};

type Booking = {
  _id: string;
  bookingRef?: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  route?: string;
  gender?: string;
  status: "pending" | "approved" | "rejected" | string;
  travelDate?: string;
  travelTime?: string;
  seat?: string;
  seats?: string[];
  bus?: {
    _id?: string;
    busNumber?: string;
    busName?: string;
  };
};

type NotificationBooking = Booking & {
  seats?: string[];
};

type AdminNotification = {
  _id: string;
  title: string;
  message: string;
  read?: boolean;
  bookingId?: NotificationBooking | null;
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

const BOOKINGS_PER_PAGE = 7;

const STAT_ACCENTS = [
  {
    bg: "bg-teal-50",
    ring: "ring-teal-100",
    icon: "text-teal-700",
  },
  {
    bg: "bg-indigo-50",
    ring: "ring-indigo-100",
    icon: "text-indigo-600",
  },
  {
    bg: "bg-amber-50",
    ring: "ring-amber-100",
    icon: "text-amber-600",
  },
  {
    bg: "bg-rose-50",
    ring: "ring-rose-100",
    icon: "text-rose-600",
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [previousTrips, setPreviousTrips] = useState<Trip[]>([]);
  const [todayTrips, setTodayTrips] = useState<Trip[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripCategory, setTripCategory] =
    useState<TripStatus>("today");

  const [tripMenuId, setTripMenuId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<
    AdminNotification[]
  >([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotification | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // --------------------------------------------------
  // CURRENT ADMIN / ROLE
  // --------------------------------------------------

  const [currentUser, setCurrentUser] = useState<
    AdminMeResponse["user"] | null
  >(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Only a superadmin may delete trips or invite new admins.
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

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );

  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", {
        cache: "no-store",
      });

      const data: AdminMeResponse = await res
        .json()
        .catch(() => ({ success: false }));

      if (!res.ok || !data.success || !data.user) {
        setCurrentUser(null);
        return;
      }
console.log('currentuser',data.user)
      setCurrentUser(data.user);
    } catch (error) {
      console.error("Failed to load current admin:", error);
      setCurrentUser(null);
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, tripsRes] = await Promise.all([
        fetch("/api/stats", {
          cache: "no-store",
        }),
        fetch("/api/bookings", {
          cache: "no-store",
        }),
        fetch("/api/trips/departures", {
          cache: "no-store",
        }),
      ]);

      if (!statsRes.ok) {
        throw new Error("Failed to fetch stats");
      }

      if (!bookingsRes.ok) {
        throw new Error("Failed to fetch bookings");
      }

      if (!tripsRes.ok) {
        throw new Error("Failed to fetch trip departures");
      }

      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();
      const tripsData = await tripsRes.json();

      setStats(statsData);
      setBookings(bookingsData.bookings || []);
      setPreviousTrips(tripsData.previousTrips || []);
      setTodayTrips(tripsData.todayTrips || []);
      setUpcomingTrips(tripsData.upcomingTrips || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await res.json();

      const fetched: AdminNotification[] =
        data.notifications || [];

      setNotifications(fetched);

      const hasReadFlag = fetched.some(
        (n) => typeof n.read === "boolean"
      );

      setNotificationCount(
        hasReadFlag
          ? fetched.filter((n) => !n.read).length
          : data.count || 0
      );
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
    loadData();
    loadNotifications();

    const interval = setInterval(() => {
      loadData();
      loadNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadCurrentUser, loadData, loadNotifications]);

  // Close the trip actions menu automatically if role info resolves
  // and the current admin turns out not to be a superadmin.
  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      setTripMenuId(null);
      setTripToDelete(null);
    }
  }, [roleLoading, isSuperAdmin]);

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

  async function handleSendAdminInvitation(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!isSuperAdmin) {
      setInviteError(
        "Only a super admin can send admin invitations."
      );
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to send admin invitation."
        );
      }

      setInviteSuccess(
        data.message ||
          "Admin invitation sent successfully."
      );

      setInviteEmail("");
    } catch (error) {
      console.error("Failed to send admin invitation:", error);

      setInviteError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSendingInvite(false);
    }
  }

  // --------------------------------------------------
  // BOOKINGS
  // --------------------------------------------------

  async function handleBookingAction(
    id: string,
    action: "approve" | "reject"
  ) {
    setActioningId(id);

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status:
            action === "approve"
              ? "approved"
              : "rejected",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setNotifications((prev) =>
        prev.filter((n) => n.bookingId?._id !== id)
      );

      setNotificationCount((prev) =>
        Math.max(0, prev - 1)
      );

      setSelectedNotification(null);

      alert(
        action === "approve"
          ? `Booking approved${
              data.emailSent
                ? " — confirmation email sent."
                : " (email failed to send, check logs)."
            }`
          : `Booking rejected${
              data.emailSent
                ? " — the passenger has been notified by email."
                : " (email failed to send, check logs)."
            }`
      );

      await Promise.all([
        loadData(),
        loadNotifications(),
      ]);
    } catch (err) {
      console.error(
        `Failed to ${action} booking:`,
        err
      );

      alert(
        `Something went wrong trying to ${action} this booking. Please try again.`
      );
    } finally {
      setActioningId(null);
    }
  }

  // --------------------------------------------------
  // DELETE TRIP
  // --------------------------------------------------

  async function handleDeleteTrip() {
    if (!isSuperAdmin) {
      alert("Only a super admin can delete trips.");
      setTripToDelete(null);
      return;
    }

    if (!tripToDelete?.busId || deletingTripId) {
      return;
    }

    const tripId = tripToDelete.busId;

    setDeletingTripId(tripId);

    try {
      const res = await fetch(
        `/api/admin/busses/${tripId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to delete trip"
        );
      }

      setPreviousTrips((prev) =>
        prev.filter(
          (trip) => trip.busId !== tripId
        )
      );

      setTodayTrips((prev) =>
        prev.filter(
          (trip) => trip.busId !== tripId
        )
      );

      setUpcomingTrips((prev) =>
        prev.filter(
          (trip) => trip.busId !== tripId
        )
      );

      setBookings((prev) =>
        prev.filter(
          (booking) =>
            booking.bus?._id !== tripId
        )
      );

      if (selectedTrip?.busId === tripId) {
        setSelectedTrip(null);
      }

      setTripMenuId(null);
      setTripToDelete(null);

      await loadData();
      await loadNotifications();
    } catch (error) {
      console.error(
        "Failed to delete trip:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the trip."
      );
    } finally {
      setDeletingTripId(null);
    }
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const res = await fetch(
        "/api/admin/logout",
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error(
          "Logout request failed"
        );
      }
    } catch (err) {
      console.error(
        "Failed to log out:",
        err
      );
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);

      router.push("/admin/login");
      router.refresh();
    }
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats?.bookedSeats ?? "—",
      icon: CalendarCheck,
    },
    {
      title: "Today's Bookings",
      value: stats?.todaysBookedSeats ?? "—",
      icon: TrendingUp,
    },
    {
      title: "Active Buses",
      value: stats?.totalBuses ?? "—",
      icon: Bus,
    },
    {
      title: "Passengers",
      value: stats?.bookedSeats ?? "—",
      icon: Users,
    },
  ];

  const pendingBookings = bookings.filter(
    (b) => b.status === "pending"
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      bookings.length / BOOKINGS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex =
    (currentPage - 1) *
    BOOKINGS_PER_PAGE;

  const paginatedBookings =
    bookings.slice(
      startIndex,
      startIndex + BOOKINGS_PER_PAGE
    );

  const activeTrips =
    tripCategory === "previous"
      ? previousTrips
      : tripCategory === "today"
        ? todayTrips
        : upcomingTrips;

  const tripCounts = {
    previous: previousTrips.length,
    today: todayTrips.length,
    upcoming: upcomingTrips.length,
  };

  function goToPage(page: number) {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  }

  function handleNotificationClick(
    notification: AdminNotification
  ) {
    setSelectedNotification(
      notification
    );

    setShowNotifications(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[270px]
          flex-col bg-gradient-to-b from-[#0b2e33] via-[#0c3238] to-[#082226]
          text-white shadow-2xl transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* LOGO */}

        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-6">

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400 text-lg font-black text-[#063d43] shadow-lg shadow-teal-500/30">
              H
            </div>

            <div>
              <p className="text-base font-black tracking-wide text-white">
                HAIKAL
              </p>

              <p className="text-[9px] font-bold tracking-[0.3em] text-teal-300">
                TOURS ADMIN
              </p>
            </div>
          </Link>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>

        </div>

        {/* SIDEBAR MENU */}

        <div className="flex-1 overflow-y-auto px-4 py-5">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Main Menu
          </p>

          <nav className="space-y-1">

            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.name === "Dashboard";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
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

                  <span>
                    {item.name}
                  </span>

                  {item.name ===
                    "Bookings" &&
                    pendingBookings.length >
                      0 && (
                      <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                        {
                          pendingBookings.length
                        }
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

            {/* SETTINGS DROPDOWN */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(
                    (current) => !current
                  )
                }
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

                <span>
                  Settings
                </span>

                <ChevronRight
                  size={16}
                  className={`
                    ml-auto transition-transform
                    ${
                      settingsOpen
                        ? "rotate-90 text-teal-300"
                        : "text-white/30"
                    }
                  `}
                />

              </button>

              {settingsOpen && (
                <div className="mt-1 overflow-hidden rounded-xl border border-white/10 bg-black/10">

                  {/* INVITE ADMIN — SUPERADMIN ONLY */}

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={openInviteAdmin}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                    >

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10">
                        <UserPlus
                          size={16}
                          className="text-teal-300"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold">
                          Invite as Admin
                        </p>

                        <p className="mt-0.5 text-[10px] text-white/30">
                          Send an admin invitation
                        </p>
                      </div>

                    </button>
                  )}

                  {/* NORMAL SETTINGS */}

                  <Link
                    href="/admin/settings"
                    onClick={() =>
                      setSidebarOpen(false)
                    }
                    className={`group flex items-center gap-3 px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white ${
                      isSuperAdmin
                        ? "border-t border-white/5"
                        : ""
                    }`}
                  >

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                      <Settings
                        size={16}
                        className="text-white/40 group-hover:text-teal-300"
                      />
                    </div>

                    <div>
                      <p className="font-semibold">
                        General Settings
                      </p>

                      <p className="mt-0.5 text-[10px] text-white/30">
                        Manage dashboard settings
                      </p>
                    </div>

                  </Link>

                </div>
              )}

            </div>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={() =>
                setConfirmLogout(true)
              }
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
              {(currentUser?.username || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-bold text-white">
                {currentUser?.username ||
                  "Administrator"}
              </p>

              <p className="truncate text-xs text-white/40">
                {isSuperAdmin
                  ? "Super Admin"
                  : "Admin"}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setConfirmLogout(true)
              }
              title="Log out"
              className="text-white/40 transition hover:text-rose-300"
            >
              <LogOut size={17} />
            </button>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="lg:ml-[270px]">

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">
                Dashboard
              </h1>

              <p className="hidden text-xs text-slate-400 sm:block">
                Welcome back, {currentUser?.username || "Administrator"}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">

              <Search
                size={17}
                className="text-slate-400"
              />

              <input
                placeholder="Search..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

            </div>

            <button
              type="button"
              onClick={() =>
                setShowNotifications(true)
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >

              <Bell size={18} />

              {notificationCount > 0 && (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white shadow-md">
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}

            </button>

            <div className="hidden items-center gap-2 sm:flex">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 ring-1 ring-teal-100">
                {(currentUser?.username || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="hidden xl:block">

                <p className="text-sm font-bold text-slate-800">
                  {currentUser?.username ||
                    "Administrator"}
                </p>

                <p className="text-[11px] text-slate-400">
                  {isSuperAdmin
                    ? "Super Admin"
                    : "Admin"}
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="p-4 sm:p-6 lg:p-8">

          {/* PAGE TITLE */}

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-medium text-teal-700">
                Overview
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                Good morning, Admin 👋
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Here is what's happening with Haikal Tours today.
              </p>

            </div>

            <Link
              href="/admin/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-3 text-sm font-bold text-white shadow-sm shadow-teal-900/10 transition hover:bg-[#052f34]"
            >
              View all bookings
              <ArrowUpRight size={16} />
            </Link>

          </div>

          {/* STAT CARDS */}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">

            {statCards.map((stat, i) => {

              const Icon = stat.icon;

              const accent =
                STAT_ACCENTS[
                  i % STAT_ACCENTS.length
                ];

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                >

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.bg} ring-1 ${accent.ring}`}
                  >
                    <Icon
                      size={21}
                      className={accent.icon}
                    />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-500 sm:mt-5 sm:text-sm">
                    {stat.title}
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">

                    {loading ? (
                      <Loader2
                        size={20}
                        className="animate-spin text-slate-300"
                      />
                    ) : (
                      stat.value
                    )}

                  </p>

                </div>
              );
            })}

          </div>

          {/* PENDING BOOKING REQUESTS */}

          {pendingBookings.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">

              <div className="mb-4 flex items-center justify-between">

                <h3 className="flex items-center gap-2 font-bold text-amber-800">
                  <Clock3 size={18} />
                  Pending booking requests (
                  {pendingBookings.length})
                </h3>

              </div>

              <div className="space-y-3">

                {pendingBookings.map((b) => (
                  <div
                    key={b._id}
                    className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="text-sm font-bold text-slate-900">
                        {b.passengerName}

                        <span className="font-normal text-slate-400">
                          {" "}
                          · {b.bookingRef}
                        </span>
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {b.route} ·{" "}
                        {b.passengerPhone}
                      </p>

                    </div>

                    <div className="flex gap-2">

                      <button
                        disabled={
                          actioningId === b._id
                        }
                        onClick={() =>
                          handleBookingAction(
                            b._id,
                            "approve"
                          )
                        }
                        className="flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
                      >

                        {actioningId ===
                        b._id ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Check size={13} />
                        )}

                        Accept

                      </button>

                      <button
                        disabled={
                          actioningId === b._id
                        }
                        onClick={() =>
                          handleBookingAction(
                            b._id,
                            "reject"
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >

                        <X size={13} />

                        Decline

                      </button>

                    </div>

                  </div>
                ))}

              </div>

              <p className="mt-3 text-[11px] text-amber-700">
                Accepting sends a WhatsApp confirmation immediately and emails the passenger now.
              </p>

            </div>
          )}

          {/* MAIN GRID */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

            {/* RECENT BOOKINGS */}

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 p-5">

                <div>

                  <h3 className="font-bold text-slate-900">
                    Recent Bookings
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Latest customer reservations
                  </p>

                </div>

                <Link
                  href="/admin/bookings"
                  className="flex items-center gap-1 text-xs font-bold text-teal-700"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>

              </div>

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full text-left">

                  <thead>

                    <tr className="border-b border-slate-100 bg-slate-50/60 text-xs text-slate-400">

                      <th className="px-5 py-4 font-semibold">
                        Booking
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Passenger
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Route
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Bus
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Gender
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {!loading &&
                      paginatedBookings.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-8 text-center text-sm text-slate-400"
                          >
                            No bookings yet.
                          </td>
                        </tr>
                      )}

                    {paginatedBookings.map(
                      (booking) => (
                        <tr
                          key={booking._id}
                          className="cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-teal-50/40"
                        >

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block"
                            >

                              <p className="text-xs font-bold text-slate-800">
                                {
                                  booking.bookingRef
                                }
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                {
                                  booking.travelTime ||
                                  "-"
                                }
                              </p>

                            </Link>

                          </td>

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block text-sm font-semibold text-slate-800 hover:text-teal-700 hover:underline"
                            >
                              {
                                booking.passengerName
                              }
                            </Link>

                          </td>

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block"
                            >

                              <p className="max-w-[170px] truncate text-xs text-slate-600">
                                {booking.route}
                              </p>

                            </Link>

                          </td>

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block"
                            >

                              <p className="text-xs font-bold text-slate-700">
                                {
                                  booking.bus
                                    ?.busNumber ||
                                  "—"
                                }
                              </p>

                              <p className="text-[11px] text-slate-400">
                                Seat{" "}
                                {booking.seat ||
                                  "-"}
                              </p>

                            </Link>

                          </td>

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block"
                            >

                              <p className="max-w-[170px] truncate text-xs text-slate-600">
                                {
                                  booking.gender
                                }
                              </p>

                            </Link>

                          </td>

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block"
                            >

                              {booking.status ===
                                "approved" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                                  <CircleCheck
                                    size={12}
                                  />
                                  Confirmed
                                </span>
                              )}

                              {booking.status ===
                                "pending" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                                  <Clock3
                                    size={12}
                                  />
                                  Pending
                                </span>
                              )}

                              {booking.status ===
                                "rejected" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                                  <CircleAlert
                                    size={12}
                                  />
                                  Cancelled
                                </span>
                              )}

                            </Link>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* MOBILE BOOKINGS */}

              <div className="divide-y divide-slate-100 md:hidden">

                {paginatedBookings.map(
                  (booking) => (
                    <Link
                      key={booking._id}
                      href={`/admin/bookings/${booking._id}`}
                      className="block p-4 transition hover:bg-teal-50/40"
                    >

                      <div className="flex items-start justify-between">

                        <div>

                          <p className="text-xs font-bold text-slate-400">
                            {
                              booking.bookingRef
                            }
                          </p>

                          <p className="mt-1 font-bold text-slate-900">
                            {
                              booking.passengerName
                            }
                          </p>

                        </div>

                        {booking.status ===
                          "approved" && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                            Confirmed
                          </span>
                        )}

                        {booking.status ===
                          "pending" && (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                            Pending
                          </span>
                        )}

                        {booking.status ===
                          "rejected" && (
                          <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">
                            Cancelled
                          </span>
                        )}

                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">

                        <span>
                          {booking.route}
                        </span>

                        <span className="font-semibold">
                          {
                            booking.bus
                              ?.busNumber ||
                            "—"
                          }{" "}
                          ·{" "}
                          {booking.seat ||
                            "-"}
                        </span>

                      </div>

                    </Link>
                  )
                )}

              </div>

              {/* PAGINATION */}

              {bookings.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">

                  <p className="text-xs text-slate-400">

                    Showing{" "}

                    <span className="font-bold text-slate-600">
                      {startIndex + 1}-
                      {Math.min(
                        startIndex +
                          BOOKINGS_PER_PAGE,
                        bookings.length
                      )}
                    </span>{" "}

                    of{" "}

                    <span className="font-bold text-slate-600">
                      {bookings.length}
                    </span>{" "}
                    bookings

                  </p>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage - 1
                        )
                      }
                      disabled={
                        currentPage === 1
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={15}
                      />
                    </button>

                    <span className="px-2 text-xs font-bold text-slate-600">
                      Page {currentPage} of{" "}
                      {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage + 1
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight
                        size={15}
                      />
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* TRIP DEPARTURES */}

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-4 sm:p-5">

                <div className="flex flex-col gap-4">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <div className="flex items-center gap-2">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                          <Bus
                            size={18}
                            className="text-slate-700"
                          />
                        </div>

                        <div>

                          <h3 className="font-bold text-slate-900">
                            Trip Departures
                          </h3>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Previous, today and upcoming trips
                          </p>

                        </div>

                      </div>

                    </div>

                    <Link
                      href="/admin/trips"
                      className="hidden items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50 sm:flex"
                    >
                      Manage
                      <ChevronRight
                        size={14}
                      />
                    </Link>

                  </div>

                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">

                    <button
                      type="button"
                      onClick={() =>
                        setTripCategory(
                          "previous"
                        )
                      }
                      className={`rounded-lg px-2 py-2 text-[10px] font-black transition sm:text-xs ${
                        tripCategory ===
                        "previous"
                          ? "bg-white text-slate-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Previous
                      <span className="ml-1 opacity-60">
                        ({tripCounts.previous})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTripCategory(
                          "today"
                        )
                      }
                      className={`rounded-lg px-2 py-2 text-[10px] font-black transition sm:text-xs ${
                        tripCategory ===
                        "today"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Today
                      <span className="ml-1 opacity-60">
                        ({tripCounts.today})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTripCategory(
                          "upcoming"
                        )
                      }
                      className={`rounded-lg px-2 py-2 text-[10px] font-black transition sm:text-xs ${
                        tripCategory ===
                        "upcoming"
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Upcoming
                      <span className="ml-1 opacity-60">
                        ({tripCounts.upcoming})
                      </span>
                    </button>

                  </div>

                </div>

              </div>

              <div className="divide-y divide-slate-100">

                {loading && (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Loading departures...
                  </div>
                )}

                {!loading &&
                  activeTrips.length ===
                    0 && (
                    <div className="px-5 py-10 text-center">

                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                        <Bus
                          size={21}
                          className="text-slate-400"
                        />
                      </div>

                      <p className="mt-3 text-sm font-bold text-slate-700">
                        No {tripCategory} trips
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        There are no trips in this category right now.
                      </p>

                    </div>
                  )}

                {!loading &&
                  activeTrips.map((trip) => {

                    const capacity =
                      Number(
                        trip.capacity || 0
                      );

                    const booked =
                      Number(
                        trip.bookedSeats ??
                          trip.passengerCount ??
                          0
                      );

                    const occupancy =
                      capacity > 0
                        ? Math.min(
                            (booked /
                              capacity) *
                              100,
                            100
                          )
                        : 0;

                    const statusConfig =
                      trip.status ===
                      "previous"
                        ? {
                            label:
                              "PREVIOUS",
                            badge:
                              "bg-slate-100 text-slate-600 ring-slate-200",
                            icon:
                              "bg-slate-100 text-slate-500 ring-slate-200",
                            bar:
                              "bg-slate-400",
                          }
                        : trip.status ===
                            "today"
                          ? {
                              label:
                                "TODAY",
                              badge:
                                "bg-emerald-50 text-emerald-700 ring-emerald-100",
                              icon:
                                "bg-emerald-50 text-emerald-700 ring-emerald-100",
                              bar:
                                "bg-emerald-500",
                            }
                          : {
                              label:
                                "UPCOMING",
                              badge:
                                "bg-blue-50 text-blue-700 ring-blue-100",
                              icon:
                                "bg-blue-50 text-blue-700 ring-blue-100",
                              bar:
                                "bg-blue-500",
                            };

                    return (
                      <div
                        key={`${trip.busId}-${trip.date}-${trip.departure}`}
                        className="relative p-4 transition hover:bg-slate-50/70 sm:p-5"
                      >

                        {/* TRIP ACTIONS — SUPERADMIN ONLY */}

                        {isSuperAdmin && (
                          <div className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4">

                            <button
                              type="button"
                              aria-label={`Trip actions for ${
                                trip.busName ||
                                trip.busNumber ||
                                "Bus"
                              }`}
                              onClick={(event) => {
                                event.stopPropagation();

                                setTripMenuId(
                                  (current) =>
                                    current ===
                                    trip.busId
                                      ? null
                                      : trip.busId
                                );
                              }}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition sm:h-9 sm:w-9 ${
                                tripMenuId ===
                                trip.busId
                                  ? "border-slate-300 bg-slate-100 text-slate-700"
                                  : "border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-700"
                              }`}
                            >
                              <MoreVertical
                                size={17}
                              />
                            </button>

                            {tripMenuId ===
                              trip.busId && (
                              <div className="absolute right-0 top-10 z-30 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 sm:top-11">

                                <button
                                  type="button"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    setTripToDelete(
                                      trip
                                    );

                                    setTripMenuId(
                                      null
                                    );
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                                >

                                  <Trash2
                                    size={15}
                                  />

                                  Delete trip

                                </button>

                              </div>
                            )}

                          </div>
                        )}

                        <div
                          className={`flex items-start gap-3 ${
                            isSuperAdmin
                              ? "pr-8 sm:pr-10"
                              : ""
                          }`}
                        >

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${statusConfig.icon}`}
                          >
                            <Bus size={18} />
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <p className="truncate text-sm font-black text-slate-900">
                                    {trip.busName ||
                                      trip.busNumber ||
                                      "Bus"}
                                  </p>

                                  {trip.busNumber &&
                                    trip.busName &&
                                    trip.busNumber !==
                                      trip.busName && (
                                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                                        {
                                          trip.busNumber
                                        }
                                      </span>
                                    )}

                                  <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-black ring-1 ${statusConfig.badge}`}
                                  >
                                    {
                                      statusConfig.label
                                    }
                                  </span>

                                </div>

                                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-600">

                                  <Route
                                    size={12}
                                    className="shrink-0 text-slate-400"
                                  />

                                  <span className="truncate">
                                    {trip.route ||
                                      `${
                                        trip.pickup ||
                                        "—"
                                      } → ${
                                        trip.dropoff ||
                                        "—"
                                      }`}
                                  </span>

                                </p>

                              </div>

                              <div className="shrink-0 text-left sm:text-right">

                                <p className="text-xs font-black text-slate-800">
                                  {trip.date
                                    ? new Date(
                                        `${trip.date}T00:00:00`
                                      ).toLocaleDateString(
                                        undefined,
                                        {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        }
                                      )
                                    : "—"}
                                </p>

                                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-400 sm:justify-end">

                                  <Clock3
                                    size={11}
                                  />

                                  {trip.departure ||
                                    "—"}

                                  {trip.arrival
                                    ? ` → ${trip.arrival}`
                                    : ""}

                                </p>

                              </div>

                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">

                              <div className="rounded-xl bg-slate-50 p-2.5">

                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Driver
                                </p>

                                <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-bold text-slate-700">

                                  <UserRound
                                    size={12}
                                    className="shrink-0 text-slate-400"
                                  />

                                  {trip.driverName ||
                                    "Not assigned"}

                                </p>

                              </div>

                              <div className="rounded-xl bg-slate-50 p-2.5">

                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Seats
                                </p>

                                <p className="mt-1 text-xs font-bold text-slate-700">
                                  {booked}/
                                  {capacity ||
                                    "—"}{" "}
                                  booked
                                </p>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTrip(
                                    trip
                                  )
                                }
                                className="col-span-2 rounded-xl bg-teal-50 p-2.5 text-left ring-1 ring-teal-100 transition hover:bg-teal-100 sm:col-span-1"
                              >

                                <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-teal-600">

                                  <UsersRound
                                    size={11}
                                  />

                                  Passengers

                                </p>

                                <p className="mt-1 flex items-center justify-between gap-2 text-xs font-black text-teal-800">

                                  <span>
                                    {trip.passengerCount ??
                                      trip.passengers
                                        ?.length ??
                                      0}{" "}
                                    passenger
                                    {(trip.passengerCount ??
                                      trip.passengers
                                        ?.length ??
                                      0) !==
                                    1
                                      ? "s"
                                      : ""}
                                  </span>

                                  <Eye
                                    size={13}
                                  />

                                </p>

                              </button>

                            </div>

                            <div className="mt-3">

                              <div className="mb-1.5 flex items-center justify-between">

                                <span className="text-[10px] font-medium text-slate-400">
                                  Occupancy
                                </span>

                                <span className="text-[10px] font-bold text-slate-500">
                                  {Math.round(
                                    occupancy
                                  )}
                                  %
                                </span>

                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                                <div
                                  className={`h-full rounded-full transition-all ${statusConfig.bar}`}
                                  style={{
                                    width: `${occupancy}%`,
                                  }}
                                />

                              </div>

                            </div>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">

                                {trip.duration && (
                                  <span>
                                    {
                                      trip.duration
                                    }
                                  </span>
                                )}

                                {trip.price !=
                                  null && (
                                  <span className="font-semibold">
                                    Rs.{" "}
                                    {Number(
                                      trip.price
                                    ).toLocaleString()}
                                  </span>
                                )}

                                {trip.bookingCount !=
                                  null && (
                                  <span>
                                    {
                                      trip.bookingCount
                                    }{" "}
                                    booking
                                    {trip.bookingCount !==
                                    1
                                      ? "s"
                                      : ""}
                                  </span>
                                )}

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/admin/trips/today/${trip.busId}`
                                  )
                                }
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                              >
                                View trip
                                <ArrowUpRight
                                  size={12}
                                />
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  })}

              </div>

              <div className="border-t border-slate-100 p-4">

                <Link
                  href="/admin/trips"
                  className="flex items-center justify-center gap-1 rounded-xl bg-slate-50 py-3 text-xs font-bold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  Manage all trips
                  <ChevronRight
                    size={14}
                  />
                </Link>

              </div>

            </div>

          </div>

          {/* QUICK ACTIONS */}

          <div className="mt-6">

            <h3 className="mb-4 text-lg font-bold text-slate-900">
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

              <QuickAction
                href="/admin/bookings"
                icon={CalendarCheck}
                label="Bookings"
              />

              <QuickAction
                href="/admin/trips"
                icon={Bus}
                label="Add Trip"
              />

              <QuickAction
                href="/admin/drivers"
                icon={UserRoundCog}
                label="Drivers"
              />

              <QuickAction
                href="/admin/routes"
                icon={Navigation}
                label="Routes"
              />

              <QuickAction
                href="/admin/destinations"
                icon={MapPin}
                label="Destination"
              />

              {/* INVITE ADMIN — SUPERADMIN ONLY */}

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={openInviteAdmin}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md sm:p-5"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">

                    <UserPlus
                      size={20}
                      className="text-teal-700"
                    />

                  </div>

                  <span className="text-xs font-bold text-slate-700">
                    Invite Admin
                  </span>

                </button>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* ========================================================= */}
      {/* INVITE ADMIN MODAL — SUPERADMIN ONLY */}
      {/* ========================================================= */}

      {showInviteAdmin && isSuperAdmin && (
        <div
          className="fixed inset-0 z-[10010] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeInviteAdmin}
        >

          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">

                    <UserPlus
                      size={21}
                      className="text-teal-700"
                    />

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

            {/* BODY */}

            <form
              onSubmit={
                handleSendAdminInvitation
              }
            >

              <div className="space-y-5 p-6">

                {/* INFO */}

                <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">

                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-teal-700"
                  />

                  <div>

                    <p className="text-xs font-bold text-slate-700">
                      How this works
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The person will receive an email with an
                      <span className="font-semibold text-slate-700">
                        {" "}Accept Invitation
                      </span>
                      {" "}button. They can then create their
                      admin password and sign in.
                    </p>

                  </div>

                </div>

                {/* EMAIL */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email address
                  </label>

                  <div className="relative">

                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) =>
                        setInviteEmail(
                          e.target.value
                        )
                      }
                      placeholder="admin@example.com"
                      autoComplete="email"
                      autoFocus
                      disabled={sendingInvite}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>

                {/* ERROR */}

                {inviteError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">

                    <CircleAlert
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {inviteError}
                    </span>

                  </div>
                )}

                {/* SUCCESS */}

                {inviteSuccess && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">

                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {inviteSuccess}
                    </span>

                  </div>
                )}

              </div>

              {/* FOOTER */}

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
                    disabled={
                      sendingInvite ||
                      !inviteEmail.trim()
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#063d43] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {sendingInvite ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
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

      {/* ========================================================= */}
      {/* NOTIFICATION MODAL */}
      {/* ========================================================= */}

      {showNotifications && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/50 p-4 pt-20 backdrop-blur-sm"
          onClick={() =>
            setShowNotifications(false)
          }
        >

          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Booking Notifications
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {unreadNotifications.length} pending request
                  {unreadNotifications.length !==
                  1
                    ? "s"
                    : ""}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

            </div>

            <div className="max-h-[500px] overflow-y-auto">

              {unreadNotifications.length ===
              0 ? (
                <div className="px-5 py-12 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">

                    <Bell
                      size={24}
                      className="text-slate-400"
                    />

                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-700">
                    No new notifications
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    New booking requests will appear here.
                  </p>

                </div>
              ) : (
                unreadNotifications.map(
                  (notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className="flex w-full gap-4 border-b border-slate-100 p-5 text-left transition hover:bg-rose-50/60"
                    >

                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">

                        <Bell
                          size={19}
                          className="text-rose-500"
                        />

                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <p className="text-sm font-bold text-slate-900">
                            {
                              notification.title
                            }
                          </p>

                          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-[9px] font-black uppercase text-rose-600">
                            New
                          </span>

                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {
                            notification.message
                          }
                        </p>

                        {notification.bookingId && (
                          <p className="mt-2 text-[10px] font-bold text-teal-700">
                            Booking #
                            {
                              notification
                                .bookingId
                                .bookingRef
                            }
                          </p>
                        )}

                      </div>

                    </button>
                  )
                )
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PENDING BOOKING REQUEST MODAL */}
      {/* ========================================================= */}

      {selectedNotification?.bookingId && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4"
          onClick={() =>
            setSelectedNotification(null)
          }
        >

          <div
            className="flex w-full max-w-xl max-h-[calc(100dvh-16px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-32px)] sm:rounded-3xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-3 py-3 sm:px-6 sm:py-5">

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 sm:h-10 sm:w-10 sm:rounded-xl">

                  <CalendarCheck
                    size={17}
                    className="text-rose-500 sm:h-[19px] sm:w-[19px]"
                  />

                </div>

                <div className="min-w-0">

                  <h3 className="truncate text-sm font-black leading-tight text-slate-900 sm:text-base">
                    Pending Booking Request
                  </h3>

                  <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-xs">
                    Review and approve this reservation
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(null)
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:h-9 sm:w-9 sm:rounded-xl"
              >
                <X size={17} />
              </button>

            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:space-y-4 sm:p-6">

              <div className="rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4">

                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  Booking Reference
                </p>

                <p className="mt-1 text-base font-black text-teal-700 sm:text-lg">
                  {
                    selectedNotification
                      .bookingId
                      .bookingRef
                  }
                </p>

              </div>

              <div className="rounded-xl border border-slate-100 p-3 sm:rounded-2xl sm:p-4">

                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-xs">
                  Passenger
                </p>

                <div className="space-y-2">

                  <div className="flex items-center justify-between gap-3">

                    <span className="shrink-0 text-xs text-slate-400 sm:text-sm">
                      Name
                    </span>

                    <span className="min-w-0 truncate text-right text-xs font-bold text-slate-900 sm:text-sm">
                      {
                        selectedNotification
                          .bookingId
                          .passengerName
                      }
                    </span>

                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <span className="shrink-0 text-xs text-slate-400 sm:text-sm">
                      Phone
                    </span>

                    <span className="min-w-0 truncate text-right text-xs font-bold text-slate-900 sm:text-sm">
                      {
                        selectedNotification
                          .bookingId
                          .passengerPhone
                      }
                    </span>

                  </div>

                  {selectedNotification
                    .bookingId
                    .passengerEmail && (
                    <div className="flex items-center justify-between gap-3">

                      <span className="shrink-0 text-xs text-slate-400 sm:text-sm">
                        Email
                      </span>

                      <span className="min-w-0 truncate text-right text-xs font-bold text-slate-900 sm:text-sm">
                        {
                          selectedNotification
                            .bookingId
                            .passengerEmail
                        }
                      </span>

                    </div>
                  )}

                </div>

              </div>

              <div className="rounded-xl border border-slate-100 p-3 sm:rounded-2xl sm:p-4">

                <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs">
                  Trip Details
                </p>

                <div className="space-y-3">

                  <div className="flex items-start gap-2.5 sm:gap-3">

                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-teal-700 sm:h-[17px] sm:w-[17px]"
                    />

                    <div className="min-w-0">

                      <p className="text-[9px] text-slate-400 sm:text-[10px]">
                        Route
                      </p>

                      <p className="break-words text-xs font-bold text-slate-900 sm:text-sm">
                        {
                          selectedNotification
                            .bookingId
                            .route
                        }
                      </p>

                    </div>

                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3">

                    <Bus
                      size={16}
                      className="mt-0.5 shrink-0 text-teal-700 sm:h-[17px] sm:w-[17px]"
                    />

                    <div className="min-w-0">

                      <p className="text-[9px] text-slate-400 sm:text-[10px]">
                        Bus
                      </p>

                      <p className="text-xs font-bold text-slate-900 sm:text-sm">
                        {
                          selectedNotification
                            .bookingId
                            .bus?.busNumber ||
                          "—"
                        }
                      </p>

                    </div>

                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3">

                    <Clock3
                      size={16}
                      className="mt-0.5 shrink-0 text-teal-700 sm:h-[17px] sm:w-[17px]"
                    />

                    <div className="min-w-0">

                      <p className="text-[9px] text-slate-400 sm:text-[10px]">
                        Departure
                      </p>

                      <p className="text-xs font-bold text-slate-900 sm:text-sm">
                        {
                          selectedNotification
                            .bookingId
                            .travelDate
                            ? new Date(
                                selectedNotification
                                  .bookingId
                                  .travelDate
                              ).toLocaleDateString()
                            : "—"
                        }
                        {" · "}
                        {
                          selectedNotification
                            .bookingId
                            .travelTime ||
                          "—"
                        }
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              <div className="rounded-xl bg-teal-50 p-3 sm:rounded-2xl sm:p-4">

                <p className="text-[9px] font-bold uppercase tracking-wider text-teal-600 sm:text-[10px]">
                  Selected Seats
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">

                  {(
                    selectedNotification
                      .bookingId
                      .seats || []
                  ).map((seat) => (
                    <span
                      key={seat}
                      className="rounded-lg bg-teal-700 px-2.5 py-1 text-[10px] font-black text-white sm:px-3 sm:py-1.5 sm:text-xs"
                    >
                      Seat {seat}
                    </span>
                  ))}

                </div>

              </div>

            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4">

              <div className="grid grid-cols-2 gap-2 sm:gap-3">

                <button
                  type="button"
                  disabled={
                    actioningId ===
                    selectedNotification
                      .bookingId
                      ._id
                  }
                  onClick={() =>
                    handleBookingAction(
                      selectedNotification
                        .bookingId!
                        ._id,
                      "reject"
                    )
                  }
                  className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
                >

                  {actioningId ===
                  selectedNotification
                    .bookingId
                    ._id ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <X size={15} />
                  )}

                  Reject

                </button>

                <button
                  type="button"
                  disabled={
                    actioningId ===
                    selectedNotification
                      .bookingId
                      ._id
                  }
                  onClick={() =>
                    handleBookingAction(
                      selectedNotification
                        .bookingId!
                        ._id,
                      "approve"
                    )
                  }
                  className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-2 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
                >

                  {actioningId ===
                  selectedNotification
                    .bookingId
                    ._id ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={15} />
                  )}

                  Approve

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PASSENGER DETAILS MODAL */}
      {/* ========================================================= */}

      {selectedTrip && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4"
          onClick={() =>
            setSelectedTrip(null)
          }
        >

          <div
            className="flex w-full max-w-2xl max-h-[calc(100dvh-16px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-32px)] sm:rounded-3xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="text-base font-black text-slate-900 sm:text-lg">
                    Passengers
                  </h3>

                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-black ${
                      selectedTrip.status ===
                      "previous"
                        ? "bg-slate-100 text-slate-600"
                        : selectedTrip.status ===
                            "today"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {selectedTrip.status.toUpperCase()}
                  </span>

                </div>

                <p className="mt-1 truncate text-xs text-slate-400">

                  {selectedTrip.busName ||
                    selectedTrip.busNumber ||
                    "Bus"}{" "}
                  ·{" "}

                  {selectedTrip.route ||
                    `${
                      selectedTrip.pickup ||
                      "—"
                    } → ${
                      selectedTrip.dropoff ||
                      "—"
                    }`}

                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTrip(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">

              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">

                <div className="rounded-xl bg-slate-50 p-3">

                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Date
                  </p>

                  <p className="mt-1 text-xs font-black text-slate-800">

                    {selectedTrip.date
                      ? new Date(
                          `${selectedTrip.date}T00:00:00`
                        ).toLocaleDateString(
                          undefined,
                          {
                            day: "2-digit",
                            month: "short",
                          }
                        )
                      : "—"}

                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-3">

                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Departure
                  </p>

                  <p className="mt-1 text-xs font-black text-slate-800">
                    {
                      selectedTrip.departure ||
                      "—"
                    }
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-3">

                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Driver
                  </p>

                  <p className="mt-1 truncate text-xs font-black text-slate-800">
                    {
                      selectedTrip.driverName ||
                      "Not assigned"
                    }
                  </p>

                </div>

                <div className="rounded-xl bg-teal-50 p-3">

                  <p className="text-[9px] font-bold uppercase tracking-wider text-teal-600">
                    Passengers
                  </p>

                  <p className="mt-1 text-xs font-black text-teal-800">
                    {selectedTrip.passengerCount ??
                      selectedTrip.passengers
                        ?.length ??
                      0}
                  </p>

                </div>

              </div>

              {(
                selectedTrip.passengers
                  ?.length || 0
              ) === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Users
                      size={21}
                      className="text-slate-400"
                    />
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-700">
                    No passengers
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    No passenger records are attached to this trip.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {selectedTrip.passengers?.map(
                    (
                      passenger,
                      index
                    ) => (
                      <div
                        key={`${
                          passenger.id ||
                          passenger.bookingRef ||
                          "passenger"
                        }-${index}`}
                        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                      >

                        <div className="flex items-start gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-black text-teal-700 ring-1 ring-teal-100">
                            {(
                              passenger.name ||
                              "P"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                              <div className="min-w-0">

                                <p className="truncate text-sm font-black text-slate-900">
                                  {
                                    passenger.name ||
                                    "Passenger"
                                  }
                                </p>

                                <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                                  {passenger.bookingRef
                                    ? `Booking #${passenger.bookingRef}`
                                    : "Booking reference unavailable"}
                                </p>

                              </div>

                              <div className="flex flex-wrap gap-1.5">

                                {passenger.gender && (
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold capitalize text-slate-600">
                                    {
                                      passenger.gender
                                    }
                                  </span>
                                )}

                                {passenger.status && (
                                  <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${
                                      passenger.status ===
                                        "approved" ||
                                      passenger.status ===
                                        "confirmed"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : passenger.status ===
                                            "pending"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {
                                      passenger.status
                                    }
                                  </span>
                                )}

                              </div>

                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">

                              <div className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">

                                <Phone
                                  size={13}
                                  className="shrink-0 text-slate-400"
                                />

                                <span className="truncate text-xs font-semibold text-slate-600">
                                  {
                                    passenger.phone ||
                                    "Phone not available"
                                  }
                                </span>

                              </div>

                              <div className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">

                                <Mail
                                  size={13}
                                  className="shrink-0 text-slate-400"
                                />

                                <span className="truncate text-xs font-semibold text-slate-600">
                                  {
                                    passenger.email ||
                                    "Email not available"
                                  }
                                </span>

                              </div>

                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Seats
                              </span>

                              {(
                                passenger.seats ||
                                []
                              ).length > 0 ? (
                                passenger.seats?.map(
                                  (seat) => (
                                    <span
                                      key={seat}
                                      className="rounded-lg bg-teal-700 px-2 py-1 text-[10px] font-black text-white"
                                    >
                                      {seat}
                                    </span>
                                  )
                                )
                              ) : (
                                <span className="text-xs font-semibold text-slate-500">
                                  No seat information
                                </span>
                              )}

                            </div>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4">

              <button
                type="button"
                onClick={() =>
                  setSelectedTrip(null)
                }
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE TRIP CONFIRMATION — SUPERADMIN ONLY */}
      {/* ========================================================= */}

      {tripToDelete && isSuperAdmin && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() =>
            !deletingTripId &&
            setTripToDelete(null)
          }
        >

          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="p-6 sm:p-7">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-100">
                <Trash2
                  size={23}
                  className="text-rose-500"
                />
              </div>

              <h3 className="mt-5 text-center text-lg font-black text-slate-900 sm:text-xl">
                Delete this trip?
              </h3>

              <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                Are you sure you want to delete this trip? This will permanently remove the bus and all passenger bookings associated with it.
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                <p className="text-xs font-black text-slate-900">
                  {tripToDelete.busName ||
                    tripToDelete.busNumber ||
                    "Bus"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {tripToDelete.route ||
                    `${
                      tripToDelete.pickup ||
                      "—"
                    } → ${
                      tripToDelete.dropoff ||
                      "—"
                    }`}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-400">

                  {tripToDelete.date && (
                    <span>
                      {tripToDelete.date}
                    </span>
                  )}

                  {tripToDelete.departure && (
                    <span>
                      ·{" "}
                      {
                        tripToDelete.departure
                      }
                    </span>
                  )}

                  <span>
                    ·{" "}
                    {tripToDelete.passengerCount ??
                      0}{" "}
                    passenger
                    {(tripToDelete.passengerCount ??
                      0) !== 1
                      ? "s"
                      : ""}
                  </span>

                </div>

              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setTripToDelete(null)
                  }
                  disabled={
                    !!deletingTripId
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteTrip
                  }
                  disabled={
                    deletingTripId ===
                    tripToDelete.busId
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {deletingTripId ===
                  tripToDelete.busId ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  {deletingTripId ===
                  tripToDelete.busId
                    ? "Deleting..."
                    : "Delete trip"}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* LOGOUT CONFIRMATION */}
      {/* ========================================================= */}

      {confirmLogout && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() =>
            !loggingOut &&
            setConfirmLogout(false)
          }
        >

          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">

              <LogOut
                size={22}
                className="text-rose-500"
              />

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
                onClick={() =>
                  setConfirmLogout(false)
                }
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
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
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

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md sm:p-5"
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">

        <Icon
          size={20}
          className="text-teal-700"
        />

      </div>

      <span className="text-xs font-bold text-slate-700">
        {label}
      </span>

    </Link>
  );
}