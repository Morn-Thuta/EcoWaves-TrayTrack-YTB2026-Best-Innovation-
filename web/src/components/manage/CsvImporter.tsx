"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";

type ImportType = "sensor_readings" | "daily_occupancy" | "dishes";

const IMPORT_CONFIGS: Record<ImportType, { label: string; requiredColumns: string[] }> = {
  sensor_readings: {
    label: "Sensor Readings",
    requiredColumns: ["sensor_id", "tray_id", "weight_grams", "recorded_at"],
  },
  daily_occupancy: {
    label: "Guest Counts",
    requiredColumns: ["date", "expected_pax"],
  },
  dishes: {
    label: "Dish Configuration",
    requiredColumns: ["name", "full_tray_weight_grams", "batch_size"],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParsedRow = Record<string, any>;

export function CsvImporter() {
  const [importType, setImportType] = useState<ImportType>("daily_occupancy");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);

    Papa.parse<ParsedRow>(f, {
      header: true,
      preview: 10,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data);
        const cols = results.meta.fields ?? [];
        setColumns(cols);
        // Auto-map columns with matching names
        const autoMap: Record<string, string> = {};
        const required = IMPORT_CONFIGS[importType].requiredColumns;
        required.forEach((req) => {
          const match = cols.find((c) => c.toLowerCase() === req.toLowerCase());
          if (match) autoMap[req] = match;
        });
        setColumnMap(autoMap);
      },
    });
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        const total = rows.length;
        let imported = 0;
        let skipped = 0;
        const batchSize = 500;

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize).map((row) => {
            const mapped: ParsedRow = {};
            Object.entries(columnMap).forEach(([target, source]) => {
              mapped[target] = row[source];
            });
            return mapped;
          });

          const { error: insertError } = await supabase
            .from(importType)
            .upsert(batch, {
              onConflict:
                importType === "daily_occupancy"
                  ? "date"
                  : importType === "sensor_readings"
                  ? "sensor_id,recorded_at"
                  : "name",
              ignoreDuplicates: true,
            });

          if (insertError) {
            skipped += batch.length;
          } else {
            imported += batch.length;
          }

          setProgress(Math.round(((i + batch.length) / total) * 100));
        }

        setResult({ imported, skipped });
        setImporting(false);
      },
    });
  }

  const config = IMPORT_CONFIGS[importType];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Import type selector */}
      <div className="space-y-2">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide block">
          Data Type
        </label>
        <div className="flex gap-2">
          {(Object.keys(IMPORT_CONFIGS) as ImportType[]).map((type) => (
            <button
              key={type}
              onClick={() => { setImportType(type); setFile(null); setPreview([]); setColumns([]); setColumnMap({}); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                importType === type
                  ? "bg-blue-700 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {IMPORT_CONFIGS[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Required columns info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm">
        <p className="text-gray-400 mb-1">Required CSV columns:</p>
        <p className="text-gray-300 font-mono">{config.requiredColumns.join(", ")}</p>
      </div>

      {/* File input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          className="border border-gray-700 text-gray-400 hover:text-white"
        >
          {file ? `📄 ${file.name}` : "Choose CSV File"}
        </Button>
      </div>

      {/* Column mapping */}
      {columns.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-gray-400 text-sm font-medium">Map CSV columns:</p>
          {config.requiredColumns.map((req) => (
            <div key={req} className="flex items-center gap-3">
              <span className="text-gray-300 text-sm w-40 font-mono">{req}</span>
              <span className="text-gray-600">←</span>
              <select
                value={columnMap[req] ?? ""}
                onChange={(e) => setColumnMap({ ...columnMap, [req]: e.target.value })}
                className="rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-1 text-sm"
              >
                <option value="">— select column —</option>
                {columns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs mb-2">Preview (first {preview.length} rows):</p>
          <div className="overflow-x-auto rounded-xl border border-gray-800 max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-900 text-gray-500 sticky top-0">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {preview.map((row, i) => (
                  <tr key={i} className="bg-gray-950">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-1.5 text-gray-400">
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import button */}
      {file && (
        <div className="space-y-3">
          <Button
            onClick={handleImport}
            disabled={importing || config.requiredColumns.some((r) => !columnMap[r])}
            className="bg-green-700 hover:bg-green-600 text-white"
          >
            {importing ? "Importing..." : "Import Data"}
          </Button>

          {importing && <Progress value={progress} className="h-2" />}

          {result && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-green-400 font-medium">✓ {result.imported} rows imported</p>
              {result.skipped > 0 && (
                <p className="text-amber-400 text-sm">{result.skipped} rows skipped (duplicates)</p>
              )}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
}
