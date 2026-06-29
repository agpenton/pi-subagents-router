/**
 * BuiltinAgents — The 4 hardcoded agents extracted from agent-router.ts
 */

import type { AgentConfig } from "./AgentConfig.ts";

export const BUILTIN_AGENTS: AgentConfig[] = [
  {
    name: "documenter",
    description:
      "Documentation specialist responsible for creating and maintaining project documentation",
    thinking: "high",
    tools: [
      "read",
      "grep",
      "find",
      "ls",
      "bash",
      "edit",
      "write",
      "contact_supvisor",
    ],
    systemPromptMode: "replace",
    inheritProjectContext: true,
    inheritSkills: false,
    triggers: [
      "documentation",
      "docs",
      "write docs",
      "documentation update",
      "README",
    ],
    useWhen: [
      "documentation creation",
      "knowledge documentation",
      "technical writing",
    ],
    avoidWhen: [
      "implementation",
      "testing",
      "deployment operations",
    ],
    capabilities: ["documentation", "knowledge", "writing"],
    produces: ["docs", "readme", "technical-writing"],
    source: "builtin",
  },
  {
    name: "researcher",
    description:
      "Research specialist responsible for information gathering, analysis, and evidence-based insights",
    thinking: "high",
    tools: [
      "read",
      "grep",
      "find",
      "ls",
      "bash",
      "web_search",
      "fetch_content",
    ],
    systemPromptMode: "replace",
    inheritProjectContext: true,
    inheritSkills: true,
    triggers: [
      "research",
      "investigate",
      "find information",
      "look up",
    ],
    useWhen: [
      "information gathering",
      "market research",
      "technical research",
      "competitive analysis",
    ],
    avoidWhen: ["implementation", "debugging", "testing"],
    capabilities: ["research", "analysis", "information-gathering"],
    produces: ["research-report", "findings", "evidence"],
    source: "builtin",
  },
  {
    name: "software-engineer",
    description: "Senior software engineering implementation specialist",
    thinking: "medium",
    tools: [
      "read",
      "grep",
      "find",
      "ls",
      "bash",
      "edit",
      "write",
      "contact_supvisor",
    ],
    systemPromptMode: "replace",
    inheritProjectContext: true,
    inheritSkills: true,
    triggers: ["code", "implement", "build", "develop", "program"],
    useWhen: [
      "software development",
      "coding",
      "implementation",
      "feature development",
    ],
    avoidWhen: [
      "documentation",
      "research",
      "testing",
    ],
    capabilities: ["implementation", "coding", "software-development"],
    produces: ["code", "source-files", "implementation"],
    source: "builtin",
  },
  {
    name: "reviewer",
    description: "Code quality reviewer responsible for validating implementation quality",
    thinking: "medium",
    tools: ["read", "grep", "find", "ls", "bash"],
    systemPromptMode: "replace",
    inheritProjectContext: true,
    inheritSkills: true,
    triggers: ["review", "audit", "check", "validate"],
    useWhen: [
      "code review",
      "quality assurance",
      "architecture review",
      "security review",
    ],
    avoidWhen: ["implementation", "documentation", "research"],
    capabilities: ["review", "quality-assurance", "auditing"],
    produces: ["review-report", "quality-feedback", "audit"],
    source: "builtin",
  },
];

/**
 * Simple keyword → capability mapping for built-in routing.
 * Used when capabilities are not explicitly declared on agents.
 */
export const KEYWORD_TO_CAPABILITY: Record<string, string[]> = {
  // Documentation
  documentation: ["documentation", "knowledge", "writing"],
  docs: ["documentation", "knowledge", "writing"],
  "write docs": ["documentation", "knowledge", "writing"],
  readme: ["documentation", "knowledge", "writing"],

  // Research
  research: ["research", "analysis", "information-gathering"],
  investigate: ["research", "analysis", "information-gathering"],
  "find information": ["research", "analysis", "information-gathering"],
  "look up": ["research", "analysis", "information-gathering"],

  // Engineering
  implement: ["implementation", "coding", "software-development"],
  build: ["implementation", "coding", "software-development"],
  develop: ["implementation", "coding", "software-development"],
  program: ["implementation", "coding", "software-development"],
  code: ["implementation", "coding", "software-development"],

  // Review
  review: ["review", "quality-assurance", "auditing"],
  audit: ["review", "quality-assurance", "auditing"],
  check: ["review", "quality-assurance", "auditing"],
  validate: ["review", "quality-assurance", "auditing"],
};
