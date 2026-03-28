"use client";

import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      <SettingsForm />
    </div>
  );
}
