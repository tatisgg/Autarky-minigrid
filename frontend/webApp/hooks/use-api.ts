import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import { useProjectStore } from "../lib/store"

export function useProjectSetup() {
  const queryClient = useQueryClient()
  const { setProjectId } = useProjectStore()
  interface ProjectSetupData {
  project_name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  time_horizon: number;
  time_resolution: string;
  seasonality_enabled: boolean;
  seasonality_option: string;
  typical_profile: string;
}

  return useMutation({
    mutationFn: async (data: ProjectSetupData) => {
      console.log("🎯 useProjectSetup - Starting mutation with data:", data)
      try {
        const result = await api.projectSetup(data)
        console.log("🎯 useProjectSetup - API call successful:", result)
        return result
      } catch (error) {
        console.error("🎯 useProjectSetup - API call failed:", error)
        throw error
      }
    },
    onSuccess: (data: any) => {
      console.log("🎯 useProjectSetup - onSuccess called with:", data)
      if (data.project_id) {
      console.log("🎯 useProjectSetup - Setting project ID:", data.project_id)
      setProjectId(data.project_id)
      } else {
      console.warn("🎯 useProjectSetup - No project_id in response:", data)
      }
      queryClient.invalidateQueries({ queryKey: ["project"] })
    },
    onError: (error: unknown) => {
      console.error("🎯 useProjectSetup - onError called with:", error)
    },
  })
}

export function useSystemConfiguration() {
  const queryClient = useQueryClient()

  interface SystemConfigurationData {
    // Define the expected shape of the input data here
    // Example:
    // configName: string;
    // parameters: Record<string, any>;
    [key: string]: any;
  }

  interface SystemConfigurationResponse {
    // Define the expected shape of the response here
    // Example:
    // success: boolean;
    // message?: string;
    [key: string]: any;
  }

  return useMutation<SystemConfigurationResponse, unknown, SystemConfigurationData>({
    mutationFn: async (data: SystemConfigurationData) => {
      console.log("🎯 useSystemConfiguration - Starting mutation with data:", data)
      try {
        const result = await api.systemConfiguration(data)
        console.log("🎯 useSystemConfiguration - API call successful:", result)
        return result
      } catch (error) {
        console.error("🎯 useSystemConfiguration - API call failed:", error)
        throw error
      }
    },
    onSuccess: (data: SystemConfigurationResponse) => {
      console.log("🎯 useSystemConfiguration - onSuccess:", data)
      queryClient.invalidateQueries({ queryKey: ["system-configuration"] })
    },
    onError: (error: unknown) => {
      console.error("🎯 useSystemConfiguration - onError:", error)
    },
  })
}

export function useTechnologyParameters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.technologyParameters,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technology-parameters"] })
    },
  })
}

export function useLoadDemand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.loadDemand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-demand"] })
    },
  })
}

export function useRenewablesPotential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.renewablesPotential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renewables-potential"] })
    },
  })
}

export function useModelUncertainties() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.modelUncertainties,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-uncertainties"] })
    },
  })
}

export function useModelOptimize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.modelOptimize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-optimize"] })
    },
  })
}
