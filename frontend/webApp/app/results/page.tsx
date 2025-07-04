"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/lib/store";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  AreaChart,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const COLORS = ["#2E86DE", "#27AE60", "#F5B041", "#A569BD", "#E74C3C"];

const SEASON_LABELS: Record<string, string> = {
  season_1: "Winter",
  season_2: "Spring",
  season_3: "Summer",
  season_4: "Autumn",
};

const COLOR_DICT: Record<string, string> = {
  "Solar Production (kWh)": "#FFD700",
  Battery: "#ADD8E6",
  "Generator Production (kWh)": "#00008B",
  "Grid Import (kWh)": "#800080",
  "Grid Export (kWh)": "#800080",
  "Solar Curtailment (kWh)": "#FFA500",
  "Lost Load (kWh)": "#FF0000",
  "Load Demand (kWh)": "#000000",
};

const PIE_COLORS = {
  Investment: "#2E86DE",
  Operation: "#27AE60",
  Replacement: "#E74C3C",
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  value,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold">{data.name}</p>
        <p style={{ color: data.color }}>{`${data.value.toFixed(1)} kUSD`}</p>
        <p className="text-sm text-gray-600">
          {`${((data.value / data.payload.total) * 100).toFixed(1)}%`}
        </p>
      </div>
    );
  }
  return null;
};

export default function ResultsPage() {
  const projectId = useProjectStore((s) => s.projectId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] =
    useState<keyof typeof SEASON_LABELS>("season_3");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    console.log("🔍 Debug Info:");
    console.log("projectId from store:", projectId);
    
    // Add debug info to state
    setDebugInfo({
      projectId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    if (!projectId) {
      console.warn("❌ No projectId found");
      setError("No project ID found. Please start a new project.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    console.log("🚀 Making API request...");
    
    // Build the URL
    const url = `https://autarky-website-backend.onrender.com/results?project_id=${projectId}`;
    console.log("📡 Request URL:", url);

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Remove CORS headers - these must be set by the server, not client
      },
    })
      .then(async (res) => {
        console.log("📬 Response received:");
        console.log("Status:", res.status);
        console.log("Status Text:", res.statusText);
        console.log("Headers:", Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Error response:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        
        const responseText = await res.text();
        console.log("📄 Raw response:", responseText);
        
        try {
          const jsonData = JSON.parse(responseText);
          console.log("✅ Parsed JSON:", jsonData);
          return jsonData;
        } catch (parseError) {
          console.error("❌ JSON parse error:", parseError);
          throw new Error(`Failed to parse JSON: ${parseError.message}`);
        }
      })
      .then((responseData) => {
        console.log("🎉 Data received successfully:", responseData);
        setData(responseData);
      })
      .catch((err) => {
        console.error("💥 Fetch error:", err);
        setError(err.message);
      })
      .finally(() => {
        console.log("🏁 Request completed");
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="text-lg mb-4">Loading results...</div>
        {debugInfo && (
          <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded">
            <div>Project ID: {debugInfo.projectId}</div>
            <div>Timestamp: {debugInfo.timestamp}</div>
            <div>Please check browser console for detailed logs</div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="text-red-600 mb-4 text-lg">Error: {error}</div>
        {debugInfo && (
          <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded mb-4">
            <div><strong>Debug Info:</strong></div>
            <div>Project ID: {debugInfo.projectId}</div>
            <div>Timestamp: {debugInfo.timestamp}</div>
            <div>User Agent: {debugInfo.userAgent}</div>
          </div>
        )}
        <Button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data?.results) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-500 mb-4">No results found.</div>
        <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded">
          <div><strong>Response Data:</strong></div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // Parse data (rest of your existing code remains the same)
  const sizing = data.results.sizing || {};
  const costs = data.results.costs || {};
  const operation = data.results.operation || {};
  const dispatch = data.results.dispatch || {};
  const LCOE = data.results["LCOE[USD/kWh]"];
  const logs = data.logs || [];

  const pieData = [
    { name: "Investment", value: costs["CAPEX[kUSD]"] || 0 },
    { name: "Operation", value: costs["OPEX[kUSD]"] || 0 },
    { name: "Replacement", value: costs["Replacement[kUSD]"] || 0 },
  ];

  const seasonData = dispatch[selectedSeason];
  const chartData = transformSeasonDataForDispatch(seasonData);

  const dispatchOptions = {
    onGrid: true,
    allowGridExport: true,
    lostLoad: false,
    uncertainty: false,
  };

  const renewablePenetration =
    operation?.["solar[MWh]"] && operation?.["generator[MWh]"]
      ? (
          (operation["solar[MWh]"] /
            (operation["solar[MWh]"] + operation["generator[MWh]"])) *
          100
        ).toFixed(1)
      : "0";
  const curtailment = operation?.["solar_curtailment"] ?? 0;
  const fuelConsumption = operation?.["fuel_liters"] ?? 0;

  const solarKW = sizing?.solar_kw ?? 0;
  const batteryKWh = sizing?.battery_kwh ?? 0;
  const generatorKW = sizing?.generator_kw ?? 0;

  const npc = costs["NPC[kUSD]"] ?? 0;
  const capex = costs["CAPEX[kUSD]"] ?? 0;
  const opex = costs["OPEX[kUSD]"] ?? 0;
  const replacement = costs["Replacement[kUSD]"] ?? 0;
  const salvage = costs["Salvage[kUSD]"] ?? 0;
  const subsidies = costs["Subsidies[kUSD]"] ?? 0;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autarky-results-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function prepareStackedDispatchData(
    seasonData: any,
    options: {
      onGrid: boolean;
      allowGridExport: boolean;
      lostLoad: boolean;
      uncertainty: boolean;
    }
  ) {
    const n = seasonData["Solar Production (kWh)"]?.length || 0;
    const result = [];

    let cumulativeOut = Array(n).fill(0);
    let cumulativeIn = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      const solar = seasonData["Solar Production (kWh)"]?.[i] ?? 0;
      const generator = seasonData["Generator Production (kWh)"]?.[i] ?? 0;
      const gridImport = seasonData["Grid Import (kWh)"]?.[i] ?? 0;
      const gridExport = seasonData["Grid Export (kWh)"]?.[i] ?? 0;
      const solarCurtail = seasonData["Solar Curtailment (kWh)"]?.[i] ?? 0;
      const lostLoad = seasonData["Lost Load (kWh)"]?.[i] ?? 0;
      const load = seasonData["Load Demand (kWh)"]?.[i] ?? 0;

      const batteryDischarge = seasonData["Battery Discharge (kWh)"]?.[i] ?? 0;
      const batteryCharge = seasonData["Battery Charge (kWh)"]?.[i] ?? 0;
      const netBattery = batteryDischarge - batteryCharge;
      const netDischarge = Math.max(netBattery, 0);
      const netCharge = Math.max(-netBattery, 0);

      let y0 = cumulativeOut[i];
      let y1 = y0 + solar;
      let y2 = y1 + netDischarge;
      let y3 = y2 + generator;
      let y4 = y3 + (options.onGrid ? gridImport : 0);
      let y5 = y4 + (options.lostLoad ? lostLoad : 0);

      let y0_in = -cumulativeIn[i];
      let y1_in = y0_in - netCharge;
      let y2_in =
        y1_in - (options.onGrid && options.allowGridExport ? gridExport : 0);

      result.push({
        hour: i + 1,
        solar0: y0,
        solar1: y1,
        batteryDischarge0: y1,
        batteryDischarge1: y2,
        generator0: y2,
        generator1: y3,
        gridImport0: y3,
        gridImport1: y4,
        lostLoad0: y4,
        lostLoad1: y5,
        batteryCharge0: y0_in,
        batteryCharge1: y1_in,
        gridExport0: y1_in,
        gridExport1: y2_in,
        load: load,
      });

      cumulativeOut[i] = y5;
      cumulativeIn[i] = -y2_in;
    }
    return result;
  }

  function transformSeasonDataForDispatch(seasonData: any) {
    if (!seasonData?.timestep) return [];

    return seasonData.timestep.map((t: number, i: number) => {
      const batteryCharge = seasonData["Battery Charge (kWh)"]?.[i] ?? 0;
      const batteryDischarge = seasonData["Battery Discharge (kWh)"]?.[i] ?? 0;
      const batteryNet = batteryDischarge - batteryCharge;

      return {
        hour: t,
        solarProduction: seasonData["Solar Production (kWh)"]?.[i] ?? 0,
        batteryDischarge: Math.max(0, batteryNet),
        generatorProduction: seasonData["Generator Production (kWh)"]?.[i] ?? 0,
        gridImport: seasonData["Grid Import (kWh)"]?.[i] ?? 0,
        lostLoad: seasonData["Lost Load (kWh)"]?.[i] ?? 0,
        batteryCharge: -Math.max(0, -batteryNet),
        gridExport: -(seasonData["Grid Export (kWh)"]?.[i] ?? 0),
        loadDemand: seasonData["Load Demand (kWh)"]?.[i] ?? 0,
      };
    });
  }

  const stackedData = prepareStackedDispatchData(seasonData, {
    onGrid: true,
    allowGridExport: true,
    lostLoad: true,
    uncertainty: false,
  });

  return (
    <div className="min-h-screen bg-white border-4 border-purple-400">
      {/* Header */}
      <header className="bg-[#FABC5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Image
              src="/Asset2.svg"
              alt="Autarky Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-black">Autarky</span>
          </div>
          <nav className="flex space-x-8">
            <a href="#" className="text-black hover:text-gray-700">
              Who we are
            </a>
            <a href="#" className="text-black hover:text-gray-700">
              Contact us
            </a>
            <a href="#" className="text-black hover:text-gray-700">
              Resources
            </a>
          </nav>
          <Button
            className="ml-8 bg-white text-black border border-black hover:bg-gray-100"
            onClick={() => (window.location.href = "/project-setup")}
          >
            Start Again
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Results</h2>
          <span className="text-sm text-gray-600">Step 5 of 5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full"
            style={{ width: "100%" }}
          ></div>
        </div>
      </div>

      {/* Debug Info Panel */}


      {/* Rest of your existing JSX remains the same */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Results</h1>
        <p className="mb-6 max-w-3xl">
          This page presents the optimized system design, including component
          sizing, dispatch profiles across seasons, and a detailed breakdown of
          investment and operational costs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Sizing and Costs */}
          <div>
            <h2 className="font-bold text-lg mb-2">Optimal Sizing</h2>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 mb-6 text-lg font-medium space-y-2">
              <div>
                Solar PV:{" "}
                <span className="font-bold">
                  {Number(solarKW).toFixed(0)} kW
                </span>
              </div>
              <div>
                Battery:{" "}
                <span className="font-bold">
                  {Number(batteryKWh).toFixed(0)} kWh
                </span>
              </div>
              <div>
                Diesel Generator:{" "}
                <span className="font-bold">
                  {Number(generatorKW).toFixed(0)} kW
                </span>
              </div>
            </div>
            <h2 className="font-bold text-lg mb-2">Costs Breakdown</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={280} height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[entry.name] || PIE_COLORS.Investment}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Cost Components</h3>
                  <div className="space-y-2">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor:
                              PIE_COLORS[entry.name] || PIE_COLORS.Investment,
                          }}
                        />
                        <span className="text-sm">
                          {entry.name}:{" "}
                          <span className="font-semibold">
                            {entry.value.toFixed(1)} kUSD
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm space-y-1 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Net Present Cost:</span>
                    <span className="font-bold">{npc.toFixed(1)} kUSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subsidies:</span>
                    <span className="font-bold">
                      {subsidies.toFixed(1)} kUSD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salvage Value:</span>
                    <span className="font-bold">{salvage.toFixed(1)} kUSD</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>LCOE:</span>
                    <span className="font-bold">{LCOE.toFixed(3)} USD/kWh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Dispatch */}
          <div>
            <h2 className="font-bold text-lg mb-2">Optimal Dispatch</h2>
            <div className="mb-2">
              <Label htmlFor="season-select" className="mr-2">
                Use the filters to visualize different seasons.
              </Label>
              <select
                id="season-select"
                value={selectedSeason}
                onChange={(e) =>
                  setSelectedSeason(
                    e.target.value as keyof typeof SEASON_LABELS
                  )
                }
                className="border rounded px-2 py-1"
              >
                {Object.entries(SEASON_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={stackedData}>
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={(d) => [d.solar0, d.solar1]}
                  stroke={COLOR_DICT["Solar Production (kWh)"]}
                  fill={COLOR_DICT["Solar Production (kWh)"]}
                  fillOpacity={0.5}
                  isRange
                  name="Solar Production"
                />
                <Area
                  type="monotone"
                  dataKey={(d) => [d.batteryDischarge0, d.batteryDischarge1]}
                  stroke={COLOR_DICT["Battery"]}
                  fill={COLOR_DICT["Battery"]}
                  fillOpacity={0.5}
                  isRange
                  name="Battery Discharge"
                />
                <Area
                  type="monotone"
                  dataKey={(d) => [d.generator0, d.generator1]}
                  stroke={COLOR_DICT["Generator Production (kWh)"]}
                  fill={COLOR_DICT["Generator Production (kWh)"]}
                  fillOpacity={0.5}
                  isRange
                  name="Generator"
                />
                <Area
                  type="monotone"
                  dataKey={(d) => [d.gridImport0, d.gridImport1]}
                  stroke={COLOR_DICT["Grid Import (kWh)"]}
                  fill={COLOR_DICT["Grid Import (kWh)"]}
                  fillOpacity={0.5}
                  isRange
                  name="Grid Import"
                />
                <Area
                  type="monotone"
                  dataKey={(d) => [d.lostLoad0, d.lostLoad1]}
                  stroke={COLOR_DICT["Lost Load (kWh)"]}
                  fill={COLOR_DICT["Lost Load (kWh)"]}
                  fillOpacity={0.5}
                  isRange
                  name="Lost Load"
                />
                <Area
                  type="monotone"
                  dataKey={(d) => [d.batteryCharge0, d.batteryCharge1]}
                  stroke={COLOR_DICT["Battery"]}
                  fill={COLOR_DICT["Battery"]}
                  fillOpacity={0.5}
                  isRange
                  name="Battery Charge"
                />
                <Area
                  type="monotone"
                  dataKey={(d) => [d.gridExport0, d.gridExport1]}
                  stroke={COLOR_DICT["Grid Export (kWh)"]}
                  fill={COLOR_DICT["Grid Export (kWh)"]}
                  fillOpacity={0.5}
                  isRange
                  name="Grid Export"
                />
                <Line
                  type="monotone"
                  dataKey="load"
                  stroke={COLOR_DICT["Load Demand (kWh)"]}
                  strokeWidth={3}
                  dot={false}
                  name="Load Demand"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm space-y-1">
              <div>
                Renewable Penetration:{" "}
                <span className="font-bold">{renewablePenetration} %</span>
              </div>
              <div>
                Yearly Curtailment Share:{" "}
                <span className="font-bold">{curtailment} %</span>
              </div>
              <div>
                Fuel Consumption:{" "}
                <span className="font-bold">
                  {fuelConsumption.toLocaleString()} liters/year
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <Button
            className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-3 rounded-lg"
            onClick={handleDownload}
          >
            Download Results
          </Button>
        </div>
        <details className="mt-8 bg-gray-50 border rounded p-4 text-xs text-gray-700 max-h-64 overflow-auto">
          <summary className="cursor-pointer font-semibold">
            Show Optimization Logs
          </summary>
          <pre className="whitespace-pre-wrap">{logs.join("\n")}</pre>
        </details>
      </main>
    </div>
  );
}