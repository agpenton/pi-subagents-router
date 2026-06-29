# Demo: Using Pi Subagents Router Extension

## Installation

First, install the extension by placing it in your Pi extensions directory:

```bash
# Clone or copy this repository
cd ~/.pi/agent/extensions
ln -s /path/to/pi-subagents-router/src/agent-router.ts agent-router.ts
```

Or install via npm (when published):

```bash
pi install npm:pi-subagents-router
```

## Starting Pi with the Extension

```bash
# Start Pi - the extension will load automatically
pi
```

You should see a notification: "Agent Router extension loaded - use /assign-agent or automatic routing"

## Demo Scenarios

### Scenario 1: Documentation Task

**Input:**
```
Create comprehensive API documentation for the user service
```

**Expected Output:**
```
[ASSIGNED TO DOCUMENTER] Create comprehensive API documentation for the user service
```

**Agent Response:**
The documenter agent will provide specialized documentation assistance, focusing on structure, clarity, and completeness.

### Scenario 2: Research Task

**Input:**
```
Research the latest trends in frontend development for 2026
```

**Expected Output:**
```
[ASSIGNED TO RESEARCHER] Research the latest trends in frontend development for 2026
```

**Agent Response:**
The researcher agent will gather and analyze information from various sources, providing evidence-based insights.

### Scenario 3: Implementation Task

**Input:**
```
Implement the payment processing feature using Stripe API
```

**Expected Output:**
```
[ASSIGNED TO SOFTWARE-ENGINEER] Implement the payment processing feature using Stripe API
```

**Agent Response:**
The software-engineer agent will provide code-focused assistance, including implementation strategies and best practices.

### Scenario 4: Code Review Task

**Input:**
```
Review the authentication module for security vulnerabilities
```

**Expected Output:**
```
[ASSIGNED TO REVIEWER] Review the authentication module for security vulnerabilities
```

**Agent Response:**
The reviewer agent will analyze the code for quality, security, and architectural issues.

## Using the Command

### Manual Routing

```
/assign-agent Design the database schema for the new e-commerce platform
```

**Output:**
```
Selected agent: software-engineer
Description: Senior software engineering implementation specialist
Reason: Trigger match: "Design"
```

### Listing Agents

```
Use the list_agents tool to see all available agents
```

**Output:**
```
Available Agents:

1. **documenter**
   Description: Documentation specialist responsible for creating and maintaining project documentation
   Thinking: high
   Triggers: documentation, docs, write docs, documentation update, README
   Use When: documentation creation, knowledge documentation, technical writing
   Avoid When: implementation, testing, deployment operations
   Tools: read, grep, find, ls, bash, edit, write, contact_supervisor

2. **researcher**
   Description: Research specialist responsible for information gathering, analysis, and evidence-based insights
   Thinking: high
   Triggers: research, investigate, find information, look up
   Use When: information gathering, market research, technical research, competitive analysis
   Avoid When: implementation, debugging, testing
   Tools: read, grep, find, ls, bash, web_search, fetch_content

... (additional agents)
```

## Advanced Usage

### Forcing a Specific Agent

```
Use the route_agent tool with:
{
  "taskDescription": "Analyze the codebase structure",
  "forceAgent": "reviewer"
}
```

### Checking Routing Logic

If you're unsure which agent will be selected, use the command first:

```
/assign-agent My task description here
```

This will show you the selected agent and reasoning without actually routing the task.

## Troubleshooting

### Extension Not Loading

1. Check that the file is in the correct extensions directory
2. Verify the file has `.ts` extension
3. Check for syntax errors with `npx tsc --noEmit`
4. Restart Pi or use `/reload`

### Routing Not Working

1. Check that your input contains keywords from agent triggers or useWhen criteria
2. Use `/assign-agent` to test the routing logic
3. Review agent configurations with the `list_agents` tool
4. Check the Pi logs for any errors

### Fallback to General-Purpose

If no specific agent is selected, tasks fall back to the general-purpose agent. This is normal for tasks that don't match any specific criteria.

## Customization

To modify the routing behavior:

1. Edit `src/agent-router.ts`
2. Update the `agents` array with your desired configurations
3. Add new agent types or modify existing ones
4. Adjust `useWhen`, `avoidWhen`, and `triggers` arrays
5. Reload the extension with `/reload`

Example of adding a new agent:

```typescript
{
  name: "architect",
  description: "Solution architect specializing in system design",
  thinking: "high",
  tools: ["read", "grep", "find", "ls", "bash"],
  systemPromptMode: "replace",
  inheritProjectContext: true,
  inheritSkills: true,
  triggers: ["architecture", "design", "system design", "solution architecture"],
  useWhen: ["system design", "architecture planning", "technical design", "solution architecture"],
  avoidWhen: ["implementation", "documentation", "testing"]
}
```
