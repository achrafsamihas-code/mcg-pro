"use client";

import React from "react";
import { TRIP_STAGES, type TripStage } from "@/lib/logistics/types";

/** Horizontal 4-stage delivery stepper: Assigned → Arrived → In Transit → Delivered. */
export default function TripStepper({ stage }: { stage: TripStage }) {
  const currentIndex = TRIP_STAGES.indexOf(stage);

  return (
    <div className="flex items-center">
      {TRIP_STAGES.map((s, i) => {
        const completed = i < currentIndex;
        const current = i === currentIndex;
        const isLast = i === TRIP_STAGES.length - 1;

        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  completed
                    ? "bg-success-500 text-white"
                    : current
                    ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}
              >
                {completed ? (
                  <svg viewBox="0 0 24 24" fill="none" className="size-4">
                    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`hidden max-w-[80px] text-center text-[11px] leading-tight sm:block ${
                  current
                    ? "font-semibold text-brand-600 dark:text-brand-400"
                    : "text-gray-400"
                }`}
              >
                {s}
              </span>
            </div>
            {!isLast && (
              <div className="mx-1 mb-5 h-0.5 flex-1 sm:mx-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completed ? "bg-success-500" : "bg-gray-100 dark:bg-gray-800"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
