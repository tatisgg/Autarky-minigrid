const API_BASE_URL = "https://autarky-website-backend.onrender.com";

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
  operation_time_steps: number;
}
export const api = {
  projectSetup: async (data: ProjectSetupData) => {
    console.log("🚀 PROJECT SETUP REQUEST:");
    console.log("URL:", `${API_BASE_URL}/project-setup`);
    console.log("Method: POST");
    console.log("Headers:", {
      "Content-Type": "application/json",
    });

    // Transform the data to match the exact API structure from your examples
    const apiData = {
      project_name: data.project_name || "",
      description: data.description || "",
      location: {
        latitude: Number(data.location?.latitude) || 0,
        longitude: Number(data.location?.longitude) || 0,
      },
      time_horizon: Number(data.time_horizon) || 20,
      time_resolution: data.time_resolution || "hourly",
      seasonality_enabled: Boolean(data.seasonality_enabled),
      seasonality_option: data.seasonality_option || "2 seasons",
      operation_time_steps: Number(data.operation_time_steps) || 0,
    };

    console.log(
      "Request Body (transformed):",
      JSON.stringify(apiData, null, 2)
    );
    console.log("Raw Data Object:", apiData);

    try {
      const response = await fetch(`${API_BASE_URL}/project-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(apiData),
      });

      console.log("📡 PROJECT SETUP RESPONSE:");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Headers:", Object.fromEntries(response.headers.entries()));
      console.log("OK:", response.ok);

      // Clone response to read it multiple times
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log("Response Text:", responseText);

      if (!response.ok) {
        console.error("❌ PROJECT SETUP ERROR:");
        console.error("Status:", response.status);
        console.error("Status Text:", response.statusText);
        console.error("Response Body:", responseText);

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          console.error("Parsed Error Data:", errorData);
          errorMessage =
            errorData.message ||
            errorData.error ||
            errorData.detail ||
            errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          // Use the raw response text as error message if JSON parsing fails
          errorMessage = responseText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      let responseData;
      try {
        responseData = await response.json();
        console.log("✅ PROJECT SETUP SUCCESS:");
        console.log("Response Data:", responseData);
      } catch (parseError) {
        console.error("Failed to parse success response as JSON:", parseError);
        console.log("Response text:", responseText);
        // If the response is not JSON, create a mock response
        responseData = {
          success: true,
          message: "Project created successfully",
          project_id:
            responseText.match(
              /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
            )?.[0] || null,
        };
      }

      return responseData;
    } catch (error) {
      console.error("🔥 PROJECT SETUP FETCH ERROR:");
      if (
        typeof error === "object" &&
        error !== null &&
        "constructor" in error &&
        typeof (error as any).constructor?.name === "string"
      ) {
        console.error("Error Type:", (error as any).constructor.name);
      } else {
        console.error("Error Type: unknown");
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as any).message === "string"
      ) {
        console.error("Error Message:", (error as any).message);
      } else {
        console.error("Error Message:", String(error));
      }
      console.error("Full Error:", error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Unable to connect to the server. Please check your internet connection."
        );
      }

      // Check if it's a CORS error
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as any).message === "string" &&
        (error as any).message.includes("CORS")
      ) {
        throw new Error(
          "CORS error: The server is not allowing requests from this domain."
        );
      }

      throw error;
    }
  },

  systemConfiguration: async (data: any) => {
    console.log("🚀 SYSTEM CONFIG REQUEST:");
    console.log("URL:", `${API_BASE_URL}/system-configuration`);

    // Transform the data to match the exact API structure
    const apiData = {
      project_id: data.project_id,
      enabled_components: {
        solar_pv: Boolean(data.enabled_components?.solar_pv),
        wind_turbine: Boolean(data.enabled_components?.wind_turbine),
        mini_hydro: Boolean(data.enabled_components?.mini_hydro),
        battery: Boolean(data.enabled_components?.battery),
        diesel_generator: Boolean(data.enabled_components?.diesel_generator),
        biogas_generator: Boolean(data.enabled_components?.biogas_generator),
        grid_connection: Boolean(data.enabled_components?.grid_connection),
        fully_ac: Boolean(data.enabled_components?.fully_ac),
      },
      layout_id: Number(data.layout_id) || 1,
    };

    console.log("Request Data (transformed):", apiData);

    try {
      const response = await fetch(`${API_BASE_URL}/system-configuration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(apiData),
      });

      console.log("📡 SYSTEM CONFIG RESPONSE:");
      console.log("Status:", response.status, response.statusText);

      const responseText = await response.clone().text();
      console.log("Response Text:", responseText);

      if (!response.ok) {
        console.error("❌ SYSTEM CONFIG ERROR:", responseText);
        throw new Error(`Failed to save system configuration: ${responseText}`);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        responseData = {
          success: true,
          message: "System configuration saved successfully",
        };
      }

      console.log("✅ SYSTEM CONFIG SUCCESS:", responseData);
      return responseData;
    } catch (error) {
      console.error("🔥 SYSTEM CONFIG FETCH ERROR:", error);
      throw error;
    }
  },

  technologyParameters: async (data: any) => {
    console.log("🚀 TECH PARAMS REQUEST:", data);

    // Transform the data to match the exact API structure
    const apiData = {
      project_id: data.project_id,
      economic_settings: {
        discount_rate: Number(data.economic_settings?.discount_rate) || 6.0,
        currency: data.economic_settings?.currency || "USD",
      },
      system_constraints: {
        maximum_lost_load:
          Number(data.system_constraints?.maximum_lost_load) ?? 0,
        minimum_renewable_penetration:
          Number(data.system_constraints?.minimum_renewable_penetration) ?? 0,
      },
      technology_parameters: data.technology_parameters || {},
    };

    const response = await fetch(`${API_BASE_URL}/technology-parameters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(apiData),
    });

    const responseText = await response.clone().text();
    console.log("📡 TECH PARAMS RESPONSE:", response.status, responseText);

    if (!response.ok) {
      console.error("❌ TECH PARAMS ERROR:", responseText);
      throw new Error(`Failed to save technology parameters: ${responseText}`);
    }

    try {
      return await response.json();
    } catch (parseError) {
      return {
        success: true,
        message: "Technology parameters saved successfully",
      };
    }
  },

  loadDemand: async (data: any) => {
    console.log("🚀 LOAD DEMAND REQUEST:", data);

    const apiData = {
      project_id: data.project_id,
      load_profile: data.load_profile || {},
    };

    const response = await fetch(`${API_BASE_URL}/load-demand`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(apiData),
    });

    const responseText = await response.clone().text();
    console.log("📡 LOAD DEMAND RESPONSE:", response.status, responseText);

    if (!response.ok) {
      console.error("❌ LOAD DEMAND ERROR:", responseText);
      throw new Error(`Failed to save load demand: ${responseText}`);
    }

    try {
      return await response.json();
    } catch (parseError) {
      return { success: true, message: "Load demand saved successfully" };
    }
  },

  renewablesPotential: async (data: any) => {
    console.log("🚀 RENEWABLES REQUEST:", data);

    const apiData = {
      project_id: data.project_id,
      technology: data.technology || "solar_pv",
      mode: data.mode || "csv_upload",
      technical_parameters: {
        component_name: data.technical_parameters?.component_name,
        nominal_capacity: data.technical_parameters?.nominal_capacity,
        inverter_efficiency: data.technical_parameters?.inverter_efficiency,
      },
      // Pass all keys (timestep, winter, spring, summer, fall, etc)
      renewables_potential_profile: { ...data.renewables_potential_profile },
    };

    const response = await fetch(`${API_BASE_URL}/renewables-potential`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(apiData),
    });

    const responseText = await response.clone().text();
    console.log("📡 RENEWABLES RESPONSE:", response.status, responseText);

    if (!response.ok) {
      console.error("❌ RENEWABLES ERROR:", responseText);
      throw new Error(`Failed to save renewables potential: ${responseText}`);
    }

    try {
      return await response.json();
    } catch (parseError) {
      return {
        success: true,
        message: "Renewables potential saved successfully",
      };
    }
  },

  modelUncertainties: async (data: any) => {
    console.log("🚀 MODEL UNCERTAINTIES REQUEST:", data);

    const apiData = {
      project_id: data.project_id,
      formulation: data.formulation || "linear",
      grid_connected: Boolean(data.grid_connected),
      // grid_outage_settings: data.grid_outage_settings || {},
    };

    const response = await fetch(`${API_BASE_URL}/model-uncertainties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(apiData),
    });

    const responseText = await response.clone().text();
    console.log(
      "📡 MODEL UNCERTAINTIES RESPONSE:",
      response.status,
      responseText
    );

    if (!response.ok) {
      console.error("❌ MODEL UNCERTAINTIES ERROR:", responseText);
      throw new Error(`Failed to save model uncertainties: ${responseText}`);
    }

    try {
      return await response.json();
    } catch (parseError) {
      return {
        success: true,
        message: "Model uncertainties saved successfully",
      };
    }
  },

  modelOptimize: async (data: any) => {
    console.log("🚀 MODEL OPTIMIZE REQUEST:", data);

    const apiData = {
      project_id: data.project_id,
      solver_name: data.solver_name || "HiGHS",
    };

    const response = await fetch(`${API_BASE_URL}/model-optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(apiData),
    });

    const responseText = await response.clone().text();
    console.log("📡 MODEL OPTIMIZE RESPONSE:", response.status, responseText);

    if (!response.ok) {
      console.error("❌ MODEL OPTIMIZE ERROR:", responseText);
      throw new Error(`Failed to optimize model: ${responseText}`);
    }

    try {
      return await response.json();
    } catch (parseError) {
      return {
        success: true,
        message: "Model optimization completed successfully",
      };
    }
  },
};
