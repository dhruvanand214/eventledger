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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(13,10,39,0.6)] backdrop-blur-sm">
      <div className="glass-card px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className="h-6 w-6 rounded-full border-2 border-t-[#4cd7f6] animate-spin"
            style={{ borderColor: "rgba(76,215,246,0.2)", borderTopColor: "#4cd7f6" }}
          />
          <div>
            <p className="font-semibold text-[#e4dfff]">Processing...</p>
            <p className="text-xs text-[#908fa0]">Please wait</p>
          </div>
        </div>
      </div>
    </div>
  );
}
