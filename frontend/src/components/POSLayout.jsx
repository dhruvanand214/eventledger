export default function POSLayout({ left, right }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:p-6">
          {left}
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:p-6">
          {right}
        </div>
      </div>
    </div>
  );
}
