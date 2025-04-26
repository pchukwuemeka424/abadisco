import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not set" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates business profile descriptions." },
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
    });
    const generatedText = completion.choices?.[0]?.message?.content || "";
    return NextResponse.json({ generatedText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate text" }, { status: 500 });
  }
}
