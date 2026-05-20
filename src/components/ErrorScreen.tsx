interface Props { message: string }

export function ErrorScreen({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center fade-in">
      <div className="text-4xl">🤔</div>
      <h2 className="text-lg font-semibold">Can't sign you in</h2>
      <p className="text-sm text-hint max-w-xs">{message}</p>
      <button
        onClick={() => location.reload()}
        className="mt-2 px-5 py-2 rounded-full bg-accent text-white text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
