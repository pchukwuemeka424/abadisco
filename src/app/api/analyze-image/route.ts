import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "OpenAI API key not set",
        suggestedTags: ["product", "item", "merchandise"],
        productType: "Generic Product",
        qualityScore: 5
      }, { status: 200 }); // Return a 200 with default values instead of 500
    }

    console.log("Using OpenAI API with key starting with:", apiKey.substring(0, 5) + "...");

    try {
      // Convert the file to a Buffer
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Initialize OpenAI client with the API key
      const openai = new OpenAI({ apiKey });
      
      // First try with a standard text model as a fallback option
      try {
        // First attempt with Vision API
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "system",
                content: "You are an AI assistant that analyzes product images for an e-commerce marketplace in Nigeria. Provide detailed analysis including product type, colors, materials, suggested tags, and any text visible in the image."
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Analyze this product image and return a JSON object with the following fields: productType, colors, materials, suggestedTags (array), visibleText (if any), and qualityScore (1-10)" },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${imageFile.type};base64,${buffer.toString('base64')}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 800,
            response_format: { type: "json_object" }
          });
          
          // Extract the JSON result
          const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
          return NextResponse.json(analysisResult);
        } catch (visionError: any) {
          console.error("Vision API error:", visionError);
          
          // Create a simpler analysis without vision capabilities
          return NextResponse.json({
            productType: "Generic Product",
            suggestedTags: ["product", "item", "merchandise", "sale", "new"],
            colors: "Unknown (image analysis unavailable)",
            materials: "Unknown (image analysis unavailable)",
            qualityScore: 7,
            analysisNote: "Basic analysis provided - Vision API access issue"
          });
        }
      } catch (modelError: any) {
        console.error("Model error:", modelError);
        
        // Return a basic response
        return NextResponse.json({
          productType: "Generic Product",
          suggestedTags: ["product", "sale"],
          qualityScore: 5,
          analysisNote: "Limited analysis - OpenAI model unavailable"
        });
      }
    } catch (openaiError: any) {
      console.error("OpenAI API Error:", openaiError);
      
      // Return a valid response with default values instead of an error
      return NextResponse.json({
        productType: "Generic Product",
        suggestedTags: ["product", "item", "merchandise"],
        qualityScore: 5,
        analysisNote: "Default values - OpenAI API error"
      });
    }
  } catch (error: any) {
    console.error('General error analyzing image:', error);
    
    // Return a valid response with default values instead of an error
    return NextResponse.json({
      productType: "Generic Product",
      suggestedTags: ["product", "item", "merchandise"],
      qualityScore: 5,
      analysisNote: "Default values - Server error"
    });
  }
}