import { create } from "zustand"
import { useProjectStore } from "./store";
const projectId = useProjectStore.getState().projectId;

interface EnabledComponents {
  solar_pv: boolean
  wind_turbine: boolean
  mini_hydro: boolean
  battery: boolean
  diesel_generator: boolean
  biogas_generator: boolean
  grid_connection: boolean
  fully_ac: boolean
}

interface SystemConfig {
  project_id: string
  enabled_components: EnabledComponents
  layout_id: number
}

interface SystemConfigStore {
  config: SystemConfig
  updateConfig: (data: Partial<SystemConfig>) => void
  submitConfig: () => Promise<void>
  resetConfig: () => void
}

//should be replaced with the actual project ID from the previous step
const initialConfig: SystemConfig = {
  project_id: projectId || "", // Use the project ID from the store or a default value
  enabled_components: {
    solar_pv: true,
    wind_turbine: false,
    mini_hydro: false,
    battery: true,
    diesel_generator: false,
    biogas_generator: false,
    grid_connection: false,
    fully_ac: true,
  },
  layout_id: 1,
}

export const useSystemConfigStore = create<SystemConfigStore>((set, get) => ({
  config: initialConfig,

  updateConfig: (data) =>
    set((state) => ({
      config: {
        ...state.config,
        ...data,
        // Handle nested enabled_components object separately
        enabled_components: {
          ...state.config.enabled_components,
          ...(data.enabled_components || {}),
        },
      },
    })),

  submitConfig: async () => {
    const { config } = get()

    try {
      // In a real app, this would be an API call
      console.log("Submitting system configuration:", config)

      // Simulate API call
      await fetch("/api/system-configuration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      return Promise.resolve()
    } catch (error) {
      console.error("Error submitting system configuration:", error)
      return Promise.reject(error)
    }
  },

  resetConfig: () => set({ config: initialConfig }),
}))
