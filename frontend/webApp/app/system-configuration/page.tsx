"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSystemConfigStore } from "@/lib/system-config-store";
import { useProjectStore } from "@/lib/store";
import { useSystemConfiguration } from "@/hooks/use-api";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import LayoutDiagram from "@/components/layout-diagram";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ComponentsPage from "@/app/components/page";

export default function SystemConfigurationPage() {
  const router = useRouter();
  const { config, updateConfig } = useSystemConfigStore();
  const { projectId } = useProjectStore();
  const systemConfigMutation = useSystemConfiguration();
  const [currentLayoutIndex, setCurrentLayoutIndex] = useState(0);
  const [availableLayouts, setAvailableLayouts] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Updated layouts with proper filtering logic
  const allLayouts = [
    {
      id: 1,
      name: "Solar Off-Grid AC-Coupled Minigrid",
      description:
        "Solar PV connected to a battery via a charge controller. The battery feeds an inverter, which powers the AC load. This simple off-grid setup is ideal for household-scale or micro-enterprise usage.",
      components: ["solar_pv", "battery"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_1",
    },
    {
      id: 2,
      name: "Hybrid Off-Grid AC-Coupled Minigrid (Solar + Battery + Diesel)",
      description:
        "Solar PV and diesel generator charge the battery. The inverter supplies the AC load. Diesel covers peak or nighttime demand, while solar provides the daytime base load.",
      components: ["solar_pv", "battery", "diesel_generator"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_2",
    },
    {
      id: 3,
      name: "Solar Diesel Off-Grid AC-Coupled Minigrid",
      description:
        "Solar PV covers daytime loads, diesel handles evening peaks. Simplified system without storage.",
      components: ["solar_pv", "diesel_generator"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_3",
    },
    {
      id: 4,
      name: "Solar On-Grid AC-Coupled Minigrid",
      description:
        "Solar PV charges the battery, which discharges through an inverter to supply the AC load. The grid supplements supply when solar and battery are insufficient and can charge the battery when needed.",
      components: ["solar_pv", "battery", "grid_connection"],
      requires_ac: true,
      requires_grid: true,
      layout_key: "layout_4",
    },
    {
      id: 5,
      name: "Hybrid On-Grid AC-Coupled Minigrid",
      description:
        "Solar and diesel with grid connection for backup power and peak demand management.",
      components: ["solar_pv", "diesel_generator", "grid_connection"],
      requires_ac: true,
      requires_grid: true,
      layout_key: "layout_5",
    },
    {
      id: 6,
      name: "Solar Biogas Off-Grid AC-Coupled Minigrid",
      description:
        "Solar PV and biogas generator provide renewable energy sources for AC loads through inverter system.",
      components: ["solar_pv", "biogas_generator"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_6",
    },
    {
      id: 7,
      name: "Hybrid Off-Grid AC-Coupled Minigrid (Solar + Battery + Biogas)",
      description:
        "Solar and biogas feed a battery that supplies AC load via an inverter. Fully renewable primary generation with biogas backup.",
      components: ["solar_pv", "battery", "biogas_generator"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_7",
    },
    {
      id: 8,
      name: "Solar Hydro Off-Grid AC-Coupled Minigrid",
      description:
        "Solar PV and mini-hydro with battery storage for reliable renewable energy supply.",
      components: ["solar_pv", "mini_hydro", "battery"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_8",
    },
    {
      id: 9,
      name: "Mini-Hydro Off-Grid AC-Coupled Minigrid",
      description:
        "Solar PV and mini-hydro generator provide consistent renewable power for AC loads.",
      components: ["solar_pv", "mini_hydro"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_9",
    },
    {
      id: 10,
      name: "Solar Off-Grid DC-Coupled Minigrid",
      description:
        "Solar PV charges the battery directly via a charge controller. The battery powers DC loads without needing an inverter, suitable for telecom towers, appliances, or small productive systems.",
      components: ["solar_pv", "battery"],
      requires_ac: false,
      requires_grid: false,
      layout_key: "layout_10",
    },
    {
      id: 11,
      name: "Wind Off-Grid AC-Coupled Minigrid",
      description:
        "Wind turbine charges the battery, which powers the AC load through an inverter. Useful in areas with strong wind resources and limited solar potential.",
      components: ["wind_turbine", "battery"],
      requires_ac: true,
      requires_grid: false,
      layout_key: "layout_11",
    },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Updated filtering logic based on your specifications
  useEffect(() => {
    const enabledComponents = Object.entries(config.enabled_components)
      .filter(([_, enabled]) => enabled)
      .map(([component]) => component);

    const { grid_connection, fully_ac } = config.enabled_components;

    let filteredLayouts = [];

    if (!grid_connection && fully_ac) {
      // Grid Connection = FALSE, Fully AC = TRUE
      const offGridACLayouts = [1, 2, 3, 6, 7, 8, 9, 11];
      filteredLayouts = allLayouts.filter(
        (layout) =>
          offGridACLayouts.includes(layout.id) &&
          layout.components.every((component) =>
            enabledComponents.includes(component)
          )
      );
    } else if (grid_connection && fully_ac) {
      // Grid Connection = TRUE, Fully AC = TRUE
      const onGridACLayouts = [4, 5];
      filteredLayouts = allLayouts.filter(
        (layout) =>
          onGridACLayouts.includes(layout.id) &&
          layout.components.every((component) =>
            enabledComponents.includes(component)
          )
      );
    } else if (!grid_connection && !fully_ac) {
      // Grid Connection = FALSE, Fully AC = FALSE
      const offGridDCLayouts = [10];
      filteredLayouts = allLayouts.filter(
        (layout) =>
          offGridDCLayouts.includes(layout.id) &&
          layout.components.every((component) =>
            enabledComponents.includes(component)
          )
      );
    } else {
      // Grid Connection = TRUE, Fully AC = FALSE (no layouts defined)
      filteredLayouts = [];
    }

    setAvailableLayouts(
      filteredLayouts.length > 0 ? filteredLayouts : allLayouts
    );

    // Reset current layout index if it's out of bounds
    if (
      currentLayoutIndex >= filteredLayouts.length &&
      filteredLayouts.length > 0
    ) {
      setCurrentLayoutIndex(0);
      updateConfig({ layout_id: filteredLayouts[0].id });
    }
  }, [config.enabled_components, currentLayoutIndex, updateConfig]);

  const handleComponentToggle = (component: string, enabled: boolean) => {
    updateConfig({
      enabled_components: {
        ...config.enabled_components,
        [component]: enabled,
      },
    });
  };

  const handleSubmit = async () => {
    if (!projectId) {
      console.error("No project ID found");
      return;
    }

    const submitData = {
      project_id: projectId,
      enabled_components: config.enabled_components,
      layout_id: config.layout_id,
    };

    console.log("🔗 Submitting system configuration:", submitData);

    try {
      const response = await systemConfigMutation.mutateAsync(submitData);
      console.log("✅ System configuration response:", response);
      router.push("/technology-parameters");
    } catch (error) {
      console.error("❌ Error submitting system configuration:", error);
    }
  };

  const nextLayout = () => {
    if (currentLayoutIndex < availableLayouts.length - 1) {
      const newIndex = currentLayoutIndex + 1;
      setCurrentLayoutIndex(newIndex);
      updateConfig({ layout_id: availableLayouts[newIndex].id });
    }
  };

  const prevLayout = () => {
    if (currentLayoutIndex > 0) {
      const newIndex = currentLayoutIndex - 1;
      setCurrentLayoutIndex(newIndex);
      updateConfig({ layout_id: availableLayouts[newIndex].id });
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  const currentLayout = availableLayouts[currentLayoutIndex] || allLayouts[0];

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
            <h2 className="text-xl font-bold">System Configuration</h2>
            <span className="text-sm text-gray-600">Step 2 of 5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: "40%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-lg mb-8 max-w-4xl ">
          Use the component toggles to define your system setup and choose from
          a set of mini-grids layouts to configure how the selected elements are
          connected through AC and/or DC buses.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Layout Carousel */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Select from the available validated layouts below based on your
              chosen components and design filters.
            </h3>

            <div className="relative border rounded-lg p-4 h-80 flex items-center justify-center mb-4 bg-white">
              {/* Layout Diagram */}
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src={`/layouts/${currentLayout.layout_key}.PNG`}
                  alt={currentLayout.name}
                  width={300}
                  height={200}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    // Fallback to generic diagram if specific image not found
                    e.currentTarget.src = "/layouts/default-layout.png";
                  }}
                />
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevLayout}
                disabled={currentLayoutIndex === 0}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextLayout}
                disabled={currentLayoutIndex === availableLayouts.length - 1}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Layout Description */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">{currentLayout.name}</h4>
              <p className="text-sm text-gray-600">
                {currentLayout.description}
              </p>
            </div>
          </div>

          {/* Right Column - Component Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Select the components to be included in the mini-grid layout.
            </h3>

            {/* Renewables Technologies */}
            <div className="mb-6">
              <h4 className="font-medium mb-3 ">Renewables</h4>
              <div className="grid grid-cols-3 gap-4">
                {/* Solar PV */}
                <div
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                    ${
                      config.enabled_components.solar_pv
                        ? "bg-yellow-100 border-gray-300 shadow-md"
                        : "bg-gray-100 border-gray-300 opacity-70 hover:opacity-90"
                    }`}
                  onClick={() =>
                    handleComponentToggle(
                      "solar_pv",
                      !config.enabled_components.solar_pv
                    )
                  }
                >
                  <div className="mb-2">
                    <Image
                      src="/Icons/solar-panel.svg"
                      alt="Solar PV"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-sm font-medium">Solar PV</span>
                </div>

                {/* Mini-Hydro */}
                <div
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                    ${
                      config.enabled_components.mini_hydro
                        ? "bg-yellow-100 border-gray-300 shadow-md"
                        : "bg-gray-100 border-gray-300 opacity-70 hover:opacity-90"
                    }`}
                  onClick={() =>
                    handleComponentToggle(
                      "mini_hydro",
                      !config.enabled_components.mini_hydro
                    )
                  }
                >
                  <div className="mb-2">
                    <Image
                      src="/Icons/hydro.svg"
                      alt="Mini-Hydro"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-sm font-medium">Mini-Hydro</span>
                </div>

                {/* Wind Turbine */}
                <div
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                    ${
                      config.enabled_components.wind_turbine
                        ? "bg-yellow-100 border-gray-300 shadow-md"
                        : "bg-gray-100 border-gray-300 opacity-70 hover:opacity-90"
                    }`}
                  onClick={() =>
                    handleComponentToggle(
                      "wind_turbine",
                      !config.enabled_components.wind_turbine
                    )
                  }
                >
                  <div className="mb-2">
                    <Image
                      src="/Icons/wind-power.svg"
                      alt="Wind Turbine"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-sm font-medium">Wind Turbine</span>
                </div>
              </div>
            </div>

            {/* Fuel Generators */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">
                Fuel Generators
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Diesel */}
                <div
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                    ${
                      config.enabled_components.diesel_generator
                        ? "bg-yellow-100 border-gray-300 shadow-md"
                        : "bg-gray-100 border-gray-300 opacity-70 hover:opacity-90"
                    }`}
                  onClick={() =>
                    handleComponentToggle(
                      "diesel_generator",
                      !config.enabled_components.diesel_generator
                    )
                  }
                >
                  <div className="mb-2">
                    <Image
                      src="/Icons/generator.svg"
                      alt="Diesel"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-sm font-medium">Diesel</span>
                </div>

                {/* Biomass */}
                <div
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                    ${
                      config.enabled_components.biogas_generator
                        ? "bg-yellow-100 border-gray-300 shadow-md"
                        : "bg-gray-100 border-gray-300 opacity-70 hover:opacity-90"
                    }`}
                  onClick={() =>
                    handleComponentToggle(
                      "biogas_generator",
                      !config.enabled_components.biogas_generator
                    )
                  }
                >
                  <div className="mb-2">
                    <Image
                      src="/Icons/biogas.svg"
                      alt="Biomass"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-sm font-medium">Biomass</span>
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="mb-6">
              <h4 className="font-medium mb-3 ">Storage</h4>
              <div className="grid grid-cols-1 gap-4">
                {/* Battery */}
                <div
                  className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition w-1/3
                    ${
                      config.enabled_components.battery
                        ? "bg-yellow-100 border-gray-300 shadow-md"
                        : "bg-gray-100 border-gray-300 opacity-70 hover:opacity-90"
                    }`}
                  onClick={() =>
                    handleComponentToggle(
                      "battery",
                      !config.enabled_components.battery
                    )
                  }
                >
                  <div className="mb-2">
                    <Image
                      src="/Icons/accumulator.svg"
                      alt="Battery"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-sm font-medium">Battery</span>
                </div>
              </div>
            </div>

            {/* System Toggles */}
            <div className="space-y-4 mb-6">
              {/* Main Grid Connection */}
              <div className="flex items-center gap-2">
                <Label htmlFor="grid-connection" className="cursor-pointer">
                  Main Grid Connection
                </Label>
                <Switch
                  id="grid-connection"
                  checked={config.enabled_components.grid_connection}
                  onCheckedChange={(checked) =>
                    handleComponentToggle("grid_connection", checked)
                  }
                />
                {/* Info icon with tooltip */}
                <span className="relative group cursor-pointer ml-1">
                  <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-center leading-5 font-bold text-xs">
                    i
                  </span>
                  <span className="absolute left-1/2 z-10 -translate-x-1/2 mt-2 w-72 p-2 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    Models the link between the local energy system and the
                    central power grid. This enables scenarios such as weak grid
                    connections, grid imports during shortages, or electricity
                    export if allowed.
                  </span>
                </span>
              </div>

              {/* Fully AC System */}
              <div className="flex items-center gap-2">
                <Label htmlFor="fully-ac" className="cursor-pointer">
                  Fully AC System
                </Label>
                <Switch
                  id="fully-ac"
                  checked={config.enabled_components.fully_ac}
                  onCheckedChange={(checked) =>
                    handleComponentToggle("fully_ac", checked)
                  }
                />
                {/* Info icon with tooltip */}
                <span className="relative group cursor-pointer ml-1">
                  <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-center leading-5 font-bold text-xs">
                    i
                  </span>
                  <span className="absolute left-1/2 z-10 -translate-x-1/2 mt-2 w-72 p-2 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    Indicates that the mini-grid is AC-coupled. This affects
                    component selection and layout by requiring specific
                    inverters and grid-compatible connections. It assumes all
                    energy flows are managed on an AC bus.
                  </span>
                </span>
              </div>
            </div>

            {/* Components Information Link - Moved here */}
            <div className="mb-6">
              <a href="/components" target="_blank" className="text-black-600 underline text-sm">
                Want to know more about Autarky modules?
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12 space-x-4">
          <Link href="/project-setup">
            <Button variant="outline" className="px-8 py-2">
              Back
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={systemConfigMutation.isPending || !projectId}
            className="bg-black hover:bg-gray-800 text-white px-8 py-2"
          >
            {systemConfigMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>

        {/* Error Message */}
        {systemConfigMutation.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">
              Error: {systemConfigMutation.error.message}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
