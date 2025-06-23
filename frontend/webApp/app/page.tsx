import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export default function LandingPage() {
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Mini-Grids Section */}
        <div className="flex items-center gap-8 mb-16">
          <div className="flex-1">
            <Image
              src="/mini-grids.png"
              alt="Mini-grid with solar panels and rural buildings"
              width={400}
              height={300}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1 bg-blue-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">
              Use Autarky <span className="text-blue-600">Mini-Grids</span> - Online Web Platform
            </h2>
            <p className="text-gray-700 mb-4">
              Easily model a <strong>hybrid mini-grid</strong> from scratch with a{" "}
              <strong>dynamic, user-friendly interface</strong>. Select components, define uncertainties, and run
              optimizations to get <strong>optimal sizing, dispatch strategies</strong>, and a complete{" "}
              <strong>cost analysis</strong>, all in one place.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Github className="w-5 h-5" />
              <Link href="https://github.com/tatisgg/Autarky-minigrid" target="_blank" className="text-blue-600 hover:underline">
                Check our <span className="underline">Github</span> Repository
              </Link>
            </div>
            <Link href="/components">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">Get Started</Button>
            </Link>
          </div>
        </div>

        {/* Swarm-Grids Section */}
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <Image
              src="/swarm-grids.png"
              alt="Swarm-grid with multiple solar installations"
              width={400}
              height={300}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1 bg-blue-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">
              Use Autarky <span className="text-blue-600">Swarm-Grids</span> - Online Web Platform
            </h2>
            <p className="text-gray-700 mb-4">
              Easily model and <strong>connect off-grid energy units</strong> through a user-friendly interface.
              Configure components, <strong>optimize energy sharing</strong>, and get efficient sizing, dispatch, and
              cost analysis across the network.
            </p>
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              <Link href="#" className="text-blue-600 hover:underline">
                Check our <span className="underline">Github</span> Repository
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
