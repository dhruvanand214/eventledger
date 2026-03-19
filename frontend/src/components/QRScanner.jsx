import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";

export default function QRScanner({ onScan }) {
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const isHandlingScanRef = useRef(false);
  const lastDecodedRef = useRef("");
  const lastDecodedAtRef = useRef(0);
  const elementId = useId().replace(/:/g, "");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = "";
    }

    if (scannerRef.current) {
      return undefined;
    }

    const scanner = new Html5QrcodeScanner(
      elementId,
      { fps: 10, qrbox: 250 },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        const now = Date.now();
        const isSameRecentCode =
          decodedText === lastDecodedRef.current && now - lastDecodedAtRef.current < 1500;

        if (isHandlingScanRef.current || isSameRecentCode) {
          return;
        }

        isHandlingScanRef.current = true;
        lastDecodedRef.current = decodedText;
        lastDecodedAtRef.current = now;
        setScannerError("");
        let shouldStopScanner = false;
        try {
          shouldStopScanner = await onScanRef.current(decodedText);
        } finally {
          // Keep a short lock to avoid frame-level duplicate callbacks.
          setTimeout(() => {
            isHandlingScanRef.current = false;
          }, 400);
        }

        if (shouldStopScanner !== false) {
          scannerRef.current?.clear().catch(() => {});
          scannerRef.current = null;
        }
      },
      (errorMessage) => {
        // Ignore frequent frame-level decode misses; surface only actionable errors.
        if (!errorMessage?.includes("No MultiFormat Readers were able to detect the code")) {
          setScannerError("Unable to scan QR code. Check camera permissions and try again.");
          console.error("QR scanner error:", errorMessage);
        }
      }
    );

    return () => {
      scannerRef.current?.clear().catch(() => {});
      scannerRef.current = null;
      const cleanupContainer = document.getElementById(elementId);
      if (cleanupContainer) {
        cleanupContainer.innerHTML = "";
      }
    };
  }, [elementId]);

  return (
    <>
      <div id={elementId} />
      {scannerError ? <p>{scannerError}</p> : null}
    </>
  );
}
