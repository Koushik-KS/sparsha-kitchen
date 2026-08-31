import { Suspense } from "react";
import TrackOrderClient from "./TrackOrderClient";

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-orange-50 text-zinc-900">
          <header className="border-b border-orange-100 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
              <div className="text-2xl font-bold text-orange-600">
                Sparsha Kitchen
              </div>
            </div>
          </header>

          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

              <p className="mt-5 text-zinc-600">
                Loading order tracking...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}