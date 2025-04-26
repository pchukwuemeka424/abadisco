"use client";

import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/supabaseClient";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const passwordSchema = z.object({
  current: z.string().min(1, "Current password is required"),
  next: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirm: z.string()
}).refine((data) => data.next === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

export default function UpdatePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // Validate form
      const result = passwordSchema.safeParse({ current, next, confirm });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ 
        password: next 
      });

      if (updateError) throw updateError;
      
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="flex-1 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-500 flex items-center gap-2">
            <a href="/dashboard" className="hover:text-rose-600 transition-colors">Dashboard</a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Update Password</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-rose-100 rounded-xl">
                <FaLock className="text-rose-600" />
              </span>
              Update Password
            </h1>
            <p className="mt-2 text-gray-600">
              Keep your account secure by using a strong, unique password that you don't use elsewhere.
            </p>
          </div>

          {/* Security Tips */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Password Requirements:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number</li>
              <li>• Contains at least one special character</li>
            </ul>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-green-700">
              <p className="font-medium">Password updated successfully!</p>
              <p className="text-sm mt-1">Your password has been changed. Please use your new password the next time you log in.</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrent ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={next}
                      onChange={(e) => setNext(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}