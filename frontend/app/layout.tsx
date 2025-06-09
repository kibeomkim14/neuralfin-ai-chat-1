import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "../src/App.scss"

export const metadata: Metadata = {
  title: "Neuralfin.AI - AI Advisor Demo",
  description: "AI-powered financial advisory chat interface",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Favicon.png" />
        <Script src="/sdk/xiaoiceRTC1.0.7.js" strategy="beforeInteractive" />
        <Script src="/sdk/xiaoiceASR1.0.6.js" strategy="beforeInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.2/axios.min.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  )
}
