"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useProjectStore } from "@/lib/store";
import { useLoadDemand } from "@/hooks/use-api";
import Papa from "papaparse";

interface LoadProfile {
  timestep: number[];
  [season: string]: number[];
}

interface LoadDemandData {
  project_id: string;
  load_profile: LoadProfile;
}

export default function LoadDemandPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { projectId } = useProjectStore();
  const loadDemandMutation = useLoadDemand();

  const [loadData, setLoadData] = useState<LoadProfile | null>(null);
  const [visibleSeasons, setVisibleSeasons] = useState<string[]>([]);
  const [rampEnabled, setRampEnabled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Initialize with sample data for testing
    const sampleData: LoadProfile = {
      timestep: Array.from({ length: 24 }, (_, i) => i),
      winter: [
        3.891376272, 3.858637756, 3.963242994, 4.132282962, 4.581515179,
        5.162331822, 5.899239976, 8.815176394, 9.263618488, 8.48467442,
        8.487606357, 15.40057905, 8.686948972, 9.345073048, 13.98699289,
        13.11970489, 10.5067569, 8.918261815, 10.621929, 14.19470429,
        16.95455871, 20.47695293, 17.43930468, 10.0685547,
      ],
      fall: [
        3.892483486, 3.97301733, 4.404666059, 4.530259663, 5.036884463,
        5.738301168, 6.656826109, 9.947372637, 9.784426994, 8.656192911,
        9.092088681, 12.32987813, 9.787916987, 13.82354352, 11.68856198,
        12.28662929, 10.64418331, 9.367869155, 12.39465148, 15.44467842,
        16.8985169, 16.47170006, 13.68607957, 8.470248611,
      ],
      spring: [
        4.060634208, 4.219408109, 4.961969356, 5.137053824, 5.161052641,
        5.426296986, 6.200015786, 8.033416645, 8.068966743, 7.710740108,
        7.114797443, 8.88547301, 9.026922076, 9.268428339, 9.438550076,
        9.904921441, 9.354557774, 9.22444803, 11.91521833, 15.88198101,
        19.38085197, 18.84231053, 14.182495, 9.050987688,
      ],
      summer: [
        3.71310055, 3.850246513, 3.922147577, 4.840740008, 5.504500008,
        5.692869978, 6.871955753, 8.40650595, 8.899747882, 8.537873092,
        8.002153308, 8.720917636, 9.809463876, 13.25056101, 18.10402886,
        15.91283643, 15.58021407, 14.01421239, 16.10392341, 19.83947905,
        18.51345079, 17.04587092, 14.06639954, 8.643647509,
      ],
    };

    setLoadData(sampleData);
    setVisibleSeasons(["winter", "summer", "fall", "spring"]);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvError(null);
      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            parseCSVData(results.data);
          } catch (error) {
            setCsvError(
              error instanceof Error
                ? error.message
                : "Failed to parse CSV file"
            );
          }
        },
        error: (error) => {
          setCsvError(`CSV parsing error: ${error.message}`);
        },
      });
    } else {
      setCsvError("Please select a valid CSV file");
    }
  };

  const parseCSVData = (data: any[]) => {
    if (!data || data.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Check if we have the required columns
    const firstRow = data[0];
    const requiredColumns = ["timestep"];
    const seasonColumns: string[] = [];

    // Identify season columns (anything that's not timestep)
    Object.keys(firstRow).forEach((key) => {
      const normalizedKey = key.trim().toLowerCase();
      if (normalizedKey !== "timestep" && normalizedKey !== "") {
        seasonColumns.push(key.trim());
      }
    });

    if (seasonColumns.length === 0) {
      throw new Error(
        "No season data columns found. Expected columns like 'winter', 'summer', etc."
      );
    }

    // Validate timestep column
    if (!("timestep" in firstRow) && !("Timestep" in firstRow)) {
      throw new Error("Missing 'timestep' column in CSV");
    }

    // Extract timestep column (case insensitive)
    const timestepKey =
      Object.keys(firstRow).find(
        (key) => key.trim().toLowerCase() === "timestep"
      ) || "timestep";

    // Parse the data
    const parsedData: LoadProfile = {
      timestep: [],
      ...Object.fromEntries(seasonColumns.map((season) => [season, []])),
    };

    data.forEach((row, index) => {
      // Skip rows with undefined timestep
      if (row[timestepKey] === undefined || row[timestepKey] === null) {
        return;
      }

      const timestep = Number(row[timestepKey]);
      if (isNaN(timestep)) {
        console.warn(
          `Invalid timestep at row ${index + 1}: ${row[timestepKey]}`
        );
        return;
      }

      parsedData.timestep.push(timestep);

      seasonColumns.forEach((season) => {
        const value = Number(row[season]);
        if (isNaN(value)) {
          console.warn(
            `Invalid value for ${season} at row ${index + 1}: ${row[season]}`
          );
          parsedData[season].push(0); // Default to 0 for invalid values
        } else {
          parsedData[season].push(value);
        }
      });
    });

    // Validate that we have data
    if (parsedData.timestep.length === 0) {
      throw new Error("No valid data rows found in CSV");
    }

    // Validate that all seasons have the same length as timestep
    seasonColumns.forEach((season) => {
      if (parsedData[season].length !== parsedData.timestep.length) {
        console.warn(`Season ${season} has different length than timestep`);
      }
    });

    console.log("✅ Parsed CSV data:", parsedData);
    setLoadData(parsedData);
    setVisibleSeasons(seasonColumns.slice(0, 4)); // Show first 4 seasons by default
  };

  const handleSeasonToggle = (season: string, checked: boolean) => {
    if (checked) {
      setVisibleSeasons([...visibleSeasons, season]);
    } else {
      setVisibleSeasons(visibleSeasons.filter((s) => s !== season));
    }
  };

  const handleSubmit = async () => {
    if (!projectId) {
      console.error("No project ID found");
      return;
    }

    if (!loadData) {
      setCsvError("Please upload a load demand file first");
      return;
    }

    const submitData: LoadDemandData = {
      project_id: projectId,
      load_profile: loadData,
    };

    console.log("🔗 Submitting load demand data:", submitData);

    try {
      const response = await loadDemandMutation.mutateAsync(submitData);
      console.log("✅ Load demand response:", response);
      router.push("/renewable-potential");
    } catch (error) {
      console.error("❌ Error submitting load demand:", error);
      setCsvError("Failed to submit load demand data. Please try again.");
    }
  };

  const getSeasonColor = (season: string, index: number): string => {
    const colors = [
      "#3b82f6", // blue
      "#f59e0b", // amber
      "#10b981", // emerald
      "#ef4444", // red
      "#8b5cf6", // violet
      "#f97316", // orange
    ];
    return colors[index % colors.length];
  };

  const getMaxValue = (): number => {
    if (!loadData) return 25;

    const allValues: number[] = [];
    visibleSeasons.forEach((season) => {
      if (loadData[season]) {
        allValues.push(...loadData[season]);
      }
    });

    return allValues.length > 0 ? Math.max(...allValues) * 1.1 : 25; // Add 10% padding
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#FABC5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="">
              <Image
                src="/Asset2.svg"
                alt="Autarky Logo"
                width={40}
                height={40}
                className="h-10 w-10 "
              />
            </div>
            <span className="text-xl font-bold text-black">Autarky</span>
          </div>
          <nav className="flex space-x-8">
            <Link href="#" className="text-black hover:text-gray-700">
              Who we are
            </Link>
            <Link href="#" className="text-black hover:text-gray-700">
              Contact us
            </Link>
            <Link href="#" className="text-black hover:text-gray-700">
              Resources
            </Link>
          </nav>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Load Demand</h2>
            <span className="text-sm text-gray-600">Step 4 of 5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: "80%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-lg mb-8 max-w-4xl">
          Welcome to the Load Demand page, here you can upload time-series data
          for each consumption profile or generate synthetic data using RAMP.
          Visualize and review your inputs to ensure realistic and site-specific
          demand modeling.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Upload Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Upload time-series data for each defined load profile, or generate
              demand profiles using the integrated RAMP simulation tool.
            </h3>

            <div className="border rounded-lg p-6 space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-4">
                  Aggregated Load Demand
                </h4>

                <div className="space-y-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload CSV file</span>
                    </Button>
                    {fileName && (
                      <p className="text-sm text-green-600 mt-2">
                        ✅ Uploaded: {fileName}
                      </p>
                    )}
                  </div>

                  {csvError && (
                    <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-700 font-medium">CSV Error</p>
                        <p className="text-red-600 text-sm">{csvError}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ramp-simulation"
                      checked={rampEnabled}
                      onCheckedChange={setRampEnabled}
                      disabled
                    />
                    <Label htmlFor="ramp-simulation" className="text-gray-400">
                      Simulate with RAMP (Coming Soon)
                    </Label>
                  </div>

                  <div>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                      disabled
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload RAMP Input file (Coming Soon)</span>
                    </Button>
                  </div>
                </div>

                {/* CSV Format Help */}
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h5 className="font-medium text-sm mb-2">
                    Expected CSV Format:
                  </h5>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      • First column: <code>timestep</code> (0-23 for hourly
                      data)
                    </p>
                    <p>
                      • Additional columns: season names (e.g., winter, summer,
                      spring, fall)
                    </p>
                    <p>• Values should be numeric (load in kW)</p>
                    <p>• Example: timestep,winter,summer,spring,fall</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visualization */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Use the filters to visualize different seasons.
              </h3>
              <div className="text-sm text-gray-600">Time Series Data</div>
            </div>

            {loadData && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Season Filters</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Filters:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(loadData)
                        .filter((key) => key !== "timestep")
                        .map((season, index) => (
                          <button
                            key={season}
                            onClick={() =>
                              handleSeasonToggle(
                                season,
                                !visibleSeasons.includes(season)
                              )
                            }
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              visibleSeasons.includes(season)
                                ? "bg-blue-100 border-blue-300 text-blue-800"
                                : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {season.charAt(0).toUpperCase() + season.slice(1)}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 h-80 bg-white flex items-center justify-center">
              {loadData ? (
                <div className="w-full h-full relative">
                  {/* Chart container with white background */}
                  <div className="relative w-full h-full bg-white border rounded">
                    <svg viewBox="0 0 400 250" width="100%" height="100%">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <line
                          key={`h-${i}`}
                          x1={40}
                          y1={30 + (i * 180) / 5}
                          x2={380}
                          y2={30 + (i * 180) / 5}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <line
                          key={`v-${i}`}
                          x1={40 + (i * 340) / 6}
                          y1={30}
                          x2={40 + (i * 340) / 6}
                          y2={210}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Chart lines */}
                      {visibleSeasons.map((season, seasonIndex) => {
                        if (!loadData[season]) return null;
                        const maxValue = getMaxValue();
                        const color = getSeasonColor(season, seasonIndex);
                        const points = loadData[season]
                          .map((value: number, index: number) => {
                            // X: 40 to 380, Y: 210 to 30 (invert Y)
                            const x =
                              40 +
                              (index /
                                Math.max(1, loadData[season].length - 1)) *
                                340;
                            const y = 210 - (value / maxValue) * 180;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <polyline
                            key={season}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            points={points}
                          />
                        );
                      })}

                      {/* Y-axis labels */}
                      {Array.from({ length: 6 }).map((_, i) => (
                        <text
                          key={`y-label-${i}`}
                          x={32}
                          y={30 + (i * 180) / 5 + 4}
                          fontSize="10"
                          textAnchor="end"
                          fill="#6b7280"
                        >
                          {Math.round((getMaxValue() / 5) * (5 - i))}
                        </text>
                      ))}

                      {/* X-axis labels */}
                      {[0, 4, 8, 12, 16, 20, 24].map((hour, i) => (
                        <text
                          key={`x-label-${hour}`}
                          x={40 + (i * 340) / 6}
                          y={225}
                          fontSize="10"
                          textAnchor="middle"
                          fill="#6b7280"
                        >
                          {hour}
                        </text>
                      ))}

                      {/* Axis titles */}
                      <text
                        x={200}
                        y={245}
                        fontSize="12"
                        textAnchor="middle"
                        fill="#6b7280"
                      >
                        Hours (0-24)
                      </text>
                      <text
                        x={10}
                        y={120}
                        fontSize="12"
                        textAnchor="middle"
                        fill="#6b7280"
                        transform="rotate(-90 10 120)"
                      >
                        Load (kW)
                      </text>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>Upload a CSV file to visualize load demand data</p>
                  <p className="text-sm mt-2">
                    (Sample data loaded for demonstration)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12 space-x-4">
          <Link href="/technology-parameters">
            <Button variant="outline" className="px-8 py-2">
              Back
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={loadDemandMutation.isPending || !projectId}
            className="bg-black hover:bg-gray-800 text-white px-8 py-2"
          >
            {loadDemandMutation.isPending ? "Submitting..." : "Next"}
          </Button>
        </div>

        {/* Error Message */}
        {loadDemandMutation.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">
              Error: {loadDemandMutation.error.message}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
