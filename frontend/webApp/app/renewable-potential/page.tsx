"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  AlertCircle,
} from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { useRenewablesPotential } from "@/hooks/use-api"; // You'll need to create this hook
import Papa from "papaparse";

interface RenewableProfile {
  [season: string]: number[];
}

interface TechnicalParameters {
  component_name: string;
  nominal_capacity: number;
  inverter_efficiency?: number;
  power_curve?: any; // For wind turbines
  head?: number; // For hydro
  efficiency?: number; // For hydro
}

interface RenewablesPotentialData {
  project_id: string;
  technology: string;
  mode: string;
  technical_parameters: TechnicalParameters;
  renewables_potential_profile: RenewableProfile;
}

export default function RenewablePotentialPage() {
  const router = useRouter();
  const { projectId } = useProjectStore();
  const renewablesPotentialMutation = useRenewablesPotential(); // You'll need to create this hook

  const [currentComponent, setCurrentComponent] = useState(0);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [renewableData, setRenewableData] = useState<{
    [key: string]: RenewableProfile;
  }>({});
  const [visibleSeasons, setVisibleSeasons] = useState<{
    [key: string]: string[];
  }>({});
  const [csvErrors, setCsvErrors] = useState<{ [key: string]: string | null }>(
    {}
  );
  const [fileNames, setFileNames] = useState<{ [key: string]: string | null }>(
    {}
  );
  const [technicalParams, setTechnicalParams] = useState<{
    [key: string]: TechnicalParameters;
  }>({});
  const [componentName, setComponentName] = useState("");
  const [nominalCapacity, setNominalCapacity] = useState(1.0);
  const [inverterEfficiency, setInverterEfficiency] = useState(0.95);

  const components = [
    {
      name: "Solar PV",
      tech_key: "solar_pv",
      icon: "/Icons/solar-panel.svg",
      description:
        "Upload CSV file with electricity production profile per unit of nominal capacity",
      apiDescription:
        "Download irradiance data from PVGIS API and simulate PV electricity production",
      apiName: "PVGIS",
      defaultParams: {
        component_name: "CS3U-350MS",
        nominal_capacity: 1.0,
        inverter_efficiency: 0.95,
      },
    },
    {
      name: "Wind Turbine",
      tech_key: "wind_turbine",
      icon: "/Icons/wind-power.svg",
      description:
        "Upload CSV file with electricity production profile per unit of nominal capacity",
      apiDescription:
        "Download wind speed data from PVGIS API and simulate wind electricity production",
      apiName: "PVGIS",
      defaultParams: {
        component_name: "Generic Wind Turbine",
        nominal_capacity: 1.0,
        power_curve: {},
      },
    },
    {
      name: "Mini-Hydro",
      tech_key: "mini_hydro",
      icon: "/Icons/hydro.svg",
      description:
        "Upload CSV file with water flow rate data for mini-hydro potential assessment",
      apiDescription: "Download hydrological data from external APIs",
      apiName: "Hydro API",
      defaultParams: {
        component_name: "Generic Mini-Hydro",
        nominal_capacity: 1.0,
        head: 10.0,
        efficiency: 0.8,
      },
    },
  ];

  useEffect(() => {
    setIsClient(true);

    // Initialize technical parameters
    const initialParams: { [key: string]: TechnicalParameters } = {};
    components.forEach((comp) => {
      initialParams[comp.tech_key] = comp.defaultParams;
    });
    setTechnicalParams(initialParams);

    // Initialize with sample data for Solar PV
    const sampleSolarData: RenewableProfile = {
      timestep: Array.from({ length: 24 }, (_, i) => i),
      winter: [
        0.0, 0.0, 0.0, 0.01, 0.03, 0.08, 0.2, 0.35, 0.5, 0.55, 0.5, 0.45, 0.4,
        0.35, 0.25, 0.15, 0.1, 0.05, 0.01, 0.0, 0.0, 0.0, 0.0, 0.0,
      ],
      spring: [
        0.0, 0.0, 0.01, 0.03, 0.08, 0.18, 0.35, 0.6, 0.75, 0.8, 0.75, 0.7, 0.65,
        0.6, 0.5, 0.35, 0.25, 0.15, 0.08, 0.03, 0.01, 0.0, 0.0, 0.0,
      ],
      summer: [
        0.0, 0.0, 0.01, 0.05, 0.12, 0.3, 0.55, 0.8, 0.9, 0.95, 0.9, 0.85, 0.8,
        0.75, 0.6, 0.4, 0.3, 0.2, 0.1, 0.05, 0.01, 0.0, 0.0, 0.0,
      ],
      fall: [
        0.0, 0.0, 0.01, 0.03, 0.1, 0.22, 0.4, 0.65, 0.78, 0.8, 0.75, 0.7, 0.6,
        0.55, 0.4, 0.25, 0.15, 0.08, 0.03, 0.01, 0.0, 0.0, 0.0, 0.0,
      ],
    };

    setRenewableData({ solar_pv: sampleSolarData });
    setVisibleSeasons({ solar_pv: ["winter", "summer", "fall", "spring"] });
  }, []);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    techKey: string
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvErrors((prev) => ({ ...prev, [techKey]: null }));
      setFileNames((prev) => ({ ...prev, [techKey]: file.name }));

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            parseCSVData(results.data, techKey);
          } catch (error) {
            setCsvErrors((prev) => ({
              ...prev,
              [techKey]:
                error instanceof Error
                  ? error.message
                  : "Failed to parse CSV file",
            }));
          }
        },
        error: (error) => {
          setCsvErrors((prev) => ({
            ...prev,
            [techKey]: `CSV parsing error: ${error.message}`,
          }));
        },
      });
    } else {
      setCsvErrors((prev) => ({
        ...prev,
        [techKey]: "Please select a valid CSV file",
      }));
    }
  };

  const parseCSVData = (data: any[], techKey: string) => {
    if (!data || data.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Identify season columns (all columns)
    const firstRow = data[0];
    const seasonColumns: string[] = Object.keys(firstRow).filter(
      (key) => key.trim() !== ""
    );

    if (seasonColumns.length === 0) {
      throw new Error(
        "No season data columns found. Expected columns like 'winter', 'summer', etc."
      );
    }

    // Use row index as timestep (not sent to backend)
    const parsedData: RenewableProfile = {
      // timestep: Array.from({ length: data.length }, (_, i) => i), // REMOVE THIS LINE
      ...Object.fromEntries(seasonColumns.map((season) => [season, []])),
    };

    data.forEach((row, index) => {
      seasonColumns.forEach((season) => {
        const value = Number(row[season]);
        parsedData[season].push(isNaN(value) ? 0 : value);
      });
    });

    setRenewableData((prev) => ({ ...prev, [techKey]: parsedData }));
    setVisibleSeasons((prev) => ({
      ...prev,
      [techKey]: seasonColumns.slice(0, 4),
    }));
  };

  const handleSeasonToggle = (
    techKey: string,
    season: string,
    checked: boolean
  ) => {
    const currentVisible = visibleSeasons[techKey] || [];
    if (checked) {
      setVisibleSeasons((prev) => ({
        ...prev,
        [techKey]: [...currentVisible, season],
      }));
    } else {
      setVisibleSeasons((prev) => ({
        ...prev,
        [techKey]: currentVisible.filter((s) => s !== season),
      }));
    }
  };

  const handleAPIDownload = () => {
    console.log(`Downloading from ${components[currentComponent].apiName} API`);
    // Handle API download here
  };

  const nextComponent = () => {
    if (currentComponent < components.length - 1) {
      setCurrentComponent(currentComponent + 1);
    }
  };

  const prevComponent = () => {
    if (currentComponent > 0) {
      setCurrentComponent(currentComponent - 1);
    }
  };

  const handleSubmit = async () => {
    if (!projectId) {
      console.error("No project ID found");
      return;
    }

    // Submit data for all components that have data
    const submissionPromises = Object.entries(renewableData).map(
      async ([techKey, profile]) => {
        let techParams = technicalParams[techKey];
        // For solar_pv, override with input values
        if (techKey === "solar_pv") {
          techParams = {
            component_name: componentName,
            nominal_capacity: nominalCapacity,
            inverter_efficiency: inverterEfficiency / 100, // If backend expects 0-1
          };
        }
        const submitData: RenewablesPotentialData = {
          project_id: projectId,
          technology: techKey,
          mode: "csv_upload",
          technical_parameters: techParams,
          renewables_potential_profile: profile,
        };

        console.log(
          `🔗 Submitting renewable potential data for ${techKey}:`,
          submitData
        );
        return renewablesPotentialMutation.mutateAsync(submitData);
      }
    );

    try {
      const responses = await Promise.all(submissionPromises);
      console.log("✅ All renewable potential responses:", responses);
      router.push("/model-uncertainties");
    } catch (error) {
      console.error("❌ Error submitting renewable potential:", error);
      setCsvErrors((prev) => ({
        ...prev,
        [components[currentComponent].tech_key]:
          "Failed to submit renewable potential data. Please try again.",
      }));
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

  const getMaxValue = (techKey: string): number => {
    const data = renewableData[techKey];
    if (!data) return 1;

    const currentVisible = visibleSeasons[techKey] || [];
    const allValues: number[] = [];
    currentVisible.forEach((season) => {
      if (data[season]) {
        allValues.push(...data[season]);
      }
    });

    return allValues.length > 0 ? Math.max(...allValues) * 1.1 : 1;
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  const current = components[currentComponent];
  const currentData = renewableData[current.tech_key];
  const currentVisible = visibleSeasons[current.tech_key] || [];
  const currentError = csvErrors[current.tech_key];
  const currentFileName = fileNames[current.tech_key];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#FABC5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="">
              <div className="">
                <Image
                  src="/Asset2.svg"
                  alt="Autarky Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
              </div>
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
            <h2 className="text-xl font-bold">Renewables Potential</h2>
            <span className="text-sm text-gray-600">Step 5 of 5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-lg mb-8 max-w-4xl">
          Welcome to the Renewable Potential page, here you can input
          site-specific renewable resource data by uploading CSV files or
          retrieving data directly from the PVGIS API for solar production and
          wind speed. Customize wind energy generation using power curves, and
          provide mini-hydro potential via uploaded flow rate data.
        </p>

        <div className="relative">
          {/* Component Carousel */}
          <div className="border rounded-lg p-8 min-h-[500px] flex items-center justify-between">
            {/* Navigation Arrow Left */}
            <button
              onClick={prevComponent}
              disabled={currentComponent === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md disabled:opacity-50 hover:bg-gray-50 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Component Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 mx-16">
              {/* Left Side - Component Info and Actions */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-2">
                    <Image
                      src={current.icon}
                      alt={current.name}
                      width={40}
                      height={40}
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{current.name}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 mb-4">{current.description}</p>

                    {/* Only show for Solar PV */}
                    {current.tech_key === "solar_pv" && (
                      <div className="mb-4 space-y-2">
                        <div>
                          <label className="block font-medium mb-1">
                            Component Name
                          </label>
                          <input
                            type="text"
                            value={componentName}
                            onChange={(e) => setComponentName(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                            placeholder="e.g. CS3U-350MS"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">
                            Nominal Capacity [kW]
                          </label>
                          <input
                            type="number"
                            value={nominalCapacity}
                            onChange={(e) =>
                              setNominalCapacity(Number(e.target.value))
                            }
                            className="border rounded px-2 py-1 w-full"
                            placeholder="e.g. 1.0"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">
                            Inverter Efficiency [%]
                          </label>
                          <input
                            type="number"
                            value={inverterEfficiency}
                            onChange={(e) =>
                              setInverterEfficiency(Number(e.target.value))
                            }
                            className="border rounded px-2 py-1 w-full"
                            placeholder="e.g. 95"
                          />
                        </div>
                      </div>
                    )}

                    <input
                      ref={(el) => {
                        fileInputRefs.current[currentComponent] = el;
                      }}
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, current.tech_key)}
                      className="hidden"
                    />
                    <Button
                      onClick={() =>
                        fileInputRefs.current[currentComponent]?.click()
                      }
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload CSV file</span>
                    </Button>
                    {currentFileName && (
                      <p className="text-sm text-green-600 mt-2">
                        ✅ Uploaded: {currentFileName}
                      </p>
                    )}
                  </div>

                  {currentError && (
                    <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-700 font-medium">CSV Error</p>
                        <p className="text-red-600 text-sm">{currentError}</p>
                      </div>
                    </div>
                  )}

                  {/* CSV Format Help */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h5 className="font-medium text-sm mb-2">
                      Expected CSV Format:
                    </h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        • Each column should be a season name (e.g., winter,
                        summer, spring, fall)
                      </p>
                      <p>
                        • Each row is an hourly value (0-23 rows for 24 hours)
                      </p>
                      <p>• Values should be numeric (capacity factor 0-1)</p>
                      <p>• Example: winter,summer,spring,fall</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Visualization */}
              <div className="space-y-4">
                {/* Season Filters */}
                {currentData && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Season Filters
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Filters:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(currentData)
                            .filter((key) => key !== "timestep")
                            .map((season, index) => (
                              <button
                                key={season}
                                onClick={() =>
                                  handleSeasonToggle(
                                    current.tech_key,
                                    season,
                                    !currentVisible.includes(season)
                                  )
                                }
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                  currentVisible.includes(season)
                                    ? "bg-blue-100 border-blue-300 text-blue-800"
                                    : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {season.charAt(0).toUpperCase() +
                                  season.slice(1)}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart */}
                <div
                  className="border rounded-lg p-4 bg-white flex items-center justify-center"
                  style={{ minHeight: 350, height: 350 }}
                >
                  {currentData ? (
                    <svg viewBox="0 0 500 350" width="100%" height="100%">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <line
                          key={`h-${i}`}
                          x1={50}
                          y1={40 + (i * 250) / 5}
                          x2={470}
                          y2={40 + (i * 250) / 5}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <line
                          key={`v-${i}`}
                          x1={50 + (i * 420) / 6}
                          y1={40}
                          x2={50 + (i * 420) / 6}
                          y2={290}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Chart lines */}
                      {currentVisible.map((season, seasonIndex) => {
                        if (!currentData[season]) return null;
                        const maxValue = getMaxValue(current.tech_key);
                        const color = getSeasonColor(season, seasonIndex);
                        const points = currentData[season]
                          .map((value: number, index: number) => {
                            const x =
                              50 +
                              (index /
                                Math.max(1, currentData[season].length - 1)) *
                                420;
                            const y = 290 - (value / maxValue) * 250;
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
                          x={45}
                          y={40 + (i * 250) / 5 + 4}
                          fontSize="12"
                          textAnchor="end"
                          fill="#6b7280"
                        >
                          {(
                            getMaxValue(current.tech_key) *
                            (1 - i / 5)
                          ).toFixed(2)}
                        </text>
                      ))}

                      {/* X-axis labels */}
                      {[0, 4, 8, 12, 16, 20, 24].map((hour, i) => (
                        <text
                          key={`x-label-${hour}`}
                          x={50 + (i * 420) / 6}
                          y={310}
                          fontSize="12"
                          textAnchor="middle"
                          fill="#6b7280"
                        >
                          {hour}
                        </text>
                      ))}

                      {/* Axis titles */}
                      <text
                        x={260}
                        y={340}
                        fontSize="14"
                        textAnchor="middle"
                        fill="#6b7280"
                      >
                        Timestep
                      </text>
                      <text
                        x={15}
                        y={165}
                        fontSize="14"
                        textAnchor="middle"
                        fill="#6b7280"
                        transform="rotate(-90 15 165)"
                      >
                        Production (kWh)
                      </text>

                      {/* Legend */}
                      {currentVisible.length > 0 && (
                        <g>
                          <rect
                            x={370}
                            y={50}
                            width={110}
                            height={24 + 20 * currentVisible.length}
                            rx={8}
                            fill="#fff"
                            stroke="#e5e7eb"
                          />
                          <text
                            x={380}
                            y={68}
                            fontSize="13"
                            fill="#444"
                            fontWeight="bold"
                          >
                            Season
                          </text>
                          {currentVisible.map((season, seasonIndex) => (
                            <g key={season}>
                              <line
                                x1={380}
                                y1={80 + 20 * seasonIndex}
                                x2={400}
                                y2={80 + 20 * seasonIndex}
                                stroke={getSeasonColor(season, seasonIndex)}
                                strokeWidth="3"
                              />
                              <text
                                x={410}
                                y={84 + 20 * seasonIndex}
                                fontSize="13"
                                fill="#444"
                              >
                                {season.charAt(0).toUpperCase() +
                                  season.slice(1)}
                              </text>
                            </g>
                          ))}
                        </g>
                      )}
                    </svg>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>
                        Upload a CSV file to visualize renewable potential data
                      </p>
                      <p className="text-sm mt-2">
                        (Sample solar data loaded for demonstration)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Arrow Right */}
            <button
              onClick={nextComponent}
              disabled={currentComponent === components.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md disabled:opacity-50 hover:bg-gray-50 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Component Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {components.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentComponent(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentComponent ? "bg-orange-400" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12 space-x-4">
          <Link href="/load-demand">
            <Button variant="outline" className="px-8 py-2">
              Back
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={renewablesPotentialMutation.isPending || !projectId}
            className="bg-black hover:bg-gray-800 text-white px-8 py-2"
          >
            {renewablesPotentialMutation.isPending ? "Submitting..." : "Next"}
          </Button>
        </div>

        {/* Error Message */}
        {renewablesPotentialMutation.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">
              Error: {renewablesPotentialMutation.error.message}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
