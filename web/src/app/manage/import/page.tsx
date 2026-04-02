import { CsvImporter } from "@/components/manage/CsvImporter";

export default function ImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-2">CSV Import</h2>
        <p className="text-gray-400 text-sm">
          Import historical sensor readings, guest count data, or dish configurations.
          Duplicate records (same tray + timestamp) are automatically skipped.
        </p>
      </div>
      <CsvImporter />
    </div>
  );
}
