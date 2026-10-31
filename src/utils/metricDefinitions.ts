import { DefinitionData } from '../types';

export function extractDefinitionQuery(query: string): string | null {
  if (!query) return null;
  const trimmed = query.trim().replace(/[?!.,;]+$/g, '').trim();
  const lower = trimmed.toLowerCase();

  // "what is bounce rate", "what is a conversion rate", "what is the retention rate"
  const whatIsMatch = lower.match(/^what(?:'s|\s+is)\s+(?:a\s+|an\s+|the\s+)?(.+)$/i);
  if (whatIsMatch && whatIsMatch[1]) {
    return whatIsMatch[1].trim();
  }

  // "what does bounce rate mean", "what do conversions mean"
  const whatMeanMatch = lower.match(/^what\s+(?:does|do)\s+(?:a\s+|an\s+|the\s+)?(.+?)\s+mean$/i);
  if (whatMeanMatch && whatMeanMatch[1]) {
    return whatMeanMatch[1].trim();
  }

  // "how is bounce rate calculated / measured / defined"
  const howCalcMatch = lower.match(
    /^how\s+is\s+(?:a\s+|an\s+|the\s+)?(.+?)\s+(?:calculated|measured|defined)$/i
  );
  if (howCalcMatch && howCalcMatch[1]) {
    return howCalcMatch[1].trim();
  }

  // "explain bounce rate", "define bounce rate", "definition of bounce rate"
  const explainMatch = lower.match(
    /^(?:explain|define|definition\s+of)\s+(?:a\s+|an\s+|the\s+)?(.+)$/i
  );
  if (explainMatch && explainMatch[1]) {
    return explainMatch[1].trim();
  }

  // "tell me about bounce rate"
  const tellMatch = lower.match(/^tell\s+me\s+about\s+(?:a\s+|an\s+|the\s+)?(.+)$/i);
  if (tellMatch && tellMatch[1]) {
    return tellMatch[1].trim();
  }

  return null;
}

const DEFINITIONS_KNOWLEDGE_BASE: Record<
  string,
  { metricName: string; explanation: string; calculationFormula?: string; suggestedGoals: string[] }
> = {
  'bounce rate': {
    metricName: 'Bounce Rate',
    explanation:
      'Bounce rate measures the percentage of single-interaction sessions where visitors leave without engaging further. In modern Google Analytics 4 (GA4), it is formally the exact inverse of Engaged Session Rate (sessions lasting under 10 seconds, with no conversion events, and fewer than 2 page views).',
    calculationFormula: 'Single-page non-engaged sessions divided by total sessions × 100%',
    suggestedGoals: [
      'Reduce landing page bounce rate by improving headline relevance and page load speed',
      'Identify and fix high bounce rate drop-off steps in the checkout funnel',
    ],
  },
  'conversion rate': {
    metricName: 'Conversion Rate',
    explanation:
      'Conversion rate is the proportion of total sessions or unique users who complete a predefined macro-conversion or primary business goal (such as placing an order, booking a demo, or completing sign-up).',
    calculationFormula: 'Total conversions divided by total eligible sessions or visitors × 100%',
    suggestedGoals: [
      'Increase checkout conversion rate by reducing payment form friction',
      'Improve lead generation form conversion rate on B2B product landing pages',
    ],
  },
  'churn rate': {
    metricName: 'Churn Rate',
    explanation:
      'Churn rate measures the percentage of subscribers or recurring customers who discontinue or cancel their subscription during a specified timeframe.',
    calculationFormula: 'Users who canceled during period divided by active users at start of period × 100%',
    suggestedGoals: [
      'Reduce 30-day subscriber churn by measuring feature adoption and product onboarding',
      'Track cancellation survey reasons and account downgrade triggers',
    ],
  },
  'retention rate': {
    metricName: 'Retention Rate',
    explanation:
      'Retention rate calculates the percentage of users who return to your web app or mobile application across specific intervals (such as Day 1, Day 7, or Day 30) after their initial acquisition.',
    calculationFormula: 'Users active in cohort period divided by total users acquired in cohort × 100%',
    suggestedGoals: [
      'Improve 7-day mobile app user retention through interactive onboarding checklists',
      'Track 60-day repeat purchase retention rate for first-time e-commerce buyers',
    ],
  },
  'cart abandonment rate': {
    metricName: 'Cart Abandonment Rate',
    explanation:
      'Cart abandonment rate tracks the percentage of shoppers who add at least one item to their virtual shopping cart but leave the site without finishing the transaction.',
    calculationFormula: '1 - (Completed purchases divided by carts created) × 100%',
    suggestedGoals: [
      'Reduce cart abandonment rate by streamlining guest checkout and shipping cost clarity',
      'Track checkout step drop-offs between shipping information and payment submit',
    ],
  },
  'customer acquisition cost': {
    metricName: 'Customer Acquisition Cost (CAC)',
    explanation:
      'Customer Acquisition Cost is the aggregate marketing and advertising spend required to convert one new paying customer over a given measurement window.',
    calculationFormula: 'Total marketing & sales acquisition costs divided by new customers acquired',
    suggestedGoals: [
      'Measure campaign attribution to lower blended customer acquisition cost',
      'Track organic vs paid search conversion efficiency to optimize ad spend',
    ],
  },
  cac: {
    metricName: 'Customer Acquisition Cost (CAC)',
    explanation:
      'Customer Acquisition Cost is the aggregate marketing and advertising spend required to convert one new paying customer over a given measurement window.',
    calculationFormula: 'Total marketing & sales acquisition costs divided by new customers acquired',
    suggestedGoals: [
      'Measure campaign attribution to lower blended customer acquisition cost',
      'Track organic vs paid search conversion efficiency to optimize ad spend',
    ],
  },
  'customer lifetime value': {
    metricName: 'Customer Lifetime Value (LTV)',
    explanation:
      'Customer Lifetime Value estimates the total net gross profit or revenue a customer generates throughout their entire relationship with your company.',
    calculationFormula: 'Average Purchase Value × Purchase Frequency × Average Customer Lifespan',
    suggestedGoals: [
      'Increase customer lifetime value by measuring repeat order cadence and replenishment reminders',
      'Track subscription plan tier upgrade rates over a 12-month customer lifecycle',
    ],
  },
  ltv: {
    metricName: 'Customer Lifetime Value (LTV)',
    explanation:
      'Customer Lifetime Value estimates the total net gross profit or revenue a customer generates throughout their entire relationship with your company.',
    calculationFormula: 'Average Purchase Value × Purchase Frequency × Average Customer Lifespan',
    suggestedGoals: [
      'Increase customer lifetime value by measuring repeat order cadence and replenishment reminders',
      'Track subscription plan tier upgrade rates over a 12-month customer lifecycle',
    ],
  },
  'average order value': {
    metricName: 'Average Order Value (AOV)',
    explanation:
      'Average Order Value is the average monetary revenue spent by customers each time an order is placed on an e-commerce platform.',
    calculationFormula: 'Total e-commerce revenue divided by total completed orders',
    suggestedGoals: [
      'Increase average order value by tracking cross-sell product recommendation clicks',
      'Measure free shipping tier threshold progress bar interactions during checkout',
    ],
  },
  aov: {
    metricName: 'Average Order Value (AOV)',
    explanation:
      'Average Order Value is the average monetary revenue spent by customers each time an order is placed on an e-commerce platform.',
    calculationFormula: 'Total e-commerce revenue divided by total completed orders',
    suggestedGoals: [
      'Increase average order value by tracking cross-sell product recommendation clicks',
      'Measure free shipping tier threshold progress bar interactions during checkout',
    ],
  },
  'engagement rate': {
    metricName: 'Engagement Rate',
    explanation:
      'In GA4, Engagement Rate is the percentage of sessions that qualify as engaged: lasting 10 seconds or longer, having 2 or more pageviews, or triggering at least 1 conversion event.',
    calculationFormula: 'Engaged sessions divided by total sessions × 100%',
    suggestedGoals: [
      'Increase engaged session rate across blog articles and educational resource hubs',
      'Track video playback progress and interactive interactive tool engagement depth',
    ],
  },
  'click through rate': {
    metricName: 'Click-Through Rate (CTR)',
    explanation:
      'Click-Through Rate is the percentage of people who see a call to action, link, or advertisement and proceed to click on it.',
    calculationFormula: 'Total clicks divided by total impressions × 100%',
    suggestedGoals: [
      'Improve homepage hero banner call-to-action click-through rate',
      'Track product recommendation carousel click-through rate',
    ],
  },
  ctr: {
    metricName: 'Click-Through Rate (CTR)',
    explanation:
      'Click-Through Rate is the percentage of people who see a call to action, link, or advertisement and proceed to click on it.',
    calculationFormula: 'Total clicks divided by total impressions × 100%',
    suggestedGoals: [
      'Improve homepage hero banner call-to-action click-through rate',
      'Track product recommendation carousel click-through rate',
    ],
  },
  'exit rate': {
    metricName: 'Exit Rate',
    explanation:
      'Exit rate represents the percentage of views on a specific page that were the final view in that user session. Unlike bounce rate, it accounts for sessions that viewed multiple pages beforehand.',
    calculationFormula: 'Exits from page divided by total page views of that page × 100%',
    suggestedGoals: [
      'Reduce exit rate on multi-step demo booking forms',
      'Identify unexpected high-exit pages in the checkout funnel',
    ],
  },
  dau: {
    metricName: 'Daily Active Users (DAU)',
    explanation:
      'Daily Active Users counts the number of unique individual users who engage with an application or website during a 24-hour day.',
    calculationFormula: 'Count of unique active user IDs logging in or performing an event in 24 hours',
    suggestedGoals: [
      'Increase daily active users by tracking core feature adoption and push notification opens',
      'Measure DAU to MAU stickiness ratio across mobile and web platforms',
    ],
  },
  mau: {
    metricName: 'Monthly Active Users (MAU)',
    explanation:
      'Monthly Active Users measures the number of unique visitors who interact with a product over a 30-day calendar period.',
    calculationFormula: 'Count of unique active user IDs over a rolling 30-day window',
    suggestedGoals: [
      'Improve monthly active user growth through re-engagement email campaigns',
      'Track feature discovery and return visit frequency',
    ],
  },
};

export function getMetricDefinition(query: string): DefinitionData | null {
  const extracted = extractDefinitionQuery(query);
  if (!extracted) return null;

  const normalized = extracted.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
  const defaultPrompt =
    'Turn this metric into an actionable tracking goal: To create a measurement plan, choose a concrete business objective below or enter one above.';

  // Direct match
  if (DEFINITIONS_KNOWLEDGE_BASE[normalized]) {
    return {
      ...DEFINITIONS_KNOWLEDGE_BASE[normalized],
      promptToTurnIntoGoal: defaultPrompt,
    };
  }

  // Substring match in keys
  for (const [key, def] of Object.entries(DEFINITIONS_KNOWLEDGE_BASE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        ...def,
        promptToTurnIntoGoal: defaultPrompt,
      };
    }
  }

  // Formatted fallback for other metrics
  const cleanName = extracted
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    metricName: cleanName,
    explanation: `${cleanName} is a key digital analytics performance indicator used to evaluate user behavior, funnel efficiency, and product health. Tracking it helps uncover friction in your user experience and conversion funnel.`,
    suggestedGoals: [
      `Track and optimize ${extracted} across key user journey touchpoints`,
      `Reduce user drop-offs related to ${extracted} in the conversion funnel`,
    ],
    promptToTurnIntoGoal: defaultPrompt,
  };
}
