"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { useModelOptimize } from "@/hooks/use-api"; // You must implement this like your other hooks
import Image from "next/image";

const SOLVERS = [
  { value: "HiGHS", label: "HiGHS" },
  { value: "GLPK", label: "GLPK" },
  // Add more solvers if needed
];

export default function OptimizePage() {
  const router = useRouter();
  const projectId = useProjectStore((state) => state.projectId);
  const [solver, setSolver] = useState("HiGHS");
  const [customOptionsOpen, setCustomOptionsOpen] = useState(false);

  const [log, setLog] = useState<string>("");

  const mutation = useModelOptimize();

  const handleOptimize = () => {
    if (!projectId) {
      alert("Project ID is missing.");
      return;
    }
    mutation.mutate(
      { project_id: projectId, solver_name: solver },
      {
        onSuccess: (data) => {
          setLog(JSON.stringify(data, null, 2));
          router.push("/results");
        },
        onError: (error: any) => {
          setLog("Error: " + (error?.message || "Unknown error"));
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-white">
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
      <div className="bg-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Model Optimization</h2>
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
        <h1 className="text-3xl font-bold mb-4">Model Optimization</h1>
        <p className="mb-6">
          Welcome to the Optimization page. Configure the solver and launch the
          optimization model. You can monitor progress and review logs during
          execution.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Solver selection and options */}
          <div>
            <div className="mb-4">
              <Label className="block mb-2">Solver Options:</Label>
              <select
                value={solver}
                onChange={(e) => setSolver(e.target.value)}
                className="border rounded px-3 py-2"
              >
                {SOLVERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Info className="inline ml-2 text-gray-400" />
            </div>
            <div className="mb-4 border-2 border-purple-400 rounded p-4">
              <span className="italic text-gray-700">
                Define custom solver options (optional) such as time limit and
                solver-specific feasibility threshold
              </span>
              <Button
                variant="outline"
                className="ml-4"
                onClick={() => setCustomOptionsOpen(!customOptionsOpen)}
              >
                Advanced{" "}
                <span className="text-blue-600 ml-1">Solver Settings</span>
              </Button>
              {/* Custom options UI can go here if needed */}
            </div>
            <Button
              onClick={handleOptimize}
              className="bg-black hover:bg-gray-800 text-white text-xl px-8 py-4 mt-2 flex items-center"
              disabled={mutation.status === "pending"}
            >
              {mutation.status === "pending" ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Optimizing...
                </>
              ) : (
                "Optimize"
              )}
            </Button>
            <Info className="inline ml-2 text-gray-400" />
            <div className="mt-4">
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3 text-yellow-800 text-sm">
                <b>
                  Do not refresh or navigate away from the page while the solver
                  is running.
                </b>{" "}
                This may interrupt the process and result in loss of data in
                this prototype version.
              </div>
            </div>
          </div>
          {/* Log output */}
          <div>
            <Label className="block mb-2">Solver Log:</Label>
            <textarea
              value={log}
              readOnly
              className="w-full h-64 border rounded p-2 font-mono"
            />
          </div>
        </div>
        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12 space-x-4">
          <Button
            variant="outline"
            className="px-8 py-2"
            onClick={() => router.back()}
          >
            Back
          </Button>
          {/* No Next button, as this is the last step */}
        </div>
      </main>
    </div>
  );
}
