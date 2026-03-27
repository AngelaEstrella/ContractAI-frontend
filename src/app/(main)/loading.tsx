export default function MainLoading() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl bg-white shadow-md" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-white shadow-md" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="h-[28rem] animate-pulse rounded-2xl bg-white shadow-md xl:col-span-8" />
        <div className="space-y-6 xl:col-span-4">
          <div className="h-56 animate-pulse rounded-2xl bg-white shadow-md" />
          <div className="h-48 animate-pulse rounded-2xl bg-white shadow-md" />
        </div>
      </div>
    </div>
  );
}
