import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import sharp from "sharp";
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
  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const imageWidth = metadata.width || 800;
  const imageHeight = metadata.height || 600;
  
  // Calculate text size based on image dimensions
  const fontSize = Math.floor(Math.min(imageWidth, imageHeight) / 6);
  
  // Create SVG text with white text and black stroke
  const svg = `
    <svg width="${imageWidth}" height="${imageHeight}">
      <text x="50%" y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="normal"
        fill="white" 
        stroke="black" 
        stroke-width="${fontSize / 25}"
        style="paint-order: stroke fill;">
        LGTMだワン！
      </text>
    </svg>
  `;
  
  // Composite the text overlay onto the image
  const outputBuffer = await sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svg),
        gravity: 'center'
      }
    ])
    .png()
    .toBuffer();
  
  return outputBuffer;
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