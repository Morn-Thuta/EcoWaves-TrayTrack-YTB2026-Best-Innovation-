"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";

type ImportType = "sensor_readings" | "daily_occupancy" | "dishes";

const IMPORT_CONFIGS: Record<
  ImportType,
  {
    label: string;
    requiredColumns: string[];
    optionalColumns: string[];
    conflict: string;
    /** merge = update existing rows on conflict; ignore = skip duplicates */
    mode: "merge" | "ignore";
  }
> = {
  sensor_readings: {
    label: "Sensor Readings",
    requiredColumns: ["sensor_id", "tray_id", "weight_grams", "recorded_at"],
    optionalColumns: ["is_averaged", "batch_source_count"],
    conflict: "sensor_id,recorded_at",
    mode: "ignore",
  },
  daily_occupancy: {
    label: "Guest Counts",
    requiredColumns: ["date", "expected_pax"],
    optionalColumns: ["actual_pax", "source", "notes"],
    conflict: "date",
    mode: "merge", // re-importing a date updates it (e.g. adding actual_pax)
  },
  dishes: {
    label: "Dish Configuration",
    requiredColumns: ["name", "full_tray_weight_grams", "batch_size"],
    optionalColumns: [
      "category",
      "dish_type",
      "tare_weight_grams",
      "cook_trigger_percent",
      "average_cook_time_minutes",
      "popularity_score",
    ],
    conflict: "name",
    mode: "ignore",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParsedRow = Record<string, any>;

interface CsvImporterProps {
  defaultType?: ImportType;
}

export function CsvImporter({ defaultType = "daily_occupancy" }: CsvImporterProps) {
  const [importType, setImportType] = useState<ImportType>(defaultType);
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
      dynamicTyping: true, // parse "118" as 118 — keeps numeric columns numeric
      complete: (results) => {
        setPreview(results.data);
        const cols = results.meta.fields ?? [];
        setColumns(cols);
        // Auto-map columns with matching names (required AND optional)
        const autoMap: Record<string, string> = {};
        const cfg = IMPORT_CONFIGS[importType];
        [...cfg.requiredColumns, ...cfg.optionalColumns].forEach((col) => {
          const match = cols.find((c) => c.toLowerCase() === col.toLowerCase());
          if (match) autoMap[col] = match;
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
      dynamicTyping: true, // parse numeric columns as numbers
      complete: async (results) => {
        const cfg = IMPORT_CONFIGS[importType];
        const rows = results.data;
        const total = rows.length;
        let imported = 0;
        let skipped = 0;
        const batchSize = 500;

        for (let i = 0; i < rows.length; i += batchSize) {
          const slice = rows.slice(i, i + batchSize);

          // Map every column the user mapped (required + optional), dropping
          // blank cells so we never write empty strings into typed columns.
          const batch = slice
            .map((row) => {
              const mapped: ParsedRow = {};
              Object.entries(columnMap).forEach(([target, source]) => {
                const v = source ? row[source] : undefined;
                if (v !== undefined && v !== null && v !== "") mapped[target] = v;
              });
              return mapped;
            })
            .filter((m) => cfg.requiredColumns.every((rc) => m[rc] !== undefined));

          // .select() returns the rows that were actually written, so we can
          // report a truthful count (ignored duplicates are NOT returned).
          const { data, error: insertError } = await supabase
            .from(importType)
            .upsert(batch, {
              onConflict: cfg.conflict,
              ignoreDuplicates: cfg.mode === "ignore",
            })
            .select();

          if (insertError) {
            skipped += slice.length;
            setError(`Import error: ${insertError.message}`);
          } else {
            const written = data?.length ?? 0;
            imported += written;
            skipped += slice.length - written;
          }

          setProgress(Math.round(((i + slice.length) / total) * 100));
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

      {/* Columns info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm space-y-1">
        <p className="text-gray-400">
          Required columns:{" "}
          <span className="text-gray-300 font-mono">{config.requiredColumns.join(", ")}</span>
        </p>
        {config.optionalColumns.length > 0 && (
          <p className="text-gray-500">
            Optional:{" "}
            <span className="text-gray-400 font-mono">{config.optionalColumns.join(", ")}</span>
          </p>
        )}
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
          {[
            ...config.requiredColumns.map((c) => ({ col: c, required: true })),
            ...config.optionalColumns.map((c) => ({ col: c, required: false })),
          ].map(({ col, required }) => (
            <div key={col} className="flex items-center gap-3">
              <span className="text-gray-300 text-sm w-40 font-mono">
                {col}
                {!required && <span className="text-gray-600 ml-1 font-sans">(optional)</span>}
              </span>
              <span className="text-gray-600">←</span>
              <select
                value={columnMap[col] ?? ""}
                onChange={(e) => setColumnMap({ ...columnMap, [col]: e.target.value })}
                className="rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-1 text-sm"
              >
                <option value="">{required ? "— select column —" : "— not mapped —"}</option>
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
