"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
CheckCircle2,
Eye,
EyeOff,
Loader2,
LockKeyhole,
ShieldCheck,
User,
XCircle,
} from "lucide-react";

type InvitationState = {
loading: boolean;
valid: boolean;
email: string;
message: string;
};

function CreateAdminAccountContent() {
const router = useRouter();
const searchParams = useSearchParams();

const token = searchParams.get("token");

const [invitation, setInvitation] = useState<InvitationState>({
loading: true,
valid: false,
email: "",
message: "",
});

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

useEffect(() => {
async function verifyInvitation() {
if (!token) {
setInvitation({
loading: false,
valid: false,
email: "",
message: "Invitation token is missing.",
});
return;
}


  try {
    const response = await fetch(
      `/api/admin/invite/verify?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data.valid) {
      setInvitation({
        loading: false,
        valid: false,
        email: "",
        message:
          data.message ||
          "This invitation is invalid, expired, or has already been used.",
      });
      return;
    }

    setInvitation({
      loading: false,
      valid: true,
      email: data.email || "",
      message: "",
    });
  } catch (err) {
    console.error("Invitation verification error:", err);

    setInvitation({
      loading: false,
      valid: false,
      email: "",
      message: "Unable to verify this invitation.",
    });
  }
}

verifyInvitation();


}, [token]);

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
event.preventDefault();


setError("");
setSuccess("");

const cleanUsername = username.trim().toLowerCase();

if (!token) {
  setError("Invitation token is missing.");
  return;
}

if (!cleanUsername) {
  setError("Please enter a username.");
  return;
}

if (cleanUsername.length < 3) {
  setError("Username must be at least 3 characters.");
  return;
}

if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
  setError(
    "Username can only contain letters, numbers, dots, underscores, and hyphens."
  );
  return;
}

if (!password) {
  setError("Please enter a password.");
  return;
}

if (password.length < 8) {
  setError("Password must be at least 8 characters.");
  return;
}

if (password !== confirmPassword) {
  setError("Passwords do not match.");
  return;
}

try {
  setSubmitting(true);

  const response = await fetch("/api/admin/invite/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      username: cleanUsername,
      password,
      confirmPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    setError(data.message || "Failed to create your account.");
    return;
  }

  setSuccess(
    "Your admin account has been created successfully. Redirecting to login..."
  );

  setUsername("");
  setPassword("");
  setConfirmPassword("");

  setTimeout(() => {
    router.push("/admin/login");
  }, 1800);
} catch (err) {
  console.error("Create admin account error:", err);
  setError("Something went wrong. Please try again.");
} finally {
  setSubmitting(false);
}


};

if (invitation.loading) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#f3f6f6] px-4"> <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eff8f8]"> <Loader2 className="h-8 w-8 animate-spin text-[#063d43]" /> </div>


      <h1 className="mt-6 text-xl font-bold text-[#172b2d]">
        Verifying Invitation
      </h1>

      <p className="mt-2 text-sm text-gray-500">
        Please wait while we verify your invitation...
      </p>
    </div>
  </main>
);


}

if (!invitation.valid) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#f3f6f6] px-4"> <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"> <div className="bg-[#063d43] px-8 py-8 text-center"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-[#063d43]">
H </div>

```
        <div className="mt-4 text-xl font-black tracking-[3px] text-white">
          HAIKAL
        </div>

        <div className="mt-1 text-[10px] font-bold tracking-[4px] text-[#b8dddd]">
          TOURS
        </div>
      </div>

      <div className="px-8 py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-9 w-9 text-red-500" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Invitation Invalid
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          {invitation.message ||
            "This invitation is invalid, expired, or has already been used."}
        </p>

        <p className="mt-3 text-xs leading-5 text-gray-400">
          Please contact a Haikal Tours administrator if you need a new
          invitation.
        </p>
      </div>
    </div>
  </main>
);


}

return ( <main className="min-h-screen bg-[#f3f6f6] px-4 py-8 sm:py-10"> <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center justify-center"> <div className="w-full overflow-hidden rounded-2xl bg-white shadow-xl">
{/* Header */} <div className="bg-[#063d43] px-7 py-8 text-center sm:px-8"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-[#063d43]">
H </div>


        <div className="mt-4 text-xl font-black tracking-[3px] text-white">
          HAIKAL
        </div>

        <div className="mt-1 text-[10px] font-bold tracking-[4px] text-[#b8dddd]">
          TOURS
        </div>

        <p className="mt-5 text-sm text-[#d7eeee]">
          Create your administrator account
        </p>
      </div>

      <div className="px-6 py-7 sm:px-8 sm:py-8">
        {/* Invitation verified */}
        <div className="rounded-xl border border-[#d7eeee] bg-[#eff8f8] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-[#063d43]">
                Invitation Verified
              </p>

              <p className="mt-1 text-xs text-gray-500">
                This account will be created as an administrator.
              </p>

              <p className="mt-2 break-all text-sm font-bold text-[#063d43]">
                {invitation.email}
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-[#063d43]" />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-800">
                Administrator Access
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Your account will have admin access to the Haikal Tours
                dashboard. Superadmin privileges cannot be created through
                an invitation.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Username
            </label>

            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={submitting || !!success}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#063d43] focus:ring-2 focus:ring-[#063d43]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <p className="mt-1.5 text-[11px] text-gray-400">
              Minimum 3 characters. Letters, numbers, dots, underscores,
              and hyphens are allowed.
            </p>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={submitting || !!success}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#063d43] focus:ring-2 focus:ring-[#063d43]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={submitting || !!success}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#063d43]"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <p className="mt-1.5 text-[11px] text-gray-400">
              Password must be at least 8 characters.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Confirm Password
            </label>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={submitting || !!success}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#063d43] focus:ring-2 focus:ring-[#063d43]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                disabled={submitting || !!success}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#063d43]"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

              <p className="text-sm leading-5 text-red-700">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

              <p className="text-sm leading-5 text-green-700">
                {success}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !!success}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Account Created
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Create Admin Account
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-5 text-gray-400">
          Your account will be created securely using the verified
          invitation email.
        </p>
      </div>
    </div>
  </div>
</main>


);
}

/**

* Suspense is required because CreateAdminAccountContent
* uses useSearchParams().
  */
  export default function CreateAdminAccountPage() {
  return (
  <Suspense
  fallback={ <main className="flex min-h-screen items-center justify-center bg-[#f3f6f6] px-4"> <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eff8f8]"> <Loader2 className="h-8 w-8 animate-spin text-[#063d43]" /> </div>

  ```
       <h1 className="mt-6 text-xl font-bold text-[#172b2d]">
         Loading Invitation
       </h1>

       <p className="mt-2 text-sm text-gray-500">
         Please wait...
       </p>
     </div>
   </main>


  }

  >

     <CreateAdminAccountContent />
   </Suspense>

);
}
