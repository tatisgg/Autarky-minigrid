"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Upload, Download, AlertCircle } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { useRenewablesPotential } from "@/hooks/use-api"; // You'll need to create this hook
import Papa from 'papaparse';

interface RenewableProfile {
  timestep: number[];
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
  const [renewableData, setRenewableData] = useState<{ [key: string]: RenewableProfile }>({});
  const [visibleSeasons, setVisibleSeasons] = useState<{ [key: string]: string[] }>({});
  const [csvErrors, setCsvErrors] = useState<{ [key: string]: string | null }>({});
  const [fileNames, setFileNames] = useState<{ [key: string]: string | null }>({});
  const [technicalParams, setTechnicalParams] = useState<{ [key: string]: TechnicalParameters }>({});

  const components = [
    {
      name: "Solar PV",
      tech_key: "solar_pv",
      icon: "/Icons/solar-panel.svg",
      description: "Upload CSV file with electricity production profile per unit of nominal capacity",
      apiDescription: "Download irradiance data from PVGIS API and simulate PV electricity production",
      apiName: "PVGIS",
      defaultParams: {
        component_name: "CS3U-350MS",
        nominal_capacity: 1.0,
        inverter_efficiency: 0.95
      }
    },
    {
      name: "Wind Turbine",
      tech_key: "wind_turbine",
      icon: "/Icons/wind-power.svg",
      description: "Upload CSV file with electricity production profile per unit of nominal capacity",
      apiDescription: "Download wind speed data from PVGIS API and simulate wind electricity production",
      apiName: "PVGIS",
      defaultParams: {
        component_name: "Generic Wind Turbine",
        nominal_capacity: 1.0,
        power_curve: {}
      }
    },
    {
      name: "Mini-Hydro",
      tech_key: "mini_hydro",
      icon: "/Icons/hydro.svg",
      description: "Upload CSV file with water flow rate data for mini-hydro potential assessment",
      apiDescription: "Download hydrological data from external APIs",
      apiName: "Hydro API",
      defaultParams: {
        component_name: "Generic Mini-Hydro",
        nominal_capacity: 1.0,
        head: 10.0,
        efficiency: 0.8
      }
    },
  ];

  useEffect(() => {
    setIsClient(true);
    
    // Initialize technical parameters
    const initialParams: { [key: string]: TechnicalParameters } = {};
    components.forEach(comp => {
      initialParams[comp.tech_key] = comp.defaultParams;
    });
    setTechnicalParams(initialParams);

    // Initialize with sample data for Solar PV
    const sampleSolarData: RenewableProfile = {
      timestep: Array.from({ length: 24 }, (_, i) => i),
      winter: [0.00, 0.00, 0.00, 0.01, 0.03, 0.08, 0.20, 0.35, 0.50, 0.55, 0.50, 0.45, 0.40, 0.35, 0.25, 0.15, 0.10, 0.05, 0.01, 0.00, 0.00, 0.00, 0.00, 0.00],
      spring: [0.00, 0.00, 0.01, 0.03, 0.08, 0.18, 0.35, 0.60, 0.75, 0.80, 0.75, 0.70, 0.65, 0.60, 0.50, 0.35, 0.25, 0.15, 0.08, 0.03, 0.01, 0.00, 0.00, 0.00],
      summer: [0.00, 0.00, 0.01, 0.05, 0.12, 0.30, 0.55, 0.80, 0.90, 0.95, 0.90, 0.85, 0.80, 0.75, 0.60, 0.40, 0.30, 0.20, 0.10, 0.05, 0.01, 0.00, 0.00, 0.00],
      fall: [0.00, 0.00, 0.01, 0.03, 0.10, 0.22, 0.40, 0.65, 0.78, 0.80, 0.75, 0.70, 0.60, 0.55, 0.40, 0.25, 0.15, 0.08, 0.03, 0.01, 0.00, 0.00, 0.00, 0.00]
    };

    setRenewableData({ solar_pv: sampleSolarData });
    setVisibleSeasons({ solar_pv: ["winter", "summer", "fall", "spring"] });
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, techKey: string) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvErrors(prev => ({ ...prev, [techKey]: null }));
      setFileNames(prev => ({ ...prev, [techKey]: file.name }));
      
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            parseCSVData(results.data, techKey);
          } catch (error) {
            setCsvErrors(prev => ({ 
              ...prev, 
              [techKey]: error instanceof Error ? error.message : "Failed to parse CSV file" 
            }));
          }
        },
        error: (error) => {
          setCsvErrors(prev => ({ 
            ...prev, 
            [techKey]: `CSV parsing error: ${error.message}` 
          }));
        }
      });
    } else {
      setCsvErrors(prev => ({ 
        ...prev, 
        [techKey]: "Please select a valid CSV file" 
      }));
    }
  };

  const parseCSVData = (data: any[], techKey: string) => {
    if (!data || data.length === 0) {
      throw new Error("CSV file is empty");
    }

    const firstRow = data[0];
    const seasonColumns: string[] = [];
    
    // Identify season columns (anything that's not timestep)
    Object.keys(firstRow).forEach(key => {
      const normalizedKey = key.trim().toLowerCase();
      if (normalizedKey !== 'timestep' && normalizedKey !== '') {
        seasonColumns.push(key.trim());
      }
    });

    if (seasonColumns.length === 0) {
      throw new Error("No season data columns found. Expected columns like 'winter', 'summer', etc.");
    }

    // Validate timestep column
    const timestepKey = Object.keys(firstRow).find(key => 
      key.trim().toLowerCase() === 'timestep'
    ) || 'timestep';

    if (!firstRow.hasOwnProperty(timestepKey)) {
      throw new Error("Missing 'timestep' column in CSV");
    }

    // Parse the data
    const parsedData: RenewableProfile = {
      timestep: [],
      ...Object.fromEntries(seasonColumns.map(season => [season, []]))
    };

    data.forEach((row, index) => {
      if (row[timestepKey] === undefined || row[timestepKey] === null) {
        return;
      }

      const timestep = Number(row[timestepKey]);
      if (isNaN(timestep)) {
        console.warn(`Invalid timestep at row ${index + 1}: ${row[timestepKey]}`);
        return;
      }

      parsedData.timestep.push(timestep);

      seasonColumns.forEach(season => {
        const value = Number(row[season]);
        if (isNaN(value)) {
          console.warn(`Invalid value for ${season} at row ${index + 1}: ${row[season]}`);
          parsedData[season].push(0);
        } else {
          parsedData[season].push(value);
        }
      });
    });

    if (parsedData.timestep.length === 0) {
      throw new Error("No valid data rows found in CSV");
    }

    console.log(`✅ Parsed CSV data for ${techKey}:`, parsedData);
    
    setRenewableData(prev => ({ ...prev, [techKey]: parsedData }));
    setVisibleSeasons(prev => ({ 
      ...prev, 
      [techKey]: seasonColumns.slice(0, 4) 
    }));
  };

  const handleSeasonToggle = (techKey: string, season: string, checked: boolean) => {
    const currentVisible = visibleSeasons[techKey] || [];
    if (checked) {
      setVisibleSeasons(prev => ({
        ...prev,
        [techKey]: [...currentVisible, season]
      }));
    } else {
      setVisibleSeasons(prev => ({
        ...prev,
        [techKey]: currentVisible.filter((s) => s !== season)
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
    const submissionPromises = Object.entries(renewableData).map(async ([techKey, profile]) => {
      const submitData: RenewablesPotentialData = {
        project_id: projectId,
        technology: techKey,
        mode: "csv_upload",
        technical_parameters: technicalParams[techKey],
        renewables_potential_profile: profile
      };

      console.log(`🔗 Submitting renewable potential data for ${techKey}:`, submitData);
      return renewablesPotentialMutation.mutateAsync(submitData);
    });

    try {
      const responses = await Promise.all(submissionPromises);
      console.log("✅ All renewable potential responses:", responses);
      router.push("/model-uncertainties");
    } catch (error) {
      console.error("❌ Error submitting renewable potential:", error);
      setCsvErrors(prev => ({ 
        ...prev, 
        [components[currentComponent].tech_key]: "Failed to submit renewable potential data. Please try again." 
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
    currentVisible.forEach(season => {
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
                    <input
                      ref={(el) => (fileInputRefs.current[currentComponent] = el)}
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, current.tech_key)}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRefs.current[currentComponent]?.click()}
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
                    <h5 className="font-medium text-sm mb-2">Expected CSV Format:</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• First column: <code>timestep</code> (0-23 for hourly data)</p>
                      <p>• Additional columns: season names (e.g., winter, summer, spring, fall)</p>
                      <p>• Values should be numeric (capacity factor 0-1)</p>
                      <p>• Example: timestep,winter,summer,spring,fall</p>
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
                      <span className="text-sm font-medium">Season Filters</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Filters:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(currentData)
                            .filter((key) => key !== "timestep")
                            .map((season, index) => (
                              <button
                                key={season}
                                onClick={() => handleSeasonToggle(current.tech_key, season, !currentVisible.includes(season))}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                  currentVisible.includes(season)
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

                {/* Chart */}
                <div className="border rounded-lg p-4 h-80 bg-white flex items-center justify-center">
                  {currentData ? (
                    <div className="w-full h-full relative">
                      <div className="relative w-full h-full bg-white border rounded">
                        {/* Grid lines */}
                        <svg className="absolute inset-0 w-full h-full">
                          {/* Horizontal grid lines */}
                          {Array.from({ length: 6 }).map((_, i) => (
                            <line
                              key={`h-${i}`}
                              x1="40"
                              y1={`${(i / 5) * 85 + 10}%`}
                              x2="95%"
                              y2={`${(i / 5) * 85 + 10}%`}
                              stroke="#e5e7eb"
                              strokeWidth="1"
                            />
                          ))}
                          {/* Vertical grid lines */}
                          {Array.from({ length: 7 }).map((_, i) => (
                            <line
                              key={`v-${i}`}
                              x1={`${40 + (i / 6) * 55}%`}
                              y1="10%"
                              x2={`${40 + (i / 6) * 55}%`}
                              y2="95%"
                              stroke="#e5e7eb"
                              strokeWidth="1"
                            />
                          ))}
                        </svg>

                        {/* Chart lines */}
                        {currentVisible.map((season, seasonIndex) => {
                          if (!currentData[season]) return null;
                          
                          const maxValue = getMaxValue(current.tech_key);
                          const color = getSeasonColor(season, seasonIndex);
                          
                          return (
                            <svg key={season} className="absolute inset-0 w-full h-full">
                              <polyline
                                fill="none"
                                stroke={color}
                                strokeWidth="2"
                                points={currentData[season]
                                  .map((value: number, index: number) => {
                                    const x = 40 + (index / Math.max(1, currentData[season].length - 1)) * 55;
                                    const y = 95 - ((value / maxValue) * 85);
                                    return `${x},${y}`;
                                  })
                                  .join(" ")}
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          );
                        })}

                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-600 py-4">
                          {Array.from({ length: 6 }).reverse().map((_, i) => (
                            <span key={i} className="text-right pr-1">
                              {(getMaxValue(current.tech_key) / 5 * i).toFixed(2)}
                            </span>
                          ))}
                        </div>

                        {/* X-axis labels */}
                        <div className="absolute bottom-0 left-10 right-0 h-6 flex justify-between text-xs text-gray-600 items-center px-2">
                          {[0, 4, 8, 12, 16, 20, 24].map(hour => (
                            <span key={hour}>{hour}</span>
                          ))}
                        </div>

                        {/* Legend */}
                        {currentVisible.length > 0 && (
                          <div className="absolute top-4 right-4 bg-white p-3 rounded shadow border max-w-32">
                            <div className="text-xs">
                              <div className="text-gray-600 mb-2 font-medium">Seasons</div>
                              {currentVisible.slice(0, 4).map((season, seasonIndex) => (
                                <div key={season} className="flex items-center space-x-2 mb-1">
                                  <div 
                                    className="w-4 h-0.5" 
                                    style={{ backgroundColor: getSeasonColor(season, seasonIndex) }}
                                  ></div>
                                  <span className="capitalize text-xs">{season}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Axis titles */}
                        <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-600 text-center pb-1">
                          Hours (0-24)
                        </div>
                        <div className="absolute left-0 top-0 bottom-0 text-xs text-gray-600 transform -rotate-90 flex items-center justify-center w-4">
                          Capacity Factor
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Upload a CSV file to visualize renewable potential data</p>
                      <p className="text-sm mt-2">(Sample solar data loaded for demonstration)</p>
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