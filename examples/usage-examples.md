# Pi Subagents Router - Usage Examples

## Basic Usage

### Example 1: Automatic Routing

When you type a task description, the extension automatically routes to the appropriate agent:

```
User: Create comprehensive documentation for the new authentication system
→ [ASSIGNED TO DOCUMENTER] Create comprehensive documentation for the new authentication system
```

The documenter agent will then respond with specialized documentation-focused assistance.

### Example 2: Research Task

```
User: Research the latest advancements in machine learning for natural language processing
→ [ASSIGNED TO RESEARCHER] Research the latest advancements in machine learning for natural language processing
```

### Example 3: Implementation Task

```
User: Implement the user profile management feature with TypeScript
→ [ASSIGNED TO SOFTWARE-ENGINEER] Implement the user profile management feature with TypeScript
```

## Manual Routing with Command

### Using /assign-agent command

```
/assign-agent Analyze the codebase architecture and suggest improvements
```

This will:
1. Analyze the task description
2. Select the most appropriate agent
3. Show you which agent was selected and why
4. Route your request to that agent

## Using the Tools

### route_agent Tool

The LLM can use this tool to route tasks programmatically:

```json
{
  "tool": "route_agent",
  "parameters": {
    "taskDescription": "Write API documentation for the payment service",
    "forceAgent": "documenter"
  }
}
```

### list_agents Tool

Get information about all available agents:

```json
{
  "tool": "list_agents",
  "parameters": {}
}
```

## Advanced Examples

### Example 4: Complex Task with Multiple Criteria

```
User: Create technical documentation for the database migration process and include code examples
→ [ASSIGNED TO DOCUMENTER] Create technical documentation for the database migration process and include code examples
```

The router recognizes "technical documentation" as a documenter task, even though it includes "code examples".

### Example 5: Task That Could Be Ambiguous

```
User: Review the authentication implementation and document any security issues
→ [ASSIGNED TO REVIEWER] Review the authentication implementation and document any security issues
```

The router prioritizes "review" and "security issues" over "document", selecting the reviewer agent.

### Example 6: Forcing a Specific Agent

```
User: I want the researcher to analyze this code implementation
→ [ASSIGNED TO RESEARCHER] I want the researcher to analyze this code implementation
```

The router detects the explicit mention of "researcher" and routes accordingly.

## Configuration Examples

### Adding a New Agent Type

To add a new agent to the router, edit the `agents` array in `src/agent-router.ts`:

```typescript
{
  name: "tester",
  description: "Quality assurance specialist focused on testing",
  thinking: "medium",
  tools: ["read", "grep", "find", "ls", "bash"],
  systemPromptMode: "replace",
  inheritProjectContext: true,
  inheritSkills: true,
  triggers: ["test", "testing", "qa", "quality assurance"],
  useWhen: ["test creation", "test execution", "quality assurance", "test automation"],
  avoidWhen: ["implementation", "documentation", "research"]
}
```

### Customizing Existing Agents

Modify the `useWhen`, `avoidWhen`, and `triggers` arrays to change routing behavior:

```typescript
// Make documenter also handle README updates
{
  name: "documenter",
  // ... other properties
  triggers: ["documentation", "docs", "write docs", "documentation update", "README", "readme"],
  useWhen: ["documentation creation", "knowledge documentation", "technical writing", "README updates"],
  // ...
}
```

## Troubleshooting

### No Agent Selected

If the router can't determine an appropriate agent, it falls back to the general-purpose agent:

```
User: What time is it?
→ [ASSIGNED TO GENERAL-PURPOSE] What time is it?
```

### Conflicting Criteria

When a task matches both `useWhen` and `avoidWhen` criteria for the same agent, the router explains why it avoided that agent:

```
User: Implement the feature and write documentation
→ [ASSIGNED TO GENERAL-PURPOSE] Implement the feature and write documentation
Reason: Potential match software-engineer was avoided due to: "documentation"
```

## Best Practices

1. **Be specific**: More detailed task descriptions lead to better routing
2. **Use keywords**: Include terms that match agent triggers and useWhen criteria
3. **Check routing**: Use `/assign-agent` if you're unsure which agent will be selected
4. **Review agents**: Use `list_agents` tool to understand available agents and their criteria
5. **Force when needed**: Use `forceAgent` parameter when you need a specific agent type
