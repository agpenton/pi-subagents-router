/**
 * Supervisor tests — validates backward compatibility and new features.
 *
 * Run with:  node --experimental-strip-types test/test-supervisor.ts
 */

import { analyzeTaskDescription, Supervisor } from "../src/Supvisor.ts";
import { BUILTIN_AGENTS } from "../src/BuiltinAgents.ts";

// ==========================================================================
// TEST GROUP 0: Backward Compatibility — analyzeTaskDescription
// ==========================================================================

const ROUTE_TEST_CASES = [
     {
    input: "Create documentation for the API",
    expectedAgent: "documenter",
    description: "Basic documenter trigger match (text-order check)",
      },
      {
    input: "Research the latest JavaScript frameworks",
    expectedAgent: "researcher",
    description: "Basic researcher trigger match",
      },
      {
    input: "Implement the user authentication feature",
    expectedAgent: "software-engineer",
    description: "Basic software-engineer trigger match",
      },
      {
    input: "implement documentation for the API",
    expectedAgent: "software-engineer",
    description:
        "NEW FIX: 'implement' at pos 0 beats 'documentation' at pos 10",
      },
      {
    input: "documentation then implement the feature",
    expectedAgent: "documenter",
    description: "NEW FIX: 'documentation' at pos 0 is earliest",
      },
      {
    input: "coding quality assurance testing",
    expectedAgent: "reviewer",
    description:
        "useWhen/avoidWhen: software-engineer scored but penalized, fallback to reviewer",
      },
      {
    input: "",
    expectedAgent: "general-purpose",
    description: "Edge: empty string → general-purpose",
      },
      {
    input: "hello world",
    expectedAgent: "general-purpose",
    description: "Edge: no matching keywords → general-purpose",
      },
];

// ==========================================================================
// TEST GROUP 1: Supervisor class creation
// ==========================================================================

const CLASS_TESTS = [
      {
    name: "Supervisor can be instantiated",
    test: () => {
      const sv = new Supervisor([...BUILTIN_AGENTS], {});
      if (!(sv instanceof Supervisor)) throw new Error("Not an instance");
      },
      },
      {
    name: "Supervisor has routeAgent method",
    test: () => {
      const sv = new Supervisor([...BUILTIN_AGENTS], {});
      if (typeof sv.routeAgent !== "function") {
        throw new Error("routeAgent is not a function");
        }
      },
      },
      {
    name: "Supervisor has planAndRoute method",
    test: () => {
      const sv = new Supervisor([...BUILTIN_AGENTS], {});
      if (typeof sv.planAndRoute !== "function") {
        throw new Error("planAndRoute is not a function");
        }
      },
      },
];

// ==========================================================================
// TEST HELPERS
// ==========================================================================

function runSyncTests(group, tests) {
  console.log("\n" + "=".repeat(55));
  console.log("    " + group + "\n");
  console.log("=".repeat(55));

  let passed = 0, failed = 0;

  tests.forEach((t) => {
    let ok = false;
    try {
      t.test();
      ok = true;
      } catch {
      ok = false;
      }
    if (ok) passed++;
    else failed++;
    console.log("   " + (ok ? "✅" : "❌") + " " + t.name);
    });

  console.log("\n   " + passed + "/" + tests.length + " passed\n");
  return { passed, failed };
}

async function runAsyncTests(group, tests) {
  console.log("\n" + "=".repeat(55));
  console.log("   " + group + "\n");
  console.log("=".repeat(55));

  const results = await Promise.all(
    tests.map(async (t) => {
      try {
        const { ok, error } = await t.test();
        return { name: t.name, ok, error };
        } catch {
        return { name: t.name, ok: false, error: "uncaught" };
        }
       })
    );

  let passed = 0, failed = 0;
  results.forEach((r) => {
    if (r.ok) { passed++; console.log("    ✅ " + r.name); } else {
      failed++;
      console.log("   ❌ " + r.name);
      console.log("       Error: " + r.error);
      }
    });
  console.log("\n   " + passed + "/" + results.length + " passed\n");
  return { passed, failed };
}

function runRouteTests(group, tests) {
  console.log("\n" + "=".repeat(55));
  console.log("    " + group + "\n");
  console.log("=".repeat(55));
  console.log(
    "    " +
      BUILTIN_AGENTS.length +
        " agents: " +
      BUILTIN_AGENTS.map((a) => a.name).join(", ") +
        "\n"
    );

  let passed = 0, failed = 0;

  tests.forEach((tc, i) => {
    const result = analyzeTaskDescription(tc.input, BUILTIN_AGENTS);
    const ok = result.agentType === tc.expectedAgent;

    if (ok) passed++; else failed++;

    console.log("   " + (ok ? "✅" : "❌") + " " + tc.description);
    if (!ok) {
      console.log("       Expected: " + tc.expectedAgent);
      console.log("       Got:        " + result.agentType);
      console.log("       Reason:     " + result.reason);
      }
    });

  console.log("\n   " + passed + "/" + tests.length + " passed\n");
  return { passed, failed };
}

// ==========================================================================
// MAIN
// ==========================================================================

async function main() {
  console.log("\n" + "=".repeat(55));
  console.log("   Pi-Subagents Supervisor Test Suite");
  console.log("=".repeat(55));

      // Group 0: analyzeTaskDescription
  const r0 = runRouteTests(
      "Group 0: analyzeTaskDescription — backward compat",
    ROUTE_TEST_CASES
    );

      // Group 1: Supervisor class
  const r1 = runSyncTests(
      "Group 1: Supervisor class creation",
    CLASS_TESTS
    );

      // Group 2: planAndRoute smoke test
  const r2 = await runAsyncTests(
      "Group 2: planAndRoute smoke test",
      [
        {
        name: "planAndRoute returns agents for 'implement code'",
        test: async () => {
           const sv = new Supervisor([...BUILTIN_AGENTS], {});
           const result = await sv.planAndRoute("implement code");
           return {
            ok:
              result.success === true &&
              result.agents !== null &&
              result.agents.length > 0,
            error: result.error,
            };
           },
          },
          {
        name: "planAndRoute returns agents for 'quality documentation'",
        test: async () => {
           const sv = new Supervisor([...BUILTIN_AGENTS], {});
           const result = await sv.planAndRoute("quality documentation");
           return {
            ok:
              result.success === true &&
              result.agents !== null &&
              result.agents!.length > 0,
            error: result.error,
            };
           },
          },
          {
        name: "planAndRoute with forceAgent overrides",
        test: async () => {
           const sv = new Supervisor([...BUILTIN_AGENTS], {});
           const result = await sv.planAndRoute("anything", {
            forceAgents: ["reviewer"],
            });
           return {
            ok:
              result.agents !== null &&
              result.agents.length === 1 &&
              result.agents[0] === "reviewer",
            error:
              result.error ??
                "agents=" + JSON.stringify(result.agents),
            };
          },
        }
      ]);

      // Summary
  const totalPassed = r0.passed + r1.passed + r2.passed;
  const totalFailed = r0.failed + r1.failed + r2.failed;

  console.log("\n" + "=".repeat(55));
  console.log(
      "   SUMMARY: " +
        totalPassed +
          " passed, " +
        totalFailed +
          " failed, " +
        (totalPassed + totalFailed) +
          " total"
      );
  console.log("=".repeat(55));

  if (totalFailed > 0) {
    console.log("   ❌ Some tests failed!");
    process.exit(1);
     } else {
    console.log("   ✅ All tests passed!");
     }
}

main();
