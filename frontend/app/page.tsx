"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
        Manage. Analyse. Grow.
      </h1>

      <p className="text-gray-600 text-lg mb-8 max-w-xl text-center">
        A modern dashboard to track your projects, analytics, KPIs, and customers —
        all in one beautiful interface.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-black text-white rounded-xl text-lg hover:bg-gray-800"
        >
          Login
        </Link>

        <Link
          href="/signup"
          className="px-6 py-3 border border-gray-400 text-gray-700 rounded-xl text-lg hover:bg-gray-100"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}
