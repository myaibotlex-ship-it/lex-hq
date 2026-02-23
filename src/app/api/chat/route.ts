import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.CLAWDBOT_GATEWAY_URL || "http://localhost:3001";
const SESSION_KEY = process.env.CLAWDBOT_SESSION_KEY || "telegram:1069873058";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Forward to Clawdbot Gateway
    const gatewayUrl = `${GATEWAY_URL}/v1/sessions/${encodeURIComponent(SESSION_KEY)}/messages`;

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
        source: "bridge-web",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Chat API] Gateway error:", response.status, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Session not found. Make sure the Gateway is running." },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { error: `Gateway error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    
    // The gateway returns the assistant's response
    // Adjust based on actual gateway response format
    const assistantResponse = data.content || data.response || data.message || JSON.stringify(data);

    return NextResponse.json({
      response: assistantResponse,
      messageId: data.id || null,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Cannot connect to Gateway. Is it running on localhost:3001?" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
