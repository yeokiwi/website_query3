import axios from 'axios';

const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';

export async function webSearch(query, freshness) {
  const params = {
    q: query,
    count: 5,
    text_decorations: false,
  };
  if (freshness) {
    params.freshness = freshness;
  }

  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip',
    'X-Subscription-Token': process.env.BRAVE_API_KEY,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.get(BRAVE_API_URL, { headers, params });
      const results = response.data?.web?.results || [];
      return results.map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description,
      }));
    } catch (err) {
      if (err.response?.status === 429 && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      console.warn(`Brave Search error: ${err.message}`);
      return [];
    }
  }

  return [];
}
