"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

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
} from "lucide-react";

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
    name: "Passengers",
    href: "/admin/passengers",
    icon: Users,
  },
  {
    name: "Destinations",
    href: "/admin/destinations",
    icon: MapPin,
  },
  {
    name: "Hotels",
    href: "/admin/hotels",
    icon: Hotel,
  },
  {
    name: "Packages",
    href: "/admin/packages",
    icon: Package,
  },
  {
    name: "Routes",
    href: "/admin/routes",
    icon: Navigation,
  },
  {
    name: "Drivers",
    href: "/admin/drivers",
    icon: UserRoundCog,
  },
];

const bottomItems = [
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

const BOOKINGS_PER_PAGE = 7;

export default function AdminDashboard() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);

  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<
    AdminNotification[]
  >([]);

  const [notificationCount, setNotificationCount] = useState(0);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotification | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  /*
   * ============================
   * LOGOUT STATE
   * ============================
   */

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /*
   * ============================
   * LOAD DASHBOARD DATA
   * ============================
   */

  const loadData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, tripsRes] = await Promise.all([
        fetch("/api/stats", {
          cache: "no-store",
        }),

        fetch("/api/bookings", {
          cache: "no-store",
        }),

        fetch("/api/trips/upcoming", {
          cache: "no-store",
        }),
      ]);

      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();
      const tripsData = await tripsRes.json();

      setStats(statsData);
      setBookings(bookingsData.bookings || []);
      setUpcomingTrips(tripsData.trips || []);
    } catch (err) {
      console.error(
        "Failed to load dashboard data:",
        err
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================
   * LOAD NOTIFICATIONS
   * ============================
   */

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/notifications",
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch notifications"
        );
      }

      const data = await res.json();

      console.log("NOTIFICATIONS:", data);

      setNotifications(
        data.notifications || []
      );

      setNotificationCount(
        data.count || 0
      );
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    }
  }, []);

  /*
   * ============================
   * INITIAL LOAD + POLLING
   * ============================
   */

  useEffect(() => {
    loadData();
    loadNotifications();

    const interval = setInterval(() => {
      loadData();
      loadNotifications();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [
    loadData,
    loadNotifications,
  ]);

  /*
   * ============================
   * APPROVE / REJECT BOOKING
   * ============================
   */

  async function handleBookingAction(
    id: string,
    action: "approve" | "reject"
  ) {
    setActioningId(id);

    try {
      const res = await fetch(
        `/api/admin/bookings/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status:
              action === "approve"
                ? "approved"
                : "rejected",
          }),
        }
      );

      const data = await res.json();

      console.log(
        "BOOKING ACTION RESPONSE:",
        data
      );

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Request failed"
        );
      }

      /*
       * Close pending booking modal
       */
      setSelectedNotification(null);

      /*
       * Refresh dashboard and notifications
       */
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

  /*
   * ============================
   * LOGOUT
   * ============================
   */

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
      /*
       * Even if the request fails, still
       * push the admin to the login page —
       * staying stuck on the dashboard is
       * worse than a stale cookie.
       */
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
      router.push("/admin/login");
      router.refresh();
    }
  }

  /*
   * ============================
   * STAT CARDS
   * ============================
   */

  const statCards = [
    {
      title: "Total Bookings",
      value:
        stats?.totalBookings ?? "—",
      icon: CalendarCheck,
    },

    {
      title: "Today's Bookings",
      value:
        stats?.todaysBookings ?? "—",
      icon: TrendingUp,
    },

    {
      title: "Active Buses",
      value:
        stats?.activeBuses ?? "—",
      icon: Bus,
    },

    {
      title: "Passengers",
      value:
        stats?.passengerCount ?? "—",
      icon: Users,
    },
  ];

  /*
   * ============================
   * PENDING BOOKINGS
   * ============================
   */

  const pendingBookings =
    bookings.filter(
      (b) => b.status === "pending"
    );

  /*
   * ============================
   * PAGINATION
   * ============================
   */

  const totalPages = Math.max(
    1,
    Math.ceil(
      bookings.length /
        BOOKINGS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const startIndex =
    (currentPage - 1) *
    BOOKINGS_PER_PAGE;

  const paginatedBookings =
    bookings.slice(
      startIndex,
      startIndex +
        BOOKINGS_PER_PAGE
    );

  function goToPage(page: number) {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  }

  /*
   * ============================
   * OPEN NOTIFICATION
   * ============================
   *
   * IMPORTANT:
   * The booking modal is OUTSIDE
   * the notification modal.
   *
   * Therefore closing notifications
   * does not destroy the booking modal.
   */

  function handleNotificationClick(
    notification: AdminNotification
  ) {
    console.log(
      "SELECTED NOTIFICATION:",
      notification
    );

    /*
     * First store the selected notification
     */
    setSelectedNotification(
      notification
    );

    /*
     * Then close notification list
     */
    setShowNotifications(false);
  }

  /*
   * ============================
   * RENDER
   * ============================
   */

  return (
    <div className="min-h-screen bg-[#f7f9f9]">

      {/* ==========================
          MOBILE SIDEBAR OVERLAY
      =========================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ==========================
          SIDEBAR
      =========================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[270px]
          flex-col border-r border-gray-100 bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* LOGO */}

        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-gray-100 px-6">

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#063d43] text-lg font-black text-white">
              H
            </div>

            <div>
              <p className="text-base font-black tracking-wide text-gray-900">
                HAIKAL
              </p>

              <p className="text-[9px] font-bold tracking-[0.3em] text-teal-700">
                TOURS ADMIN
              </p>
            </div>
          </Link>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>

        </div>

        {/* SIDEBAR MENU */}

        <div className="flex-1 overflow-y-auto px-4 py-5">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Main Menu
          </p>

          <nav className="space-y-1">

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-medium transition
                    ${
                      item.name ===
                      "Dashboard"
                        ? "bg-teal-50 font-bold text-teal-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-teal-700"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    className={
                      item.name ===
                      "Dashboard"
                        ? "text-teal-700"
                        : "text-gray-400 group-hover:text-teal-700"
                    }
                  />

                  <span>
                    {item.name}
                  </span>

                  {item.name ===
                    "Bookings" &&
                    pendingBookings.length >
                      0 && (
                      <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {
                          pendingBookings.length
                        }
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
                  <Icon
                    size={19}
                    className="text-gray-400 group-hover:text-teal-700"
                  />

                  {item.name}
                </Link>
              );
            })}

            {/* LOG OUT (SYSTEM MENU) */}

            <button
              type="button"
              onClick={() =>
                setConfirmLogout(true)
              }
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut
                size={19}
                className="text-gray-400 group-hover:text-red-500"
              />

              Log Out
            </button>

          </nav>

        </div>

        {/* ADMIN USER */}

        <div className="border-t border-gray-100 p-4">

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
              A
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-bold text-gray-800">
                Administrator
              </p>

              <p className="truncate text-xs text-gray-400">
                admin@haikaltours.com
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setConfirmLogout(true)
              }
              title="Log out"
              className="text-gray-400 transition hover:text-red-500"
            >
              <LogOut size={17} />
            </button>

          </div>

        </div>

      </aside>

      {/* ==========================
          MAIN
      =========================== */}

      <main className="lg:ml-[270px]">

        {/* ========================
            HEADER
        ========================= */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>

              <h1 className="text-lg font-black text-gray-900 sm:text-xl">
                Dashboard
              </h1>

              <p className="hidden text-xs text-gray-400 sm:block">
                Welcome back,
                Administrator
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            {/* SEARCH */}

            <div className="hidden items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 md:flex">

              <Search
                size={17}
                className="text-gray-400"
              />

              <input
                placeholder="Search..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />

            </div>

            {/* NOTIFICATION BUTTON */}

            <button
              type="button"
              onClick={() =>
                setShowNotifications(
                  true
                )}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            >
              <Bell size={18} />

              {notificationCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-md">
                  {notificationCount >
                  99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </button>

            {/* ADMIN */}

            <div className="hidden items-center gap-2 sm:flex">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                A
              </div>

              <div className="hidden xl:block">

                <p className="text-sm font-bold text-gray-800">
                  Administrator
                </p>

                <p className="text-[11px] text-gray-400">
                  Super Admin
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* ========================
            CONTENT
        ========================= */}

        <div className="p-4 sm:p-6 lg:p-8">

          {/* PAGE TITLE */}

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-medium text-teal-700">
                Overview
              </p>

              <h2 className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
                Good morning, Admin 👋
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Here is what's
                happening with Haikal
                Tours today.
              </p>

            </div>

            <Link
              href="/admin/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#052f34]"
            >
              View all bookings

              <ArrowUpRight
                size={16}
              />
            </Link>

          </div>

          {/* ========================
              STAT CARDS
          ========================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {statCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">

                      <Icon
                        size={21}
                        className="text-teal-700"
                      />

                    </div>

                  </div>

                  <p className="mt-5 text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>

                  <p className="mt-1 text-2xl font-black text-gray-900">

                    {loading ? (
                      <Loader2
                        size={20}
                        className="animate-spin text-gray-300"
                      />
                    ) : (
                      stat.value
                    )}

                  </p>

                </div>
              );
            })}

          </div>

          {/* ========================
              PENDING BOOKING REQUESTS
          ========================= */}

          {pendingBookings.length >
            0 && (
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">

              <div className="mb-4 flex items-center justify-between">

                <h3 className="flex items-center gap-2 font-bold text-amber-800">

                  <Clock3 size={18} />

                  Pending booking requests (
                  {pendingBookings.length}
                  )

                </h3>

              </div>

              <div className="space-y-3">

                {pendingBookings.map(
                  (b) => (
                    <div
                      key={b._id}
                      className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div>

                        <p className="text-sm font-bold text-gray-900">

                          {
                            b.passengerName
                          }

                          <span className="font-normal text-gray-400">
                            {" "}
                            ·{" "}
                            {
                              b.bookingRef
                            }
                          </span>

                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {b.route} ·{" "}
                          {
                            b.passengerPhone
                          }
                        </p>

                      </div>

                      <div className="flex gap-2">

                        <button
                          disabled={
                            actioningId ===
                            b._id
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
                            <Check
                              size={13}
                            />
                          )}

                          Accept

                        </button>

                        <button
                          disabled={
                            actioningId ===
                            b._id
                          }
                          onClick={() =>
                            handleBookingAction(
                              b._id,
                              "reject"
                            )
                          }
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                        >

                          <X size={13} />

                          Decline

                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>

              <p className="mt-3 text-[11px] text-amber-700">
                Accepting sends a
                WhatsApp confirmation
                immediately and emails
                the passenger 4 minutes
                later.
              </p>

            </div>
          )}

          {/* ========================
              MAIN GRID
          ========================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

            {/* RECENT BOOKINGS */}

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-gray-100 p-5">

                <div>

                  <h3 className="font-bold text-gray-900">
                    Recent Bookings
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Latest customer
                    reservations
                  </p>

                </div>

                <Link
                  href="/admin/bookings"
                  className="flex items-center gap-1 text-xs font-bold text-teal-700"
                >
                  View all

                  <ChevronRight
                    size={14}
                  />
                </Link>

              </div>

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full text-left">

                  <thead>

                    <tr className="border-b border-gray-100 text-xs text-gray-400">

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
                            colSpan={5}
                            className="px-5 py-8 text-center text-sm text-gray-400"
                          >
                            No bookings yet.
                          </td>

                        </tr>
                      )}

                    {paginatedBookings.map(
                      (booking) => (
                        <tr
                          key={
                            booking._id
                          }
                          className="cursor-pointer border-b border-gray-50 transition last:border-0 hover:bg-teal-50/40"
                        >

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block"
                            >

                              <p className="text-xs font-bold text-gray-800">
                                {
                                  booking.bookingRef
                                }
                              </p>

                              <p className="mt-1 text-[11px] text-gray-400">
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
                              className="block text-sm font-semibold text-gray-800 hover:text-teal-700 hover:underline"
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

                              <p className="max-w-[170px] truncate text-xs text-gray-600">
                                {
                                  booking.route
                                }
                              </p>

                            </Link>

                          </td>

                          <td className="px-5 py-4">

                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="block"
                            >

                              <p className="text-xs font-bold text-gray-700">
                                {
                                  booking
                                    .bus
                                    ?.busNumber ||
                                  "—"
                                }
                              </p>

                              <p className="text-[11px] text-gray-400">
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

                              {booking.status ===
                                "approved" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600">
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
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
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

              <div className="divide-y divide-gray-100 md:hidden">

                {paginatedBookings.map(
                  (booking) => (
                    <Link
                      key={
                        booking._id
                      }
                      href={`/admin/bookings/${booking._id}`}
                      className="block p-4 transition hover:bg-teal-50/40"
                    >

                      <div className="flex items-start justify-between">

                        <div>

                          <p className="text-xs font-bold text-gray-400">
                            {
                              booking.bookingRef
                            }
                          </p>

                          <p className="mt-1 font-bold text-gray-900">
                            {
                              booking.passengerName
                            }
                          </p>

                        </div>

                        {booking.status ===
                          "approved" && (
                          <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
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
                          <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                            Cancelled
                          </span>
                        )}

                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">

                        <span>
                          {
                            booking.route
                          }
                        </span>

                        <span className="font-semibold">
                          {
                            booking
                              .bus
                              ?.busNumber ||
                            "—"
                          }{" "}
                          ·{" "}
                          {
                            booking.seat ||
                            "-"
                          }
                        </span>

                      </div>

                    </Link>
                  )
                )}

              </div>

              {/* PAGINATION */}

              {bookings.length >
                0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row">

                  <p className="text-xs text-gray-400">

                    Showing{" "}

                    <span className="font-bold text-gray-600">

                      {startIndex + 1}-
                      {Math.min(
                        startIndex +
                          BOOKINGS_PER_PAGE,
                        bookings.length
                      )}

                    </span>{" "}

                    of{" "}

                    <span className="font-bold text-gray-600">
                      {
                        bookings.length
                      }
                    </span>{" "}
                    bookings

                  </p>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage -
                            1
                        )
                      }
                      disabled={
                        currentPage ===
                        1
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={15}
                      />
                    </button>

                    <span className="px-2 text-xs font-bold text-gray-600">
                      Page{" "}
                      {
                        currentPage
                      }{" "}
                      of{" "}
                      {
                        totalPages
                      }
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage +
                            1
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight
                        size={15}
                      />
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* UPCOMING TRIPS */}

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

              <div className="border-b border-gray-100 p-5">

                <h3 className="font-bold text-gray-900">
                  Upcoming Trips
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Today's scheduled
                  departures
                </p>

              </div>

              <div className="divide-y divide-gray-100">

                {!loading &&
                  upcomingTrips.length ===
                    0 && (
                    <p className="p-5 text-center text-sm text-gray-400">
                      No confirmed trips
                      scheduled for
                      today yet.
                    </p>
                  )}

                {upcomingTrips.map(
                  (trip) => (
                    <div
                      key={`${trip.busNumber}-${trip.departure}`}
                      className="p-5"
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                            <Bus
                              size={18}
                              className="text-teal-700"
                            />
                          </div>

                          <div>

                            <p className="text-sm font-bold text-gray-900">
                              {
                                trip.busNumber
                              }
                            </p>

                            <p className="text-xs text-gray-400">
                              {
                                trip.departure
                              }
                            </p>

                          </div>

                        </div>

                        <span className="text-xs font-bold text-gray-500">
                          {
                            trip.bookedSeats
                          }
                          /
                          {
                            trip.capacity
                          }
                        </span>

                      </div>

                      <div className="mt-4">

                        <p className="text-sm font-semibold text-gray-700">
                          {
                            trip.route
                          }
                        </p>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">

                          <div
                            className="h-full rounded-full bg-teal-700"
                            style={{
                              width: `${Math.min(
                                (trip.bookedSeats /
                                  trip.capacity) *
                                  100,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

              <div className="border-t border-gray-100 p-4">

                <Link
                  href="/admin/trips"
                  className="flex items-center justify-center gap-1 rounded-xl bg-gray-50 py-3 text-xs font-bold text-gray-700 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  Manage trips

                  <ChevronRight
                    size={14}
                  />
                </Link>

              </div>

            </div>

          </div>

          {/* ========================
              QUICK ACTIONS
          ========================= */}

          <div className="mt-6">

            <h3 className="mb-4 text-lg font-bold text-gray-900">
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

              <QuickAction
                href="/admin/settings"
                icon={Settings}
                label="Settings"
              />

            </div>

          </div>

        </div>

      </main>

      {/* =====================================================
          NOTIFICATION MODAL
          
          IMPORTANT:
          This modal ONLY contains the notification list.
          
          The booking request modal is BELOW this block,
          OUTSIDE this modal.
      ====================================================== */}

      {showNotifications && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 p-4 pt-20 backdrop-blur-sm"
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

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

              <div>

                <h3 className="text-lg font-black text-gray-900">
                  Booking Notifications
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  {notificationCount} pending
                  request
                  {notificationCount !==
                  1
                    ? "s"
                    : ""}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>

            </div>

            {/* NOTIFICATION LIST */}

            <div className="max-h-[500px] overflow-y-auto">

              {notifications.length ===
              0 ? (
                <div className="px-5 py-12 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <Bell
                      size={24}
                      className="text-gray-400"
                    />
                  </div>

                  <p className="mt-4 text-sm font-bold text-gray-700">
                    No new
                    notifications
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    New booking requests
                    will appear here.
                  </p>

                </div>
              ) : (
                notifications.map(
                  (notification) => (
                    <button
                      key={
                        notification._id
                      }
                      type="button"
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className="flex w-full gap-4 border-b border-gray-100 p-5 text-left transition hover:bg-red-50"
                    >

                      {/* ICON */}

                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">

                        <Bell
                          size={19}
                          className="text-red-500"
                        />

                        {!notification.read && (
                          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                        )}

                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <p className="text-sm font-bold text-gray-900">
                            {
                              notification.title
                            }
                          </p>

                          {!notification.read && (
                            <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[9px] font-black uppercase text-red-600">
                              New
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
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

      {/* =====================================================
          PENDING BOOKING REQUEST MODAL
          
          IMPORTANT FIX:
          This is OUTSIDE the notification modal.
          
          Therefore:
          
          setShowNotifications(false)
          
          will NOT remove this modal.
      ====================================================== */}

      {selectedNotification?.bookingId && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedNotification(null)
          }
        >

          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">

                    <CalendarCheck
                      size={19}
                      className="text-red-500"
                    />

                  </div>

                  <div>

                    <h3 className="font-black text-gray-900">
                      Pending Booking
                      Request
                    </h3>

                    <p className="text-xs text-gray-400">
                      Review and approve
                      this reservation
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>

            </div>

            {/* BOOKING DETAILS */}

            <div className="space-y-4 p-6">

              {/* BOOKING REFERENCE */}

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Booking Reference
                </p>

                <p className="mt-1 text-lg font-black text-teal-700">
                  {
                    selectedNotification
                      .bookingId
                      .bookingRef
                  }
                </p>

              </div>

              {/* PASSENGER */}

              <div className="rounded-2xl border border-gray-100 p-4">

                <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400">
                  Passenger
                </p>

                <div className="space-y-2">

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-gray-400">
                      Name
                    </span>

                    <span className="text-sm font-bold text-gray-900">
                      {
                        selectedNotification
                          .bookingId
                          .passengerName
                      }
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-gray-400">
                      Phone
                    </span>

                    <span className="text-sm font-bold text-gray-900">
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
                    <div className="flex justify-between gap-4">

                      <span className="text-sm text-gray-400">
                        Email
                      </span>

                      <span className="max-w-[250px] truncate text-sm font-bold text-gray-900">
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

              {/* TRIP DETAILS */}

              <div className="rounded-2xl border border-gray-100 p-4">

                <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400">
                  Trip Details
                </p>

                <div className="space-y-3">

                  {/* ROUTE */}

                  <div className="flex items-center gap-3">

                    <MapPin
                      size={17}
                      className="text-teal-700"
                    />

                    <div>

                      <p className="text-[10px] text-gray-400">
                        Route
                      </p>

                      <p className="text-sm font-bold text-gray-900">
                        {
                          selectedNotification
                            .bookingId
                            .route
                        }
                      </p>

                    </div>

                  </div>

                  {/* BUS */}

                  <div className="flex items-center gap-3">

                    <Bus
                      size={17}
                      className="text-teal-700"
                    />

                    <div>

                      <p className="text-[10px] text-gray-400">
                        Bus
                      </p>

                      <p className="text-sm font-bold text-gray-900">
                        {
                          selectedNotification
                            .bookingId
                            .bus
                            ?.busNumber ||
                          "—"
                        }
                      </p>

                    </div>

                  </div>

                  {/* DEPARTURE */}

                  <div className="flex items-center gap-3">

                    <Clock3
                      size={17}
                      className="text-teal-700"
                    />

                    <div>

                      <p className="text-[10px] text-gray-400">
                        Departure
                      </p>

                      <p className="text-sm font-bold text-gray-900">

                        {selectedNotification
                          .bookingId
                          .travelDate
                          ? new Date(
                              selectedNotification
                                .bookingId
                                .travelDate
                            ).toLocaleDateString()
                          : "—"}

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

              {/* SELECTED SEATS */}

              <div className="rounded-2xl bg-teal-50 p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                  Selected Seats
                </p>

                <div className="mt-2 flex flex-wrap gap-2">

                  {(
                    selectedNotification
                      .bookingId
                      .seats || []
                  ).map((seat) => (
                    <span
                      key={seat}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-black text-white"
                    >
                      Seat {seat}
                    </span>
                  ))}

                </div>

              </div>

              {/* ACTION BUTTONS */}

              <div className="grid grid-cols-2 gap-3 pt-2">

                {/* REJECT */}

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
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >

                  {actioningId ===
                  selectedNotification
                    .bookingId
                    ._id ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <X size={17} />
                  )}

                  Reject Booking

                </button>

                {/* APPROVE */}

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
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
                >

                  {actioningId ===
                  selectedNotification
                    .bookingId
                    ._id ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={17} />
                  )}

                  Approve Booking

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          LOGOUT CONFIRMATION MODAL
      ====================================================== */}

      {confirmLogout && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <LogOut
                size={22}
                className="text-red-500"
              />
            </div>

            <h3 className="mt-4 text-center text-lg font-black text-gray-900">
              Log out of admin
              dashboard?
            </h3>

            <p className="mt-1 text-center text-sm text-gray-500">
              You'll need to sign in
              again to access bookings
              and trips.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  setConfirmLogout(
                    false
                  )
                }
                disabled={loggingOut}
                className="rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
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

/*
 * ============================
 * QUICK ACTION COMPONENT
 * ============================
 */

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
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md"
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">

        <Icon
          size={20}
          className="text-teal-700"
        />

      </div>

      <span className="text-xs font-bold text-gray-700">
        {label}
      </span>

    </Link>
  );
}