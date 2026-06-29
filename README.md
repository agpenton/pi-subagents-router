# Pi Subagents Router Extension

A TypeScript extension for Pi that intelligently routes tasks to appropriate agent types based on task descriptions using `useWhen` and `avoidWhen` criteria.

## Features

- **Automatic Agent Routing**: Analyzes task descriptions and automatically selects the best agent type
- **Custom Tools**: Provides tools for manual routing (`route_agent`) and agent information (`list_agents`)
- **Custom Commands**: Includes `/assign-agent` command for manual routing
- **Input Interception**: Automatically routes tasks based on natural language input
- **Configurable Agents**: Easy to extend with additional agent types and criteria
- **Second-best Fallback**: When the top agent is penalized, tries the next best alternative instead of giving up

## Routing Algorithm

```
1. Scans ALL trigger keywords across ALL agents, picks the earliest position in input text
2. Scoring: counts useWhen matches per agent (most matches = highest score)
3. Check avoidWhen penalties (keyword found → penalize that agent)
4. If top-scoring agent is penalized, find the next-highest unpenalized agent (fallback)
5. If all agents penalized, fall back to general-purpose
```

> **Key improvement** (v1.1): Trigger matching is now **text-order aware** — the earliest keyword in the input determines routing priority. For example, \"implement documentation\" routes to the software-engineer (\"implement\" at pos 0) instead of the documenter (\"documentation\" at pos 9).

## Usage

### Automatic Routing

The extension automatically analyzes your input and routes to the appropriate agent:

```
User: "Create documentation for the new API endpoint"
→ Automatically routed to: documenter

User: "Research the latest React hooks best practices"
→ Automatically routed to: researcher

User: "Implement the user authentication feature"
→ Automatically routed to: software-engineer
```

### Manual Routing

Use the `/assign-agent` command:

```
/assign-agent Create comprehensive documentation for the database schema
```

### List Available Agents

```
Use the list_agents tool to see all available agents and their criteria.
```

### Force Specific Agent

```
Use the route_agent tool with forceAgent parameter to override automatic routing.
```

## Agent Configuration

The extension comes with predefined agents:

### Documenter
- **Description**: Documentation specialist responsible for creating and maintaining project documentation
- **Use When**: documentation creation, knowledge documentation, technical writing
- **Avoid When**: implementation, testing, deployment operations
- **Triggers**: documentation, docs, write docs, documentation update, README

### Researcher  
- **Description**: Research specialist responsible for information gathering, analysis, and evidence-based insights
- **Use When**: information gathering, market research, technical research, competitive analysis
- **Avoid When**: implementation, debugging, testing
- **Triggers**: research, investigate, find information, look up

### Software Engineer
- **Description**: Senior software engineering implementation specialist
- **Use When**: software development, coding, implementation, feature development
- **Avoid When**: documentation, research, testing
- **Triggers**: code, implement, build, develop, program

### Reviewer
- **Description**: Code quality reviewer responsible for validating implementation quality
- **Use When**: code review, quality assurance, architecture review, security review
- **Avoid When**: implementation, documentation, research
- **Triggers**: review, audit, check, validate

## Customization

To add or modify agent configurations:

1. Edit the `agents` array in `src/agent-router.ts`
2. Add new agent configurations with appropriate `useWhen`, `avoidWhen`, and `triggers`
3. Reload the extension with `/reload`

## Development

```bash
# Install dependencies
npm install

# Run tests
npx tsx test/test-routing.ts
```

## License

MIT License

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

## Support

For issues and questions, please open a GitHub issue.
