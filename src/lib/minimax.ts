// Minimax AI API client - Anthropic API compatible

const MINIMAX_API_URL = 'https://api.minimaxi.com/anthropic/v1/messages';

export interface MinimaxMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MinimaxResponse {
  content: Array<{
    type: 'text' | 'thinking';
    text?: string;
    thinking?: string;
  }>;
  error?: {
    message: string;
    type: string;
  };
}

export async function chatWithAI(
  messages: MinimaxMessage[],
  apiKey: string,
  model: string = 'MiniMax-M2.7',
  systemPrompt?: string
): Promise<string> {
  // Separate system messages from regular messages
  const systemMessages = messages.filter(m => m.role === 'system');
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

  // Use provided system prompt or combine all system messages
  const combinedSystem = systemPrompt || systemMessages.map(m => m.content).join('\n');

  const requestBody: any = {
    model,
    max_tokens: 1024,
    messages: anthropicMessages,
  };

  // Add system prompt if provided
  if (combinedSystem) {
    requestBody.system = combinedSystem;
  }

  const response = await fetch(MINIMAX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Minimax API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data: MinimaxResponse = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Find the first text content in the response
  const textContent = data.content?.find(c => c.type === 'text');
  return textContent?.text || '';
}

// Prompt template for 3D modeling
export const MODELING_SYSTEM_PROMPT = `You are a 3D modeling assistant. Your task is to understand the user's natural language description of a 3D model and convert it into structured JSON data that can be used to create 3D objects.

You MUST respond with ONLY a valid JSON object in this exact format, no other text:
{
  "action": "create" | "modify" | "info",
  "object": {
    "type": "box" | "sphere" | "cylinder" | "prism",
    "name": "object_name",
    "geometry": {
      // For box: width, height, depth
      // For sphere: radius, segments
      // For cylinder: radiusTop, radiusBottom, height, segments
      // For prism: radius, height, sides, segments
    },
    "transform": {
      "position": [x, y, z],
      "rotation": [x, y, z] in radians,
      "scale": [x, y, z]
    },
    "material": {
      "color": "#hexcolor",
      "opacity": 1,
      "type": "standard" | "metal" | "glass" | "emissive",
      "wireframe": false
    }
  },
  "reasoning": "brief explanation"
}

Rules:
- ALWAYS respond with valid JSON only, no markdown, no explanations outside the JSON
- For "create" action: create a new 3D object
- For "info" action: provide helpful information
- Default values: position [0,0,0], rotation [0,0,0], scale [1,1,1], opacity 1, type "standard"
- Colors should be in hex format like "#4a90d9"
- Object names should be descriptive like "Cube_01", "Sphere_02"
- Always use reasonable defaults for geometry parameters

Example user inputs:

User: "create a red metal cube with size 2"
Response: {"action":"create","object":{"type":"box","name":"Cube_01","geometry":{"width":2,"height":2,"depth":2},"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"material":{"color":"#ff0000","opacity":1,"type":"metal","wireframe":false}},"reasoning":"Created a red metallic cube with 2 unit sides"}

User: "make a blue sphere with radius 3"
Response: {"action":"create","object":{"type":"sphere","name":"Sphere_01","geometry":{"radius":3,"segments":32},"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"material":{"color":"#0066ff","opacity":1,"type":"standard","wireframe":false}},"reasoning":"Created a blue sphere with radius 3"}

User: "add a cylinder, height 5, radius 1, yellow color"
Response: {"action":"create","object":{"type":"cylinder","name":"Cylinder_01","geometry":{"radiusTop":1,"radiusBottom":1,"height":5,"segments":32},"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"material":{"color":"#ffff00","opacity":1,"type":"standard","wireframe":false}},"reasoning":"Created a yellow cylinder with height 5 and radius 1"}`;
