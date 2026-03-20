import { useState, useRef } from "react";
import type { PlaygroundConfig } from "../../types/playground.ts";
import { importConfig, exportConfig } from "../../lib/config-io.ts";

interface ConfigImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  config: PlaygroundConfig | null;
  onConfigChange: (config: PlaygroundConfig | null) => void;
}

export function ConfigImportExport({
  isOpen,
  onClose,
  config,
  onConfigChange,
}: ConfigImportExportProps) {
  const [pasteValue, setPasteValue] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportPaste = async () => {
    if (!pasteValue.trim()) return;
    const result = await importConfig(pasteValue);
    if (result.ok) {
      onConfigChange(result.config);
      setWarnings(result.warnings);
      setError(null);
      if (result.warnings.length === 0) {
        setPasteValue("");
      }
    } else {
      setError(result.error);
      setWarnings([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importConfig(file);
    if (result.ok) {
      onConfigChange(result.config);
      setWarnings(result.warnings);
      setError(null);
    } else {
      setError(result.error);
      setWarnings([]);
    }
    e.target.value = "";
  };

  const handleExport = () => {
    const json = exportConfig(config ?? {});
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "z2f.config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    onConfigChange(null);
    setWarnings([]);
    setError(null);
    setPasteValue("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel w-full max-w-md flex flex-col">
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            z2f Config
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors w-7 h-7 flex items-center justify-center rounded-md"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            aria-label="Close config dialog"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Paste z2f.config JSON
            </label>
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              placeholder='{"components": {...}, "fields": {...}}'
              rows={4}
              className="input-glass w-full px-3 py-2 text-sm resize-none"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <button
              onClick={handleImportPaste}
              disabled={!pasteValue.trim()}
              className="btn-accent mt-2 text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Import
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-glass text-xs px-3 py-1.5"
            >
              Upload File
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {error && (
            <div
              className="glass-panel text-xs p-2.5"
              style={{
                color: "rgb(248, 113, 113)",
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
            >
              {error}
            </div>
          )}
          {warnings.length > 0 && (
            <div
              className="glass-panel text-xs p-2.5 space-y-1"
              style={{
                color: "rgb(250, 204, 21)",
                background: "rgba(234, 179, 8, 0.06)",
                border: "1px solid rgba(234, 179, 8, 0.15)",
              }}
            >
              {warnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          )}

          {config && (
            <div className="pt-4 space-y-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Current config
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="btn-glass text-xs px-3 py-1.5"
                  >
                    Export
                  </button>
                  <button
                    onClick={handleClear}
                    className="btn-glass text-xs px-3 py-1.5"
                    style={{ color: "rgb(248, 113, 113)" }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <pre
                className="text-xs rounded-lg p-2.5 overflow-auto max-h-32"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  background: "rgba(15, 20, 32, 0.6)",
                }}
              >
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
