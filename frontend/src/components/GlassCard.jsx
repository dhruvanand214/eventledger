export default function GlassCard({ children, className = "" }) {
  return (
    <div className={`glass-card p-6 ${className}`}>
      {children}
    </div>
  );
}
