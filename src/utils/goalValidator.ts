import { extractDefinitionQuery } from './metricDefinitions';
import { GoalIntentCategory } from '../types';

export interface ScopeCheckResult {
  isOutOfScope: boolean;
  message?: string;
  category?: 'coding' | 'ui_ux' | 'high_stakes_strategy' | 'trivia' | 'general';
}

export const OUT_OF_SCOPE_MESSAGE =
  'Invalid Analytics Goal: This tool only creates digital analytics measurement plans. Your query appears to be out of scope (such as coding, UI/UX design, or high-stakes business strategy). Please enter an actionable tracking or business objective (e.g., Increase checkout conversion rate, Track blog reads, Increase signups).';

export interface GoalCheckResult {
  isVague: boolean;
  warningTitle?: string;
  reason?: string;
  clarificationMessage?: string;
  questions?: Array<{
    id: string;
    question: string;
    context: string;
    options: string[];
  }>;
}

export interface GoalClassificationResult {
  category: GoalIntentCategory;
  isOutOfScope: boolean;
  outOfScopeReason?: string;
  isDefinition: boolean;
  definitionQuery?: string;
  isVague: boolean;
  warningTitle?: string;
  reason?: string;
  clarificationMessage?: string;
  questions?: Array<{
    id: string;
    question: string;
    context: string;
    options: string[];
  }>;
}

export function checkGoalScope(goal: string): ScopeCheckResult {
  const trimmed = goal.trim();
  if (!trimmed) {
    return { isOutOfScope: false };
  }

  const lower = trimmed.toLowerCase();

  // 1. High-Stakes Business Strategy, HR / Personnel Decisions, Legal & Medical
  // Examples: 'should we fire our staff', 'how to fire employees', 'layoff workers', 'should we sell the company'
  const isFiringOrLayoff =
    /\b(fire|firing|fired|layoff|layoffs|laying\s*off|terminate|terminating)\s+(our\s+|my\s+|the\s+)?(staff|employees|workers|team|people)\b/i.test(
      trimmed
    ) ||
    /\bshould\s+(we|i)\s+(fire|lay\s*off|terminate|cut)\b/i.test(trimmed) ||
    /\b(how\s+to\s+fire|should\s+i\s+fire|should\s+we\s+fire)\b/i.test(trimmed);

  const isHighStakesLegalOrCorporate =
    /\b(should\s+(we|i)\s+sell\s+(the|our|my)\s+company|declare\s+bankruptcy|file\s+for\s+bankruptcy|lawsuit|sue\s+someone|legal\s+advice)\b/i.test(
      trimmed
    ) ||
    /\b(medical\s+advice|diagnose\s+me|prescribe|cure\s+for\s+cancer)\b/i.test(trimmed);

  if (isFiringOrLayoff || isHighStakesLegalOrCorporate) {
    return {
      isOutOfScope: true,
      category: 'high_stakes_strategy',
      message:
        'Invalid Analytics Goal: This tool only creates digital analytics measurement plans for tracking user behavior. Your query appears to be about high-stakes business strategy or human resources (such as personnel or legal decisions). Please enter a digital analytics tracking objective instead (e.g., Increase signups, Reduce checkout drop-off, Track blog reads).',
    };
  }

  // 2. Explicit tracking or business performance signals that override minor terms
  const analyticsKeywords = [
    'track',
    'tracking',
    'measure',
    'measurement',
    'analytics',
    'kpi',
    'kpis',
    'conversion rate',
    'conversion',
    'conversions',
    'bounce rate',
    'drop-off',
    'drop off',
    'dropoff',
    'abandonment',
    'churn rate',
    'churn',
    'retention rate',
    'retention',
    'funnel',
    'event tracking',
    'events',
    'session depth',
    'completion rate',
  ];

  // 3. UI/UX and Front-End Styling Indicators
  const uiUxIndicators = [
    'responsive',
    'responsiveness',
    'mobile responsive',
    'wireframe',
    'figma',
    'sketch',
    'prototype',
    'navbar',
    'navigation bar',
    'hamburger menu',
    'sidebar layout',
    'modal popup',
    'ui/ux',
    'ui design',
    'ux design',
    'user interface',
    'color palette',
    'button color',
    'typography',
    'font size',
  ];

  // 4. Technical Coding & Web Development Indicators
  const codingIndicators = [
    'css',
    'css3',
    'flexbox',
    'grid layout',
    'center a div',
    'centering',
    'media query',
    'media queries',
    'breakpoint',
    'breakpoints',
    'tailwind',
    'bootstrap',
    'sass',
    'scss',
    'styling',
    'stylesheet',
    'z-index',
    'padding',
    'margin',
    'front-end',
    'frontend',
    'back-end',
    'backend',
    'javascript',
    'typescript',
    'react',
    'vue',
    'angular',
    'svelte',
    'next.js',
    'nextjs',
    'html',
    'html5',
    'dom',
    'component',
    'useeffect',
    'usestate',
    'hook',
    'api route',
    'sql query',
    'database schema',
    'docker',
  ];

  // Match question patterns like "How to make my app responsive", "How to write CSS", "How to build a navbar"
  const isHowToCodingOrDesign =
    /^how\s+to\s+(make|build|create|code|style|center|fix|design|write)\b/i.test(trimmed);

  const matchedUiUx = uiUxIndicators.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(lower);
  });

  const matchedCoding = codingIndicators.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(lower);
  });

  // Check general non-analytical / trivia patterns
  const isNonAnalytical =
    /^(weather in|recipe for|translate|tell me a joke|write a poem|who is|what is the capital|how to cook)\b/i.test(
      trimmed
    );

  if (isHowToCodingOrDesign || matchedUiUx || matchedCoding || isNonAnalytical) {
    const hasExplicitAnalyticsIntent = analyticsKeywords.some((keyword) => lower.includes(keyword));

    // If query is directly asking about UI/UX or coding (e.g., "how to write CSS", "how to make my app responsive")
    // or has no explicit behavioral tracking intent:
    if (!hasExplicitAnalyticsIntent || isHowToCodingOrDesign || lower.includes('css') || lower.includes('flexbox') || lower.includes('responsive')) {
      if (matchedUiUx || lower.includes('responsive') || lower.includes('ui/ux') || lower.includes('figma')) {
        return {
          isOutOfScope: true,
          category: 'ui_ux',
          message:
            'Invalid Analytics Goal: This tool creates analytics measurement plans for tracking user behavior. Your query appears to be about UI/UX design (e.g., responsive layouts). Please enter a business or tracking objective instead (e.g., Track user engagement on mobile devices, Increase signups).',
        };
      }

      if (matchedCoding || lower.includes('css') || lower.includes('flexbox') || lower.includes('center a div')) {
        return {
          isOutOfScope: true,
          category: 'coding',
          message:
            'Invalid Analytics Goal: This tool creates analytics measurement plans for tracking user behavior. Your query appears to be about front-end development or coding (e.g., CSS, styling). Please enter a business or tracking objective instead (e.g., Increase checkout conversion rate, Track blog reads).',
        };
      }

      return {
        isOutOfScope: true,
        category: 'general',
        message:
          'Invalid Analytics Goal: This tool only creates digital analytics measurement plans for tracking user behavior. Please enter an actionable tracking or business objective (e.g., Increase checkout conversion rate, Track blog reads, Increase signups).',
      };
    }
  }

  return { isOutOfScope: false };
}

export const DEFAULT_CLARIFYING_QUESTIONS = [
  {
    id: 'specific_pages',
    question: "What specific pages, screens, or features define 'better'?",
    context: "Pinpoints the exact touchpoint in your user journey (e.g., checkout funnel, lead form, pricing page).",
    options: [
      'Checkout and payment funnel (reduce drop-off at shipping/billing steps)',
      'Lead generation or demo inquiry form (increase completion rate)',
      'New user onboarding flow and account setup checklist',
      'Product catalog search, filtering, and detail page browsing',
      'Pricing tiers, feature comparison tables, and plan selection',
    ],
  },
  {
    id: 'success_metric',
    question: 'What specific, measurable metric or outcome defines success?',
    context: "Defines the calculation ratio (e.g., conversion rate, bounce rate, completion percentage).",
    options: [
      'Increase conversion completion rate (fewer drop-offs between start and submit)',
      'Reduce bounce rate or exit rate on the key landing / checkout step',
      'Increase engaged session depth and interaction with core value features',
      'Increase qualified lead form submissions relative to total visitors',
      'Improve 7-day user activation and feature adoption retention',
    ],
  },
  {
    id: 'target_audience',
    question: 'Who is the primary audience or traffic segment you need to measure?',
    context: "Helps select the right tracking parameters, source attribution, and device filters.",
    options: [
      'First-time visitors arriving from marketing campaigns or search',
      'Returning customers completing repeat transactions or renewals',
      'Mobile app users across iOS and Android devices',
      'Free-trial or freemium accounts evaluating self-serve features',
      'High-intent enterprise prospects requesting custom quotes',
    ],
  },
];

export function checkGoalClarity(goal: string): GoalCheckResult {
  const trimmed = goal.trim();
  if (!trimmed) {
    return {
      isVague: true,
      warningTitle: 'Clarification Needed',
      reason: 'Please enter a business goal to begin.',
      clarificationMessage: 'A specific, measurable metric is required. Please provide a clear definition of success.',
      questions: DEFAULT_CLARIFYING_QUESTIONS,
    };
  }

  const lower = trimmed.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  // Explicit phrases that are inherently vague without quantifiable definition
  const vaguePhrases = [
    'make the site better',
    'make site better',
    'make our site better',
    'make my site better',
    'make the website better',
    'make website better',
    'make our website better',
    'make it better',
    'make the app better',
    'make app better',
    'make our app better',
    'improve the site',
    'improve site',
    'improve website',
    'improve the website',
    'improve our website',
    'improve my website',
    'improve app',
    'improve the app',
    'better site',
    'better website',
    'better app',
    'better analytics',
    'grow',
    'grow sales',
    'grow the business',
    'grow business',
    'grow my business',
    'grow our business',
    'get more sales',
    'get more users',
    'get more traffic',
    'get more leads',
    'get more customers',
    'make money',
    'make more money',
    'track everything',
    'track stuff',
    'track users',
    'track analytics',
    'more sales',
    'more traffic',
    'more users',
    'more leads',
    'increase sales',
    'increase revenue',
    'increase traffic',
    'increase engagement',
    'increase users',
    'increase leads',
    'boost sales',
    'boost traffic',
    'boost performance',
    'optimize site',
    'optimize website',
    'help me track',
    'marketing',
    'digital marketing',
    'analytics setup',
  ];

  const normalized = lower.replace(/[.!?,;]+$/g, '').trim();

  // Check exact vague match
  if (vaguePhrases.includes(normalized)) {
    return {
      isVague: true,
      warningTitle: 'Clarification Needed',
      reason: `The goal "${trimmed}" is broad and lacks a definition of success.`,
      clarificationMessage:
        "A specific, measurable metric is required. The provided business goal is underspecified. Please provide a clear definition of success (such as 'increase conversions' or 'reduce bounce rate on checkout') or answer the 3 clarifying questions below.",
      questions: DEFAULT_CLARIFYING_QUESTIONS,
    };
  }

  // Check prefix matches (e.g. "make the site better by doing things", "grow my business through ads")
  const vaguePrefixes = [
    'make the site better',
    'make site better',
    'make website better',
    'make it better',
    'improve the site',
    'improve website',
    'improve our website',
    'track everything',
    'grow sales',
    'grow my business',
    'grow the business',
    'grow business',
    'get more sales',
    'make money',
  ];

  for (const prefix of vaguePrefixes) {
    if (
      normalized.startsWith(prefix) &&
      !normalized.includes('checkout') &&
      !normalized.includes('bounce') &&
      !normalized.includes('conversion') &&
      !normalized.includes('retention') &&
      !normalized.includes('onboarding') &&
      !normalized.includes('signup') &&
      !normalized.includes('sign-up') &&
      !normalized.includes('blog')
    ) {
      return {
        isVague: true,
        warningTitle: 'Clarification Needed',
        reason: `The goal starts with "${prefix}", which requires a specific success metric.`,
        clarificationMessage:
          "A specific, measurable metric is required. Please scope the exact pages and metrics or answer the 3 clarifying questions below.",
        questions: DEFAULT_CLARIFYING_QUESTIONS,
      };
    }
  }

  // Check measurable indicators for actionable tracking/business objectives
  const measurableSignals = [
    'conversion',
    'conversions',
    'convert',
    'bounce rate',
    'bounce',
    'drop-off',
    'drop off',
    'dropoff',
    'drop-offs',
    'abandonment',
    'retention',
    'churn',
    'checkout',
    'cart',
    'purchase',
    'sign up',
    'signup',
    'signups',
    'sign-up',
    'sign-ups',
    'register',
    'registration',
    'trial',
    'lead form',
    'lead',
    'leads',
    'blog',
    'reads',
    'read',
    'reading',
    'article',
    'articles',
    'content',
    'onboarding',
    'activation',
    'completion rate',
    'newsletter',
    'booking',
    'bookings',
    'deposit',
    'download',
    'downloads',
    'search',
  ];

  const hasMeasurableSignal = measurableSignals.some((sig) => {
    const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(lower);
  });

  // If short (under 5 words or under 22 chars) AND lacks measurable signal
  if ((words.length < 5 || trimmed.length < 22) && !hasMeasurableSignal) {
    return {
      isVague: true,
      warningTitle: 'Clarification Needed',
      reason: 'The input goal is short and does not define a measurable outcome.',
      clarificationMessage:
        "A specific, measurable metric is required. To generate a high-impact tracking plan without guessing, please specify what success looks like or answer the 3 clarifying questions below.",
      questions: DEFAULT_CLARIFYING_QUESTIONS,
    };
  }

  return { isVague: false };
}

/**
 * Evaluates the user's input goal against four strict categories:
 * - Type A (Valid Goal): Actionable tracking/business objectives (e.g. 'increase signups', 'reduce checkout drop-off', 'track blog reads')
 * - Type B (Vague/Broad Goal): Underspecified inputs (e.g. 'make the site better', 'grow my business')
 * - Type C (Informational Question): Asking for metrics definitions (e.g. 'What is bounce rate?', 'What is a conversion rate?')
 * - Type D (Completely Out-of-Scope): Coding, UI/UX design, or high-stakes business strategy (e.g. 'how to write CSS', 'should we fire our staff')
 */
export function classifyGoalIntent(goal: string): GoalClassificationResult {
  const trimmed = goal.trim();
  if (!trimmed) {
    return {
      category: 'TYPE_B_VAGUE_GOAL',
      isOutOfScope: false,
      isDefinition: false,
      isVague: true,
      warningTitle: 'Clarification Needed',
      reason: 'Please enter a business goal to begin.',
      clarificationMessage:
        'A specific, measurable metric is required. Please provide a clear definition of success.',
      questions: DEFAULT_CLARIFYING_QUESTIONS,
    };
  }

  // 1. Type D (Completely Out-of-Scope Check: Coding, UI/UX design, or high-stakes business strategy)
  const scopeResult = checkGoalScope(trimmed);
  if (scopeResult.isOutOfScope) {
    return {
      category: 'TYPE_D_OUT_OF_SCOPE',
      isOutOfScope: true,
      outOfScopeReason: scopeResult.message || OUT_OF_SCOPE_MESSAGE,
      isDefinition: false,
      isVague: false,
    };
  }

  // 2. Type C (Informational Question Check: Asking for metric definitions)
  const defQuery = extractDefinitionQuery(trimmed);
  if (defQuery) {
    return {
      category: 'TYPE_C_INFORMATIONAL_QUESTION',
      isOutOfScope: false,
      isDefinition: true,
      definitionQuery: defQuery,
      isVague: false,
    };
  }

  // 3. Type B (Vague/Broad Goal Check: Underspecified inputs)
  const clarityResult = checkGoalClarity(trimmed);
  if (clarityResult.isVague) {
    return {
      category: 'TYPE_B_VAGUE_GOAL',
      isOutOfScope: false,
      isDefinition: false,
      isVague: true,
      warningTitle: clarityResult.warningTitle || 'Clarification Needed',
      reason: clarityResult.reason,
      clarificationMessage: clarityResult.clarificationMessage,
      questions: clarityResult.questions || DEFAULT_CLARIFYING_QUESTIONS,
    };
  }

  // 4. Type A (Valid Goal: Actionable tracking/business objectives)
  return {
    category: 'TYPE_A_VALID_GOAL',
    isOutOfScope: false,
    isDefinition: false,
    isVague: false,
  };
}
