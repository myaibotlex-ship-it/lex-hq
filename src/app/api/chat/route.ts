import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.CLAWDBOT_GATEWAY_URL || "http://localhost:18789";
const GATEWAY_TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || "";

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

    // Use OpenAI-compatible chat completions endpoint
    const gatewayUrl = `${GATEWAY_URL}/v1/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (GATEWAY_TOKEN) {
      headers["Authorization"] = `Bearer ${GATEWAY_TOKEN}`;
    }

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "clawdbot:main",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        user: "bridge-web-dan",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Chat API] Gateway error:", response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Unauthorized. Check CLAWDBOT_GATEWAY_TOKEN." },
          { status: 502 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Chat endpoint not enabled. Enable gateway.http.endpoints.chatCompletions." },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { error: `Gateway error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    
    // OpenAI format: data.choices[0].message.content
    const assistantResponse = data.choices?.[0]?.message?.content || 
                              data.content || 
                              data.response || 
                              "No response received.";

    return NextResponse.json({
      response: assistantResponse,
      messageId: data.id || null,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Cannot connect to Gateway. Is it running?" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
