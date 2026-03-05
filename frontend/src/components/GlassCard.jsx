export default function GlassCard({ children }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-xl">
      {children}
    </div>
  );
}