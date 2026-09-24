"use client";

import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  children: ReactNode;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => dialogRef.current?.showModal()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            dialogRef.current?.showModal();
          }
        }}
      >
        {children}
      </span>

      <dialog
        ref={dialogRef}
        className="glass-panel w-full max-w-md rounded-[1.25rem] p-6 text-foreground shadow-2xl backdrop:bg-[#071A2B]/70 open:animate-[dialog-in_220ms_ease-out]"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => dialogRef.current?.close()}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
