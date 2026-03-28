"use client";

import { useState, useEffect } from "react";
import { useSettings, useSaveSettings, useModels } from "@/lib/hooks";
import { Key, Shield, HardDrive, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function SettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const saveSettings = useSaveSettings();
  const { data: models } = useModels();

  const [apiKey, setApiKey] = useState("");
  const [defaultT2V, setDefaultT2V] = useState("veo-3-fast");
  const [defaultI2V, setDefaultI2V] = useState("veo-2");
  const [defaultV2V, setDefaultV2V] = useState("kling-v1.6-standard");
  const [maxUploadMb, setMaxUploadMb] = useState(100);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  useEffect(() => {
    if (settings) {
      setDefaultT2V(settings.defaultT2VModel);
      setDefaultI2V(settings.defaultI2VModel);
      setDefaultV2V(settings.defaultV2VModel);
      setMaxUploadMb(settings.maxUploadMb);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      const data: Record<string, unknown> = {
        defaultT2VModel: defaultT2V,
        defaultI2VModel: defaultI2V,
        defaultV2VModel: defaultV2V,
        maxUploadMb,
      };
      if (apiKey) data.apifreeKey = apiKey;

      await saveSettings.mutateAsync(data);
      toast.success("Settings saved successfully");
      setApiKey("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    try {
      const res = await fetch("/api/models?refresh=true");
      if (res.ok) {
        const data = await res.json();
        setTestStatus("success");
        toast.success(`Connected! ${data.models?.length || 0} models available`);
      } else {
        setTestStatus("error");
        toast.error("Connection failed");
      }
    } catch {
      setTestStatus("error");
      toast.error("Connection failed");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-bg-card skeleton-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Key */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">API Configuration</h3>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-txt-muted">ApiFree.ai API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.hasApiKey ? "••••••••  (key configured)" : "Enter your API key"}
              className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50"
            />
            <button
              onClick={handleTestConnection}
              disabled={testStatus === "testing"}
              className="px-4 py-2 rounded-lg bg-bg-elevated border border-border text-sm font-medium text-txt-secondary hover:text-txt-primary hover:border-border-hover transition-colors disabled:opacity-50"
            >
              {testStatus === "testing" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : testStatus === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-accent-green" />
              ) : testStatus === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                "Test"
              )}
            </button>
          </div>
          {settings?.hasApiKey && (
            <p className="text-[10px] text-accent-green flex items-center gap-1">
              <Shield className="w-3 h-3" />
              API key is configured and encrypted
            </p>
          )}
        </div>
      </div>

      {/* Default Models */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-sm">Default Models</h3>

        {[
          { label: "Text to Video", value: defaultT2V, onChange: setDefaultT2V },
          { label: "Image to Video", value: defaultI2V, onChange: setDefaultI2V },
          { label: "Video Remodel", value: defaultV2V, onChange: setDefaultV2V },
        ].map((field) => (
          <div key={field.label} className="space-y-1">
            <label className="text-xs font-medium text-txt-muted">{field.label}</label>
            <select
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:outline-none focus:border-accent/50"
            >
              {models?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Storage */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">Storage</h3>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-txt-muted">Max Upload Size (MB)</label>
          <input
            type="number"
            value={maxUploadMb}
            onChange={(e) => setMaxUploadMb(Number(e.target.value))}
            min={1}
            max={500}
            className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saveSettings.isPending}
        className="w-full py-3 rounded-xl bg-accent hover:bg-accent-glow text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saveSettings.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Save Settings
      </button>
    </div>
  );
}
