import { OpenRouter } from '@openrouter/sdk';
import 'dotenv/config';

async function main() {
  try {
    const openRouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Contoh input pengguna (ganti dengan input aktual)
    const userMessage = 'hai bagaimana kabarmu?';

    const response = await openRouter.chat.send({
      model: 'meta-llama/llama-3.1-8b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an intent detection AI. Analyze the user message and respond only with a valid JSON object containing "intent" (string), "confidence" (number between 0 and 1), and "entities" (array of key-value pairs, e.g., [{"type": "product", "value": "laptop"}]). Possible intents: greeting, question, statement, command, etc.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      provider: {
        order: ['nebius/fp8']
      },
      stream: false,
    });

    const content = response.choices[0].message.content;
    console.log('Raw response:', content);

    // Bersihkan markdown code block jika ada
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();

    // Parse sebagai JSON
    const intentData = JSON.parse(cleanedContent);
    console.log('Parsed intent:', intentData);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
