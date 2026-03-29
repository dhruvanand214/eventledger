export default function POSLayout({ left, right }) {
  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass-card p-5 md:p-6">
          {left}
        </div>
        <div className="glass-card p-5 md:p-6">
          {right}
        </div>
      </div>
    </div>
  );
}
