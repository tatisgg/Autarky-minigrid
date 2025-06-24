import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const team = [
  {
    name: "Tatiana Gonzaléz Grandón",
    role: "Principal Investigator",
    image: "/Tatiana.jpg",
  },
  {
    name: "Nesrine Ouanes",
    role: "PhD Candidate",
    image: "/Nesrine Ouanes.jpg",
  },
  {
    name: "Alessandro Onori",
    role: "Research Fellow & Backend Developer",
    image: "/Alessandro.jpg",
  },
  {
    name: "Armel Munyaneza",
    role: "Frontend Developer",
    image: "/armel.jpeg",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Image
                src="/logo-2.png"
                alt="Autarky Logo"
                width={40}
                height={40}
                className="w-10 h-10"
                priority
              />
            </div>
            <span className="text-xl font-bold text-gray-800">Autarky</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium">
            <Link
              href="#mission"
              className="text-gray-700 hover:text-gray-900 transition-colors scroll-smooth"
            >
              Who we are
            </Link>
            <Link
              href="#contact"
              className="text-gray-700 hover:text-gray-900 transition-colors scroll-smooth"
            >
              Contact us
            </Link>
            <Link
              href="#resources"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Resources
            </Link>
          </nav>
          {/* Mobile menu button */}
          <button className="md:hidden p-2">
            <div className="w-6 h-0.5 bg-gray-600 mb-1"></div>
            <div className="w-6 h-0.5 bg-gray-600 mb-1"></div>
            <div className="w-6 h-0.5 bg-gray-600"></div>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen hero-background flex items-center justify-center pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Fully open. Fully yours
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-800 mb-8 max-w-3xl mx-auto leading-relaxed">
              Welcome to <span className="font-bold">Autarky</span> - an
              open-source tool for designing and operating solar mini-grids and
              swarm grids considering uncertainties.
            </p>

            <div className="mb-8 max-w-2xl mx-auto">
              <Image
                src="/hero.jpeg"
                alt="People working with solar panels"
                width={600}
                height={400}
                className="rounded-lg shadow-lg w-full h-auto"
                priority
              />
            </div>

            <p className="text-lg md:text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
              Model, optimize, and manage decentralized energy systems under
              uncertainty, fully open, fully yours.
            </p>
            <Link
              href="https://app.autarky-energy.net/"
              className="inline-block"
            >
              <Button
                size="lg"
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg rounded-lg"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-[#FABC5F] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Image
                  src="/logo-2.png"
                  alt="Placeholder image"
                  width={200}
                  height={200}
                  className=""
                />
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-8">
              How does it work?
            </h2>

            <p className="text-lg md:text-xl text-gray-800 mb-8 leading-relaxed">
              Autarky has employed stochastic optimization methods and tools to{" "}
              <span className="font-bold">
                quantify and manage energy supply reliability
              </span>
              , including preventive, corrective, and restorative actions,
              alongside preparedness measures and dispatch strategies for{" "}
              <span className="font-bold">
                decentralized energy systems' components
              </span>
              .
            </p>

            <Button
              size="lg"
              className="bg-[#0097B2] hover:bg-cyan-600 text-white px-8 py-4 text-lg rounded-lg mb-16"
            >
              Read more
            </Button>

            <div className="border-t-2 border-gray-800 pt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                CONTRIBUTORS:
              </h3>
              <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap">
                <Image
                  src="/ntu.png"
                  alt="Contributor Logo"
                  width={200}
                  height={200}
                  className=" object-cover"
                />
                <div className="bg-black text-white px-4 py-2 rounded font-bold text-lg">
                  OPEN4CEC
                </div>
                {/* <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
                  </div>
                  <span className="font-bold text-gray-800">ENACCESS</span>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section id="mission" className="bg-[#0097B2] py-16 md:py-24">
        <div className="container mx-auto px-4 ">
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-12">
            Our mission
          </h2>

          {/* Images with center logo */}
          <div className="relative mb-12 px-4 md:px-8 ">
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="relative">
                <Image
                  src="/left.jpeg"
                  alt="Hands joining together"
                  width={400}
                  height={300}
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>
              <div className="relative">
                <Image
                  src="/right.jpeg"
                  alt="People with statue"
                  width={400}
                  height={300}
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>
            </div>

            {/* Center logo overlay */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg ">
              <div className="relative ">
                <Image
                  src="/logo-sv.svg"
                  alt="Logo"
                  width={200}
                  height={200}
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Text content below images */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-bold text-black mb-4">
                Justice, access and collective power
              </h3>
              <p className="text-black text-sm leading-relaxed">
                <span className="font-bold">Autarky</span> exists to reclaim the
                tools of energy design as instruments of justice, access, and
                collective power. It was created to interrupt the logic of
                commercial proprietary systems that gatekeep knowledge through
                high licensing fees and opaque architectures.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-black mb-4">
                Open source space
              </h3>
              <p className="text-black text-sm leading-relaxed">
                We recognize that small developers, cooperatives,
                municipalities, and governments in the Global South deserve an
                open-source space to build and share techno-economic insight. By
                centering accessibility, transparency, and shared ownership, we
                aim to restore technical sovereignty to those too often excluded
                from the so-called "energy transition."
              </p>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="border-t-2 border-black pt-12">
              <p className="text-lg md:text-xl text-white leading-relaxed mb-6 font-semibold">
                Our mission is to enable energy system design for and by the
                people: communities, cooperatives, municipal utilities, and
                movements working toward a just energy future.
              </p>
              <div className="border-t-2 border-black pt-12">
                <p className="text-black/90">
                  Not just for those with capital, but for those with care. We
                  believe energy is not a commodity. It is a right, a
                  relationship, and a responsibility.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-8">
              Meet our Team
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden flex items-center justify-center mx-auto">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={96}
                        height={96}
                        className="object-cover w-24 h-24"
                      />
                    </div>
                  </div>
                  <p className="text-black font-bold mt-2">{member.name}</p>
                  <p className="text-black text-base">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-8">
              Contact us
            </h2>
            <p className="text-lg text-gray-600 mb-12">
              Get in touch with us for feedback, questions, or collaboration
              opportunities.
            </p>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold text-gray-700 mb-2 text-left"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-gray-700 mb-2 text-left"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-bold text-gray-700 mb-2 text-left"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-bold text-gray-700 mb-2 text-left"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Tell us more about your inquiry..."
                ></textarea>
              </div>

              <Button
                type="submit"
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 text-lg rounded-lg w-full md:w-auto"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="relative">
                <Image
                  src="/logo-2.png"
                  alt="Autarky Logo"
                  width={40}
                  height={40}
                />
              </div>
              <span className="text-lg font-bold">Autarky</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Autarky. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
