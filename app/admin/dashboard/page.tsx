"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

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
  Clock3,
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
  TrendingUp,
  Check,
  Loader2,
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
  passengerPhone: string;
  route: string;
  bus?: { busNumber: string } | null;
  seat?: string;
  travelTime?: string;
  status: "pending" | "confirmed" | "cancelled";
  emailSent: boolean;
  whatsappSent: boolean;
};

type Stats = {
  totalBookings: number;
  todaysBookings: number;
  activeBuses: number;
  passengerCount: number;
};

type Trip = {
  busNumber: string;
  route: string;
  departure: string;
  bookedSeats: number;
  capacity: number;
};

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, tripsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/bookings"),
        fetch("/api/trips/upcoming"),
      ]);

      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();
      const tripsData = await tripsRes.json();

      setStats(statsData);
      setBookings(bookingsData.bookings || []);
      setUpcomingTrips(tripsData.trips || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Keep the dashboard fresh without a manual refresh
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleBookingAction(id: string, action: "approve" | "reject") {
    setActioningId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Request failed");
      await loadData();
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
      alert(`Something went wrong trying to ${action} this booking. Please try again.`);
    } finally {
      setActioningId(null);
    }
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats?.totalBookings ?? "—",
      icon: CalendarCheck,
    },
    {
      title: "Today's Bookings",
      value: stats?.todaysBookings ?? "—",
      icon: TrendingUp,
    },
    {
      title: "Active Buses",
      value: stats?.activeBuses ?? "—",
      icon: Bus,
    },
    {
      title: "Passengers",
      value: stats?.passengerCount ?? "—",
      icon: Users,
    },
  ];

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const recentBookings = bookings.slice(0, 6);

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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-medium transition
                    ${
                      item.name === "Dashboard"
                        ? "bg-teal-50 font-bold text-teal-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-teal-700"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    className={
                      item.name === "Dashboard"
                        ? "text-teal-700"
                        : "text-gray-400 group-hover:text-teal-700"
                    }
                  />
                  <span>{item.name}</span>
                  {item.name === "Bookings" && pendingBookings.length > 0 && (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {pendingBookings.length}
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
              <h1 className="text-lg font-black text-gray-900 sm:text-xl">Dashboard</h1>
              <p className="hidden text-xs text-gray-400 sm:block">
                Welcome back, Administrator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 md:flex">
              <Search size={17} className="text-gray-400" />
              <input
                placeholder="Search..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50">
              <Bell size={18} />
              {pendingBookings.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                A
              </div>
              <div className="hidden xl:block">
                <p className="text-sm font-bold text-gray-800">Administrator</p>
                <p className="text-[11px] text-gray-400">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-teal-700">Overview</p>
              <h2 className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
                Good morning, Admin 👋
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Here is what's happening with Haikal Tours today.
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#052f34]"
            >
              View all bookings
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* STAT CARDS */}
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
                      <Icon size={21} className="text-teal-700" />
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {loading ? (
                      <Loader2 size={20} className="animate-spin text-gray-300" />
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
                  Pending booking requests ({pendingBookings.length})
                </h3>
              </div>
              <div className="space-y-3">
                {pendingBookings.map((b) => (
                  <div
                    key={b._id}
                    className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {b.passengerName}{" "}
                        <span className="font-normal text-gray-400">· {b.bookingRef}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {b.route} · {b.passengerPhone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={actioningId === b._id}
                        onClick={() => handleBookingAction(b._id, "approve")}
                        className="flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
                      >
                        {actioningId === b._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Accept
                      </button>
                      <button
                        disabled={actioningId === b._id}
                        onClick={() => handleBookingAction(b._id, "reject")}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        <X size={13} />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-amber-700">
                Accepting sends a WhatsApp confirmation immediately and emails the
                passenger 4 minutes later.
              </p>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            {/* RECENT BOOKINGS */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <div>
                  <h3 className="font-bold text-gray-900">Recent Bookings</h3>
                  <p className="mt-1 text-xs text-gray-400">Latest customer reservations</p>
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
                    <tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="px-5 py-4 font-semibold">Booking</th>
                      <th className="px-5 py-4 font-semibold">Passenger</th>
                      <th className="px-5 py-4 font-semibold">Route</th>
                      <th className="px-5 py-4 font-semibold">Bus</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && recentBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                          No bookings yet.
                        </td>
                      </tr>
                    )}
                    {recentBookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-gray-800">{booking.bookingRef}</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {booking.travelTime || "-"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-800">
                            {booking.passengerName}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[170px] truncate text-xs text-gray-600">
                            {booking.route}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-gray-700">
                            {booking.bus?.busNumber || "—"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Seat {booking.seat || "-"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {booking.status === "confirmed" && (
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
                          {booking.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                              <CircleAlert size={12} />
                              Cancelled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE BOOKINGS */}
              <div className="divide-y divide-gray-100 md:hidden">
                {recentBookings.map((booking) => (
                  <div key={booking._id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-400">{booking.bookingRef}</p>
                        <p className="mt-1 font-bold text-gray-900">{booking.passengerName}</p>
                      </div>
                      {booking.status === "confirmed" && (
                        <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                          Confirmed
                        </span>
                      )}
                      {booking.status === "pending" && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                          Pending
                        </span>
                      )}
                      {booking.status === "cancelled" && (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{booking.route}</span>
                      <span className="font-semibold">
                        {booking.bus?.busNumber || "—"} · {booking.seat || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UPCOMING TRIPS */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5">
                <h3 className="font-bold text-gray-900">Upcoming Trips</h3>
                <p className="mt-1 text-xs text-gray-400">Today's scheduled departures</p>
              </div>

              <div className="divide-y divide-gray-100">
                {!loading && upcomingTrips.length === 0 && (
                  <p className="p-5 text-center text-sm text-gray-400">
                    No confirmed trips scheduled for today yet.
                  </p>
                )}
                {upcomingTrips.map((trip) => (
                  <div key={`${trip.busNumber}-${trip.departure}`} className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                          <Bus size={18} className="text-teal-700" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{trip.busNumber}</p>
                          <p className="text-xs text-gray-400">{trip.departure}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {trip.bookedSeats}/{trip.capacity}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700">{trip.route}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-teal-700"
                          style={{
                            width: `${Math.min(
                              (trip.bookedSeats / trip.capacity) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 p-4">
                <Link
                  href="/admin/trips"
                  className="flex items-center justify-center gap-1 rounded-xl bg-gray-50 py-3 text-xs font-bold text-gray-700 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  Manage trips
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <QuickAction href="/admin/bookings" icon={CalendarCheck} label="Bookings" />
              <QuickAction href="/admin/trips" icon={Bus} label="Add Trip" />
              <QuickAction href="/admin/drivers" icon={UserRoundCog} label="Drivers" />
              <QuickAction href="/admin/routes" icon={Navigation} label="Routes" />
              <QuickAction href="/admin/destinations" icon={MapPin} label="Destination" />
              <QuickAction href="/admin/settings" icon={Settings} label="Settings" />
            </div>
          </div>
        </div>
      </main>
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
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
        <Icon size={20} className="text-teal-700" />
      </div>
      <span className="text-xs font-bold text-gray-700">{label}</span>
    </Link>
  );
}
