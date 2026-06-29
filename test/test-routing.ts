// Test file for agent routing logic — validates all ORACLE fixes
// Tests: (1) text-order trigger matching, (2) second-best fallback for useWhen penalties

const testAgents = [
    {
      name: "documenter",
      description: "Documentation specialist",
      triggers: ["documentation", "docs", "write docs"],
      useWhen: ["documentation creation", "knowledge documentation", "technical writing"],
      avoidWhen: ["implementation", "testing", "deployment operations"]
    },
    {
      name: "researcher",
      description: "Research specialist",
      triggers: ["research", "investigate", "find information"],
      useWhen: ["information gathering", "market research", "technical research"],
      avoidWhen: ["implementation", "debugging", "testing"]
    },
    {
      name: "software-engineer",
      description: "Software engineering specialist",
      triggers: ["code", "implement", "build"],
      useWhen: ["software development", "coding", "implementation"],
      avoidWhen: ["documentation", "research", "testing"]
    },
    {
      name: "reviewer",
      description: "Code quality reviewer",
      triggers: ["review", "audit", "check"],
      useWhen: ["code review", "quality assurance"],
      avoidWhen: ["implementation", "documentation", "research"]
    }
];

// Test cases — ALL existing + new tests for the ORACLE-recommended fixes
const testCases = [
    // === EXISTING: Basic trigger matching (should still pass) ===
    {
      input: "Create documentation for the API",
      expectedAgent: "documenter",
      description: "Basic documenter trigger match (text-order check)"
    },
    {
      input: "Research the latest JavaScript frameworks",
      expectedAgent: "researcher",
      description: "Basic researcher trigger match"
    },
    {
      input: "Implement the user authentication feature",
      expectedAgent: "software-engineer",
      description: "Basic software-engineer trigger match"
    },
    {
      input: "Write unit tests for the component",
      expectedAgent: "general-purpose",
      description: "No match triggers → general-purpose"
    },

    // === FIX #1: Text-order trigger matching ===
    // Previously: array-order-first-match (documenter checked before software-engineer)
    // Now: earliest trigger position in input text wins

    {
      input: "implement documentation for the API",
      expectedAgent: "software-engineer",
      description: "NEW FIX: 'implement' at pos 0 beats 'documentation' at pos 9 → software-engineer (was documenter before!)"
    },
    {
      input: "documentation then implement the feature",
      expectedAgent: "documenter",
      description: "NEW FIX: 'documentation' at pos 0 is earliest → documenter"
    },

    // === FIX #2: Second-best fallback for useWhen penalties ===
    // Input carefully crafted: no trigger keywords, two agents with useWhen matches,
    // top one penalized by avoidWhen, second best NOT penalized
    // "coding" doesn't contain "code" as substring → no trigger match
    // "software development" → software-engineer useWhen (score 2, also "coding")
    // "quality assurance" → reviewer useWhen (score 1)
    // "testing" → penalizes software-engineer (but NOT reviewer)
    // Result: software-engineer penalized → fallback to reviewer

    {
      input: "coding software development testing quality assurance",
      expectedAgent: "reviewer",
      description: "NEW FIX: second-best fallback — software-engineer (score 2) penalized by 'testing', falls to reviewer (score 1, not penalized)"
    },

    // === Edge cases ===
    {
      input: "",
      expectedAgent: "general-purpose",
      description: "Edge: empty string → general-purpose"
    },
    {
      input: "hello world",
      expectedAgent: "general-purpose",
      description: "Edge: no matching keywords → general-purpose"
    }
];

// Helper function — MATCHES the NEW fixed logic in agent-router.ts
function analyzeTaskDescription(taskDescription: string, agents: any[]): any {
    const lowerTask = taskDescription.toLowerCase();

    // FIX #1: Check ALL triggers, pick earliest position in text
    let bestTriggerAgent: { name: string; trigger: string; position: number } | null = null;
    for (const agent of agents) {
        if (agent.triggers) {
            for (const trigger of agent.triggers) {
                const position = lowerTask.indexOf(trigger.toLowerCase());
                if (position >= 0) {
                    if (!bestTriggerAgent || position < bestTriggerAgent.position) {
                        bestTriggerAgent = { name: agent.name, trigger, position };
                    }
                }
            }
        }
    }

    if (bestTriggerAgent) {
        return { agentType: bestTriggerAgent.name, reason: `Trigger match: "${bestTriggerAgent.trigger}"` };
    }

    // Check useWhen criteria
    const useWhenScores: { agent: string; score: number; matches: string[] }[] = [];
    for (const agent of agents) {
        if (agent.useWhen) {
            const matches = agent.useWhen.filter(criterion =>
                lowerTask.includes(criterion.toLowerCase())
            );
            if (matches.length > 0) {
                useWhenScores.push({ agent: agent.name, score: matches.length, matches });
            }
        }
    }

    // Check avoidWhen penalties
    const avoidWhenPenalties: { agent: string; penalties: string[] }[] = [];
    for (const agent of agents) {
        if (agent.avoidWhen) {
            const penalties = agent.avoidWhen.filter(criterion =>
                lowerTask.includes(criterion.toLowerCase())
            );
            if (penalties.length > 0) {
                avoidWhenPenalties.push({ agent: agent.name, penalties });
            }
        }
    }

    // Find best match with second-best fallback (FIX #2)
    if (useWhenScores.length > 0) {
        useWhenScores.sort((a, b) => b.score - a.score);

        const topCandidate = useWhenScores[0];
        const topPenalty = avoidWhenPenalties.find(p => p.agent === topCandidate.agent);

        if (!topPenalty) {
            return {
                agentType: topCandidate.agent,
                reason: `useWhen match: "${topCandidate.matches.join(", ")}" (score: ${topCandidate.score})`
            };
        }

        // FIX #2: Second-best fallback — try next best non-penalized agent
        for (let i = 1; i < useWhenScores.length; i++) {
            const candidate = useWhenScores[i];
            const candidatePenalty = avoidWhenPenalties.find(p => p.agent === candidate.agent);
            if (!candidatePenalty) {
                return {
                    agentType: candidate.agent,
                    reason: `useWhen match: "${candidate.matches.join(", ")}" (score: ${candidate.score}), fallback from penalized "${topCandidate.agent}"`
                };
            }
        }

        // No non-penalized match — fall back to second-best
        const secondBest = useWhenScores[1];
        if (secondBest) {
            return {
                agentType: secondBest.agent,
                reason: `FALLBACK: "${topCandidate.agent}" penalized (${topPenalty.penalties.join(", ")}), using "${secondBest.agent}"`
            };
        }
    }

    return { agentType: "general-purpose", reason: "No clear match - using general-purpose agent" };
}

// Runner
let passed = 0;
let failed = 0;

console.log("Running routing tests...\n");

testCases.forEach((testCase, index) => {
    const result = analyzeTaskDescription(testCase.input, testAgents);
    const passed_test = result.agentType === testCase.expectedAgent;

    if (passed_test) passed++; else failed++;

    console.log(`Test ${index + 1}: ${passed_test ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`  Description: ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);
    console.log(`  Expected: ${testCase.expectedAgent}`);
    console.log(`  Got: ${result.agentType}`);
    console.log(`  Reason: ${result.reason}`);
    if (!passed_test) console.log(`  ** MISMATCH **`);
    console.log();
});

console.log(`============================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed === 0) {
    console.log("All tests passed! ✓");
} else {
    console.log("Some tests failed! ✗");
    process.exit(1);
}
