import { OpenRouter } from '@openrouter/sdk';
import 'dotenv/config';

async function main() {
  try {
    const openRouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const response = await openRouter.chat.send({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: '1,2,3,4,5,....',
        },
      ],
      provider: {
        order: ['deepinfra/fp4']
      },
      stream: false,
    });

    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
