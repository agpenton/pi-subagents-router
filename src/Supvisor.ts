/**
 * Supvisor — The agent routing supervisor.
 *
 * Extracts the agent management logic from agent-router.ts and provides
 * two entry points:
 *   - routeAgent() — single-agent routing (same behavior as old)
 *   - planAndRoute() — multi-agent workflow (NEW)
 */

import type {
  AgentConfig,
  RoutingDecision,
  RouteResult,
} from "./AgentConfig.ts";
import { BUILTIN_AGENTS, KEYWORD_TO_CAPABILITY } from "./BuiltinAgents.ts";

// ============================================================================
// Helper: Route to a sub-agent via RPC (extracted from agent-router.ts)
// ============================================================================

interface SpawnOptions {
  thinking?: string;
  model?: string;
  inheritContext?: boolean;
  inheritSkills?: boolean;
  run_in_background?: boolean;
  cwd?: string;
}

interface SpawnRequest {
  requestId: string;
  type: string;
  prompt: string;
  options: SpawnOptions;
}

async function spawnSubAgent(
  pi: any,
  subagentType: string,
  prompt: string,
  description: string,
  runInBackground: boolean = false,
  options: {
    thinking?: string;
    model?: string;
    inheritContext?: boolean;
    inheritSkills?: boolean;
  } = {}
): Promise<{ success: boolean; agentId?: string; error?: string }> {
  const PI_SUBAGENTS_REPO =
    "https://github.com/tintinweb/pi-subagents";
  const requestId = `router-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return new Promise((resolve) => {
    let unsub: (() => void) | null = null;

    const timeout = setTimeout(() => {
      if (unsub) unsub();
      resolve({
        success: false,
        error: `Timed out waiting for pi-subagents RPC reply. Is ${PI_SUBAGENTS_REPO} installed and loaded?`,
      });
    }, 10_000);

    let emitError: string | undefined;
    try {
      pi.events.emit("subagents:rpc:spawn", {
        requestId,
        type: subagentType,
        prompt,
        options: {
          description,
          run_in_background: runInBackground,
          thinking: options.thinking,
          model: options.model,
          inherit_context: options.inheritContext,
          inherit_skills: options.inheritSkills,
        },
      });
    } catch (err: any) {
      emitError = err.message || "Unknown emit error";
    }

    if (emitError) {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: `Failed to emit spawn event to pi-subagents: ${emitError}`,
      });
      return;
    }

    unsub = pi.events.on(
      `subagents:rpc:spawn:reply:${requestId}`,
      (reply: any) => {
        clearTimeout(timeout);
        unsub!();

        if (!reply?.success) {
          resolve({
            success: false,
            error: reply?.error || "Unknown pi-subagents RPC error",
          });
          return;
        }

        resolve({ success: true, agentId: reply.data?.id });
      }
    );
  });
}

// ============================================================================
// Helper: Analyze task description and determine best agent
// (Same as the old analyzeTaskDescription, extracted and made static)
// ============================================================================

export function analyzeTaskDescription(
  taskDescription: string,
  agents: AgentConfig[]
): RoutingDecision {
  const lowerTask = taskDescription.toLowerCase();

  // FIX: Check ALL triggers across ALL agents, then pick earliest position in input text
  let bestTriggerAgent: {
    name: string;
    trigger: string;
    position: number;
  } | null = null;
  for (const agent of agents) {
    if (agent.triggers) {
      for (const trigger of agent.triggers) {
        const position = lowerTask.indexOf(trigger.toLowerCase());
        if (position >= 0) {
          if (
            !bestTriggerAgent ||
            position < bestTriggerAgent.position
          ) {
            bestTriggerAgent = {
              name: agent.name,
              trigger,
              position,
            };
          }
        }
      }
    }
  }

  if (bestTriggerAgent) {
    return {
      agentType: bestTriggerAgent.name,
      reason: `Trigger match: "${bestTriggerAgent.trigger}"`,
    };
  }

  // Check useWhen criteria
  const useWhenScores: {
    agent: string;
    score: number;
    matches: string[];
  }[] = [];
  for (const agent of agents) {
    if (agent.useWhen) {
      const matches = agent.useWhen.filter((criterion) =>
        lowerTask.includes(criterion.toLowerCase())
      );
      if (matches.length > 0) {
        useWhenScores.push({
          agent: agent.name,
          score: matches.length,
          matches: matches,
        });
      }
    }
  }

  // Check avoidWhen penalties
  const avoidWhenPenalties: {
    agent: string;
    penalties: string[];
  }[] = [];
  for (const agent of agents) {
    if (agent.avoidWhen) {
      const penalties = agent.avoidWhen.filter(
        (criterion) => lowerTask.includes(criterion.toLowerCase())
      );
      if (penalties.length > 0) {
        avoidWhenPenalties.push({ agent: agent.name, penalties });
      }
    }
  }

  // Find best match with second-best fallback
  if (useWhenScores.length > 0) {
    useWhenScores.sort((a, b) => b.score - a.score);

    const topCandidate = useWhenScores[0];
    const topPenalty = avoidWhenPenalties.find(
      (p) => p.agent === topCandidate.agent
    );

    if (!topPenalty) {
      return {
        agentType: topCandidate.agent,
        reason: `useWhen match: "${topCandidate.matches.join(
          ", "
        )}" (score: ${topCandidate.score})`,
      };
    }

    // Second-best fallback — try next best non-penalized agent
    for (let i = 1; i < useWhenScores.length; i++) {
      const candidate = useWhenScores[i];
      const candidatePenalty = avoidWhenPenalties.find(
        (p) => p.agent === candidate.agent
      );
      if (!candidatePenalty) {
        return {
          agentType: candidate.agent,
          reason: `useWhen match: "${candidate.matches.join(
            ", "
          )}" (score: ${candidate.score}), fallback from penalized "${topCandidate.agent}"`,
        };
      }
    }

    // No non-penalized match — fall back to second-best
    const secondBest = useWhenScores[1];
    if (secondBest) {
      return {
        agentType: secondBest.agent,
        reason: `FALLBACK: "${topCandidate.agent}" penalized (${topPenalty.penalties.join(", ")}), using "${secondBest.agent}"`,
      };
    }
  }

  return {
    agentType: "general-purpose",
    reason: "No clear match - using general-purpose agent",
  };
}

// ============================================================================
// Supervisor — The main agent routing supervisor class
// ============================================================================

export class Supervisor {
  private agents: AgentConfig[];
  private pi: any;

  constructor(agents: AgentConfig[], pi: any) {
    this.agents = agents;
    this.pi = pi;
  }

   // ========================================================================
   // Single-Agent Routing (UNCHANGED behavior from old code)
   // ========================================================================

  async routeAgent(
    taskDescription: string,
    forceAgent?: string,
    runInBackground?: boolean,
    thinking?: string,
    model?: string
  ): Promise<RouteResult> {
    // If forceAgent is specified, use it directly
    if (forceAgent) {
      const agent = this.agents.find((a) => a.name === forceAgent);
      if (agent) {
        const spawnResult = await spawnSubAgent(
          this.pi,
          agent.name,
          taskDescription,
          taskDescription.substring(0, 50) +
            (taskDescription.length > 50 ? "..." : ""),
          runInBackground || false,
          { thinking: thinking || agent.thinking, model }
        );

        if (spawnResult.success) {
          return {
            success: true,
            agentType: forceAgent,
            agentId: spawnResult.agentId,
            reason: "Forced by user",
          };
        } else {
          return {
            success: false,
            error: `Failed to spawn agent '${forceAgent}': ${spawnResult.error}`,
          };
        }
      } else {
        return {
          success: false,
          error: `Agent not found: ${forceAgent}`,
        };
      }
    }

    // Analyze task description against agent criteria
    const routingDecision = analyzeTaskDescription(
      taskDescription,
      this.agents
    );
    const selectedAgent = this.agents.find(
      (a) => a.name === routingDecision.agentType
    );

    if (!selectedAgent) {
      return {
        success: true,
        agentType: "general-purpose",
        reason: routingDecision.reason,
      };
    }

    // Spawn the sub-agent via pi-subagents RPC
    const spawnResult = await spawnSubAgent(
      this.pi,
      selectedAgent.name,
      taskDescription,
      taskDescription.substring(0, 50) +
        (taskDescription.length > 50 ? "..." : ""),
      runInBackground || false,
      { thinking: thinking || selectedAgent.thinking, model }
    );

    if (spawnResult.success) {
      return {
        success: true,
        agentType: selectedAgent.name,
        reason: routingDecision.reason,
        agentId: spawnResult.agentId,
      };
    } else {
      return {
        success: false,
        error: `Failed to spawn agent '${selectedAgent.name}': ${spawnResult.error}`,
      };
    }
  }

   // ========================================================================
   // Multi-Agent Routing (NEW — planAndRoute)
   // ========================================================================

  /**
   * Plan and route a workflow for multiple agents.
   * Uses keyword matching to find relevant agents, then executes
   * them in parallel (where dependencies allow).
   */
  async planAndRoute(
    goal: string,
    options?: { forceAgents?: string[]; background?: boolean }
  ): Promise<{
    success: boolean;
    agents?: string[];       // selected agents
    steps?: string[];        // executed steps
    results?: Record<string, any>; // results keyed by agent name
    error?: string;
  }> {
    // Step 1: Find relevant agents via keyword matching
    const relevantAgents = options?.forceAgents
      ? this.agents.filter((a) => options!.forceAgents!.includes(a.name))
      : this._findRelevantAgents(goal);

    if (relevantAgents.length === 0) {
      return { success: false, error: "No agents matched for goal" };
    }

    // Step 2: Execute agents in parallel (no dependencies in v2.0)
    const results: Record<string, any> = {};
    const steps: string[] = [];

    const promises = relevantAgents.map(async (agent) => {
      const spawnResult = await spawnSubAgent(
        this.pi,
        agent.name,
        goal,
        goal.substring(0, 50) + (goal.length > 50 ? "..." : ""),
        options?.background || false,
        { model: undefined }
      );

      if (spawnResult.success) {
        results[agent.name] = { success: true, agentId: spawnResult.agentId };
        steps.push(`✅ ${agent.name}: spawned (id: ${spawnResult.agentId})`);
      } else {
        results[agent.name] = { success: false, error: spawnResult.error };
        steps.push(`❌ ${agent.name}: failed (${spawnResult.error})`);
      }
    });

    await Promise.all(promises);

    return {
      success: true,
      agents: relevantAgents.map((a) => a.name),
      results,
      steps,
    };
  }

   // ========================================================================
   // Internal: Find relevant agents by keyword matching
   // ========================================================================

  private _findRelevantAgents(goal: string): AgentConfig[] {
    const lowerGoal = goal.toLowerCase();
    const scores: Map<string, number> = new Map();

    for (const agent of this.agents) {
      let score = 0;

      // Check triggers (highest priority)
      if (agent.triggers) {
        for (const trigger of agent.triggers) {
          if (lowerGoal.includes(trigger.toLowerCase())) {
            score += 10;
          }
        }
      }

      // Check useWhen
      if (agent.useWhen) {
        for (const when of agent.useWhen) {
          if (lowerGoal.includes(when.toLowerCase())) {
            score += 5;
          }
        }
      }

      // Subtract for avoidWhen
      if (agent.avoidWhen) {
        for (const when of agent.avoidWhen) {
          if (lowerGoal.includes(when.toLowerCase())) {
            score -= 3;
          }
        }
      }

      if (score > 0) scores.set(agent.name, score);
    }

    // Return agents with score > 0, sorted by score descending
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => this.agents.find((a) => a.name === name)!)
      .filter(Boolean);
  }

   // ========================================================================
   // Helper: Get all agents (builtin + filesystem)
   // ========================================================================

  static async getAllAgents(): Promise<AgentConfig[]> {
    return BUILTIN_AGENTS;
  }
}
