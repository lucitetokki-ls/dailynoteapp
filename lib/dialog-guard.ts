"use client";

let blockDialogOpenUntil = 0;

export function blockDialogReopen() {
  blockDialogOpenUntil = Date.now() + 350;
}

export function canOpenDialog() {
  return Date.now() > blockDialogOpenUntil;
}

export function stopDialogEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
