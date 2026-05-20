export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 fade-in">
      <div className="w-10 h-10 rounded-full border-2 border-divider border-t-accent spin" />
      <div className="text-sm text-hint">Loading…</div>
    </div>
  );
}
