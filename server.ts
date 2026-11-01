import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { extractDefinitionQuery, getMetricDefinition } from './src/utils/metricDefinitions';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '2mb' }));

// Initialize GoogleGenAI client (only used server-side)
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_')) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return null;
}

// Built-in expert fallback engine for reliability & offline support
interface GeneratePlanRequest {
  businessGoal: string;
  industry?: string;
  platform?: string;
  analyticsTool?: string;
  clarifications?: Record<string, string>;
  forceGenerate?: boolean;
}

import {
  checkGoalScope,
  checkGoalClarity,
  classifyGoalIntent,
  OUT_OF_SCOPE_MESSAGE,
} from './src/utils/goalValidator';

function evaluateScope(goal: string): { isOutOfScope: boolean; message: string } {
  const res = checkGoalScope(goal);
  return {
    isOutOfScope: res.isOutOfScope,
    message: res.message || OUT_OF_SCOPE_MESSAGE,
  };
}

function evaluateVagueness(goal: string): {
  isVague: boolean;
  questions: any[];
  warningTitle: string;
  clarificationMessage: string;
} {
  const res = checkGoalClarity(goal);
  return {
    isVague: res.isVague,
    questions: res.questions || [],
    warningTitle: res.warningTitle || 'Clarification Needed',
    clarificationMessage: res.clarificationMessage || '',
  };
}

function generateLocalConsultantPlan(
  goal: string,
  industry?: string,
  platform?: string,
  analyticsTool?: string,
  clarifications?: Record<string, string>
) {
  const lowerGoal = goal.toLowerCase();
  const lowerIndustry = (industry || '').toLowerCase();
  const lowerPlatform = (platform || '').toLowerCase();
  const clarifiedAction = (clarifications?.specific_pages || clarifications?.primary_action || '').toLowerCase();
  const clarifiedMetric = (clarifications?.success_metric || '').toLowerCase();
  const clarifiedAudience = (clarifications?.target_audience || '').toLowerCase();

  // ONLY user input (goal and user's direct clarification answers) must determine the workflow pillars!
  // The Industry dropdown must ONLY guide parameter terminology, NEVER force or replace workflow templates.
  const goalContext = `${lowerGoal} ${clarifiedAction} ${clarifiedMetric}`.trim();

  // Industry-specific parameter configuration (Industry Dropdown Scope: guide parameter terminology ONLY)
  const isFintechIndustry = lowerIndustry.includes('fintech') || lowerIndustry.includes('financial');
  const isSaasIndustry = lowerIndustry.includes('saas') || lowerIndustry.includes('software');
  const isHealthcareIndustry = lowerIndustry.includes('health') || lowerIndustry.includes('medical');

  const industryProductParam = isFintechIndustry
    ? 'financial_product_type'
    : isSaasIndustry
    ? 'plan_tier'
    : isHealthcareIndustry
    ? 'specialty_service'
    : 'product_type';

  const industryProductExample = isFintechIndustry
    ? 'high_yield_savings'
    : isSaasIndustry
    ? 'pro_annual'
    : isHealthcareIndustry
    ? 'telehealth_consult'
    : 'standard_tier';

  // 1. Product Page & Application Funnel (derived from user's explicit verbs and nouns)
  const hasApplicationFunnel =
    (goalContext.includes('application') || goalContext.includes('apply')) &&
    (goalContext.includes('product') ||
      goalContext.includes('form') ||
      goalContext.includes('clickthrough') ||
      goalContext.includes('click through') ||
      goalContext.includes('ctr') ||
      goalContext.includes('rate'));

  // 2. E-commerce Checkout: ONLY if user explicitly mentions cart, checkout, or purchase
  const hasEcommerce =
    !hasApplicationFunnel &&
    (goalContext.includes('checkout') ||
      goalContext.includes('cart') ||
      goalContext.includes('purchase') ||
      goalContext.includes('shopping cart') ||
      goalContext.includes('order completion'));

  // 3. Blog & Editorial: ONLY if user explicitly mentions blog, articles, or editorial reading
  const hasContentOrBlog =
    goalContext.includes('blog') ||
    goalContext.includes('article') ||
    goalContext.includes('editorial') ||
    goalContext.includes('read') ||
    goalContext.includes('newsletter');

  // 4. App Retention: ONLY if user explicitly mentions retention, onboarding, churn, or app active users
  const hasAppRetention =
    lowerGoal.includes('retention') ||
    lowerGoal.includes('onboarding') ||
    lowerGoal.includes('churn') ||
    lowerGoal.includes('active user') ||
    lowerGoal.includes('day-7') ||
    lowerGoal.includes('day 7') ||
    lowerGoal.includes('dau') ||
    lowerGoal.includes('mau') ||
    lowerGoal.includes('activation funnel') ||
    lowerGoal.includes('feature adoption') ||
    clarifiedAction.includes('onboarding');

  // 5. Landing Page & Bounce Rate
  const hasBounceRate =
    lowerGoal.includes('bounce') ||
    lowerGoal.includes('bounce rate') ||
    lowerGoal.includes('exit rate') ||
    lowerGoal.includes('single page') ||
    lowerGoal.includes('landing page');

  // 6. Search & Discovery
  const hasSearch =
    lowerGoal.includes('search') ||
    lowerGoal.includes('catalog search') ||
    lowerGoal.includes('query') ||
    lowerGoal.includes('filter');

  // 7. Lead Generation: ONLY if user explicitly mentions demo, lead, or quote inquiry
  const hasLeadGen =
    !hasApplicationFunnel &&
    (goalContext.includes('lead') ||
      goalContext.includes('demo') ||
      goalContext.includes('quote') ||
      goalContext.includes('inquiry'));

  // 8. Financial Services KYC / Account Funding: STRICT RULE - ONLY if user explicitly mentions 'kyc', 'funding', 'deposits', or 'bank transfer' in their text!
  // NEVER activate simply because the industry is Fintech!
  const hasFintech =
    goalContext.includes('kyc') ||
    goalContext.includes('identity verification') ||
    goalContext.includes('account funding') ||
    goalContext.includes('first deposit') ||
    goalContext.includes('initial deposit') ||
    goalContext.includes('bank transfer') ||
    goalContext.includes('funding deposit');

  // 9. Healthcare Consultations: ONLY if user explicitly mentions appointments, doctor, or patient
  const hasHealthcare =
    goalContext.includes('appointment') ||
    goalContext.includes('doctor') ||
    goalContext.includes('patient') ||
    goalContext.includes('clinic booking') ||
    goalContext.includes('telehealth visit');

  // Pillar 0: Product Page & Application Funnel
  const applicationFunnelModule = {
    name: 'Product Page & Application Funnel',
    kpis: [
      {
        id: 'kpi_app_funnel_1',
        name: 'Product Page to Application Click-Through Rate',
        shortDefinition:
          'The percentage of visitors viewing product detail pages who click the primary call-to-action button to enter the application form.',
        whyItMatters:
          'Directly measures the transition efficiency and headline/value proposition appeal between product browsing and application intent.',
        measurementFormula:
          'Unique sessions with apply_cta_clicked divided by unique sessions with product_page_viewed × 100%',
        type: 'Micro-conversion',
        pillar: 'Product Page & Application Funnel',
      },
      {
        id: 'kpi_app_funnel_2',
        name: 'Application Form Completion Rate',
        shortDefinition:
          'The proportion of initiated application forms that are successfully completed and submitted.',
        whyItMatters:
          'Measures friction across form fields and reveals bottom-of-funnel drop-offs before final submission.',
        measurementFormula:
          'Unique users with application_form_submitted divided by unique users with application_form_started × 100%',
        type: 'Macro-conversion',
        pillar: 'Product Page & Application Funnel',
      },
    ],
    events: [
      {
        id: 'ev_app_funnel_1',
        eventName: 'product_page_viewed',
        description:
          'Fires when a prospective applicant views an individual product detail or offering overview page.',
        trigger: 'Product page URL loaded and main content visible in viewport',
        keyParameters: [
          {
            name: industryProductParam,
            description: `Offering or product category for ${industry || 'selected industry'}`,
            example: industryProductExample,
          },
          {
            name: 'product_id',
            description: 'Unique product identifier or SKU',
            example: 'fin_prod_802',
          },
          {
            name: 'traffic_source',
            description: 'Inbound marketing or acquisition channel',
            example: 'organic_search',
          },
        ],
        supportedKpi: 'Product Page to Application Click-Through Rate',
        pillar: 'Product Page & Application Funnel',
      },
      {
        id: 'ev_app_funnel_2',
        eventName: 'apply_cta_clicked',
        description:
          'Fires when a visitor clicks the primary Apply Now or Begin Application button on the product page.',
        trigger: 'Click on primary application CTA button on product page',
        keyParameters: [
          {
            name: industryProductParam,
            description: 'Product associated with the application click',
            example: industryProductExample,
          },
          {
            name: 'cta_placement',
            description: 'Position of CTA button on product page',
            example: 'hero_primary',
          },
          {
            name: 'button_label',
            description: 'Text label of clicked CTA button',
            example: 'Apply Now',
          },
        ],
        supportedKpi: 'Product Page to Application Click-Through Rate',
        pillar: 'Product Page & Application Funnel',
      },
      {
        id: 'ev_app_funnel_3',
        eventName: 'application_form_started',
        description:
          'Fires when an applicant lands on the application form and interacts with the initial input field.',
        trigger: 'User focuses or inputs text into the first field of the application form',
        keyParameters: [
          {
            name: industryProductParam,
            description: 'Product category being applied for',
            example: industryProductExample,
          },
          {
            name: 'application_id',
            description: 'Pseudonymous draft application ID',
            example: 'app_2026_9941',
          },
          {
            name: 'entry_source',
            description: 'Referring product page URL or section',
            example: 'product_detail_hero',
          },
        ],
        supportedKpi: 'Application Form Completion Rate',
        pillar: 'Product Page & Application Funnel',
      },
      {
        id: 'ev_app_funnel_4',
        eventName: 'application_form_submitted',
        description:
          'Fires once when the user successfully submits the completed application form and confirmation is displayed.',
        trigger: 'Confirmation screen rendered after valid application submission',
        keyParameters: [
          {
            name: industryProductParam,
            description: 'Product category submitted',
            example: industryProductExample,
          },
          {
            name: 'application_id',
            description: 'Submitted application reference',
            example: 'app_2026_9941',
          },
          {
            name: 'submission_status',
            description: 'Result state of application',
            example: 'submitted_for_review',
          },
        ],
        supportedKpi: 'Application Form Completion Rate',
        pillar: 'Product Page & Application Funnel',
      },
    ],
  };

  // Pillar 1: E-commerce
  const ecommerceModule = {
    name: 'E-commerce Checkout',
    kpis: [
      {
        id: 'kpi_ecom_1',
        name: 'Checkout Completion Rate',
        shortDefinition: 'The share of users who initiate checkout and successfully finish paying.',
        whyItMatters: 'Reveals friction in the payment or shipping steps where interested buyers drop off.',
        measurementFormula: 'Unique users with purchase_completed divided by unique users with checkout_started',
        type: 'Macro-conversion',
        pillar: 'E-commerce Checkout',
      },
      {
        id: 'kpi_ecom_2',
        name: 'Cart-to-Detail View Ratio',
        shortDefinition: 'The rate at which product page visitors add an item to their shopping bag.',
        whyItMatters: 'Indicates whether product imagery, pricing, and descriptions convince users to take intent-driven action.',
        measurementFormula: 'Unique sessions with add_to_cart divided by unique sessions with product_viewed',
        type: 'Micro-conversion',
        pillar: 'E-commerce Checkout',
      },
    ],
    events: [
      {
        id: 'ev_ecom_1',
        eventName: 'product_viewed',
        description: 'Fires when a user lands on or scrolls through an individual product detail page.',
        trigger: 'Product page loaded and details visible in viewport',
        keyParameters: [
          { name: 'product_id', description: 'Internal SKU or identifier', example: 'prod_98421' },
          { name: 'product_category', description: 'Catalog category', example: 'running_shoes' },
          { name: 'product_price', description: 'Listed monetary price', example: '120.00' },
        ],
        supportedKpi: 'Cart-to-Detail View Ratio',
        pillar: 'E-commerce Checkout',
      },
      {
        id: 'ev_ecom_2',
        eventName: 'add_to_cart',
        description: 'Fires when a user clicks the Add to Cart button from any product card.',
        trigger: 'Click on Add to Cart button with successful cart drawer confirmation',
        keyParameters: [
          { name: 'product_id', description: 'Item added', example: 'prod_98421' },
          { name: 'quantity', description: 'Number of units', example: '1' },
          { name: 'cart_value_total', description: 'New total cart value', example: '120.00' },
        ],
        supportedKpi: 'Cart-to-Detail View Ratio',
        pillar: 'E-commerce Checkout',
      },
      {
        id: 'ev_ecom_3',
        eventName: 'checkout_started',
        description: 'Fires when the user initiates the checkout funnel from the cart.',
        trigger: 'Click on Proceed to Checkout or landing on the initial checkout URL',
        keyParameters: [
          { name: 'cart_item_count', description: 'Total units in cart', example: '2' },
          { name: 'shipping_country', description: 'Detected or prefilled destination', example: 'US' },
          { name: 'coupon_applied', description: 'Whether a promo code is active', example: 'true' },
        ],
        supportedKpi: 'Checkout Completion Rate',
        pillar: 'E-commerce Checkout',
      },
      {
        id: 'ev_ecom_4',
        eventName: 'purchase_completed',
        description: 'Fires once when the order confirmation screen is displayed.',
        trigger: 'Receipt of order confirmation screen with verified transaction identifier',
        keyParameters: [
          { name: 'transaction_id', description: 'Unique order identifier', example: 'ord_2026_8892' },
          { name: 'order_value', description: 'Total paid including taxes and shipping', example: '135.50' },
          { name: 'shipping_tier', description: 'Selected delivery option', example: 'express' },
        ],
        supportedKpi: 'Checkout Completion Rate',
        pillar: 'E-commerce Checkout',
      },
    ],
  };

  // Pillar 2: Content & Blog
  const contentBlogModule = {
    name: 'Blog & Content Engagement',
    kpis: [
      {
        id: 'kpi_content_1',
        name: 'Engaged Article Read Depth Ratio',
        shortDefinition: 'The proportion of readers who scroll past 75% depth and actively dwell on editorial articles.',
        whyItMatters: 'Demonstrates content resonance and indicates whether articles hold audience attention.',
        measurementFormula: 'Unique sessions reaching >= 75% scroll depth divided by total article_viewed sessions',
        type: 'Engagement',
        pillar: 'Blog & Content Engagement',
      },
      {
        id: 'kpi_content_2',
        name: 'Newsletter Subscription Conversion Rate',
        shortDefinition: 'The rate at which blog readers convert into ongoing newsletter subscribers.',
        whyItMatters: 'Measures editorial efficiency in transforming organic readers into an owned subscriber audience.',
        measurementFormula: 'Unique users with newsletter_subscribed divided by unique article readers',
        type: 'Micro-conversion',
        pillar: 'Blog & Content Engagement',
      },
    ],
    events: [
      {
        id: 'ev_content_1',
        eventName: 'article_viewed',
        description: 'Fires when a reader views a blog post or editorial content page.',
        trigger: 'Blog article URL loaded with main content visible in viewport',
        keyParameters: [
          { name: 'article_id', description: 'Unique identifier or slug', example: 'art_analytics_trends_2026' },
          { name: 'article_category', description: 'Content topic category', example: 'digital_strategy' },
          { name: 'author_name', description: 'Author of the piece', example: 'editorial_team' },
        ],
        supportedKpi: 'Engaged Article Read Depth Ratio',
        pillar: 'Blog & Content Engagement',
      },
      {
        id: 'ev_content_2',
        eventName: 'article_scroll_depth_reached',
        description: 'Fires as the reader reaches key reading milestones (25%, 50%, 75%, 100%).',
        trigger: 'Vertical scroll threshold crossed with active reading dwell time',
        keyParameters: [
          { name: 'article_id', description: 'Article slug', example: 'art_analytics_trends_2026' },
          { name: 'scroll_depth_threshold', description: 'Percentage marker reached', example: '75' },
          { name: 'dwell_time_seconds', description: 'Seconds active on article', example: '95' },
        ],
        supportedKpi: 'Engaged Article Read Depth Ratio',
        pillar: 'Blog & Content Engagement',
      },
      {
        id: 'ev_content_3',
        eventName: 'newsletter_subscribed',
        description: 'Fires upon successful submission of the email newsletter signup form.',
        trigger: 'Confirmation message rendered after valid newsletter signup',
        keyParameters: [
          { name: 'signup_location', description: 'Placement of form on page', example: 'in_article_footer' },
          { name: 'referring_article_id', description: 'Article where signup occurred', example: 'art_analytics_trends_2026' },
        ],
        supportedKpi: 'Newsletter Subscription Conversion Rate',
        pillar: 'Blog & Content Engagement',
      },
    ],
  };

  // Pillar 3: Mobile App Retention & Onboarding
  const appRetentionModule = {
    name: 'App Retention & Onboarding',
    kpis: [
      {
        id: 'kpi_app_1',
        name: 'Day-7 Active User Retention Rate',
        shortDefinition: 'The percentage of app installers who return and perform an active session on Day 7.',
        whyItMatters: 'The gold standard metric for product stickiness; indicates whether new users find lasting utility.',
        measurementFormula: 'Users active on Day 7 divided by initial cohort of users who launched app on Day 0',
        type: 'Retention',
        pillar: 'App Retention & Onboarding',
      },
      {
        id: 'kpi_app_2',
        name: 'Onboarding Funnel Completion Rate',
        shortDefinition: 'The share of users who begin the app walkthrough and finish all initial setup steps.',
        whyItMatters: 'Onboarding drop-offs are the strongest predictor of immediate uninstalls and churn.',
        measurementFormula: 'Unique users completing final onboarding step divided by users with app_session_started',
        type: 'Micro-conversion',
        pillar: 'App Retention & Onboarding',
      },
    ],
    events: [
      {
        id: 'ev_app_1',
        eventName: 'app_session_started',
        description: 'Fires when user opens or resumes the mobile app in the foreground.',
        trigger: 'App lifecycle event: foreground activity initialized',
        keyParameters: [
          { name: 'app_version', description: 'App semantic release version', example: '2.4.0' },
          { name: 'device_os', description: 'Operating system platform', example: 'ios' },
          { name: 'session_number_cumulative', description: 'Lifetime session count for device', example: '7' },
        ],
        supportedKpi: 'Day-7 Active User Retention Rate',
        pillar: 'App Retention & Onboarding',
      },
      {
        id: 'ev_app_2',
        eventName: 'onboarding_step_completed',
        description: 'Fires when user completes each setup walkthrough milestone or permission prompt.',
        trigger: 'Advancing past each onboarding milestone card',
        keyParameters: [
          { name: 'step_index', description: 'Sequential stage index', example: '2' },
          { name: 'step_name', description: 'Milestone name', example: 'set_preferences' },
          { name: 'time_spent_seconds', description: 'Time taken on step', example: '14' },
        ],
        supportedKpi: 'Onboarding Funnel Completion Rate',
        pillar: 'App Retention & Onboarding',
      },
      {
        id: 'ev_app_3',
        eventName: 'core_feature_used',
        description: 'Fires when the user executes the primary value-delivering tool or workspace feature.',
        trigger: 'Successful completion of core product workflow action',
        keyParameters: [
          { name: 'feature_name', description: 'Name of tool used', example: 'export_summary' },
          { name: 'interaction_mode', description: 'Gesture or trigger method', example: 'tap_button' },
        ],
        supportedKpi: 'Day-7 Active User Retention Rate',
        pillar: 'App Retention & Onboarding',
      },
    ],
  };

  // Pillar 4: Lead Generation
  const leadGenModule = {
    name: 'Lead Generation',
    kpis: [
      {
        id: 'kpi_lead_1',
        name: 'Lead Submission Rate',
        shortDefinition: 'The share of qualified visitors who submit a demo or consultation request form.',
        whyItMatters: 'Demonstrates how effectively landing pages and value propositions generate new pipeline.',
        measurementFormula: 'Unique users with lead_form_submitted divided by unique landing page visitors',
        type: 'Macro-conversion',
        pillar: 'Lead Generation',
      },
      {
        id: 'kpi_lead_2',
        name: 'Form Field Completion Rate',
        shortDefinition: 'The percentage of users who start filling a form and reach the submit step.',
        whyItMatters: 'Identifies whether too many questions or confusing inputs cause abandonment.',
        measurementFormula: 'Completed forms divided by form_started events',
        type: 'Micro-conversion',
        pillar: 'Lead Generation',
      },
    ],
    events: [
      {
        id: 'ev_lead_1',
        eventName: 'lead_form_started',
        description: 'Fires on the first user interaction inside any lead or demo input field.',
        trigger: 'User focuses or inputs text into the first field of the contact/demo form',
        keyParameters: [
          { name: 'form_id', description: 'Identifier of the form element', example: 'demo_request_modal' },
          { name: 'form_location', description: 'Page section where form lives', example: 'header_cta' },
        ],
        supportedKpi: 'Form Field Completion Rate',
        pillar: 'Lead Generation',
      },
      {
        id: 'ev_lead_2',
        eventName: 'lead_form_submitted',
        description: 'Fires upon successful submission and server validation of the lead form.',
        trigger: 'Successful submit action and confirmation dialog display',
        keyParameters: [
          { name: 'form_id', description: 'Identifier of form', example: 'demo_request_modal' },
          { name: 'inquiry_type', description: 'Dropdown selection of use case', example: 'enterprise_quote' },
        ],
        supportedKpi: 'Lead Submission Rate',
        pillar: 'Lead Generation',
      },
    ],
  };

  // Pillar 5: Financial Services
  const fintechModule = {
    name: 'Financial Services & KYC',
    kpis: [
      {
        id: 'kpi_fin_1',
        name: 'Account Funding Completion Rate',
        shortDefinition: 'The percentage of registered users who complete identity verification and make their first deposit.',
        whyItMatters: 'Identifies KYC and banking linkage drop-offs before users become active depositors.',
        measurementFormula: 'Unique users with initial_deposit_completed divided by unique users with account_created',
        type: 'Macro-conversion',
        pillar: 'Financial Services & KYC',
      },
    ],
    events: [
      {
        id: 'ev_fin_1',
        eventName: 'kyc_verification_started',
        description: 'Fires when user initiates identity verification flow.',
        trigger: 'First step of document or biometric verification is viewed',
        keyParameters: [
          { name: 'document_type', description: 'Government ID selected', example: 'passport' },
        ],
        supportedKpi: 'Account Funding Completion Rate',
        pillar: 'Financial Services & KYC',
      },
      {
        id: 'ev_fin_2',
        eventName: 'initial_deposit_completed',
        description: 'Fires when the first account funding deposit is confirmed.',
        trigger: 'First money transfer initiates successfully from linked funding account',
        keyParameters: [
          { name: 'funding_currency', description: 'ISO currency code', example: 'USD' },
          { name: 'deposit_method', description: 'Payment rail used', example: 'ach_transfer' },
        ],
        supportedKpi: 'Account Funding Completion Rate',
        pillar: 'Financial Services & KYC',
      },
    ],
  };

  // Pillar 6: Healthcare
  const healthcareModule = {
    name: 'Healthcare & Consultations',
    kpis: [
      {
        id: 'kpi_health_1',
        name: 'Appointment Booking Rate',
        shortDefinition: 'The share of provider search visits that result in a confirmed appointment.',
        whyItMatters: 'Shows whether patients easily find availability and complete booking intake.',
        measurementFormula: 'Unique visits with appointment_confirmed divided by visits with provider_search_performed',
        type: 'Macro-conversion',
        pillar: 'Healthcare & Consultations',
      },
    ],
    events: [
      {
        id: 'ev_health_1',
        eventName: 'provider_search_performed',
        description: 'Fires when a patient searches by specialty, clinic, or provider name.',
        trigger: 'Execution of directory search query or filter application',
        keyParameters: [
          { name: 'specialty_category', description: 'Medical specialty', example: 'dermatology' },
        ],
        supportedKpi: 'Appointment Booking Rate',
        pillar: 'Healthcare & Consultations',
      },
      {
        id: 'ev_health_2',
        eventName: 'appointment_confirmed',
        description: 'Fires when appointment booking confirmation screen is rendered.',
        trigger: 'Server confirmation of booked calendar slot',
        keyParameters: [
          { name: 'appointment_id', description: 'Pseudonymous appointment reference', example: 'apt_99214' },
        ],
        supportedKpi: 'Appointment Booking Rate',
        pillar: 'Healthcare & Consultations',
      },
    ],
  };

  // Pillar 7: Landing Page & Bounce Rate Optimization
  const bounceRateModule = {
    name: 'Landing Page & Bounce Optimization',
    kpis: [
      {
        id: 'kpi_bounce_1',
        name: 'Landing Page Bounce Rate',
        shortDefinition: 'The percentage of landing page sessions that exit without an engaged interaction or navigation.',
        whyItMatters: 'Identifies whether initial landing page messaging, design, and performance align with visitor intent.',
        measurementFormula: 'Non-engaged landing page sessions divided by total landing page sessions',
        type: 'Macro-conversion',
        pillar: 'Landing Page & Bounce Optimization',
      },
      {
        id: 'kpi_bounce_2',
        name: 'Engaged Session Depth Rate',
        shortDefinition: 'The proportion of visitors who stay on the landing page for 10+ seconds or scroll past 50%.',
        whyItMatters: 'Demonstrates content consumption and user attention before potential drop-off.',
        measurementFormula: 'Sessions with engaged_session_achieved divided by total landing page sessions',
        type: 'Micro-conversion',
        pillar: 'Landing Page & Bounce Optimization',
      },
    ],
    events: [
      {
        id: 'ev_bounce_1',
        eventName: 'landing_page_viewed',
        description: 'Fires when a user enters the site and lands on a designated entry page view.',
        trigger: 'Initial page load on the landing or entry URL',
        keyParameters: [
          { name: 'page_location', description: 'URL of the landing page', example: 'https://example.com/promo' },
          { name: 'traffic_source', description: 'Campaign or referral channel', example: 'google_cpc' },
          { name: 'device_category', description: 'Device category of visitor', example: 'mobile' },
        ],
        supportedKpi: 'Landing Page Bounce Rate',
        pillar: 'Landing Page & Bounce Optimization',
      },
      {
        id: 'ev_bounce_2',
        eventName: 'scroll_depth_reached',
        description: 'Fires when a visitor scrolls through key vertical thresholds of the landing page.',
        trigger: 'User scrolls past 25%, 50%, 75%, or 90% of the page viewport height',
        keyParameters: [
          { name: 'percent_scrolled', description: 'Vertical scroll percentage', example: '50' },
          { name: 'page_location', description: 'Current URL path', example: '/promo' },
        ],
        supportedKpi: 'Engaged Session Depth Rate',
        pillar: 'Landing Page & Bounce Optimization',
      },
      {
        id: 'ev_bounce_3',
        eventName: 'engaged_session_timer_elapsed',
        description: 'Fires when an active visitor remains continuously engaged on the landing page for 10 seconds.',
        trigger: '10 continuous seconds of active window focus and interaction',
        keyParameters: [
          { name: 'engagement_seconds', description: 'Time elapsed threshold', example: '10' },
        ],
        supportedKpi: 'Engaged Session Depth Rate',
        pillar: 'Landing Page & Bounce Optimization',
      },
      {
        id: 'ev_bounce_4',
        eventName: 'landing_cta_clicked',
        description: 'Fires when user clicks the primary call-to-action button or navigation link on the landing page.',
        trigger: 'Click on main CTA button leading to the next funnel step',
        keyParameters: [
          { name: 'button_label', description: 'Text on clicked CTA button', example: 'Get Started' },
          { name: 'destination_url', description: 'Next step URL in funnel', example: '/checkout' },
        ],
        supportedKpi: 'Landing Page Bounce Rate',
        pillar: 'Landing Page & Bounce Optimization',
      },
    ],
  };

  // Pillar 8: Search & Discovery
  const searchModule = {
    name: 'Search & Catalog Discovery',
    kpis: [
      {
        id: 'kpi_search_1',
        name: 'Search-to-Detail Click Rate',
        shortDefinition: 'The percentage of internal site search queries that yield a click-through to a result.',
        whyItMatters: 'Demonstrates search algorithm relevance and whether users find what they are seeking.',
        measurementFormula: 'Searches resulting in result click divided by total site searches',
        type: 'Micro-conversion',
        pillar: 'Search & Catalog Discovery',
      },
    ],
    events: [
      {
        id: 'ev_search_1',
        eventName: 'site_search_performed',
        description: 'Fires when a user executes a search query across catalog or content.',
        trigger: 'Search query submission via enter key or search icon click',
        keyParameters: [
          { name: 'search_term', description: 'Keyword string entered by user', example: 'wireless headphones' },
          { name: 'results_count', description: 'Number of results found', example: '24' },
        ],
        supportedKpi: 'Search-to-Detail Click Rate',
        pillar: 'Search & Catalog Discovery',
      },
      {
        id: 'ev_search_2',
        eventName: 'search_result_clicked',
        description: 'Fires when a user selects a search result item.',
        trigger: 'Click on search result card or list row',
        keyParameters: [
          { name: 'search_term', description: 'Search query executed', example: 'wireless headphones' },
          { name: 'item_id', description: 'Item clicked', example: 'prod_442' },
          { name: 'item_position', description: 'Rank position in result list', example: '1' },
        ],
        supportedKpi: 'Search-to-Detail Click Rate',
        pillar: 'Search & Catalog Discovery',
      },
    ],
  };

  // Determine all active pillars based on actual goal
  const activeModules: any[] = [];

  if (hasApplicationFunnel) activeModules.push(applicationFunnelModule);
  if (hasBounceRate) activeModules.push(bounceRateModule);
  if (hasEcommerce) activeModules.push(ecommerceModule);
  if (hasContentOrBlog) activeModules.push(contentBlogModule);
  if (hasSearch) activeModules.push(searchModule);
  if (hasLeadGen) activeModules.push(leadGenModule);
  if (hasFintech) activeModules.push(fintechModule);
  if (hasHealthcare) activeModules.push(healthcareModule);
  if (hasAppRetention) activeModules.push(appRetentionModule);

  // If no predefined pillar matched, build a clean dynamic module tailored to the user's exact words!
  // NEVER default to an onboarding/app retention template!
  if (activeModules.length === 0) {
    const cleanGoalWords = goal
      .replace(/[^a-zA-Z0-9 ]+/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 4);

    const cleanGoalTitle =
      cleanGoalWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') ||
      'Objective';

    const slugGoal =
      cleanGoalWords.map((w) => w.toLowerCase()).join('_').slice(0, 24) || 'target_action';

    activeModules.push({
      name: `${cleanGoalTitle} Measurement`,
      kpis: [
        {
          id: 'kpi_dyn_1',
          name: `${cleanGoalTitle} Completion Rate`,
          shortDefinition: `The percentage of eligible user sessions that successfully achieve: "${goal}".`,
          whyItMatters: `Provides direct visibility into the user's specific business goal without guessing or proxy metrics.`,
          measurementFormula: `Sessions completing target goal divided by total eligible sessions`,
          type: 'Macro-conversion',
          pillar: `${cleanGoalTitle} Measurement`,
        },
        {
          id: 'kpi_dyn_2',
          name: `${cleanGoalTitle} Engagement Depth`,
          shortDefinition: `The rate at which visitors actively interact with elements tied to: "${goal}".`,
          whyItMatters: `Measures user intent and preliminary interactions leading up to the final objective.`,
          measurementFormula: `Sessions initiating action divided by total visitors`,
          type: 'Micro-conversion',
          pillar: `${cleanGoalTitle} Measurement`,
        },
      ],
      events: [
        {
          id: 'ev_dyn_1',
          eventName: `${slugGoal}_started`,
          description: `Fires when a user begins interacting with the flow related to "${goal}".`,
          trigger: `User engages with the initial interactive element for this objective`,
          keyParameters: [
            {
              name: industryProductParam,
              description: `Contextual category for ${industry || 'selected industry'}`,
              example: industryProductExample,
            },
            { name: 'entry_point', description: 'Screen or section where interaction began', example: 'main_view' },
            { name: 'traffic_source', description: 'Acquisition channel', example: 'direct' },
          ],
          supportedKpi: `${cleanGoalTitle} Engagement Depth`,
          pillar: `${cleanGoalTitle} Measurement`,
        },
        {
          id: 'ev_dyn_2',
          eventName: `${slugGoal}_completed`,
          description: `Fires upon successful completion of the primary action for "${goal}".`,
          trigger: `Confirmation of target user action completion`,
          keyParameters: [
            {
              name: industryProductParam,
              description: `Contextual category for ${industry || 'selected industry'}`,
              example: industryProductExample,
            },
            { name: 'outcome_status', description: 'Result state of target action', example: 'success' },
          ],
          supportedKpi: `${cleanGoalTitle} Completion Rate`,
          pillar: `${cleanGoalTitle} Measurement`,
        },
      ],
    });
  }

  // Combine ALL active pillars without dropping any objective!
  const detectedPillars = activeModules.map((m) => m.name);
  const kpis: any[] = [];
  const events: any[] = [];

  activeModules.forEach((mod) => {
    mod.kpis.forEach((k: any) => kpis.push({ ...k }));
    mod.events.forEach((e: any) => events.push({ ...e }));
  });

  const trackingPlanTable = events.map((ev) => ({
    eventName: ev.eventName,
    description: ev.description,
    trigger: ev.trigger,
    parameters: ev.keyParameters.map((p: any) => p.name).join(', '),
    kpiSupported: ev.supportedKpi,
    pillar: ev.pillar || detectedPillars[0],
  }));

  const isMultiPillar = detectedPillars.length > 1;
  const summaryText = isMultiPillar
    ? `Comprehensive Multi-Objective Measurement Plan covering all ${detectedPillars.length} stated pillars: ${detectedPillars.join(', ')}. All stated areas include dedicated KPIs and tracking events without dropping any objective.`
    : `Measurement plan tailored for: "${goal}" (${industry || 'All Industries'}, ${platform || 'Web & Mobile'}, ${analyticsTool || 'GA4'}). Focuses on high-impact conversion signals and friction identification without invasive data collection.`;

  return {
    isVague: false,
    plan: {
      summary: summaryText,
      businessGoal: goal,
      industry: industry || 'Multi-industry',
      platform: platform || 'Web & Mobile',
      analyticsTool: analyticsTool || 'GA4',
      detectedPillars,
      kpis,
      events,
      trackingPlanTable,
      governanceTips: [
        'Ensure all event names and parameters use lowercase snake_case across all pillars for cross-platform schema consistency.',
        'Never pass PII (email, phone, real name) inside parameter values; use pseudonymous user IDs.',
        'Validate triggers in your staging environment or debug view across web and app containers before deploying to production.',
      ],
    },
  };
}

// API endpoint to generate plan
app.post('/api/generate-plan', async (req: Request, res: Response) => {
  try {
    const {
      businessGoal,
      industry = 'Any',
      platform = 'Both (Web & Mobile)',
      analyticsTool = 'GA4',
      clarifications = {},
      forceGenerate = false,
    } = req.body as GeneratePlanRequest;

    if (!businessGoal || typeof businessGoal !== 'string' || !businessGoal.trim()) {
      return res.status(400).json({ error: 'Please enter a business goal.' });
    }

    const trimmedGoal = businessGoal.trim();
    const hasClarifications = Object.keys(clarifications).length > 0;

    // 1. Evaluate intent against four strict categories:
    // - Type A (Valid Goal)
    // - Type B (Vague/Broad Goal)
    // - Type C (Informational Question)
    // - Type D (Completely Out-of-Scope)
    const classification = classifyGoalIntent(trimmedGoal);

    // Type D: Completely Out-of-Scope (Coding, UI/UX design, or high-stakes business strategy)
    if (classification.category === 'TYPE_D_OUT_OF_SCOPE') {
      return res.status(400).json({
        intentType: 'TYPE_D_OUT_OF_SCOPE',
        isOutOfScope: true,
        isVague: false,
        error: classification.outOfScopeReason || OUT_OF_SCOPE_MESSAGE,
        outOfScopeError: classification.outOfScopeReason || OUT_OF_SCOPE_MESSAGE,
      });
    }

    // Type C: Informational Question (Metric definitions like 'What is bounce rate?')
    if (classification.category === 'TYPE_C_INFORMATIONAL_QUESTION') {
      const localDef = getMetricDefinition(trimmedGoal);
      const aiClient = getAiClient();
      if (aiClient) {
        try {
          const defPrompt = `The user asked an analytics definition question: "${trimmedGoal}".
Extract the metric name, provide a concise 2-sentence explanation of the metric for digital marketers and product analysts, and provide 2 suggested, concrete business tracking goals they might want to plan for (e.g. 'Reduce landing page bounce rate').
Respond in valid JSON matching the schema.`;
          const defCall = aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: defPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  metricName: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  calculationFormula: { type: Type.STRING },
                  suggestedGoals: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['metricName', 'explanation', 'suggestedGoals'],
              },
            },
          });
          const defTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Definition timeout')), 5000)
          );
          const defRes: any = await Promise.race([defCall, defTimeout]);
          if (defRes.text) {
            const parsedDef = JSON.parse(defRes.text);
            return res.json({
              intentType: 'TYPE_C_INFORMATIONAL_QUESTION',
              isDefinition: true,
              isVague: false,
              definition: {
                ...parsedDef,
                promptToTurnIntoGoal:
                  'Turn this metric into an actionable tracking goal: To create a measurement plan, choose a concrete business objective below or enter one above.',
              },
            });
          }
        } catch (_err) {
          // Fall through to rich built-in definition knowledge base
        }
      }

      if (localDef) {
        return res.json({
          intentType: 'TYPE_C_INFORMATIONAL_QUESTION',
          isDefinition: true,
          isVague: false,
          definition: localDef,
        });
      }
    }

    // Type B: Vague/Broad Goal (Underspecified inputs like 'make the site better', 'grow my business')
    if (classification.category === 'TYPE_B_VAGUE_GOAL' && !hasClarifications) {
      return res.json({
        intentType: 'TYPE_B_VAGUE_GOAL',
        isVague: true,
        warningTitle: classification.warningTitle || 'Clarification Needed',
        clarificationMessage: classification.clarificationMessage,
        clarificationQuestions: classification.questions,
      });
    }

    // Extract user keywords to dynamically guide LLM generation and prevent template defaults
    const userKeywords = trimmedGoal
      .replace(/[^a-zA-Z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .join(', ');

    // If Gemini client is available, generate via LLM with strict consultant constraints
    const aiClient = getAiClient();
    if (aiClient) {
      try {
        const systemInstruction = `You are a Principal Digital Analytics Consultant and Lead Measurement Architect.
Your task is to transform a business goal into a practical, draft digital analytics measurement plan for marketers, product owners, and junior analysts.

MANDATORY ARCHITECTURAL RULES:
1. STRICT GOAL PARSING MANDATE:
   - USER QUERY KEYWORDS: [${userKeywords}]
   - The event schema, KPIs, and user journey steps MUST be directly and faithfully derived from the specific verbs, nouns, and touchpoints in the user's goal input ("${trimmedGoal}").
   - Concrete Example: When given the goal "increase clickthrough rates from product pages into application form", you MUST generate tracking for product page views/clicks and application form progression (e.g., product_page_viewed, apply_cta_clicked, application_form_started, application_form_submitted), with CTR and completion rate KPIs.
   - Every event name, trigger, and parameter must reflect what the user actually asked to measure.

2. INDUSTRY DROPDOWN SCOPE & BOUNDARIES:
   - The selected Industry dropdown ("${industry}") serves ONLY to guide contextual parameter terminology (for example: if Industry is Fintech, include relevant parameters like 'financial_product_type', 'account_category', 'loan_tier'; if SaaS, use 'plan_tier'; if E-commerce, use 'product_category').
   - The Industry dropdown MUST NEVER replace, dictate, or override the user's core workflow or funnel steps. Do NOT substitute the user's workflow with an industry default.

3. NO DEFAULT TEMPLATE OVERRIDES:
   - You MUST NEVER fall back to standard account funding, KYC, or generic industry templates unless the user explicitly mentions 'KYC', 'funding', 'deposits', or 'bank transfer' in their text!
   - For a goal like "increase clickthrough rates from product pages into application form" with Fintech selected, you MUST generate Product Page and Application Form events, NEVER KYC or Account Funding events.
   - NEVER generate shopping cart or checkout events unless the user explicitly mentions 'cart', 'checkout', or 'purchase'.
   - NEVER generate app retention or onboarding events unless the user explicitly mentions 'app', 'retention', 'onboarding', or 'churn'.

4. CONSISTENT EVENT NAMES: Every event name MUST be in lowercase snake_case (e.g. product_page_viewed, apply_cta_clicked, application_form_started, application_form_submitted).
5. NO BENCHMARKS OR TARGETS: NEVER invent arbitrary numbers, percentage targets, or benchmarks (e.g. DO NOT say "Target: 15%"). Express KPIs strictly conceptually and with mathematical calculation formulas.
6. NO PERSONAL DATA: Never ask for or include personally identifiable information (PII) like email, phone, personal name, or card data in tracking parameters.
7. PLAIN, NON-TECHNICAL LANGUAGE: Explain triggers and parameters so junior analysts and marketers immediately understand what they mean and when they fire.
8. MULTI-OBJECTIVE & MULTI-PILLAR MANDATE: When a user provides a messy or multi-objective goal (e.g., combining e-commerce checkouts, blog tracking, and app retention), the plan MUST address ALL stated pillars rather than dropping any objective. Assign a 'pillar' name to every KPI, event, and table row.
9. FORMAT: Respond in valid JSON matching the requested schema.`;

        const userPrompt = `EXACT USER GOAL TO MEASURE: "${trimmedGoal}"
Extracted User Keywords: [${userKeywords}]
Selected Industry Dropdown: ${industry} (SCOPE: Use ONLY to guide parameter terminology like 'financial_product_type', NEVER override the workflow!)
Platform Context: ${platform}
Analytics Tool: ${analyticsTool}
${
  hasClarifications
    ? `User Clarifications Provided:\n${Object.entries(clarifications)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')}`
    : ''
}

CRITICAL EXECUTION MANDATE:
1. STRICT GOAL PARSING: The event schema MUST be directly derived from the specific verbs and nouns in the user's goal input ("${trimmedGoal}").
   - Example: If the goal is "increase clickthrough rates from product pages into application form", you MUST generate product page and application form events (e.g. product_page_viewed, apply_cta_clicked, application_form_started, application_form_submitted).
2. INDUSTRY DROPDOWN SCOPE: The selected Industry (${industry}) should ONLY guide parameter terminology (e.g., using 'financial_product_type' as a parameter), NOT replace the core user workflow.
3. NO DEFAULT TEMPLATE OVERRIDES: Never fall back to standard account funding or KYC templates unless the user explicitly mentions 'KYC', 'funding', or 'deposits' in their text.

Please provide:
1. KPIs: Distinct KPIs directly measuring the specific flow described in "${trimmedGoal}". Each KPI must have name, shortDefinition, whyItMatters, measurementFormula (no made-up benchmarks/numbers!), type ("Macro-conversion" | "Micro-conversion" | "Engagement" | "Retention"), and pillar.
2. Events: Core events directly measuring "${trimmedGoal}" with snake_case eventName, plain description, clear trigger, keyParameters (name in snake_case, description, example), supportedKpi, and pillar.
3. Tracking Plan Table: structured rows connecting eventName, description, trigger, parameters (comma-separated string), kpiSupported, and pillar.
4. Summary tailored specifically to "${trimmedGoal}", and 3 practical governance tips for review.`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Fast fallback to expert engine (12s)')), 12000)
        );

        const geminiCall = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isVague: { type: Type.BOOLEAN },
                clarificationMessage: { type: Type.STRING },
                clarificationQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      context: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['id', 'question', 'options'],
                  },
                },
                plan: {
                  type: Type.OBJECT,
                  properties: {
                    summary: { type: Type.STRING },
                    businessGoal: { type: Type.STRING },
                    industry: { type: Type.STRING },
                    platform: { type: Type.STRING },
                    analyticsTool: { type: Type.STRING },
                    detectedPillars: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    kpis: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          shortDefinition: { type: Type.STRING },
                          whyItMatters: { type: Type.STRING },
                          measurementFormula: { type: Type.STRING },
                          type: { type: Type.STRING },
                          pillar: { type: Type.STRING },
                        },
                        required: [
                          'id',
                          'name',
                          'shortDefinition',
                          'whyItMatters',
                          'measurementFormula',
                          'type',
                        ],
                      },
                    },
                    events: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          eventName: { type: Type.STRING },
                          description: { type: Type.STRING },
                          trigger: { type: Type.STRING },
                          supportedKpi: { type: Type.STRING },
                          pillar: { type: Type.STRING },
                          keyParameters: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                example: { type: Type.STRING },
                              },
                              required: ['name', 'description', 'example'],
                            },
                          },
                        },
                        required: [
                          'id',
                          'eventName',
                          'description',
                          'trigger',
                          'supportedKpi',
                          'keyParameters',
                        ],
                      },
                    },
                    trackingPlanTable: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          eventName: { type: Type.STRING },
                          description: { type: Type.STRING },
                          trigger: { type: Type.STRING },
                          parameters: { type: Type.STRING },
                          kpiSupported: { type: Type.STRING },
                          pillar: { type: Type.STRING },
                        },
                        required: [
                          'eventName',
                          'description',
                          'trigger',
                          'parameters',
                          'kpiSupported',
                        ],
                      },
                    },
                    governanceTips: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                },
              },
              required: ['isVague'],
            },
          },
        });

        const response: any = await Promise.race([geminiCall, timeoutPromise]);

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          // If Gemini decided it is vague and provided questions
          if (parsed.isVague && parsed.clarificationQuestions?.length) {
            return res.json(parsed);
          }
          if (parsed.plan) {
            const rawKpis = Array.isArray(parsed.plan.kpis) ? parsed.plan.kpis : [];
            const rawEvents = Array.isArray(parsed.plan.events) ? parsed.plan.events : [];

            // If the LLM returned incomplete plan, fall through to deterministic expert engine
            if (rawKpis.length > 0 && rawEvents.length > 0) {
              // Ensure snake_case for all event names
              rawEvents.forEach((ev: any) => {
                if (ev.eventName) {
                  ev.eventName = ev.eventName
                    .toLowerCase()
                    .replace(/[^a-z0-9_]+/g, '_')
                    .replace(/^_+|_+$/g, '');
                }
                if (!Array.isArray(ev.keyParameters)) {
                  ev.keyParameters = [];
                }
              });

              let trackingTable = Array.isArray(parsed.plan.trackingPlanTable)
                ? parsed.plan.trackingPlanTable
                : [];

              if (trackingTable.length === 0) {
                trackingTable = rawEvents.map((ev: any) => ({
                  eventName: ev.eventName,
                  description: ev.description || '',
                  trigger: ev.trigger || '',
                  parameters: Array.isArray(ev.keyParameters)
                    ? ev.keyParameters.map((p: any) => p.name).join(', ')
                    : '',
                  kpiSupported: ev.supportedKpi || '',
                }));
              } else {
                trackingTable.forEach((row: any) => {
                  if (row.eventName) {
                    row.eventName = row.eventName
                      .toLowerCase()
                      .replace(/[^a-z0-9_]+/g, '_')
                      .replace(/^_+|_+$/g, '');
                  }
                });
              }

              parsed.plan.kpis = rawKpis;
              parsed.plan.events = rawEvents;
              parsed.plan.trackingPlanTable = trackingTable;
              parsed.plan.governanceTips = Array.isArray(parsed.plan.governanceTips)
                ? parsed.plan.governanceTips
                : [];

              return res.json({
                ...parsed,
                intentType: 'TYPE_A_VALID_GOAL',
              });
            }
          }
        }
      } catch (_ignored) {
        // Upstream high demand or timeout; seamlessly use deterministic consultant engine
      }
    }

    // Fallback to deterministic expert consultant engine
    const localResult = generateLocalConsultantPlan(
      trimmedGoal,
      industry,
      platform,
      analyticsTool,
      clarifications
    );
    return res.json({
      ...localResult,
      intentType: 'TYPE_A_VALID_GOAL',
    });
  } catch (error: any) {
    console.error('Error generating plan:', error);
    return res.status(500).json({
      error: 'Failed to generate measurement plan. Please check your input and try again.',
      details: error.message,
    });
  }
});

// Server-side streaming endpoint supporting Server-Sent Events (SSE)
app.post('/api/generate-plan/stream', async (req: Request, res: Response) => {
  try {
    const { businessGoal, industry = 'Any', platform = 'Both (Web & Mobile)', analyticsTool = 'GA4' } = req.body;
    if (!businessGoal || typeof businessGoal !== 'string' || !businessGoal.trim()) {
      return res.status(400).json({ error: 'Please enter a business goal.' });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      // Deterministic fallback response streamed back
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const localResult = generateLocalConsultantPlan(businessGoal.trim(), industry, platform, analyticsTool);
      res.write(`data: ${JSON.stringify(localResult)}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamResponse = await aiClient.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: `Transform this business tracking goal into a digital measurement plan: "${businessGoal.trim()}" (Industry: ${industry}, Platform: ${platform}, Analytics: ${analyticsTool}). Provide KPIs, events, and tracking table in JSON format.`,
      config: {
        systemInstruction: 'You are a Principal Digital Analytics Consultant. Return valid JSON measurement specifications with snake_case event names.',
        responseMimeType: 'application/json',
      },
    });

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (streamErr: any) {
    console.error('Stream error:', streamErr);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming failed', details: streamErr.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
      res.end();
    }
  }
});

// Setup Vite or static serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Measurement Plan Applet running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
