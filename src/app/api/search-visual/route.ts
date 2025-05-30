import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/supabaseClient';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const limit = Number(formData.get('limit')) || 10;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert the file to a Buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get image embedding from OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: await generateImageDescription(buffer, imageFile.type),
      encoding_format: "float",
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Query the database for similar products
    // Note: This assumes you have a 'products' table with an 'embedding' column
    // You would need to set up a PostgreSQL function to calculate vector similarity
    
    // For now, let's simulate by getting products and adding a random similarity score
    const { data: products, error } = await supabase
      .from('products')
      .select('*, businesses(name, id, logo_url)') 
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    // In a real implementation, you would use embedding similarity
    // Here we're just adding random similarity scores as a placeholder
    const results = products.map(product => ({
      ...product,
      similarity: Math.random() // Placeholder for actual embedding similarity
    })).sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({ 
      results,
      message: "Note: This is a demonstration with random similarity scores. For production, you'll need to implement proper vector similarity search."
    });
  } catch (error: any) {
    console.error('Error in visual search:', error);
    return NextResponse.json(
      { error: 'An error occurred during visual search', details: error.message }, 
      { status: 500 }
    );
  }
}

// Helper function to generate a description of an image
async function generateImageDescription(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this product image in detail to use for similarity search" },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "Product image";
  } catch (error) {
    console.error("Error generating image description:", error);
    return "Product image"; // Fallback description
  }
}