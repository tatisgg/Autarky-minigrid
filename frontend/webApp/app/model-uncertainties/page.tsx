"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Upload, Info } from "lucide-react";
import Image from "next/image";
import { useModelUncertainties } from "@/hooks/use-api";
import { useProjectStore } from "@/lib/store";
import { useSystemConfigStore } from "@/lib/system-config-store";
import Papa from "papaparse";

export default function ModelUncertaintiesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedModel, setSelectedModel] = useState("linear");
  const gridConnected = useSystemConfigStore(
    (state) => state.config.enabled_components.grid_connection
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadOrSimulate, setUploadOrSimulate] = useState<
    "upload" | "simulate"
  >("upload");
  const [avgOutages, setAvgOutages] = useState("");
  const [avgDuration, setAvgDuration] = useState("");
  const [simulationResult, setSimulationResult] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Add toggles for load demand and solar PV for demo (expand as needed)
  const [simulateLoad, setSimulateLoad] = useState(true);
  const [simulatePV, setSimulatePV] = useState(false);
  const [loadCSVs, setLoadCSVs] = useState<{ [season: string]: File | null }>(
    {}
  );
  const [pvCSVs, setPvCSVs] = useState<{ [season: string]: File | null }>({});
  const [iccJcc, setIccJcc] = useState<"icc" | "jcc">("icc");
  const [probIslanding, setProbIslanding] = useState("");

  const projectId = useProjectStore((state) => state.projectId);
  const setModelFormulation = useProjectStore((s) => s.setModelFormulation);

  // API mutation
  const mutation = useModelUncertainties();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setUploadedFile(file);
    }
  };

  const handleSimulateGridAvailability = async () => {
    if (!projectId) {
      alert("Project ID is missing.");
      return;
    }
    if (!avgOutages || !avgDuration) {
      alert("Please enter simulation parameters.");
      return;
    }
    setIsSimulating(true);
    const res = await fetch(
      "https://autarky-website-backend.onrender.com/grid-availability",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          avg_outages_per_year: Number(avgOutages),
          avg_outage_duration: Number(avgDuration),
        }),
      }
    );
    setIsSimulating(false);
    if (!res.ok) {
      alert("Failed to simulate grid availability.");
      setSimulationResult(false);
      return;
    }
    setSimulationResult(true);
  };

  const handleSubmit = async () => {
    if (!projectId) {
      alert("Project ID is missing.");
      return;
    }

    setModelFormulation(selectedModel);

    // LINEAR + GRID CONNECTED
    if (selectedModel === "linear" && gridConnected) {
      if (uploadOrSimulate === "simulate") {
        if (!simulationResult) {
          alert("Please run the simulation first.");
          return;
        }
        // Only call /model-uncertainties
        mutation.mutate(
          {
            project_id: projectId,
            formulation: "linear",
            grid_connected: true,
          },
          {
            onSuccess: () => router.push("/optimize"),
            onError: (error: any) => {
              alert("Failed to submit: " + (error?.message || "Unknown error"));
            },
          }
        );
        return;
      }

      // UPLOAD CSV
      if (uploadOrSimulate === "upload") {
        if (!uploadedFile) {
          alert("Please upload a grid availability CSV file.");
          return;
        }
        // Parse CSV to JS object (implement parseCsvFile)
        const parsedMatrix = await parseCsvFile(uploadedFile);
        mutation.mutate(
          {
            project_id: projectId,
            formulation: "linear",
            grid_connected: true,
            grid_outage_settings: {
              availability_matrix: parsedMatrix,
            },
          },
          {
            onSuccess: () => router.push("/optimize"),
            onError: (error: any) => {
              alert("Failed to submit: " + (error?.message || "Unknown error"));
            },
          }
        );
        return;
      }
    }

    // EXPECTED VALUES MODEL
    if (selectedModel === "expected") {
      // Example: You may want to collect forecast error CSVs for load/renewables here
      // For now, just send the minimal payload
      mutation.mutate(
        {
          project_id: projectId,
          formulation: "expected_values",
          grid_connected: !!gridConnected,
          // Add forecast_errors here if needed
        },
        {
          onSuccess: () => router.push("/optimize"),
          onError: (error: any) => {
            alert("Failed to submit: " + (error?.message || "Unknown error"));
          },
        }
      );
      return;
    }

    // PROBABILISTIC MODEL (ICC/JCC)
    if (selectedModel === "probabilistic") {
      // Example: You may want to collect forecast error CSVs and ICC/JCC params here
      mutation.mutate(
        {
          project_id: projectId,
          formulation: iccJcc, // "icc" or "jcc"
          grid_connected: !!gridConnected,
          // Add forecast_errors and probabilistic_config here if needed
        },
        {
          onSuccess: () => router.push("/optimize"),
          onError: (error: any) => {
            alert("Failed to submit: " + (error?.message || "Unknown error"));
          },
        }
      );
      return;
    }
  };

  async function parseCsvFile(file: File): Promise<Record<string, number[]>> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as any[];
            if (!data || data.length === 0) {
              reject(new Error("CSV file is empty"));
              return;
            }
            const firstRow = data[0];
            const seasonColumns: string[] = Object.keys(firstRow).filter(
              (key) => key.trim() !== ""
            );
            const parsedData: Record<string, number[]> = {};
            data.forEach((row) => {
              seasonColumns.forEach((season) => {
                const value = Number(row[season]);
                if (!parsedData[season]) parsedData[season] = [];
                parsedData[season].push(isNaN(value) ? 0 : value);
              });
            });
            resolve(parsedData);
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

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
            <h2 className="text-xl font-bold">Model Uncertainties</h2>
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
        <p className="text-lg mb-8 max-w-4xl text-justify">
          Choose between different Autarky formulations of increasing
          computational complexity, from linear to advanced stochastic models,
          but including more sources of uncertainties related to a weak
          connection with the main grid.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Model Selection */}
          <div className="space-y-6">
            <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
              {/* Linear Model */}
              <div
                className={`border rounded-lg p-6 ${
                  selectedModel === "linear"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="linear" id="linear" />
                  <Label htmlFor="linear" className="text-lg font-medium">
                    Use Autarky{" "}
                    <span className="text-blue-600">Linear Model</span>
                  </Label>
                </div>
                <p className="text-sm text-gray-600 mt-3 ml-7">
                  The linear model uses a grid availability matrix to capture
                  deterministic limitations in grid connection, without modeling
                  randomness.
                </p>
              </div>
              {/* Expected Values Model */}
              <div
                className={`border rounded-lg p-6 ${
                  selectedModel === "expected"
                    ? "bg-blue-50 border-blue-200"
                    : "border-gray-200 bg-white"
                } bg-white`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="expected" id="expected" />
                  <Label htmlFor="expected" className="text-lg font-medium">
                    Use Autarky{" "}
                    <span className="text-blue-600">Expected Values Model</span>
                  </Label>
                </div>
                <p className="text-sm text-gray-600 mt-3 ml-7">
                  The expected-value model incorporates forecast errors for
                  renewable production and demand by replacing random variables
                  with their expected values, simplifying the problem but
                  ignoring variability.
                </p>
              </div>
              {/* Advanced Probabilistic Model */}
              <div
                className={`border rounded-lg p-6 ${
                  selectedModel === "probabilistic"
                    ? "bg-blue-50 border-blue-200"
                    : "border-gray-200"
                } bg-white`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="probabilistic" id="probabilistic" />
                  <Label
                    htmlFor="probabilistic"
                    className="text-lg font-medium"
                  >
                    Use Autarky{" "}
                    <span className="text-blue-600">
                      Advanced Probabilistic Models
                    </span>
                  </Label>
                </div>
                <p className="text-sm text-gray-600 mt-3 ml-7">
                  Advanced probabilistic models apply individual (ICC) or joint
                  chance constraints (JCC) to account for forecasting errors and
                  main grid outages, explicitly incorporating the probability of
                  outage (ω) and islanding success (ρ) to ensure the system can
                  meet demand during uncertain disconnections.
                </p>
              </div>
            </RadioGroup>
          </div>

          {/* Right Column - Parameters */}
          <div className="space-y-6">
            {/* Only show if grid connection is enabled and linear model is selected */}
            {selectedModel === "linear" && gridConnected && (
              <div className="border rounded-lg p-6 space-y-6">
                <div className="mb-4">
                  <RadioGroup
                    value={uploadOrSimulate}
                    onValueChange={setUploadOrSimulate}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="upload" id="upload" />
                      <Label htmlFor="upload">
                        Upload Grid Availability CSV
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="simulate" id="simulate" />
                      <Label htmlFor="simulate">
                        Simulate Grid Availability
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {uploadOrSimulate === "upload" && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadedFile
                          ? `Uploaded: ${uploadedFile.name}`
                          : "Upload CSV file"}
                      </span>
                    </Button>
                    {uploadedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Grid availability file uploaded successfully
                      </p>
                    )}
                  </>
                )}

                {uploadOrSimulate === "simulate" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Average Number of Outages per Year</Label>
                      <Input
                        type="number"
                        min={0}
                        value={avgOutages}
                        onChange={(e) => setAvgOutages(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Average Duration per Outage (hours)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={avgDuration}
                        onChange={(e) => setAvgDuration(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleSimulateGridAvailability}
                      className="w-full"
                      disabled={isSimulating || simulationResult}
                    >
                      {isSimulating
                        ? "Simulating..."
                        : simulationResult
                        ? "Simulated!"
                        : "Simulate Grid Availability"}
                    </Button>
                    {simulationResult && (
                      <p className="text-green-600 text-sm mt-2">
                        Simulation complete! (You can proceed.)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12 space-x-4">
          <Link href="/renewable-potential">
            <Button variant="outline" className="px-8 py-2">
              Back
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            className="bg-black hover:bg-gray-800 text-white px-8 py-2"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Submitting..." : "Next"}
          </Button>
        </div>
      </main>
    </div>
  );
}
