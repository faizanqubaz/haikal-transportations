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
} from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");

        if (!username || !password) {
            setError("Please enter your username and password.");
            return;
        }

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

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Invalid username or password."
                );
                return;
            }

            router.push("/admin/dashboard");
            router.refresh();
        } catch (error) {
            console.error(error);

            setError(
                "Unable to connect to the server. Please try again."
            );
        }
    };

    return (
        <main className="flex min-h-screen bg-gray-50">

            {/* LEFT SIDE */}

            <div className="hidden lg:flex lg:w-1/2 bg-[#063d43] relative overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-br from-[#063d43] via-[#07545a] to-[#021f23]" />

                <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

                    {/* LOGO */}

                    <Link href="/" className="flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-[#063d43]">
                            H
                        </div>

                        <div>
                            <p className="text-xl font-black tracking-wide text-white">
                                HAIKAL
                            </p>

                            <p className="text-[10px] font-bold tracking-[0.3em] text-teal-200">
                                TOURS
                            </p>
                        </div>

                    </Link>


                    {/* CONTENT */}

                    <div className="max-w-lg">

                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                            <ShieldCheck
                                size={34}
                                className="text-teal-200"
                            />
                        </div>

                        <h1 className="text-4xl font-black leading-tight text-white xl:text-5xl">
                            Welcome to the
                            <span className="block text-teal-200">
                                Haikal Tours
                            </span>
                            Administration.
                        </h1>

                        <p className="mt-6 text-base leading-7 text-white/70">
                            Manage bookings, buses, trips, passengers,
                            destinations and your entire tour operation
                            from one place.
                        </p>

                    </div>


                    <p className="text-sm text-white/40">
                        © {new Date().getFullYear()} Haikal Tours
                    </p>

                </div>
            </div>


            {/* RIGHT SIDE */}

            <div className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">

                <div className="w-full max-w-md">

                    {/* MOBILE LOGO */}

                    <div className="mb-10 flex justify-center lg:hidden">

                        <Link href="/" className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#063d43] text-xl font-black text-white">
                                H
                            </div>

                            <div>
                                <p className="text-xl font-black tracking-wide text-gray-900">
                                    HAIKAL
                                </p>

                                <p className="text-[10px] font-bold tracking-[0.3em] text-teal-700">
                                    TOURS
                                </p>
                            </div>

                        </Link>

                    </div>


                    <div className="mb-8">

                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                            <LockKeyhole
                                size={23}
                                className="text-teal-700"
                            />
                        </div>

                        <h2 className="text-3xl font-black text-gray-900">
                            Admin Sign In
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Sign in to access your administration dashboard.
                        </p>

                    </div>


                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* USERNAME */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Username
                            </label>

                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                autoComplete="username"
                                className="h-13 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-50"
                            />

                        </div>


                        {/* PASSWORD */}

                        <div>

                            <div className="mb-2 flex items-center justify-between">

                                <label className="text-sm font-semibold text-gray-700">
                                    Password
                                </label>

                                <button
                                    type="button"
                                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                                >
                                    Forgot password?
                                </button>

                            </div>

                            <div className="relative">

                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className="h-13 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-50"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>

                            </div>

                        </div>


                        {/* ERROR */}

                        {error && (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                {error}
                            </div>
                        )}


                        {/* LOGIN */}

                        <button
                            type="submit"
                            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 text-sm font-bold text-white shadow-lg transition hover:bg-[#052f34] hover:shadow-xl"
                        >
                            Sign In
                            <ArrowRight size={17} />
                        </button>

                    </form>


                    <div className="mt-8 text-center">

                        <Link
                            href="/"
                            className="text-sm font-medium text-gray-500 transition hover:text-teal-700"
                        >
                            ← Back to Haikal Tours
                        </Link>

                    </div>

                </div>

            </div>

        </main>
    );
}

