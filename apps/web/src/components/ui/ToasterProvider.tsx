"use client";
import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster richColors theme="system" position="top-right" />
  );
}
