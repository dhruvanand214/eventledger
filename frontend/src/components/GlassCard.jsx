export default function GlassCard({ children }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
      {children}
    </div>
  );
}
