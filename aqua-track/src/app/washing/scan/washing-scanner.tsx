"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRScanner } from "@/components/qr-scanner";
import type { ScannerResult } from "@/lib/scanner";
import { getLaundryStatusLabel } from "@/lib/labels";
import {
  confirmWashingScanAction,
  resolveWashingScanAction,
} from "./scan-actions";

export function WashingScanner() {
  const [identifier, setIdentifier] = useState("");
  const [preview, setPreview] = useState<ScannerResult | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function resetStation() {
    setPreview(null);
    setIdentifier("");
    setMessage("");
    setSuccess(false);
  }

  function lookup(value: string) {
    const next = value.trim();
    if (!next) {
      return;
    }

    startTransition(async () => {
      const state = await resolveWashingScanAction(next);
      setIdentifier(next);
      setPreview(state.result);
      setMessage(state.message);
      setSuccess(state.success);
    });
  }

  function confirm() {
    startTransition(async () => {
      const state = await confirmWashingScanAction(identifier);
      setPreview(state.result);
      setMessage(state.message);
      setSuccess(state.success);
      if (state.success && state.result?.operation !== "INFO") {
        setIdentifier("");
        setPreview(null);
      }
    });
  }

  const canConfirm =
    preview?.success &&
    (preview.operation === "START_WASHING" ||
      preview.operation === "COMPLETE_WASHING");

  return (
    <div className="space-y-4">
      <QRScanner
        continuous
        onScan={(value) => {
          setIdentifier(value);
          lookup(value);
        }}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-sm text-muted-foreground">
            OR
          </span>
        </div>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          lookup(identifier);
        }}
      >
        <label htmlFor="identifier" className="text-sm font-medium">
          Roll number or QR token
        </label>
        <Input
          id="identifier"
          name="identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Scan or type an identifier"
          autoComplete="off"
        />
        <Button type="submit" disabled={pending || !identifier.trim()}>
          {pending ? "Checking..." : "Look up bag"}
        </Button>
      </form>

      {preview ? (
        <div className="space-y-3 rounded-lg border p-4">
          {preview.bagCode ? (
            <p className="font-medium">Bag {preview.bagCode}</p>
          ) : null}
          {preview.studentName ? (
            <p className="text-sm text-muted-foreground">{preview.studentName}</p>
          ) : null}
          {preview.orderNumber ? (
            <p className="text-sm">
              {preview.orderNumber}
              {preview.orderStatus
                ? ` · ${getLaundryStatusLabel(preview.orderStatus)}`
                : ""}
            </p>
          ) : null}
          <p className="text-sm">{preview.message}</p>

          {canConfirm ? (
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={confirm} disabled={pending}>
                {preview.operation === "START_WASHING"
                  ? "Start washing"
                  : "Mark washed"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetStation}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={resetStation}>
              Scan next
            </Button>
          )}
        </div>
      ) : null}

      {message && (!preview || !canConfirm) ? (
        <p
          className={
            success ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
