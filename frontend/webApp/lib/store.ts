import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Location {
  latitude: number;
  longitude: number;
}

interface ProjectData {
  project_name: string;
  description: string;
  location: Location;
  time_horizon: number;
  time_resolution: string;
  seasonality_enabled: boolean;
  seasonality_option: string;
  operation_timesteps: number;
}

interface ProjectStore {
  projectId: string | null;
  projectData: ProjectData;
  selectedModelFormulation: string | null; // <-- ADD THIS LINE
  setProjectId: (id: string) => void;
  updateProjectData: (data: Partial<ProjectData>) => void;
  setModelFormulation: (formulation: string) => void; // <-- ADD THIS LINE
  resetProject: () => void;
}

const initialProjectData: ProjectData = {
  project_name: "",
  description: "",
  location: {
    latitude: -2.05627616659381,
    longitude: 41.11023900111167,
  },
  time_horizon: 20,
  time_resolution: "hourly",
  seasonality_enabled: false,
  seasonality_option: "2 seasons",
  operation_timesteps: 24,
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projectId: null,
      projectData: initialProjectData,
      selectedModelFormulation: null, // <-- ADD THIS LINE

      setProjectId: (id) => {
        console.log("📦 STORE - Setting project ID:", id);
        set({ projectId: id });
      },

      updateProjectData: (data) => {
        console.log("📦 STORE - Updating project data with:", data);
        set((state) => {
          const newData = {
            projectData: {
              ...state.projectData,
              ...data,
              location: {
                ...state.projectData.location,
                ...(data.location || {}),
              },
            },
          };
          console.log("📦 STORE - New project data:", newData.projectData);
          return newData;
        });
      },

      setModelFormulation: (formulation) => {
        set({ selectedModelFormulation: formulation });
      }, // <-- ADD THIS FUNCTION

      resetProject: () => {
        console.log("📦 STORE - Resetting project");
        set({
          projectId: null,
          projectData: initialProjectData,
          selectedModelFormulation: null,
        }); // <-- RESET FORMULATION TOO
      },
    }),
    {
      name: "autarky-project-store",
    }
  )
);
