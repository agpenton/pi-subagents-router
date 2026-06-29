/**
 * AgentConfig — Shared type for all agents (builtin + filesystem).
 *
 * This file extracts the AgentConfig interface from the monolithic
 * agent-router.ts so it can be imported by all modules.
 */

export type AgentSource = "builtin" | "filesystem";

export interface AgentConfig {
  name: string;
  description: string;
  thinking?: string;
  tools?: string[];
  systemPromptMode?: string;
  inheritProjectContext?: boolean;
  inheritSkills?: boolean;
  triggers?: string[];
  useWhen?: string[];
  avoidWhen?: string[];

  // NEW (Phase 1+): capability-based routing
  capabilities?: string[]; // capabilities this agent provides
  consumes?: string[];     // dependencies (inputs needed)
  produces?: string[];     // dependencies (outputs produced)
  dependsOn?: string[];    // agents this agent depends on
  source?: AgentSource;    // "builtin" | "filesystem"
}

/**
 * Simple routing decision
 */
export interface RoutingDecision {
  agentType: string;
  reason: string;
}

/**
 * Route result — single agent
 */
export interface RouteResult {
  success: boolean;
  error?: string;
  agentId?: string;
  agentType?: string;
  reason?: string;
  details?: Record<string, any>;
}

/**
 * Plan result — multi-agent workflow
 */
export interface PlanResult {
  success: boolean;
  error?: string;
  agents?: string[];     // names of agents to execute
  steps?: string[];      // executed step descriptions
  results?: Record<string, any>; // results keyed by agent name
}
