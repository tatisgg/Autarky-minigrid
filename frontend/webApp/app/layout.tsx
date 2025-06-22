
import type { Metadata } from 'next'

import './globals.css'
import { ReactQueryProvider } from "@/lib/react-query"


export const metadata: Metadata = {
  title:
    "Autarky - an open-source tool for designing and operating solar mini-grids and swarm grids considering uncertainties",
  description:
    "Welcome to Autarky - an open-source tool for designing and operating solar mini-grids and swarm grids considering uncertainties",
};



export default function RootLayout({
  
  children,
}: Readonly<{
  children: React.ReactNode
}>) {


  return (
    <html lang="en">
      <body> <ReactQueryProvider>{children}</ReactQueryProvider></body>
    </html>
  )
}
