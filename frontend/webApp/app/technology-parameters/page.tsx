"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjectStore } from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTechParamsStore } from "@/lib/tech-params-store";
import { useSystemConfigStore } from "@/lib/system-config-store";
import Image from "next/image";
import { Info } from "lucide-react";
import { useTechnologyParameters } from "@/hooks/use-api";

// Add or update your types at the top of your file or import them from your store
type DieselGeneratorParams = {
  nominal_capacity: number;
  nominal_efficiency: number;
  partial_load_enabled: boolean;
  efficiency_samples: number;
  investment_cost: number;
  operation_cost: number;
  lifetime: number;
  fuel_type: string;
  lower_heating_value: number;
  fuel_cost: number;
  fuel_limit_enabled: boolean;
  fuel_limit_max: number;
};

type GridConnectionParams = {
  allow_export?: boolean;
  line_capacity?: number;
  // Add other grid connection parameters as needed
};

type SolarPVParams = {
  investment_cost: number;
  operation_cost: number;
  subsidy: number;
  lifetime: number;
  // Add other solar PV parameters as needed
};

type WindTurbineParams = {
  investment_cost: number;
  operation_cost: number;
  subsidy: number;
  lifetime: number;
  // Add other wind turbine parameters as needed
};

type MiniHydroParams = {
  investment_cost: number;
  operation_cost: number;
  subsidy: number;
  lifetime: number;
  // Add other mini-hydro parameters as needed
};

type BatteryParams = {
  nominal_capacity: number;
  investment_cost: number;
  operation_cost: number;
  lifetime: number;
  charge_time: number;
  discharge_time: number;
  charging_efficiency: number;
  discharging_efficiency: number;
  soc_min: number;
  soc_max: number;
  soc_initial: number;
  // Add other battery parameters as needed
};

type BiogasGeneratorParams = {
  nominal_capacity: number;
  nominal_efficiency: number;
  partial_load_enabled: boolean;
  efficiency_samples: number;
  investment_cost: number;
  operation_cost: number;
  lifetime: number;
  fuel_type: string;
  lower_heating_value: number;
  fuel_cost: number;
  fuel_limit_enabled: boolean;
  fuel_limit_max: number;
};

type Params = {
  technology_parameters: {
    diesel_generator?: DieselGeneratorParams;
    solar_pv?: SolarPVParams;
    wind_turbine?: WindTurbineParams;
    mini_hydro?: MiniHydroParams;
    battery?: BatteryParams;
    grid_connection?: GridConnectionParams;
    // ...other components
  };
  project_economic_settings: {
    currency: string;
    discount_rate: number;
  };
  system_constraints: {
    maximum_lost_load: number;
    minimum_renewable_penetration: number;
  };
  selectedComponent?: string;
};

export default function TechnologyParametersPage() {
  const { projectId } = useProjectStore();
  const router = useRouter();
  const {
    params,
    updateEconomicSettings,
    updateComponentParams,
    selectComponent,
  } = useTechParamsStore();
  const { config } = useSystemConfigStore();
  const mutation = useTechnologyParameters();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Add state for uploaded CSVs at the top of your component:
  const [gridCostCSV, setGridCostCSV] = useState<File | null>(null);
  const [gridPriceCSV, setGridPriceCSV] = useState<File | null>(null);
  const [gridCost, setGridCost] = useState<any>(null);
  const [gridPrice, setGridPrice] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper to parse CSV to JS object
  async function parseCsvFile(file: File) {
    const text = await file.text();
    // Simple CSV parser: expects header row with "season", then values
    // e.g. dry,0.09,0.09,...\nwet,0.11,0.11,...
    const lines = text.trim().split("\n");
    const result: any = {};
    for (const line of lines) {
      const [season, ...values] = line.split(",");
      result[season.trim()] = values.map(Number);
    }
    return result;
  }

  // Only include enabled and filled technology parameters
  const getEnabledTechParams = () => {
    const enabled = Object.entries(config.enabled_components)
      .filter(([_, enabled]) => enabled)
      .map(([component]) => component);

    const techParams: Record<string, any> = {};
    for (const comp of enabled) {
      if (params.technology_parameters[comp]) {
        // Only include fields that are defined and not empty
        const clean = Object.fromEntries(
          Object.entries(params.technology_parameters[comp]).filter(
            ([_, v]) =>
              v !== undefined &&
              v !== null &&
              v !== "" &&
              // Remove false for booleans, but keep 0 for numbers
              (typeof v !== "boolean" || v === true)
          )
        );
        if (Object.keys(clean).length > 0) techParams[comp] = clean;
      }
    }
    return techParams;
  };

  const handleSubmit = async () => {
    if (!projectId) {
      alert("Project ID is missing.");
      return;
    }

    // Validate parameters before submission
    const validationError = validateParams();
    if (validationError) {
      alert(validationError);
      return;
    }

    const payload = {
      project_id: projectId,
      economic_settings: {
        discount_rate: params.project_economic_settings.discount_rate,
        currency: params.project_economic_settings.currency,
      },
      system_constraints: {
        maximum_lost_load: params.system_constraints.maximum_lost_load,
        minimum_renewable_penetration:
          params.system_constraints.minimum_renewable_penetration,
      },
      technology_parameters: getEnabledTechParams(),
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        router.push("/load-demand");
      },
      onError: (error: any) => {
        alert(
          "Error submitting technology parameters: " +
            (error?.message || "Unknown error")
        );
      },
    });
  };

  // Parameter validation function
  function validateParams() {
    const { technology_parameters } = params;

    // --- Solar PV ---
    if (params.selectedComponent === "solar_pv") {
      const p = technology_parameters.solar_pv;
      if (!p) return "Solar PV parameters are missing.";
      if (!(p.investment_cost > 0)) return "Investment cost must be > 0.";
      if (!(p.operation_cost >= 0 && p.operation_cost <= 100))
        return "Operation cost must be between 0 and 100.";
      if (!(p.subsidy >= 0 && p.subsidy <= 100))
        return "Subsidy must be between 0 and 100.";
      if (!(Number.isInteger(p.lifetime) && p.lifetime > 0))
        return "Lifetime must be an integer > 0.";
    }

    // --- Battery ---
    if (params.selectedComponent === "battery") {
      const p = technology_parameters.battery;
      if (!p) return "Battery parameters are missing.";
      if (!(p.nominal_capacity > 0)) return "Nominal Capacity must be > 0.";
      if (!(p.investment_cost > 0)) return "Investment cost must be > 0.";
      if (!(p.operation_cost >= 0 && p.operation_cost <= 100))
        return "Operation cost must be between 0 and 100.";
      if (!(Number.isInteger(p.lifetime) && p.lifetime > 0))
        return "Lifetime must be an integer > 0.";
      if (!(Number.isInteger(p.charge_time) && p.charge_time > 0))
        return "Charge time must be an integer > 0.";
      if (!(Number.isInteger(p.discharge_time) && p.discharge_time > 0))
        return "Discharge time must be an integer > 0.";
      if (!(p.charging_efficiency >= 0 && p.charging_efficiency <= 100))
        return "Charging efficiency must be between 0 and 100.";
      if (!(p.discharging_efficiency >= 0 && p.discharging_efficiency <= 100))
        return "Discharging efficiency must be between 0 and 100.";
      if (!(p.soc_min >= 0 && p.soc_min <= 100))
        return "Minimum SOC must be between 0 and 100.";
      if (!(p.soc_max >= 0 && p.soc_max <= 100))
        return "Maximum SOC must be between 0 and 100.";
      if (!(p.soc_initial >= 0 && p.soc_initial <= 100))
        return "Initial SOC must be between 0 and 100.";
    }

    // --- Diesel Generator ---
    if (params.selectedComponent === "diesel_generator") {
      const p = technology_parameters.diesel_generator;
      if (!p) return "Generator parameters are missing.";
      if (!(p.nominal_capacity > 0)) return "Nominal Capacity must be > 0.";
      if (!(p.nominal_efficiency >= 0 && p.nominal_efficiency <= 100))
        return "Nominal efficiency must be between 0 and 100.";
      if (!(p.investment_cost > 0)) return "Investment cost must be > 0.";
      if (!(p.operation_cost >= 0 && p.operation_cost <= 100))
        return "Operation cost must be between 0 and 100.";
      if (!(Number.isInteger(p.lifetime) && p.lifetime > 0))
        return "Lifetime must be an integer > 0.";
      if (!(p.lower_heating_value > 0))
        return "Lower Heating Value must be > 0.";
      if (!(p.fuel_cost > 0)) return "Fuel cost must be > 0.";
    }

    if (
      params.system_constraints.maximum_lost_load < 0 ||
      params.system_constraints.maximum_lost_load > 100
    )
      return "Maximum lost load must be between 0 and 100.";
    if (
      params.system_constraints.minimum_renewable_penetration < 0 ||
      params.system_constraints.minimum_renewable_penetration > 100
    )
      return "Minimum renewable penetration must be between 0 and 100.";

    return null; // No error
  }

  // Get enabled components
  const enabledComponents = Object.entries(config.enabled_components)
    .filter(([_, enabled]) => enabled)
    .map(([component]) => component);

  // SVG icon map (adjust paths as needed)
  const iconMap: Record<string, string> = {
    solar_pv: "/Icons/solar-panel.svg",
    wind_turbine: "/Icons/wind-power.svg",
    mini_hydro: "/Icons/hydro.svg",
    battery: "/Icons/accumulator.svg",
    diesel_generator: "/Icons/generator.svg",
    biogas_generator: "/Icons/biogas.svg",
    grid_connection: "/Icons/power.svg",
  };

  // Left column: scrollable, consistent icons, grid connection if enabled
  const renderComponentCards = () => (
    <div className="overflow-y-auto max-h-[500px] space-y-4 pr-2">
      <div>
        <h4 className="font-medium mb-3">Renewables Technologies</h4>
        <div className="grid grid-cols-2 gap-4">
          {enabledComponents.includes("solar_pv") && (
            <div
              className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                ${
                  params.selectedComponent === "solar_pv"
                    ? "bg-yellow-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300 opacity-70"
                }`}
              onClick={() => selectComponent("solar_pv")}
            >
              <Image
                src={iconMap.solar_pv}
                alt="Solar PV"
                width={40}
                height={40}
              />
              <span className="text-sm font-medium mt-2">Solar PV</span>
            </div>
          )}
          {enabledComponents.includes("wind_turbine") && (
            <div
              className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                ${
                  params.selectedComponent === "wind_turbine"
                    ? "bg-yellow-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300 opacity-70"
                }`}
              onClick={() => selectComponent("wind_turbine")}
            >
              <Image
                src={iconMap.wind_turbine}
                alt="Wind Turbine"
                width={40}
                height={40}
              />
              <span className="text-sm font-medium mt-2">Wind Turbine</span>
            </div>
          )}
          {enabledComponents.includes("mini_hydro") && (
            <div
              className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                ${
                  params.selectedComponent === "mini_hydro"
                    ? "bg-yellow-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300 opacity-70"
                }`}
              onClick={() => selectComponent("mini_hydro")}
            >
              <Image
                src={iconMap.mini_hydro}
                alt="Mini-Hydro"
                width={40}
                height={40}
              />
              <span className="text-sm font-medium mt-2">Mini-Hydro</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-medium mb-3">Storage</h4>
        <div className="grid grid-cols-2 gap-4">
          {enabledComponents.includes("battery") && (
            <div
              className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                ${
                  params.selectedComponent === "battery"
                    ? "bg-yellow-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300 opacity-70"
                }`}
              onClick={() => selectComponent("battery")}
            >
              <Image
                src={iconMap.battery}
                alt="Battery"
                width={40}
                height={40}
              />
              <span className="text-sm font-medium mt-2">Battery</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-medium mb-3">Fuel Generators</h4>
        <div className="grid grid-cols-2 gap-4">
          {enabledComponents.includes("diesel_generator") && (
            <div
              className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                ${
                  params.selectedComponent === "diesel_generator"
                    ? "bg-yellow-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300 opacity-70"
                }`}
              onClick={() => selectComponent("diesel_generator")}
            >
              <Image
                src={iconMap.diesel_generator}
                alt="Diesel Generator"
                width={40}
                height={40}
              />
              <span className="text-sm font-medium mt-2">Diesel Generator</span>
            </div>
          )}
          {enabledComponents.includes("biogas_generator") && (
            <div
              className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                ${
                  params.selectedComponent === "biogas_generator"
                    ? "bg-yellow-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300 opacity-70"
                }`}
              onClick={() => selectComponent("biogas_generator")}
            >
              <Image
                src={iconMap.biogas_generator}
                alt="Biogas Generator"
                width={40}
                height={40}
              />
              <span className="text-sm font-medium mt-2">Biogas Generator</span>
            </div>
          )}
        </div>
      </div>
      {/* Grid Connection */}
      {enabledComponents.includes("grid_connection") && (
        <div>
          <h4 className="font-medium mb-3">Grid</h4>
          <div className="grid grid-cols-1 gap-4">
            <div
              className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition
                ${
                  params.selectedComponent === "grid_connection"
                    ? "bg-yellow-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300 opacity-70"
                }`}
              onClick={() => selectComponent("grid_connection")}
            >
              <Image
                src={iconMap.grid_connection}
                alt="Grid Connection"
                width={40}
                height={40}
              />
              <span className="text-sm font-medium mt-2">Grid Connection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Add this function inside your component:
  const renderParameterFields = () => {
    const selectedComponent = params.selectedComponent;
    if (!selectedComponent) {
      return (
        <div className="p-6 text-center text-gray-500">
          <p>
            Select a component from the system layout to view and edit its
            parameters.
          </p>
        </div>
      );
    }

    // Typed helpers
    const Field = ({
      id,
      label,
      tooltip,
      value,
      onChange,
      unit,
      inputProps = {},
    }: {
      id: string;
      label: string;
      tooltip: string;
      value: number | string | undefined;
      onChange: (v: number) => void;
      unit?: string;
      inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    }) => (
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Input
            id={id}
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
            className="w-1/3"
            {...inputProps}
          />
          {unit && (
            <span className="ml-2 italic text-xs text-gray-500">{unit}</span>
          )}
        </div>
      </div>
    );

    const TextField = ({
      id,
      label,
      tooltip,
      value,
      onChange,
      unit,
    }: {
      id: string;
      label: string;
      tooltip: string;
      value: string | undefined;
      onChange: (v: string) => void;
      unit?: string;
    }) => (
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Input
            id={id}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-1/3"
          />
          {unit && (
            <span className="ml-2 italic text-xs text-gray-500">{unit}</span>
          )}
        </div>
      </div>
    );

    const ToggleField = ({
      id,
      label,
      tooltip,
      checked,
      onChange,
    }: {
      id: string;
      label: string;
      tooltip: string;
      checked: boolean;
      onChange: (checked: boolean) => void;
    }) => (
      <div className="flex items-center gap-2 mb-4">
        <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
        <Label htmlFor={id}>{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );

    // --- SOLAR PV ---
    if (selectedComponent === "solar_pv") {
      const p: SolarPVParams = params.technology_parameters.solar_pv || {
        investment_cost: 0,
        operation_cost: 0,
        subsidy: 0,
        lifetime: 0,
      };
      return (
        <div>
          <h4 className="font-semibold mb-2">Economics</h4>
          <Field
            id="solar-investment-cost"
            label="Investment Cost"
            tooltip="Cost per kW of installed capacity"
            value={p.investment_cost}
            onChange={(v) =>
              updateComponentParams("solar_pv", { investment_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/kW`}
          />
          <Field
            id="solar-operation-cost"
            label="Operation Cost"
            tooltip="Annual operation and maintenance cost as percentage of investment cost"
            value={p.operation_cost}
            onChange={(v) =>
              updateComponentParams("solar_pv", { operation_cost: v })
            }
            unit="% of CAPEX/year"
          />
          <Field
            id="solar-subsidy"
            label="Subsidy"
            tooltip="Percentage of investment cost covered by subsidies"
            value={p.subsidy}
            onChange={(v) => updateComponentParams("solar_pv", { subsidy: v })}
            unit="% of CAPEX"
          />
          <Field
            id="solar-lifetime"
            label="Lifetime"
            tooltip="Expected operational lifetime of the solar PV system"
            value={p.lifetime}
            onChange={(v) => updateComponentParams("solar_pv", { lifetime: v })}
            unit="years"
          />
        </div>
      );
    }

    // --- WIND TURBINE ---
    if (selectedComponent === "wind_turbine") {
      const p = params.technology_parameters.wind_turbine || {};
      return (
        <div>
          <h4 className="font-semibold mb-2">Economics</h4>
          <Field
            id="wind-investment-cost"
            label="Investment Cost"
            tooltip="Cost per kW of installed capacity"
            value={p.investment_cost}
            onChange={(v) =>
              updateComponentParams("wind_turbine", { investment_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/kW`}
          />
          <Field
            id="wind-operation-cost"
            label="Operation Cost"
            tooltip="Annual operation and maintenance cost as percentage of investment cost"
            value={p.operation_cost}
            onChange={(v) =>
              updateComponentParams("wind_turbine", { operation_cost: v })
            }
            unit="% of CAPEX/year"
          />
          <Field
            id="wind-subsidy"
            label="Subsidy"
            tooltip="Percentage of investment cost covered by subsidies"
            value={p.subsidy}
            onChange={(v) =>
              updateComponentParams("wind_turbine", { subsidy: v })
            }
            unit="% of CAPEX"
          />
          <Field
            id="wind-lifetime"
            label="Lifetime"
            tooltip="Expected operational lifetime of the wind turbine"
            value={p.lifetime}
            onChange={(v) =>
              updateComponentParams("wind_turbine", { lifetime: v })
            }
            unit="years"
          />
        </div>
      );
    }

    // --- MINI-HYDRO ---
    if (selectedComponent === "mini_hydro") {
      const p = params.technology_parameters.mini_hydro || {};
      return (
        <div>
          <h4 className="font-semibold mb-2">Economics</h4>
          <Field
            id="hydro-investment-cost"
            label="Investment Cost"
            tooltip="Cost per kW of installed capacity"
            value={p.investment_cost}
            onChange={(v) =>
              updateComponentParams("mini_hydro", { investment_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/kW`}
          />
          <Field
            id="hydro-operation-cost"
            label="Operation Cost"
            tooltip="Annual operation and maintenance cost as percentage of investment cost"
            value={p.operation_cost}
            onChange={(v) =>
              updateComponentParams("mini_hydro", { operation_cost: v })
            }
            unit="% of CAPEX/year"
          />
          <Field
            id="hydro-subsidy"
            label="Subsidy"
            tooltip="Percentage of investment cost covered by subsidies"
            value={p.subsidy}
            onChange={(v) =>
              updateComponentParams("mini_hydro", { subsidy: v })
            }
            unit="% of CAPEX"
          />
          <Field
            id="hydro-lifetime"
            label="Lifetime"
            tooltip="Expected operational lifetime of the mini-hydro system"
            value={p.lifetime}
            onChange={(v) =>
              updateComponentParams("mini_hydro", { lifetime: v })
            }
            unit="years"
          />
        </div>
      );
    }

    // --- BATTERY ---
    if (selectedComponent === "battery") {
      const p = params.technology_parameters.battery || {};
      return (
        <div>
          <Field
            id="battery-nominal-capacity"
            label="Nominal Capacity"
            tooltip="Total energy storage capacity of the battery"
            value={p.nominal_capacity}
            onChange={(v) =>
              updateComponentParams("battery", { nominal_capacity: v })
            }
            unit="kWh"
          />
          <h4 className="font-semibold mb-2">Economics</h4>
          <Field
            id="battery-investment-cost"
            label="Investment Cost"
            tooltip="Cost per kWh of battery capacity"
            value={p.investment_cost}
            onChange={(v) =>
              updateComponentParams("battery", { investment_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/kWh`}
          />
          <Field
            id="battery-operation-cost"
            label="Operation Cost"
            tooltip="Annual operation and maintenance cost as percentage of investment cost"
            value={p.operation_cost}
            onChange={(v) =>
              updateComponentParams("battery", { operation_cost: v })
            }
            unit="% of CAPEX/year"
          />
          <Field
            id="battery-lifetime"
            label="Lifetime"
            tooltip="Expected operational lifetime of the battery"
            value={p.lifetime}
            onChange={(v) => updateComponentParams("battery", { lifetime: v })}
            unit="years"
          />
          <h4 className="font-semibold mb-2">Operation</h4>
          <Field
            id="battery-charge-time"
            label="Charge Time"
            tooltip="Time required to fully charge the battery"
            value={p.charge_time}
            onChange={(v) =>
              updateComponentParams("battery", { charge_time: v })
            }
            unit="hours"
          />
          <Field
            id="battery-discharge-time"
            label="Discharge Time"
            tooltip="Time required to fully discharge the battery"
            value={p.discharge_time}
            onChange={(v) =>
              updateComponentParams("battery", { discharge_time: v })
            }
            unit="hours"
          />
          <Field
            id="battery-charging-efficiency"
            label="Charging Efficiency"
            tooltip="Efficiency of the battery during charging"
            value={p.charging_efficiency}
            onChange={(v) =>
              updateComponentParams("battery", { charging_efficiency: v })
            }
            unit="%"
          />
          <Field
            id="battery-discharging-efficiency"
            label="Discharging Efficiency"
            tooltip="Efficiency of the battery during discharging"
            value={p.discharging_efficiency}
            onChange={(v) =>
              updateComponentParams("battery", { discharging_efficiency: v })
            }
            unit="%"
          />
          <Field
            id="battery-soc-min"
            label="Minimum SOC"
            tooltip="Minimum state of charge allowed"
            value={p.soc_min}
            onChange={(v) => updateComponentParams("battery", { soc_min: v })}
            unit="%"
          />
          <Field
            id="battery-soc-max"
            label="Maximum SOC"
            tooltip="Maximum state of charge allowed"
            value={p.soc_max}
            onChange={(v) => updateComponentParams("battery", { soc_max: v })}
            unit="%"
          />
          <Field
            id="battery-soc-initial"
            label="Initial SOC"
            tooltip="Initial state of charge at simulation start"
            value={p.soc_initial}
            onChange={(v) =>
              updateComponentParams("battery", { soc_initial: v })
            }
            unit="%"
          />
        </div>
      );
    }

    // --- DIESEL GENERATOR ---
    if (selectedComponent === "diesel_generator") {
      const p: DieselGeneratorParams =
        params.technology_parameters.diesel_generator ||
        ({} as DieselGeneratorParams);
      return (
        <div>
          <Field
            id="diesel-nominal-capacity"
            label="Nominal Capacity"
            tooltip="Maximum power output of the generator"
            value={p.nominal_capacity}
            onChange={(v) =>
              updateComponentParams("diesel_generator", { nominal_capacity: v })
            }
            unit="kW"
          />
          <Field
            id="diesel-nominal-efficiency"
            label="Nominal Efficiency"
            tooltip="Efficiency at rated power"
            value={p.nominal_efficiency}
            onChange={(v) =>
              updateComponentParams("diesel_generator", {
                nominal_efficiency: v,
              })
            }
            unit="%"
          />

          <h4 className="font-semibold mb-2">Economics</h4>
          <Field
            id="diesel-investment-cost"
            label="Investment Cost"
            tooltip="Cost per kW of installed capacity"
            value={p.investment_cost}
            onChange={(v) =>
              updateComponentParams("diesel_generator", { investment_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/kW`}
          />
          <Field
            id="diesel-operation-cost"
            label="Operation Cost"
            tooltip="Annual operation and maintenance cost as percentage of investment cost"
            value={p.operation_cost}
            onChange={(v) =>
              updateComponentParams("diesel_generator", { operation_cost: v })
            }
            unit="% of CAPEX/year"
          />
          <Field
            id="diesel-lifetime"
            label="Lifetime"
            tooltip="Expected operational lifetime of the generator"
            value={p.lifetime}
            onChange={(v) =>
              updateComponentParams("diesel_generator", { lifetime: v })
            }
            unit="years"
          />
          <h4 className="font-semibold mb-2">Fuel</h4>
          <TextField
            id="diesel-fuel-type"
            label="Fuel Type"
            tooltip="Type of fuel used by the generator"
            value={p.fuel_type}
            onChange={(v) =>
              updateComponentParams("diesel_generator", { fuel_type: v })
            }
          />
          <Field
            id="diesel-lhv"
            label="Lower Heating Value"
            tooltip="Lower heating value of the fuel"
            value={p.lower_heating_value}
            onChange={(v) =>
              updateComponentParams("diesel_generator", {
                lower_heating_value: v,
              })
            }
            unit="kWh/liter"
          />
          <Field
            id="diesel-fuel-cost"
            label="Fuel Cost"
            tooltip="Cost per liter of fuel"
            value={p.fuel_cost}
            onChange={(v) =>
              updateComponentParams("diesel_generator", { fuel_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/liter`}
          />
          <ToggleField
            id="diesel-fuel-limit"
            label="Fuel Consumption Limit"
            tooltip="Limit the maximum annual fuel consumption"
            checked={!!p.fuel_limit_enabled}
            onChange={(checked) =>
              updateComponentParams("diesel_generator", {
                fuel_limit_enabled: !!checked,
              })
            }
          />
          {p.fuel_limit_enabled && (
            <Field
              id="diesel-fuel-limit-max"
              label="Max Annual Fuel Consumption"
              tooltip="Maximum amount of fuel that can be consumed per year"
              value={p.fuel_limit_max}
              onChange={(v) =>
                updateComponentParams("diesel_generator", { fuel_limit_max: v })
              }
              unit="liters"
            />
          )}
        </div>
      );
    }

    // --- GRID CONNECTION ---
    if (selectedComponent === "grid_connection") {
      const p = params.technology_parameters.grid_connection || {};
      return (
        <div className="border rounded-xl p-6 bg-white">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="grid-line-capacity" className="font-semibold">
                Maximum Line Capacity (kW)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Maximum power transfer capacity of the grid connection
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="grid-line-capacity"
              type="number"
              value={p.line_capacity ?? ""}
              onChange={(e) =>
                updateComponentParams("grid_connection", {
                  line_capacity: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="w-1/2"
            />
          </div>

          {/* Grid Cost */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-1">
              Upload CSV file with electricity grid cost
            </div>
            <div className="flex items-center gap-3">
              <Label className="font-medium">Grid Cost (currency/kWh)</Label>
              <Input
                type="file"
                accept=".csv"
                className="hidden"
                id="grid-cost-csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  setGridCostCSV(file);
                  if (file) {
                    const parsed = await parseCsvFile(file);
                    setGridCost(parsed);
                    updateComponentParams("grid_connection", {
                      grid_cost: parsed,
                    });
                  }
                }}
              />
              <label htmlFor="grid-cost-csv">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  asChild={false}
                >
                  Upload CSV file
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                </Button>
              </label>
              {gridCostCSV && (
                <span className="text-xs text-green-700 ml-2">
                  {gridCostCSV.name} uploaded
                </span>
              )}
            </div>
          </div>

          {/* Allow Export Toggle */}
          <div className="mb-6 flex items-center gap-3">
            <Label htmlFor="grid-allow-export" className="font-medium">
              Allow Export to the Grid
            </Label>
            <Checkbox
              id="grid-allow-export"
              checked={!!p.allow_export}
              onCheckedChange={(checked) =>
                updateComponentParams("grid_connection", {
                  allow_export: !!checked,
                })
              }
            />
          </div>

          {/* Grid Price (only if export allowed) */}
          {p.allow_export && (
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Upload CSV file with electricity grid cost
              </div>
              <div className="flex items-center gap-3">
                <Label className="font-medium">Grid Price (currency/kWh)</Label>
                <Input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="grid-price-csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    setGridPriceCSV(file);
                    if (file) {
                      const parsed = await parseCsvFile(file);
                      setGridPrice(parsed);
                      updateComponentParams("grid_connection", {
                        grid_price: parsed,
                      });
                    }
                  }}
                />
                <label htmlFor="grid-price-csv">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    asChild={false}
                  >
                    Upload CSV file
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                  </Button>
                </label>
                {gridPriceCSV && (
                  <span className="text-xs text-green-700 ml-2">
                    {gridPriceCSV.name} uploaded
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // --- BIOGAS GENERATOR ---
    if (selectedComponent === "biogas_generator") {
      const p: BiogasGeneratorParams = params.technology_parameters
        .biogas_generator || {
        nominal_capacity: 0,
        nominal_efficiency: 0,
        partial_load_enabled: false,
        efficiency_samples: 0,
        investment_cost: 0,
        operation_cost: 0,
        lifetime: 0,
        fuel_type: "",
        lower_heating_value: 0,
        fuel_cost: 0,
        fuel_limit_enabled: false,
        fuel_limit_max: 0,
      };
      return (
        <div>
          <Field
            id="biogas-nominal-capacity"
            label="Nominal Capacity"
            tooltip="Maximum power output of the biogas generator"
            value={p.nominal_capacity}
            onChange={(v) =>
              updateComponentParams("biogas_generator", { nominal_capacity: v })
            }
            unit="kW"
          />
          <Field
            id="biogas-nominal-efficiency"
            label="Nominal Efficiency"
            tooltip="Efficiency at rated power"
            value={p.nominal_efficiency}
            onChange={(v) =>
              updateComponentParams("biogas_generator", {
                nominal_efficiency: v,
              })
            }
            unit="%"
          />

          <h4 className="font-semibold mb-2">Economics</h4>
          <Field
            id="biogas-investment-cost"
            label="Investment Cost"
            tooltip="Cost per kW of installed capacity"
            value={p.investment_cost}
            onChange={(v) =>
              updateComponentParams("biogas_generator", { investment_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/kW`}
          />
          <Field
            id="biogas-operation-cost"
            label="Operation Cost"
            tooltip="Annual operation and maintenance cost as percentage of investment cost"
            value={p.operation_cost}
            onChange={(v) =>
              updateComponentParams("biogas_generator", { operation_cost: v })
            }
            unit="% of CAPEX/year"
          />
          <Field
            id="biogas-lifetime"
            label="Lifetime"
            tooltip="Expected operational lifetime of the biogas generator"
            value={p.lifetime}
            onChange={(v) =>
              updateComponentParams("biogas_generator", { lifetime: v })
            }
            unit="years"
          />
          <h4 className="font-semibold mb-2">Fuel</h4>
          <TextField
            id="biogas-fuel-type"
            label="Fuel Type"
            tooltip="Type of fuel used by the biogas generator"
            value={p.fuel_type}
            onChange={(v) =>
              updateComponentParams("biogas_generator", { fuel_type: v })
            }
          />
          <Field
            id="biogas-lhv"
            label="Lower Heating Value"
            tooltip="Lower heating value of the fuel"
            value={p.lower_heating_value}
            onChange={(v) =>
              updateComponentParams("biogas_generator", {
                lower_heating_value: v,
              })
            }
            unit="kWh/liter"
          />
          <Field
            id="biogas-fuel-cost"
            label="Fuel Cost"
            tooltip="Cost per liter of fuel"
            value={p.fuel_cost}
            onChange={(v) =>
              updateComponentParams("biogas_generator", { fuel_cost: v })
            }
            unit={`${params.project_economic_settings.currency}/liter`}
          />
          <ToggleField
            id="biogas-fuel-limit"
            label="Fuel Consumption Limit"
            tooltip="Limit the maximum annual fuel consumption"
            checked={!!p.fuel_limit_enabled}
            onChange={(checked) =>
              updateComponentParams("biogas_generator", {
                fuel_limit_enabled: !!checked,
              })
            }
          />
          {p.fuel_limit_enabled && (
            <Field
              id="biogas-fuel-limit-max"
              label="Max Annual Fuel Consumption"
              tooltip="Maximum amount of fuel that can be consumed per year"
              value={p.fuel_limit_max}
              onChange={(v) =>
                updateComponentParams("biogas_generator", { fuel_limit_max: v })
              }
              unit="liters"
            />
          )}
        </div>
      );
    }

    return (
      <div className="p-6 text-center text-gray-500">
        <p>Parameters for this component are not available.</p>
      </div>
    );
  };

  // Example for a single parameter field (Solar PV Investment Cost)
  // Place info icon next to label, input 1/3 width, unit in italic/small
  const renderInvestmentCostField = (
    component: string,
    label: string,
    value: number,
    onChange: (v: number) => void,
    info: string,
    unit: string
  ) => (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Label htmlFor={`${component}-investment-cost`}>{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{info}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Input
          id={`${component}-investment-cost`}
          type="number"
          value={value}
          onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
          className="w-1/3"
        />
        <span className="ml-2 italic text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  );

  // ...repeat for other fields as needed...

  if (!isClient) return <div>Loading...</div>;

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
                className="h-10 w-10 rounded-full"
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
            <h2 className="text-xl font-bold">Technology Parameters</h2>
            <span className="text-sm text-gray-600">Step 3 of 5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-lg mb-8 max-w-4xl">
          Define the technical and financial characteristics of your energy
          system. Click on each component on the left to view and edit
          parameters such as efficiency, capacity, investment cost, operational
          cost, and lifetime.
        </p>
        <p className="text-lg mb-8 max-w-xl font-bold">
          Click on each component in the system layout to display and edit its
          technical and financial parameters on the right panel.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Scrollable Component Cards */}
          <div className="border rounded-lg p-6 bg-white  overflow-y-auto">
            {renderComponentCards()}
          </div>
          {/* Right Column - Parameter Panel */}
          <div>
            {/* Project Economic Settings */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">
                Project Economic Settings
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discount-rate">Discount Rate:</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Annual discount rate used for economic calculations
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center">
                    <Input
                      id="discount-rate"
                      type="number"
                      value={params.project_economic_settings.discount_rate}
                      onChange={(e) =>
                        updateEconomicSettings({
                          discount_rate: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                    />
                    <span className="ml-2">%</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="currency">Currency:</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Currency used for all cost calculations</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="currency"
                    value={params.project_economic_settings.currency}
                    onChange={(e) =>
                      updateEconomicSettings({
                        currency: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* System Constraints */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">System Constraints</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max-lost-load">Maximum Lost Load:</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Maximum percentage of total demand that can be unmet
                            (0–100%).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center">
                    <Input
                      id="max-lost-load"
                      type="number"
                      min={0}
                      max={100}
                      value={params.system_constraints.maximum_lost_load}
                      onChange={(e) =>
                        updateSystemConstraints({
                          maximum_lost_load:
                            Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                    />
                    <span className="ml-2">%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="min-renewable-penetration">
                      Minimum Renewable Penetration:
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Minimum percentage of demand to be met by renewables
                            (0–100%).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center">
                    <Input
                      id="min-renewable-penetration"
                      type="number"
                      min={0}
                      max={100}
                      value={
                        params.system_constraints.minimum_renewable_penetration
                      }
                      onChange={(e) =>
                        updateSystemConstraints({
                          minimum_renewable_penetration:
                            Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                    />
                    <span className="ml-2">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Component Parameters */}
            <div className="border rounded-lg p-6 bg-gray-50 min-h-[400px] max-h-[600px] overflow-y-auto">
              {renderParameterFields()}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-12 space-x-4">
          <Link href="/system-configuration">
            <Button variant="outline" className="px-8 py-2">
              Back
            </Button>
          </Link>
          <Button
            onClick={() => {
              const error = validateParams();
              if (error) {
                setValidationError(error);
                return;
              }
              setValidationError(null);
              handleSubmit();
            }}
            className="bg-black hover:bg-gray-800 text-white px-8 py-2"
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}
