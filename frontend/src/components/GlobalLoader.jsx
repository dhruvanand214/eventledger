import { useEffect, useState } from "react";
import { subscribeLoading } from "../utils/networkLoader";

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLoading(setIsLoading);
    return unsubscribe;
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-6 py-5 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <div>
            <p className="font-semibold">Processing...</p>
            <p className="text-xs text-white/70">Please wait</p>
          </div>
        </div>
      </div>
    </div>
  );
}
