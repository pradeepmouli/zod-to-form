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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100">
            z2f Config
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
            aria-label="Close config dialog"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              Paste z2f.config JSON
            </label>
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              placeholder='{"components": {...}, "fields": {...}}'
              rows={4}
              className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 outline-none focus:border-violet-500 font-mono resize-none"
            />
            <button
              onClick={handleImportPaste}
              disabled={!pasteValue.trim()}
              className="mt-1 text-xs px-3 py-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Import
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">or</span>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
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
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded p-2">
              {error}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-500/20 rounded p-2 space-y-1">
              {warnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          )}

          {config && (
            <div className="border-t border-zinc-800 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Current config</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={handleClear}
                    className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-zinc-700 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <pre className="text-xs text-zinc-500 bg-zinc-800/50 rounded p-2 font-mono overflow-auto max-h-32">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
