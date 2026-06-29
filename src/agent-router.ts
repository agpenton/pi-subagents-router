/**
 * pi-subagents — Agent Router Extension
 *
 * v2.0: Supervisor-based routing (refactored from monolithic agent-router.ts)
 *
 * Entry point that wires the Supervisor into the VS Code extension host.
 * Exposes:
 *   - "route_agent" tool       (single-agent, same behavior as v1)
 *   - "plan_and_route" tool   (multi-agent workflow, NEW)
 *   - "/assign-agent" command  (backward-compatible shortcut)
 *   - "list_agents" tool      (list all available agents)
 *
 * @see https://github.com/tintinweb/pi-subagents
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import { Supervisor } from "./Supvisor.ts";
import { BUILTIN_AGENTS } from "./BuiltinAgents.ts";

const PI_SUBAGENTS_REPO = "https://github.com/tintinweb/pi-subagents";

// ============================================================================
// Entry point
// ============================================================================

export default async function(pi: ExtensionAPI) {
  // Build the supervisor with builtin agents
  const supervisor = new Supervisor([...BUILTIN_AGENTS], pi);

  // ---- Register route_agent tool (UNCHANGED behavior) ------------------
  pi.registerTool({
    name: "route_agent",
    label: "Route Agent",
    description: `Route tasks to appropriate sub-agents via pi-subagents (${PI_SUBAGENTS_REPO})`,
    parameters: Type.Object({
      taskDescription: Type.String({ description: "Description of the task to be performed" }),
      forceAgent: Type.Optional(Type.String({ description: "Optionally force a specific agent type" })),
      runInBackground: Type.Optional(Type.Boolean({ description: "Run the agent in background (non-blocking)" })),
      thinking: Type.Optional(Type.String({ description: "Thinking level" })),
      model: Type.Optional(Type.String({ description: "Model to use" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx: any) {
      const { taskDescription, forceAgent, runInBackground, thinking, model } = params;

      // If forceAgent is specified, use it directly
      if (forceAgent) {
        const result = await supervisor.routeAgent(
          taskDescription,
          forceAgent,
          runInBackground,
          thinking,
          model
        );

        if (result.success) {
          const agent = BUILTIN_AGENTS.find((a) => a.name === result.agentType);
          return {
            content: [{
              type: "text",
              text: `Routed to agent: ${result.agentType} via pi-subagents\n\n${agent?.description ?? ""}\n\nAgent ID: ${result.agentId ?? "foreground"}\n\nExecuted by: ${PI_SUBAGENTS_REPO}`,
            }],
            details: {
              agentType: result.agentType,
              reason: result.reason ?? "Forced by user",
              subagentRepo: PI_SUBAGENTS_REPO,
              agentId: result.agentId,
            },
          };
        } else {
          return {
            content: [{
              type: "text",
              text: `Failed to spawn agent '${forceAgent}': ${result.error}`,
            }],
            details: { error: result.error },
          };
        }
      }

      // Otherwise, analyze and route normally
      const result = await supervisor.routeAgent(
        taskDescription,
        undefined,
        runInBackground,
        thinking,
        model
      );

      if (result.success) {
        const agent = BUILTIN_AGENTS.find((a) => a.name === result.agentType);
        return {
          content: [{
            type: "text",
            text: `Routed to agent: ${result.agentType} via pi-subagents\n\nDescription: ${agent?.description ?? ""}\n\nReason: ${result.reason ?? ""}\n\nAgent ID: ${result.agentId ?? "foreground"}\n\nExecuted by: ${PI_SUBAGENTS_REPO}`,
          }],
          details: {
            agentType: result.agentType,
            reason: result.reason,
            subagentRepo: PI_SUBAGENTS_REPO,
            agentId: result.agentId,
          },
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `Failed to spawn agent: ${result.error}`,
          }],
          details: { error: result.error },
        };
      }
    },
  });

  // ---- Register plan_and_route tool (NEW — multi-agent workflow) --------
  pi.registerTool({
    name: "plan_and_route",
    label: "Plan and Route",
    description: `Plan a multi-agent workflow via pi-subagents (${PI_SUBAGENTS_REPO}). Launches multiple agents in parallel based on goal keywords.`,
    parameters: Type.Object({
      goal: Type.String({ description: "The goal description for multi-agent execution" }),
      forceAgents: Type.Optional(Type.Array(Type.String({ description: "Agent names to force" }))),
      runInBackground: Type.Optional(Type.Boolean({ description: "Run agents in background" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx: any) {
      const { goal, forceAgents, runInBackground } = params;

      const result = await supervisor.planAndRoute(goal, { forceAgents, background: runInBackground });

      if (result.success) {
        return {
          content: [{
            type: "text",
            text: `Multi-agent workflow launched successfully!\n\nAgents: ${(result.agents ?? []).join(", ")}\nSteps:\n${(result.steps ?? []).join("\n")}`,
          }],
          details: {
            agents: result.agents,
            results: result.results,
            subagentRepo: PI_SUBAGENTS_REPO,
          },
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `Failed to plan workflow: ${result.error}`,
          }],
          details: { error: result.error },
        };
      }
    },
  });

  // ---- Register /assign-agent command (UNCHANGED behavior) --------------
  pi.registerCommand("assign-agent", {
    description: `Route tasks to appropriate sub-agents via pi-subagents (${PI_SUBAGENTS_REPO})`,
    handler: async (input: string, ctx: any) => {
      if (!input) {
        ctx.ui.notify("Please provide a task description", "error");
        return;
      }

      const result = await supervisor.routeAgent(input, undefined, false);

      if (result.success) {
        ctx.ui.notify(`Routed to ${result.agentType}: ${result.reason ?? ""} (via pi-subagents)`, "info");
      } else {
        ctx.ui.notify(`Failed to spawn agent: ${result.error}`, "error");
      }
    },
  });

  // ---- Register list_agents tool (UNCHANGED behavior) ------------------
  pi.registerTool({
    name: "list_agents",
    label: "List Agents",
    description: `List all available agents and their routing criteria (${PI_SUBAGENTS_REPO})`,
    parameters: Type.Object({}),
    async execute() {
      const agents = [
        ...BUILTIN_AGENTS,
         // TODO: add filesystem agents here when implemented
      ];

      let response = `Available Agents (routed via pi-subagents):\n\n`;
      agents.forEach((agent, index) => {
        response += `${index + 1}. **${agent.name}**\n`;
        response += `   Description: ${agent.description}\n`;
        response += `   Thinking: ${agent.thinking ?? "medium"}\n`;
        response += `   Triggers: ${agent.triggers?.join(", ") ?? "none"}\n`;
        response += `   Use When: ${agent.useWhen?.join(", ") ?? "any"}\n`;
        response += `   Avoid When: ${agent.avoidWhen?.join(", ") ?? "none"}\n`;
        response += `   Tools: ${agent.tools?.join(", ") ?? "default"}\n\n`;
      });

      return {
        content: [{ type: "text", text: response }],
        details: {
          agents: agents.map((a) => ({
            name: a.name,
            description: a.description,
            useWhen: a.useWhen,
            avoidWhen: a.avoidWhen,
          })),
          subagentRepo: PI_SUBAGENTS_REPO,
        },
      };
    },
  });

  // ---- Intercept input (UNCHANGED behavior from old code) --------------
  pi.on("input", async (event: any, ctx: any) => {
    // Skip commands / special prefixes
    if (event.text.startsWith("/") || event.text.startsWith("!")) {
      return { action: "continue" };
    }

    // Analyze and route
    const result = await supervisor.routeAgent(event.text, undefined, true);

    if (result.success) {
      ctx.ui.notify(
        `Auto-routed to ${result.agentType}: ${result.reason ?? ""} (via pi-subagents)`,
        "info"
      );
      return { action: "handled" };
    } else {
      // Fallback to text transformation instead of suppressing
      ctx.ui.notify(`Auto-routing failed: ${result.error}`, "warning");
      return {
        action: "transform",
        text: `[ROUTED] ${event.text}`,
      };
    }
  });

  // ---- Session start notification (UNCHANGED) --------------------------
  pi.on("session_start", async (_event: any, ctx: any) => {
    ctx.ui.notify(`${PI_SUBAGENTS_REPO} engine loaded — route_agent and plan_and_route available`, "info");
  });
}
