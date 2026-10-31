export interface KPIItem {
  id: string;
  name: string;
  shortDefinition: string;
  whyItMatters: string;
  measurementFormula: string;
  type: 'Macro-conversion' | 'Micro-conversion' | 'Engagement' | 'Retention' | string;
  pillar?: string;
}

export interface KeyParameter {
  name: string;
  description: string;
  example: string;
}

export interface TrackingEvent {
  id: string;
  eventName: string;
  description: string;
  trigger: string;
  keyParameters: KeyParameter[];
  supportedKpi: string;
  pillar?: string;
}

export interface TrackingPlanRow {
  eventName: string;
  description: string;
  trigger: string;
  parameters: string;
  kpiSupported: string;
  pillar?: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  context?: string;
  options: string[];
}

export interface MeasurementPlan {
  summary: string;
  businessGoal: string;
  industry?: string;
  platform?: string;
  analyticsTool?: string;
  detectedPillars?: string[];
  kpis: KPIItem[];
  events: TrackingEvent[];
  trackingPlanTable: TrackingPlanRow[];
  governanceTips?: string[];
}

export interface DefinitionData {
  metricName: string;
  explanation: string;
  calculationFormula?: string;
  suggestedGoals: string[];
  promptToTurnIntoGoal?: string;
}

export type GoalIntentCategory =
  | 'TYPE_A_VALID_GOAL'
  | 'TYPE_B_VAGUE_GOAL'
  | 'TYPE_C_INFORMATIONAL_QUESTION'
  | 'TYPE_D_OUT_OF_SCOPE';

export interface PlanApiResponse {
  intentType?: GoalIntentCategory;
  isVague: boolean;
  isOutOfScope?: boolean;
  outOfScopeError?: string;
  isDefinition?: boolean;
  definition?: DefinitionData;
  clarificationMessage?: string;
  clarificationQuestions?: ClarificationQuestion[];
  plan?: MeasurementPlan;
  error?: string;
}
