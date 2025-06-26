import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Jimp } from "jimp";
import { JimpMime } from "jimp";
import fetch from "node-fetch";
import fs from "fs/promises";
import os from "os";
import path from "path";

const DOG_API_URL = "https://dog.ceo/api/breeds/image/random";

async function fetchRandomDogImage(): Promise<Buffer> {
  const response = await fetch(DOG_API_URL);
  const data = await response.json() as { message: string; status: string };
  
  if (data.status !== "success") {
    throw new Error("Failed to fetch dog image");
  }

  const imageResponse = await fetch(data.message);
  const buffer = await imageResponse.buffer();
  return buffer;
}

async function addLGTMOverlay(imageBuffer: Buffer): Promise<Buffer> {
  const image = await Jimp.read(imageBuffer);
  
  // Calculate text positioning (no background box)
  const imageWidth = image.bitmap.width;
  const imageHeight = image.bitmap.height;
  
  // Draw "LGTM" text using thinner white font
  const letters = {
    L: [
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1]
    ],
    G: [
      [0,1,1,1,1,0],
      [1,1,1,1,1,1],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,0,0,0],
      [1,0,0,1,1,1],
      [1,0,0,1,1,1],
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [0,1,1,1,1,0]
    ],
    T: [
      [1,1,1,1,1,1],
      [1,1,1,1,1,1],
      [0,0,1,1,0,0],
      [0,0,1,1,0,0],
      [0,0,1,1,0,0],
      [0,0,1,1,0,0],
      [0,0,1,1,0,0],
      [0,0,1,1,0,0],
      [0,0,1,1,0,0],
      [0,0,1,1,0,0]
    ],
    M: [
      [1,0,0,0,0,1],
      [1,1,0,0,1,1],
      [1,1,1,1,1,1],
      [1,0,1,1,0,1],
      [1,0,0,0,0,1],
      [1,0,0,0,0,1],
      [1,0,0,0,0,1],
      [1,0,0,0,0,1],
      [1,0,0,0,0,1],
      [1,0,0,0,0,1]
    ]
  };
  
  const letterOrder = ['L', 'G', 'T', 'M'];
  const letterPixelWidth = 6;
  const letterPixelHeight = 10;
  const pixelSize = Math.max(3, Math.floor(Math.min(imageWidth * 0.7 / (letterOrder.length * letterPixelWidth + 9), imageHeight * 0.25 / letterPixelHeight)));
  
  const spacing = pixelSize * 1.5; // Space between letters
  const totalTextWidth = letterOrder.length * letterPixelWidth * pixelSize + (letterOrder.length - 1) * spacing;
  const totalTextHeight = letterPixelHeight * pixelSize;
  
  // Center the text on the image
  const startX = (imageWidth - totalTextWidth) / 2;
  const startY = (imageHeight - totalTextHeight) / 2;
  
  letterOrder.forEach((letter, letterIndex) => {
    const pattern = letters[letter as keyof typeof letters];
    const letterX = startX + letterIndex * (letterPixelWidth * pixelSize + spacing);
    
    pattern.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel === 1) {
          // Draw white pixel with black shadow for better visibility
          for (let px = 0; px < pixelSize; px++) {
            for (let py = 0; py < pixelSize; py++) {
              const pixelX = Math.floor(letterX + colIndex * pixelSize + px);
              const pixelY = Math.floor(startY + rowIndex * pixelSize + py);
              
              if (pixelX >= 0 && pixelX < imageWidth && 
                  pixelY >= 0 && pixelY < imageHeight) {
                // Add subtle black shadow (offset by 1 pixel)
                const shadowX = pixelX + 1;
                const shadowY = pixelY + 1;
                if (shadowX < imageWidth && shadowY < imageHeight) {
                  image.setPixelColor(0x000000AA, shadowX, shadowY); // Semi-transparent black shadow
                }
                // Draw white text
                image.setPixelColor(0xFFFFFFFF, pixelX, pixelY); // White text
              }
            }
          }
        }
      });
    });
  });
  
  return await image.getBuffer(JimpMime.png);
}

const server = new Server(
  {
    name: "lgtm-dog-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_lgtm_dog",
        description: "Generate a dog image with LGTM overlay",
        inputSchema: {
          type: "object",
          properties: {
            outputPath: {
              type: "string",
              description: "Path where the generated image should be saved (optional)",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "generate_lgtm_dog") {
    try {
      const args = request.params.arguments as { outputPath?: string };
      
      const dogImageBuffer = await fetchRandomDogImage();
      const lgtmImageBuffer = await addLGTMOverlay(dogImageBuffer);
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = args.outputPath || path.join(os.homedir(), 'Downloads', `lgtm-dog-${timestamp}.png`);
      
      // Save to temporary location
      await fs.writeFile(filename, lgtmImageBuffer);
      
      return {
        content: [
          {
            type: "text",
            text: `LGTM dog image generated successfully!\n\nImage saved to: ${filename}\n\nYou can open this file to view the image.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating LGTM dog image: ${error}`,
          },
        ],
      };
    }
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LGTM Dog MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});