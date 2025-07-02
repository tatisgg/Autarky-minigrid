"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { useModelOptimize } from "@/hooks/use-api";
import Image from "next/image";

// Example: get this from store or props in real app
const FORMULATION_OPTIONS = [
  { value: "linear", label: "Linear" },
  { value: "expected", label: "Expected Values" },
  { value: "probabilistic", label: "Probabilistic Constraints" },
];

const SOLVER_OPTIONS = {
  linear: [
    { value: "HiGHS", label: "HiGHS" },
    { value: "Ipopt", label: "Ipopt" },
    { value: "GLPK", label: "GLPK" },
  ],
  expected: [{ value: "Ipopt", label: "Ipopt" }],
  probabilistic: [{ value: "Ipopt", label: "Ipopt" }],
};

export default function OptimizePage() {
  const router = useRouter();
  const projectId = useProjectStore((state) => state.projectId);

  // Model formulation state (should come from previous step/store)
  const [formulation, setFormulation] = useState("linear");

  // Solver state
  const [solver, setSolver] = useState(
    formulation === "linear" ? "HiGHS" : "Ipopt"
  );
  const [customOptionsOpen, setCustomOptionsOpen] = useState(false);

  // Advanced options
  const [timeLimit, setTimeLimit] = useState("");
  const [mipGap, setMipGap] = useState("");
  const [tol, setTol] = useState("");

  const [log, setLog] = useState<string>("");

  const mutation = useModelOptimize();

  // Update solver when formulation changes
  const compatibleSolvers = SOLVER_OPTIONS[formulation];
  // If current solver is not compatible, reset to default
  if (!compatibleSolvers.find((s) => s.value === solver)) {
    setSolver(compatibleSolvers[0].value);
  }

  const handleOptimize = () => {
    if (!projectId) {
      alert("Project ID is missing.");
      return;
    }
    mutation.mutate(
      {
        project_id: projectId,
        solver_name: solver,
        time_limit: timeLimit ? Number(timeLimit) : undefined,
        mip_gap: mipGap ? Number(mipGap) : undefined,
        tol: tol ? Number(tol) : undefined,
      },
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
          Configure the solver and launch the optimization model.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Solver selection and options */}
          <div>
            {/* Model Formulation Selector */}
            <div className="mb-4">
              <Label className="block mb-2">Model Formulation:</Label>
              <select
                value={formulation}
                onChange={(e) => setFormulation(e.target.value)}
                className="border rounded px-3 py-2"
              >
                {FORMULATION_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Solver Dropdown */}
            <div className="mb-4">
              <Label className="block mb-2">Solver Options:</Label>
              <select
                value={solver}
                onChange={(e) => setSolver(e.target.value)}
                className="border rounded px-3 py-2"
              >
                {compatibleSolvers.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Info className="inline ml-2 text-gray-400" />
            </div>
            {/* Advanced Solver Settings Expander */}
            <div className="mb-4 border-2 border-purple-400 rounded p-4">
              <div
                className="flex items-center cursor-pointer select-none"
                onClick={() => setCustomOptionsOpen((v) => !v)}
              >
                <span className="italic text-gray-700">
                  Define custom solver options (optional)
                </span>
                {customOptionsOpen ? (
                  <ChevronUp className="ml-2 w-5 h-5" />
                ) : (
                  <ChevronDown className="ml-2 w-5 h-5" />
                )}
                <span className="text-blue-600 ml-2">
                  Advanced Solver Settings
                </span>
              </div>
              {customOptionsOpen && (
                <div className="mt-4 space-y-3">
                  <div>
                    <Label className="block mb-1">Time Limit (seconds)</Label>
                    <input
                      type="number"
                      min={0}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className="border rounded px-2 py-1 w-40"
                      placeholder="e.g. 600"
                    />
                  </div>
                  <div>
                    <Label className="block mb-1">MIP Gap</Label>
                    <input
                      type="number"
                      min={0}
                      step="0.001"
                      value={mipGap}
                      onChange={(e) => setMipGap(e.target.value)}
                      className="border rounded px-2 py-1 w-40"
                      placeholder="e.g. 0.01"
                    />
                  </div>
                  <div>
                    <Label className="block mb-1">Tolerance (tol)</Label>
                    <input
                      type="number"
                      min={0}
                      step="0.00001"
                      value={tol}
                      onChange={(e) => setTol(e.target.value)}
                      className="border rounded px-2 py-1 w-40"
                      placeholder="e.g. 1e-6"
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Optimize Button with Tooltip */}
            <div className="flex items-center mt-2">
              <Button
                onClick={handleOptimize}
                className="bg-black hover:bg-gray-800 text-white text-xl px-8 py-4 flex items-center"
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
              <div className="ml-3 group relative">
                <Info className="text-gray-400 cursor-pointer" />
                <div className="absolute left-8 top-1/2 -translate-y-1/2 w-80 bg-black text-white text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20">
                  Depending on the selected model formulation and system
                  complexity, the optimization may take several seconds or a few
                  minutes to complete.
                </div>
              </div>
            </div>
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
          {/* Log output or image */}
          <div>
            <Image
              src={"/solvers.PNG"}
              width={1000}
              height={1000}
              alt="Solvers"
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
        </div>
      </main>
    </div>
  );
}
