import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  try {
    console.log("Chat API called")

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not found")
      return new Response("API key not configured", { status: 500 })
    }

    const { messages } = await req.json()
    console.log("Messages received:", messages)

    const result = await streamText({
      model: openai("gpt-4o"),
      messages,
      system: `You are Sandra, a professional financial advisor from DL Family Office. You provide expert financial advice with a focus on:
      - Portfolio management and asset allocation
      - Retirement planning strategies
      - Risk management and diversification
      - Investment opportunities and market analysis
      - Tax-efficient investing
      - Estate planning considerations
      
      Keep your responses informative yet conversational. Always consider the user's risk tolerance and investment timeline when providing advice. Provide specific, actionable recommendations when possible.`,
      maxTokens: 1000,
    })

    console.log("OpenAI response generated successfully")
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
