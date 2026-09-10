"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShieldCheck,
    Eye,
    EyeOff,
    ArrowRight,
    LockKeyhole,
    Loader2,
    MapPin,
} from "lucide-react";

const SERIF = "'Fraunces', ui-serif, Georgia, serif";
const SANS = "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function AdminLoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Guard: ignore a second click while a request is already in flight.
        if (isSubmitting) return;

        setError("");

        if (!username || !password) {
            setError("Please enter your username and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.message || "Invalid username or password.");
                setIsSubmitting(false);
                return;
            }

            router.push("/admin/dashboard");
            router.refresh();
            // Intentionally leave isSubmitting=true here — the page is
            // navigating away, so the button should stay locked/spinning
            // rather than flash back to its idle state.
        } catch (err) {
            console.error(err);
            setError("Unable to connect to the server. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Font setup — move these into the root layout's <head> for
                production; kept here so the component is self-contained. */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,680&family=Inter:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />

            <style>{`
                @keyframes routeDraw {
                    from { stroke-dashoffset: 900; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes pinPop {
                    0% { opacity: 0; transform: scale(0.4); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes riseIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .route-path {
                    stroke-dasharray: 900;
                    stroke-dashoffset: 900;
                    animation: routeDraw 1.8s ease-out 0.2s forwards;
                }
                .route-pin {
                    opacity: 0;
                    animation: pinPop 0.5s ease-out forwards;
                }
                .rise-in {
                    opacity: 0;
                    animation: riseIn 0.6s ease-out forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .route-path, .route-pin, .rise-in {
                        animation: none !important;
                        opacity: 1 !important;
                        stroke-dashoffset: 0 !important;
                    }
                }
            `}</style>

            <main
                className="flex min-h-screen flex-col bg-[#F3F2EC] lg:flex-row"
                style={{ fontFamily: SANS }}
            >
                {/* HERO / ROUTE PANEL */}
                <div
                    className="relative overflow-hidden rounded-b-[2.5rem] bg-[#063d43] px-6 pb-16 pt-9 sm:px-10 sm:pb-20 sm:pt-12 lg:w-[46%] lg:min-h-screen lg:rounded-none lg:px-14 lg:py-14 xl:px-20"
                    style={{
                        backgroundImage:
                            "radial-gradient(ellipse at top left, #0a545c 0%, #063d43 55%, #021b1e 100%)",
                    }}
                >
                    <div className="relative z-10 flex h-full flex-col lg:min-h-[calc(100vh-7rem)] lg:justify-between">
                        {/* LOGO */}
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black text-[#063d43] sm:h-12 sm:w-12 sm:text-xl">
                                H
                            </div>
                            <div>
                                <p className="text-lg font-black tracking-wide text-white sm:text-xl">
                                    HAIKAL
                                </p>
                                <p className="text-[9px] font-bold tracking-[0.3em] text-teal-200 sm:text-[10px]">
                                    TOURS
                                </p>
                            </div>
                        </Link>

                        {/* HEADLINE — mobile */}
                        <div className="mt-8 lg:hidden">
                            <h1
                                className="text-[26px] font-semibold leading-[1.15] text-white sm:text-3xl"
                                style={{ fontFamily: SERIF }}
                            >
                                Every trip starts
                                <span className="block text-teal-200">
                                    with a sign in.
                                </span>
                            </h1>
                        </div>

                        {/* ROUTE ILLUSTRATION — desktop only */}
                        <div className="mt-10 hidden flex-1 items-center justify-center lg:flex">
                            <svg
                                viewBox="0 0 320 420"
                                className="h-auto w-full max-w-[280px]"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M36 380 C 90 340, 30 280, 90 250 C 150 220, 110 160, 170 130 C 215 108, 195 60, 260 40"
                                    stroke="#2E8C8F"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray="6 10"
                                    opacity="0.35"
                                />
                                <path
                                    className="route-path"
                                    d="M36 380 C 90 340, 30 280, 90 250 C 150 220, 110 160, 170 130 C 215 108, 195 60, 260 40"
                                    stroke="#8FD9CF"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                                <circle cx="36" cy="380" r="6" fill="#8FD9CF" className="route-pin" style={{ animationDelay: "0.2s" }} />
                                <circle cx="90" cy="250" r="4.5" fill="#D9A441" className="route-pin" style={{ animationDelay: "1.1s" }} />
                                <circle cx="170" cy="130" r="4.5" fill="#D9A441" className="route-pin" style={{ animationDelay: "1.5s" }} />
                                <g className="route-pin" style={{ animationDelay: "1.9s" }}>
                                    <circle cx="260" cy="40" r="9" fill="#F3F2EC" />
                                    <circle cx="260" cy="40" r="4" fill="#063d43" />
                                </g>
                            </svg>
                        </div>

                        {/* HEADLINE + COPY — desktop */}
                        <div className="hidden max-w-md lg:block">
                            <h1
                                className="text-[40px] font-semibold leading-[1.12] text-white xl:text-[46px]"
                                style={{ fontFamily: SERIF }}
                            >
                                Keep the fleet
                                <span className="block text-teal-200">
                                    running on schedule.
                                </span>
                            </h1>
                            <p className="mt-5 text-[15px] leading-7 text-white/65">
                                Sign in to manage bookings, buses, drivers, and
                                every departure across the Haikal Tours network.
                            </p>
                        </div>

                        <p className="mt-10 hidden text-sm text-white/35 lg:block">
                            © {new Date().getFullYear()} Haikal Tours
                        </p>
                    </div>
                </div>

                {/* FORM PANEL */}
                <div className="relative z-10 -mt-8 flex flex-1 justify-center px-5 pb-10 sm:px-8 lg:mt-0 lg:w-[54%] lg:items-center lg:px-12">
                    <div className="w-full max-w-md rounded-t-[2rem] bg-white px-6 pb-9 pt-8 shadow-[0_-8px_30px_rgba(6,61,67,0.08)] sm:px-8 lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:shadow-none">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                            <LockKeyhole size={22} className="text-teal-700" />
                        </div>

                        <h2
                            className="text-[26px] font-semibold text-gray-900 sm:text-3xl"
                            style={{ fontFamily: SERIF }}
                        >
                            Admin sign in
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Enter your credentials to reach the dashboard.
                        </p>

                        <form onSubmit={handleLogin} className="mt-7 space-y-5" noValidate>
                            {/* USERNAME */}
                            <div>
                                <label
                                    htmlFor="admin-username"
                                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                                >
                                    Username
                                </label>
                                <input
                                    id="admin-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                    disabled={isSubmitting}
                                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                                />
                            </div>

                            {/* PASSWORD */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label
                                        htmlFor="admin-password"
                                        className="text-sm font-semibold text-gray-700"
                                    >
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-teal-700 transition hover:text-teal-800"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        id="admin-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
                                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        disabled={isSubmitting}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* ERROR */}
                            {error && (
                                <div
                                    role="alert"
                                    className="rise-in rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                                >
                                    {error}
                                </div>
                            )}

                            {/* SUBMIT */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                aria-busy={isSubmitting}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:bg-[#052f34] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:bg-[#063d43] disabled:hover:shadow-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={17} className="animate-spin" />
                                        Signing in…
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-7 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                            <ShieldCheck size={13} className="text-gray-400" />
                            Access is limited to authorized Haikal Tours staff.
                        </div>

                        <div className="mt-5 text-center lg:mt-8">
                            <Link
                                href="/"
                                className="text-sm font-medium text-gray-500 transition hover:text-teal-700"
                            >
                                ← Back to Haikal Tours
                            </Link>
                        </div>

                        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-300 lg:hidden">
                            <MapPin size={12} />© {new Date().getFullYear()} Haikal Tours
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}