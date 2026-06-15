"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

/** A selectable role card definition for the development gateway. */
interface RoleCard {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  accent: string; // gradient classes for the icon tile
  icon: React.ReactNode;
}

const ROLE_CARDS: RoleCard[] = [
  {
    key: "admin",
    title: "Super Admin / CEO",
    subtitle: "Command center, BI analytics, global oversight",
    href: "/admin/dashboard",
    accent: "from-violet-500 to-indigo-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M3 3v18h18M7 14l4-4 4 4 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "supplier",
    title: "Supplier",
    subtitle: "Listings, B2B negotiations, fulfilment",
    href: "/supplier/dashboard",
    accent: "from-sky-500 to-blue-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M3 9h18M3 9l2-5h14l2 5M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M9 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "warehouse",
    title: "Warehouse",
    subtitle: "Capacity, tenants, bookings, pricing",
    href: "/warehouse/dashboard",
    accent: "from-emerald-500 to-teal-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35ZM6 18h12M6 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "logistics",
    title: "Logistics / Driver",
    subtitle: "Job board, routes, deliveries, wallet",
    href: "/logistics/dashboard",
    accent: "from-amber-500 to-orange-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M1 16V6h13v10M14 9h4l3 3v4h-7M5.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "customer",
    title: "B2B Customer / Buyer",
    subtitle: "Marketplace, bulk orders, tracking, disputes",
    href: "/customer/dashboard",
    accent: "from-rose-500 to-pink-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PortalGateway() {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const enter = (card: RoleCard) => {
    setLoadingKey(card.key);
    router.push(card.href);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl dark:bg-brand-500/10" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-16">
        {/* Branding */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-gray-600 backdrop-blur dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
            </span>
            Live Deployment · Testing Phase
          </span>
          <h1 className="mt-6 bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-white dark:to-gray-400 sm:text-5xl">
            MaVentures Operating System
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 dark:text-gray-400">
            The unified B2B Trade &amp; Logistics ecosystem. Select a portal below
            to explore each role&apos;s live dashboard.
          </p>
        </div>

        {/* Role grid */}
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_CARDS.map((card) => {
            const isLoading = loadingKey === card.key;
            return (
              <button
                key={card.key}
                onClick={() => enter(card)}
                disabled={loadingKey !== null}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/10 disabled:cursor-wait dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white ${card.accent}`}
                >
                  {card.icon}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {card.subtitle}
                </p>

                <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
                  {isLoading ? (
                    <>
                      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Entering…
                    </>
                  ) : (
                    <>
                      Enter portal
                      <svg viewBox="0 0 24 24" fill="none" className="size-4 transition-transform group-hover:translate-x-1">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            );
          })}

          {/* Sign-in card */}
          <button
            onClick={() => {
              setLoadingKey("signin");
              router.push("/signin");
            }}
            disabled={loadingKey !== null}
            className="group relative flex flex-col items-start justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-transparent p-6 text-left transition-all hover:border-brand-400 hover:bg-white/50 disabled:cursor-wait dark:border-gray-700 dark:hover:bg-white/[0.02]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" className="size-6">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-gray-800 dark:text-white/90">
              {loadingKey === "signin" ? "Loading…" : "Sign In"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Authenticate to be routed to your role automatically
            </p>
          </button>
        </div>

        <p className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} MaVentures. Development gateway — direct
          portal access is enabled for testing.
        </p>
      </div>
    </main>
  );
}
