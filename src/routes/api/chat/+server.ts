import { streamText, convertToModelMessages, stepCountIs, type InferUITools, type UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { PRIVATE_GEMINI_API_KEY, PRIVATE_OPENAI_API_KEY, USER_ID, COMPOSIO_API_KEY, FIRST_NAME } from '$env/static/private';
import type { RequestHandler } from './$types';
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

const composio = new Composio({ provider: new VercelProvider(), apiKey: COMPOSIO_API_KEY });
const google = createGoogleGenerativeAI({ apiKey: PRIVATE_GEMINI_API_KEY });
const openai = createOpenAI({ apiKey: PRIVATE_OPENAI_API_KEY });

const session = await composio.create(USER_ID);
const tools = await session.tools();

export const POST: RequestHandler = async ({ request }) => {
    const { messages }: { messages: UIMessage[] } = await request.json();

    // Essayer Gemini d'abord, basculer sur OpenAI si nécessaire
    let result;
    try {
        result = streamText({
            model: google('gemini-1.5-flash'),
            messages: await convertToModelMessages(messages),
            stopWhen: stepCountIs(10),
            tools
        });
    } catch (error) {
        console.error("Gemini failed, falling back to OpenAI", error);
        result = streamText({
            model: openai('gpt-4o-mini'),
            messages: await convertToModelMessages(messages),
            stopWhen: stepCountIs(10),
            tools
        });
    }

    return result.toUIMessageStreamResponse();
};
