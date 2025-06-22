"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectStore } from "@/lib/store";
import { useProjectSetup } from "@/hooks/use-api";
import dynamic from "next/dynamic";
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
});
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProjectSetupPage() {
  const router = useRouter();
  const { projectData, updateProjectData } = useProjectStore();
  const projectSetupMutation = useProjectSetup();

  const [isClient, setIsClient] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
    // Get user's current location
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateProjectData({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.log("Error getting location:", error);
          // Default to Kenya coordinates if location access is denied
          updateProjectData({
            location: {
              latitude: -2.05627616659381,
              longitude: 41.11023900111167,
            },
          });
        }
      );
    }
  }, [updateProjectData]);

  const validateForm = () => {
    // Clear previous validation errors
    setValidationError("");

    // Validate required fields
    if (!projectData.project_name.trim()) {
      setValidationError("Please enter a project name");
      return false;
    }

    // Validate coordinates
    if (
      isNaN(projectData.location.latitude) ||
      isNaN(projectData.location.longitude)
    ) {
      setValidationError("Please enter valid coordinates");
      return false;
    }

    // Validate latitude range
    if (
      projectData.location.latitude < -90 ||
      projectData.location.latitude > 90
    ) {
      setValidationError("Latitude must be between -90 and 90");
      return false;
    }

    // Validate longitude range
    if (
      projectData.location.longitude < -180 ||
      projectData.location.longitude > 180
    ) {
      setValidationError("Longitude must be between -180 and 180");
      return false;
    }

    // Validate time horizon
    if (projectData.time_horizon < 1 || projectData.time_horizon > 50) {
      setValidationError("Time horizon must be between 1 and 50 years");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      project_name: projectData.project_name.trim(),
      description: projectData.description.trim(),
      location: {
        latitude: projectData.location.latitude,
        longitude: projectData.location.longitude,
      },
      time_horizon: projectData.time_horizon,
      time_resolution: projectData.time_resolution,
      seasonality_enabled: projectData.seasonality_enabled,
      seasonality_option: projectData.seasonality_option,
      typical_profile: projectData.typical_profile || "day", // use selected value or fallback
    };

    console.log(
      "🚀 Submitting project data:",
      JSON.stringify(submitData, null, 2)
    );

    try {
      const result = await projectSetupMutation.mutateAsync(submitData);
      console.log("✅ Project setup successful:", result);
      router.push("/system-configuration");
    } catch (error) {
      console.error("❌ Project setup failed:", error);
      // Error is handled by mutation state
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    // Ensure we have valid numbers
    const latitude = isNaN(lat) ? 0 : lat;
    const longitude = isNaN(lng) ? 0 : lng;

    updateProjectData({
      location: {
        latitude,
        longitude,
      },
    });
  };

  const handleLatitudeChange = (value: string) => {
    const lat = value === "" ? 0 : parseFloat(value);
    if (!isNaN(lat)) {
      handleLocationChange(lat, projectData.location.longitude);
    }
  };

  const handleLongitudeChange = (value: string) => {
    const lng = value === "" ? 0 : parseFloat(value);
    if (!isNaN(lng)) {
      handleLocationChange(projectData.location.latitude, lng);
    }
  };

  const handleTimeHorizonChange = (value: string) => {
    const timeHorizon = value === "" ? 20 : parseInt(value, 10);
    if (!isNaN(timeHorizon)) {
      updateProjectData({ time_horizon: timeHorizon });
    }
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
              <div className="">
                <img
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
            <h2 className="text-xl font-bold">Project Setup</h2>
            <span className="text-sm text-gray-600">Step 1 of 5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: "20%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-lg mb-8 max-w-4xl text-justify">
          Welcome to the Project Setup page, here you can create a new modeling
          project by defining its name, location, simulation horizon, and time
          resolution to lay the foundation for your energy system analysis.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          {/* Left Column - Map and Location */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Pinpoint your case study location by clicking on the map or
                entering coordinates below.
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="latitude">Latitude:</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={projectData.location.latitude}
                    onChange={(e) => handleLatitudeChange(e.target.value)}
                    className="mt-1"
                    min="-90"
                    max="90"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude:</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={projectData.location.longitude}
                    onChange={(e) => handleLongitudeChange(e.target.value)}
                    className="mt-1"
                    min="-180"
                    max="180"
                  />
                </div>
              </div>

              <div className="w-full h-96 border rounded-lg overflow-hidden">
                <MapComponent
                  latitude={projectData.location.latitude}
                  longitude={projectData.location.longitude}
                  onLocationChange={handleLocationChange}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="projectName" className="text-lg font-semibold">
                Project Name *
              </Label>
              <Input
                id="projectName"
                value={projectData.project_name}
                onChange={(e) =>
                  updateProjectData({ project_name: e.target.value })
                }
                className="mt-2"
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-lg font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                value={projectData.description}
                onChange={(e) =>
                  updateProjectData({ description: e.target.value })
                }
                className="mt-2 min-h-24"
                placeholder="Enter project description"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Time Settings</h3>
              <p className="text-gray-600 mb-4">
                Define how long and how detailed your simulation will be:
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="timeHorizon">Time Horizon:</Label>
                  <Input
                    id="timeHorizon"
                    type="number"
                    min="1"
                    max="50"
                    value={projectData.time_horizon}
                    onChange={(e) => handleTimeHorizonChange(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-500">years</span>
                </div>

                <div>
                  <Label htmlFor="timeResolution">Time Resolution:</Label>
                  <Select
                    value={projectData.time_resolution}
                    onValueChange={(value) =>
                      updateProjectData({ time_resolution: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="30-minutes" disabled>
                        30 Minutes
                      </SelectItem>
                      <SelectItem value="15-minutes" disabled>
                        15 Minutes
                      </SelectItem>
                      <SelectItem value="minute" disabled>
                        Minute
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-gray-400 block mt-1">
                    Support for other time resolution coming soon
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seasonality"
                    checked={projectData.seasonality_enabled}
                    onCheckedChange={(checked) =>
                      updateProjectData({
                        seasonality_enabled: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="seasonality">Seasonality:</Label>
                  {/* Info icon with tooltip */}
                  <span className="relative group cursor-pointer">
                    <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-center leading-5 font-bold ml-1">
                      i
                    </span>
                    <span className="absolute left-1/2 z-10 -translate-x-1/2 mt-2 w-72 p-2 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      Enables seasonal modeling by using representative profiles
                      for different parts of the year. Choose between 2 seasons
                      (dry/wet) for tropical regions or 4 seasons (winter,
                      spring, summer, fall) for temperate climates to better
                      capture variability in demand and renewable resources.
                    </span>
                  </span>
                </div>

                {/* Flex row for Number of seasons and Typical Profile */}
                <div className="flex flex-row gap-6 items-end">
                  {projectData.seasonality_enabled && (
                    <div>
                      <Label htmlFor="seasonalityOption">
                        Number of seasons:
                      </Label>
                      <Select
                        value={projectData.seasonality_option}
                        onValueChange={(value) =>
                          updateProjectData({ seasonality_option: value })
                        }
                      >
                        <SelectTrigger className="mt-1 max-w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2 seasons">2 seasons</SelectItem>
                          <SelectItem value="4 seasons">4 seasons</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Typical Profile Dropdown */}
                  <div>
                    <Label htmlFor="typicalProfile">
                      Typical Operation Profile:
                    </Label>
                    <Select
                      value={projectData.typical_profile || ""}
                      onValueChange={(value) =>
                        updateProjectData({ typical_profile: value })
                      }
                    >
                      <SelectTrigger className="mt-1 max-w-48">
                        <SelectValue placeholder="Select profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        {/* Add more options in the future */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Validation Error Display */}
        {validationError && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">
              Validation Error:
            </h4>
            <p className="text-yellow-600 text-sm">{validationError}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12 space-x-4">
          <Link href="/components">
            <Button variant="outline" className="px-8 py-2">
              Back
            </Button>
          </Link>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              projectSetupMutation.isPending || !projectData.project_name.trim()
            }
            className="bg-black hover:bg-gray-800 text-white px-8 py-2"
          >
            {projectSetupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>

        {/* Error Display */}
        {projectSetupMutation.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-medium text-red-800 mb-2">
              Error creating project:
            </h4>
            <p className="text-red-600 text-sm">
              {projectSetupMutation.error instanceof Error
                ? projectSetupMutation.error.message
                : "An error occurred."}
            </p>
            <details className="mt-2">
              <summary className="text-red-600 text-sm cursor-pointer">
                Show technical details
              </summary>
              <pre className="text-xs text-red-500 mt-1 overflow-auto">
                {JSON.stringify(projectSetupMutation.error, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Debug Info */}
      </main>
    </div>
  );
}
