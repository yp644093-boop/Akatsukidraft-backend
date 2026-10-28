import axios from 'axios';
import config from '../config/env.js';

const SYSTEM_PROMPT = `You are a helpful editorial assistant.
Improve the user's article draft for clarity, grammar, and engagement.
Preserve the original meaning and facts.

Respond with ONLY a valid JSON object in this format:
{
  "title": "improved title",
  "description": "short 1-2 sentence summary",
  "content": "improved content in markdown",
  "category": "appropriate category"
}`;

// Call OpenRouter to improve post content
export const improveContentWithAI = async ({ title, description = '', content, category = 'General' }) => {
  const apiKey = config.openRouter.apiKey;
  const model = config.openRouter.model;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in .env');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('Cannot improve empty content');
  }

  const userPrompt = `Title: ${title}\nCategory: ${category}\nDescription: ${description}\n\nContent:\n${content}`;

  const modelsToTry = [
    model,
    'recursive/flint-v1.0:free',
    'nvidia/nemotron-3.5-lightning:free'
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let response;
  let lastError;

  for (const currentModel of modelsToTry) {
    try {
      response = await axios.post(
        `${config.openRouter.baseUrl}/chat/completions`,
        {
          model: currentModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.5,
          max_tokens: 4000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 45000,
        }
      );
      if (response?.data?.choices?.[0]?.message?.content) {
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!response?.data?.choices?.[0]?.message?.content) {
    const errorMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Failed to get response';
    throw new Error(`OpenRouter Error: ${errorMsg}`);
  }

  const rawText = response.data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('AI returned an empty response');

  // Strip markdown code fences if present
  let cleanText = rawText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const parsed = JSON.parse(cleanText);

  return {
    title: parsed.title || title,
    description: parsed.description || description,
    content: parsed.content || content,
    category: parsed.category || category,
  };
};

export default { improveContentWithAI };
