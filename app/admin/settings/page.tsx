
"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  User,
  Crown,
  MoreVertical,
  Trash2,
  KeyRound,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CalendarDays,
} from "lucide-react";

interface Admin {
  _id: string;
  username: string;
  role: "admin" | "superadmin";
  createdAt: string;
  updatedAt: string;
}

type ModalType = "delete" | "reset" | null;

export default function SuperAdminSettings() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ============================================================
  // GET ALL ADMINS
  // ============================================================

  const fetchAdmins = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/settings/admins");

      if (!response.ok) {
        throw new Error("Failed to fetch administrators");
      }

      const data = await response.json();

      setAdmins(data.admins || data || []);
    } catch (error) {
      console.error("FETCH ADMINS ERROR:", error);

      setMessage({
        type: "error",
        text: "Unable to load administrators.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // ============================================================
  // DELETE ADMIN
  // ============================================================

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/settings/admins/${selectedAdmin._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete admin");
      }

      setAdmins((prev) =>
        prev.filter((admin) => admin._id !== selectedAdmin._id)
      );

      setMessage({
        type: "success",
        text: `${selectedAdmin.username} has been deleted successfully.`,
      });

      closeModal();
    } catch (error) {
      console.error("DELETE ADMIN ERROR:", error);

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to delete administrator.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // RESET ADMIN PASSWORD
  // ============================================================

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;

    if (!resetPassword.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a new password.",
      });

      return;
    }

    if (resetPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });

      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch("/api/settings/admins/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: selectedAdmin._id,
          newPassword: resetPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setMessage({
        type: "success",
        text: `Password for ${selectedAdmin.username} was reset successfully.`,
      });

      setResetPassword("");

      closeModal();
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to reset password.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // CHANGE OWN PASSWORD
  // ============================================================

  const handleChangeOwnPassword = async () => {
    setMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({
        type: "error",
        text: "Please fill in all password fields.",
      });

      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "New password must be at least 6 characters.",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });

      return;
    }

    try {
      setPasswordLoading(true);

      const response = await fetch("/api/settings/admins/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage({
        type: "success",
        text: "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to change password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ============================================================
  // MODAL HELPERS
  // ============================================================

  const openDeleteModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setModalType("delete");
    setOpenMenu(null);
  };

  const openResetModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setModalType("reset");
    setResetPassword("");
    setShowResetPassword(false);
    setOpenMenu(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedAdmin(null);
    setResetPassword("");
    setShowResetPassword(false);
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ============================================================
  // PASSWORD INPUT COMPONENT
  // ============================================================

  const PasswordInput = ({
    value,
    onChange,
    placeholder,
    show,
    setShow,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    show: boolean;
    setShow: (value: boolean) => void;
  }) => {
    return (
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#063d43] focus:bg-white focus:ring-4 focus:ring-[#063d43]/10"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#063d43] text-white shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  General Settings
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage administrators, permissions and account security.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Super Admin
            </div>
          </div>
        </div>

        {/* =====================================================
            ALERT MESSAGE
        ====================================================== */}

        {message && (
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}

              <p className="text-sm font-medium">{message.text}</p>
            </div>

            <button
              onClick={() => setMessage(null)}
              className="rounded-lg p-1 hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =====================================================
            ADMINISTRATORS
        ====================================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#063d43]" />

                  <h2 className="text-lg font-bold text-gray-900">
                    Administrators
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Manage all administrator accounts and their access.
                </p>
              </div>

              <div className="flex h-9 items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-600">
                <Users className="h-4 w-4" />
                {admins.length} {admins.length === 1 ? "Account" : "Accounts"}
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Administrator
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-[#063d43]" />

                        <p className="text-sm text-gray-500">
                          Loading administrators...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <Users className="mx-auto h-10 w-10 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No administrators found
                      </p>
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr
                      key={admin._id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#063d43]/10 text-sm font-bold uppercase text-[#063d43]">
                            {admin.username.charAt(0)}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {admin.username}
                            </p>

                            <p className="text-xs text-gray-400">
                              Administrator account
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {admin.role === "superadmin" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            <Crown className="h-3.5 w-3.5" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            <User className="h-3.5 w-3.5" />
                            Admin
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          {formatDate(admin.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {admin.role === "superadmin" ? (
                          <div className="text-right">
                            <span className="text-xs font-medium text-gray-400">
                              Protected account
                            </span>
                          </div>
                        ) : (
                          <div className="relative flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === admin._id ? null : admin._id
                                )
                              }
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {openMenu === admin._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenu(null)}
                                />

                                <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => openResetModal(admin)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                  >
                                    <KeyRound className="h-4 w-4 text-[#063d43]" />
                                    Reset Password
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(admin)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Admin
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}

          <div className="divide-y divide-gray-100 md:hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-3 p-12">
                <Loader2 className="h-7 w-7 animate-spin text-[#063d43]" />

                <p className="text-sm text-gray-500">
                  Loading administrators...
                </p>
              </div>
            ) : admins.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No administrators found
                </p>
              </div>
            ) : (
              admins.map((admin) => (
                <div key={admin._id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#063d43]/10 text-sm font-bold uppercase text-[#063d43]">
                        {admin.username.charAt(0)}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {admin.username}
                        </p>

                        <div className="mt-1">
                          {admin.role === "superadmin" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <Crown className="h-3 w-3" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              <User className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {admin.role !== "superadmin" && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu === admin._id ? null : admin._id
                            )
                          }
                          className="rounded-lg border border-gray-200 p-2 text-gray-500"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {openMenu === admin._id && (
                          <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => openResetModal(admin)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <KeyRound className="h-4 w-4 text-[#063d43]" />
                              Reset Password
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(admin)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Admin
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    Created {formatDate(admin.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* =====================================================
            CHANGE PASSWORD
        ====================================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#063d43]/10 text-[#063d43]">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Change Your Password
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update your Super Admin account password.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Current Password
                </label>

                <PasswordInput
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Current password"
                  show={showCurrentPassword}
                  setShow={setShowCurrentPassword}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  New Password
                </label>

                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="New password"
                  show={showNewPassword}
                  setShow={setShowNewPassword}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>

                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm password"
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#063d43]" />

                <p>
                  Use a strong password with at least 6 characters.
                </p>
              </div>

              <button
                type="button"
                onClick={handleChangeOwnPassword}
                disabled={passwordLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#063d43] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#052f34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* =======================================================
          DELETE MODAL
      ======================================================== */}

      {modalType === "delete" && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Delete Administrator?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {selectedAdmin.username}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={actionLoading}
                  className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAdmin}
                  disabled={actionLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          RESET PASSWORD MODAL
      ======================================================== */}

      {modalType === "reset" && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#063d43]/10 text-[#063d43]">
                <KeyRound className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Reset Password
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Set a new password for{" "}
                <span className="font-semibold text-gray-900">
                  {selectedAdmin.username}
                </span>
                .
              </p>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  New Password
                </label>

                <PasswordInput
                  value={resetPassword}
                  onChange={setResetPassword}
                  placeholder="Enter new password"
                  show={showResetPassword}
                  setShow={setShowResetPassword}
                />
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Password must contain at least 6 characters.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={actionLoading}
                  className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#063d43] px-5 text-sm font-semibold text-white transition hover:bg-[#052f34] disabled:opacity-60"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
