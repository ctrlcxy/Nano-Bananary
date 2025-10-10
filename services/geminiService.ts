
import type { GeneratedContent } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const OPENROUTER_API_KEY = process.env.API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

async function requestImageGeneration(content: any[]): Promise<GeneratedContent> {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '',
        'X-Title': 'Nano Bananary'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenRouter API Response:", JSON.stringify(data, null, 2));

    const result: GeneratedContent = { imageUrl: null, text: null };
    const message = data.choices?.[0]?.message;
    const messageContent = message?.content;
    const messageImages = message?.images;

    if (messageImages && Array.isArray(messageImages) && messageImages.length > 0) {
      const imageData = messageImages[0];
      if (imageData.type === 'image_url' && imageData.image_url?.url) {
        result.imageUrl = imageData.image_url.url;
      }
    }

    if (typeof messageContent === 'string') {
      result.text = messageContent;
    }

    if (!result.imageUrl && Array.isArray(messageContent)) {
      for (const part of messageContent) {
        if (part.type === 'image_url' && part.image_url?.url) {
          result.imageUrl = part.image_url.url;
        } else if (part.type === 'text' && part.text) {
          result.text = (result.text ? result.text + "\n" : "") + part.text;
        }
      }
    }

    if (!result.imageUrl && typeof messageContent === 'string') {
      const base64Match = messageContent.match(/data:image\/[^;]+;base64,([^\s"']+)/);
      const urlMatch = messageContent.match(/(https?:\/\/[^\s"']+\.(png|jpg|jpeg|gif|webp))/i);

      if (base64Match) {
        result.imageUrl = base64Match[0];
      } else if (urlMatch) {
        result.imageUrl = urlMatch[0];
      }
    }

    if (!result.imageUrl) {
      let errorMessage;
      if (result.text) {
        errorMessage = `The model responded: "${result.text}"`;
      } else {
        const finishReason = data.choices?.[0]?.finish_reason;
        errorMessage = "The model did not return an image. It might have refused the request. Please try a different image or prompt.";

        if (finishReason === 'content_filter') {
          errorMessage = `The request was blocked for safety reasons. Please modify your prompt or image.`;
        }

        console.error("Response structure:", data);
        errorMessage += ` (Response: ${JSON.stringify(data.choices?.[0]?.message)})`;
      }
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    if (error instanceof Error) {
      let errorMessage = error.message;
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.message) {
          if (parsedError.error.code === 429) {
            errorMessage = "You've likely exceeded the request limit. Please wait a moment before trying again.";
          } else if (parsedError.error.code === 500) {
            errorMessage = "An unexpected server error occurred. This might be a temporary issue. Please try again in a few moments.";
          } else {
            errorMessage = parsedError.error.message;
          }
        }
      } catch (e) {}
      throw new Error(errorMessage);
    }
    throw new Error("An unknown error occurred while communicating with the API.");
  }
}

export async function editImage(
    base64ImageData: string,
    mimeType: string,
    prompt: string,
    maskBase64: string | null,
    secondaryImage: { base64: string; mimeType: string } | null
): Promise<GeneratedContent> {
  let fullPrompt = prompt;
  const content: any[] = [];

  content.push({
    type: "image_url",
    image_url: {
      url: `data:${mimeType};base64,${base64ImageData}`
    }
  });

  if (maskBase64) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${maskBase64}`
      }
    });
    fullPrompt = `Apply the following instruction only to the masked area of the image: "${prompt}". Preserve the unmasked area.`;
  }

  if (secondaryImage) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${secondaryImage.mimeType};base64,${secondaryImage.base64}`
      }
    });
  }

  content.push({
    type: "text",
    text: fullPrompt
  });

  return requestImageGeneration(content);
}

export async function generateImageFromPrompt(prompt: string): Promise<GeneratedContent> {
  const content = [
    {
      type: "text",
      text: prompt
    }
  ];

  return requestImageGeneration(content);
}
