import Anthropic from '@anthropic-ai/sdk';
import { tools } from '../tools/toolDefinitions.js';
import { webSearch } from './braveSearch.js';
import { fetchUrl } from './urlFetcher.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a web research assistant specializing in detecting recent changes on websites.
You have access to tools to search the web and fetch URLs.
Your goal is to determine what has changed on a given website in the last 30 days.
Be thorough — check the main page, blog/news sections, changelog pages, and any relevant search results.
Always distinguish between changes you can CONFIRM (have explicit dates) vs. changes that appear recent based on context.`;

function buildUserPrompt(url) {
  const currentDate = new Date().toISOString().split('T')[0];
  return `I need you to examine ${url} and focus specifically on:
- What's new or changed in the last 30 days?
- Any announcements, blog posts, or news from the past month
- Updates to products, services, or features
- Changes to pricing, terms of service, or policies

Please distinguish between what you can confirm as recent vs. what appears to be recent based on dates or context.

Today's date is ${currentDate}.`;
}

async function executeTool(name, input) {
  switch (name) {
    case 'web_search': {
      const results = await webSearch(input.query, input.freshness);
      return JSON.stringify(results);
    }
    case 'fetch_url': {
      const result = await fetchUrl(input.url, input.selector);
      return result.text;
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export async function runAgent(url, emit, signal) {
  const maxIterations = parseInt(process.env.MAX_AGENT_ITERATIONS || '10', 10);
  let iteration = 0;

  const messages = [
    { role: 'user', content: buildUserPrompt(url) },
  ];

  while (iteration < maxIterations) {
    if (signal?.aborted) return;
    iteration++;

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    let fullResponse = null;

    for await (const event of stream) {
      if (signal?.aborted) {
        stream.controller.abort();
        return;
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          emit({ type: 'text_delta', delta: event.delta.text });
        }
      }
    }

    fullResponse = await stream.finalMessage();

    if (fullResponse.stop_reason === 'end_turn') {
      emit({ type: 'done' });
      return;
    }

    if (fullResponse.stop_reason === 'tool_use') {
      const toolUseBlocks = fullResponse.content.filter(
        (block) => block.type === 'tool_use'
      );

      messages.push({ role: 'assistant', content: fullResponse.content });

      const toolResults = [];

      for (const toolBlock of toolUseBlocks) {
        if (signal?.aborted) return;

        emit({
          type: 'tool_start',
          tool: toolBlock.name,
          input: toolBlock.input,
        });

        let result;
        try {
          result = await executeTool(toolBlock.name, toolBlock.input);
        } catch (err) {
          result = JSON.stringify({ error: err.message });
        }

        const summary =
          toolBlock.name === 'web_search'
            ? `${JSON.parse(result).length || 0} results returned`
            : `Fetched ${result.length} chars`;

        emit({
          type: 'tool_end',
          tool: toolBlock.name,
          result_summary: summary,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: result,
        });
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop reason
    emit({ type: 'done' });
    return;
  }

  // Hit max iterations
  emit({
    type: 'text_delta',
    delta: '\n\n---\n*Agent reached maximum number of tool calls. Analysis may be incomplete.*',
  });
  emit({ type: 'done' });
}
