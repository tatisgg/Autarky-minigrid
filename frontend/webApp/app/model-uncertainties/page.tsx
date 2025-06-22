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

export default function ModelUncertaintiesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedModel, setSelectedModel] = useState("linear");
  const [gridConnected, setGridConnected] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const projectId = useProjectStore((state) => state.projectId);

  // API mutation
  const mutation = useModelUncertainties();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setUploadedFile(file);
      setGridConnected(true); // If uploading grid availability, assume grid connected
    }
  };

  const handleSubmit = async () => {
    if (!projectId) {
      alert("Project ID is missing.");
      return;
    }

    // Validation
    if (selectedModel === "linear" && gridConnected && !uploadedFile) {
      alert(
        "Please upload a grid availability CSV file for grid-connected linear model."
      );
      return;
    }

    const payload: any = {
      project_id: projectId,
      formulation: selectedModel,
      grid_connected: gridConnected,
    };

    // Add grid availability CSV if uploaded (future implementation)
    if (uploadedFile) {
      // payload.grid_availability_csv = uploadedFile; // This would be handled differently in real implementation
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        router.push("/optimize"); // Go to the new optimize page
      },
      onError: (error: any) => {
        console.error("API Error:", error);
        alert(
          "Failed to submit model uncertainties: " +
            (error?.message || "Unknown error")
        );
      },
    });
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
        <p className="text-lg mb-8 max-w-4xl">
          Welcome to the Uncertainties page, here you can choose between
          different Autarky formulations of increasing computational complexity,
          from linear to advanced probabilistic models, but including more
          sources of uncertainties related to a weak connection with the main
          grid.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Model Selection */}
          <div className="space-y-6">
            <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
              {/* Linear Model */}
              <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
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
              <div className="border rounded-lg p-6 bg-gray-50 border-gray-200">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="expected" id="expected" disabled />
                  <Label
                    htmlFor="expected"
                    className="text-lg font-medium text-gray-400"
                  >
                    Use Autarky{" "}
                    <span className="text-purple-400">
                      Expected Values Model
                    </span>
                  </Label>
                </div>
                <p className="text-sm text-gray-400 mt-3 ml-7">
                  The expected-value model incorporates forecast errors for
                  renewable production and demand by replacing random variables
                  with their expected values, simplifying the problem but
                  ignoring variability.
                </p>
              </div>

              {/* Advanced Probabilistic Model */}
              <div className="border rounded-lg p-6 bg-gray-50 border-gray-200">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value="probabilistic"
                    id="probabilistic"
                    disabled
                  />
                  <Label
                    htmlFor="probabilistic"
                    className="text-lg font-medium text-gray-400"
                  >
                    Use Autarky{" "}
                    <span className="text-purple-400">
                      Advanced Probabilistic Models
                    </span>
                  </Label>
                </div>
                <p className="text-sm text-gray-400 mt-3 ml-7">
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
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  Upload Grid Availability matrix
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        CSV file containing grid availability data over time
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

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
            </div>
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
