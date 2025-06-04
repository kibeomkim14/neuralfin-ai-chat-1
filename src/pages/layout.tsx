import type React from "react"
import type { Metadata } from "next"
import "../src/App.scss"

export const metadata: Metadata = {
  title: "NEURALFIN.AI - Financial Advisor",
  description: "AI-powered financial advisory chat interface",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
