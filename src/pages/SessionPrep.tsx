/**
 * Public session-preparation page.
 *
 * Stub for now — the full planner (filters, weather strip, recommended
 * targets) will be assembled in a follow-up iteration on top of these
 * foundations.
 */
export function SessionPrep() {
  return (
    <div className="min-h-screen bg-space-bg">
      <main className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-semibold text-text-primary">Plan your night</h1>
        <p className="mt-2 text-text-secondary">
          Coming up: weather, moon, recommended deep-sky targets.
        </p>
      </main>
    </div>
  );
}
