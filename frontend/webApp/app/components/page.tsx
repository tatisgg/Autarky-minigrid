import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import Image from "next/image";
export default function ComponentsPage() {
  const components = [
    {
      title: "Solar PV",
      icon: "/Icons/solar-panel.svg",
      description:
        "Autarky accepts per-unit electricity production time series, inverter efficiency, and techno-economic parameters for investment and O&M. It integrates with the PVGIS API to automatically generate high-resolution production profiles based on GPS location, tilt, and orientation.",
    },
    {
      title: "Wind Turbine",
      icon: "/Icons/wind-power.svg",
      description:
        "Autarky accepts per-unit electricity production time series, wind turbine efficiency, and techno-economic parameters for investment and O&M. It integrates with the PVGIS API to retrieve wind speed data based on GPS location, which is then converted to electricity production using a default or custom wind turbine power curve.",
    },
    {
      title: "Small Hydro",
      icon: "/Icons/hydro.svg",
      description:
        "Autarky accepts per-unit electricity production time series, turbine-generator efficiency, and techno-economic parameters for investment and O&M. For small hydro systems, such as run-of-the-river plants, calculations are based on water flow time series and key parameters including head height.",
    },
    {
      title: "Battery",
      icon: "/Icons/accumulator.svg",
      description:
        "Autarky models battery storage using a linear approach: key parameters such as depth of discharge (DoD), round-trip efficiency, nominal capacity, and techno-economic costs for investment, O&M, and replacements.",
    },
    {
      title: "Backup Generator",
      icon: "/Icons/generator.svg",
      description:
        "Autarky supports backup generation using diesel or biomass generators, modeled through user-defined techno-economic parameters such as fuel type, efficiency, investment and O&M costs, fuel price, and emissions.",
    },
    {
      title: "Main Grid Connection",
      icon: "/Icons/power.svg",
      description:
        "Autarky can be configured to model decentralized energy systems with a grid connection. In contexts where the grid is unreliable, user can input the average daily outage duration, while the program automatically handles the uncertainty in outage frequency.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#FABC5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="">
              {" "}
              <div className="">
                <Image
                  src="/Asset2.svg"
                  alt="Autarky Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Autarky Mini-Grids Components</h1>
        
        </div>

        <p className="text-lg mb-12 max-w-4xl ">
          Autarky has the following <strong>modules</strong> with related
          functionality and input requirements, with the flexibility of
          including any of the following components:
        </p>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {components.map((component, index) => (
            <div key={index} className="flex gap-4 p-6 border rounded-lg">
              <div className="flex-shrink-0">
                {component.icon.endsWith(".svg") ? (
                  <Image
                    src={component.icon}
                    alt={component.title}
                    width={40}
                    height={40}
                    className="h-10 w-10"
                  />
                ) : (
                  <span className="text-4xl">{component.icon}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">{component.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {component.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        {/* <div className="flex justify-end space-x-4">
          <Link href="/">
            <Button variant="outline" className="px-8 py-2">
              Back
            </Button>
          </Link>
          <Link href="/project-setup">
            <Button className="bg-black hover:bg-gray-800 text-white px-8 py-2">
              Next
            </Button>
          </Link>
        </div> */}
      </main>
    </div>
  );
}
