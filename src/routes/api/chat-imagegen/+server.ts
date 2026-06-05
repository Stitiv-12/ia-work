import { streamText, convertToModelMessages, stepCountIs, type InferUITools, type UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { PRIVATE_GEMINI_API_KEY, USER_ID, COMPOSIO_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
const composio = new Composio({ provider: new VercelProvider(), apiKey: COMPOSIO_API_KEY });
const google = createGoogleGenerativeAI({ apiKey: PRIVATE_GEMINI_API_KEY });
// Create a tool router session
const session = await composio.create(USER_ID);
const tools = await session.tools();

/*const stream = await streamText({
	model: google('gemini-2.5-flash'),
	prompt: "Star the composiohq/composio repo on GitHub",
	stopWhen: stepCountIs(10),
	tools,
});

for await (const textPart of stream.textStream) {
	process.stdout.write(textPart);
}*/

export type ChatTools = InferUITools<typeof tools>;

export const POST: RequestHandler = async ({ request }) => {
	const { messages }: { messages: UIMessage[] } = await request.json();

	const result = streamText({
		model: google('gemini-3.1-flash-lite'),
		messages: await convertToModelMessages(messages),
		stopWhen: stepCountIs(10),
		tools
	});

	return result.toUIMessageStreamResponse();
};

