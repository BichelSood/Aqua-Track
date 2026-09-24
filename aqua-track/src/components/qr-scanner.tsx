"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Camera, CheckCircle2, ScanLine, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type QRScannerProps = {
  onScan: (value: string) => void;
  continuous?: boolean;
};

export function QRScanner({
  onScan,
  continuous = false,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const scannedRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  async function startScanner() {
    if (!videoRef.current || starting) {
      return;
    }

    setStarting(true);
    setError("");
    setDetected(false);
    scannedRef.current = false;

    try {
      scannerRef.current?.destroy();

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (scannedRef.current) {
            return;
          }

          const value = result.data.trim();

          if (!value) {
            return;
          }

          scannedRef.current = true;
          setDetected(true);

          onScan(value);

          if (continuous) {
            restartTimerRef.current = setTimeout(() => {
              scannedRef.current = false;
              setDetected(false);
            }, 2000);

            return;
          }

          scanner.stop();
          setActive(false);
        },
        {
          preferredCamera: "environment",
          returnDetailedScanResult: true,
        },
      );

      scannerRef.current = scanner;

      await scanner.start();

      setActive(true);
    } catch (scanError) {
      scannerRef.current?.destroy();
      scannerRef.current = null;
      setActive(false);

      setError(
        scanError instanceof Error
          ? scanError.message
          : "Unable to access the camera.",
      );
    } finally {
      setStarting(false);
    }
  }

  function stopScanner() {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    scannerRef.current?.stop();

    setActive(false);
    setDetected(false);
    scannedRef.current = false;
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ScanLine className="size-5" />
          </div>

          <div>
            <h3 className="font-semibold">Scan Bag QR</h3>
            <p className="text-sm text-muted-foreground">
              Scan the QR code attached to the laundry bag.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* IMPORTANT:
            Fixed height prevents the camera viewport from collapsing
            when the video starts.
        */}
        <div className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-black sm:h-[420px]">
          {/* Camera video */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />

          {/* Camera not started */}
          {!active ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black px-6 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/10 text-white">
                <Camera className="size-7" />
              </div>

              <p className="font-medium text-white">
                {starting ? "Starting camera..." : "Camera is ready"}
              </p>

              <p className="mt-1 max-w-sm text-sm leading-6 text-white/60">
                Start the scanner and place the bag QR code inside the frame.
              </p>
            </div>
          ) : null}

          {/* Active scanner */}
          {active ? (
            <>
              {/* Dark edge overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_35%,rgb(0_0_0_/_0.65)_100%)]" />

              {/* Scan frame */}
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div className="relative h-[230px] w-[230px] sm:h-[270px] sm:w-[270px]">
                  {/* Corners */}

                  <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-[3px] border-t-[3px] border-accent" />

                  <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-[3px] border-t-[3px] border-accent" />

                  <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-[3px] border-l-[3px] border-accent" />

                  <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-[3px] border-r-[3px] border-accent" />

                  {/* Scanning line */}
                  {!detected ? (
                    <span className="scan-line absolute inset-x-4 top-1/2 h-0.5 bg-accent shadow-[0_0_16px_rgba(34,211,238,0.95)]" />
                  ) : null}
                </div>
              </div>

              {/* Status */}
              <div className="absolute inset-x-0 top-0 z-30 flex justify-center p-4">
                <div className="rounded-full bg-black/65 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                  {detected ? "QR code detected" : "Scanning..."}
                </div>
              </div>

              {/* Instruction */}
              <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center p-4">
                <div className="rounded-full bg-black/65 px-4 py-2 text-xs text-white backdrop-blur">
                  Align the QR code inside the frame
                </div>
              </div>

              {/* Detection success */}
              {detected ? (
                <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-success text-white shadow-xl">
                    <CheckCircle2 className="size-10" />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {/* Controls */}
        <div className="mt-4">
          {!active ? (
            <Button
              type="button"
              onClick={startScanner}
              disabled={starting}
              className="w-full"
            >
              <Camera className="size-4" />
              {starting ? "Starting camera..." : "Start Camera"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={stopScanner}
              className="w-full"
            >
              <Square className="size-4" />
              Stop Scanner
            </Button>
          )}
        </div>

        {/* Error */}
        {error ? (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm font-medium text-destructive">
              Camera could not start
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}