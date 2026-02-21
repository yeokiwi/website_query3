export const tools = [
  {
    name: 'web_search',
    description:
      'Search the web using Brave Search. Use this to find recent news, announcements, or changes related to a website or company.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            "The search query. Be specific and include the site name + 'recent changes', 'new features', 'announcements', etc.",
        },
        freshness: {
          type: 'string',
          enum: ['pd', 'pw', 'pm'],
          description:
            'Filter results by recency: pd=past day, pw=past week, pm=past month',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch_url',
    description:
      'Fetch the HTML content of a URL and extract its readable text. Use this to read the homepage, blog, changelog, or any page directly.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to fetch',
        },
        selector: {
          type: 'string',
          description:
            "Optional CSS selector to extract only a specific section of the page (e.g. 'article', '.changelog', 'main')",
        },
      },
      required: ['url'],
    },
  },
];
