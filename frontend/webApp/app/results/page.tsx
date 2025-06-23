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

export default function ResultsPage() {
  const projectId = useProjectStore((s) => s.projectId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] =
    useState<keyof typeof SEASON_LABELS>("season_3"); // Default to Summer

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    fetch(
      `https://autarky-website-backend.onrender.com/results?project_id=${projectId}`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading)
    return <div className="p-12 text-center text-lg">Loading results...</div>;
  if (error)
    return <div className="p-12 text-center text-red-600">{error}</div>;
  if (!data?.results)
    return (
      <div className="p-12 text-center text-gray-500">No results found.</div>
    );

  // Parse data
  const sizing = data.results.sizing || {};
  const costs = data.results.costs || {};
  const operation = data.results.operation || {};
  const dispatch = data.results.dispatch || {};
  const LCOE = data.results["LCOE[USD/kWh]"];
  const logs = data.logs || [];

  // Pie chart data
  const pieData = [
    { name: "Investment", value: costs["CAPEX[kUSD]"] || 0 },
    { name: "Operation", value: costs["OPEX[kUSD]"] || 0 },
    { name: "Replacement", value: costs["Replacement[kUSD]"] || 0 },
  ];

  // Dispatch chart data for selected season
  const seasonData = dispatch[selectedSeason];
  const chartData =
    seasonData?.timestep?.map((t: number, i: number) => ({
      hour: t,
      Load: seasonData["load[kWh]"]?.[i] ?? 0,
      Generator: seasonData["generator[kWh]"]?.[i] ?? 0,
      Solar: seasonData["solar[kWh]"]?.[i] ?? 0,
      BatteryCharge: seasonData["charge[kWh]"]?.[i] ?? 0,
      BatteryDischarge: seasonData["discharge[kWh]"]?.[i] ?? 0,
      SOC: seasonData["soc[kWh]"]?.[i] ?? 0,
    })) || [];

  // Summary stats
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

  // Sizing values
  const solarKW = sizing?.solar_kw ?? 0;
  const batteryKWh = sizing?.battery_kwh ?? 0;
  const generatorKW = sizing?.generator_kw ?? 0;

  // Costs
  const npc = costs["NPC[kUSD]"] ?? 0;
  const capex = costs["CAPEX[kUSD]"] ?? 0;
  const opex = costs["OPEX[kUSD]"] ?? 0;
  const replacement = costs["Replacement[kUSD]"] ?? 0;
  const salvage = costs["Salvage[kUSD]"] ?? 0;
  const subsidies = costs["Subsidies[kUSD]"] ?? 0;

  // Download results
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

      {/* Main Content */}
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
                Solar PV: <span className="font-bold">{solarKW} kW</span>
              </div>
              <div>
                Battery: <span className="font-bold">{batteryKWh} kWh</span>
              </div>
              <div>
                Diesel Generator:{" "}
                <span className="font-bold">{generatorKW.toFixed(2)} kW</span>
              </div>
            </div>
            <h2 className="font-bold text-lg mb-2">Costs Breakdown</h2>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-sm space-y-1">
                <div>
                  Net Present Cost (kUSD):{" "}
                  <span className="font-bold">{npc}</span>
                </div>
                <div>
                  Subsidies (share of CAPEX):{" "}
                  <span className="font-bold">{subsidies} kUSD</span>
                </div>
                <div>
                  Salvage Value (kUSD):{" "}
                  <span className="font-bold">{salvage}</span>
                </div>
                <div>
                  Levelized Cost of Energy (LCOE):{" "}
                  <span className="font-bold">{LCOE} USD/kWh</span>
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  label={{
                    value: "Hour",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Energy (kWh)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Load"
                  stroke="#2E86DE"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Generator"
                  stroke="#F5B041"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Solar"
                  stroke="#27AE60"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="BatteryCharge"
                  fill="#A569BD"
                  stroke="#A569BD"
                  opacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="BatteryDischarge"
                  fill="#E74C3C"
                  stroke="#E74C3C"
                  opacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="SOC"
                  stroke="#000"
                  strokeDasharray="5 5"
                  dot={false}
                />
                <RechartsTooltip />
              </LineChart>
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
        {/* Download Button */}
        <div className="flex justify-end mt-8">
          <Button
            className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-3 rounded-lg"
            onClick={handleDownload}
          >
            Download Results
          </Button>
        </div>
        {/* Logs (optional, collapsible) */}
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
