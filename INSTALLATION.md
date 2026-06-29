# Installation Guide for Pi Subagents Router Extension

## Quick Start

### Method 1: Direct File Installation (Recommended)

```bash
# Clone this repository or download the files
git clone https://github.com/your-repo/pi-subagents-router.git
cd pi-subagents-router

# Install to global Pi extensions
mkdir -p ~/.pi/agent/extensions
ln -s $(pwd)/src/agent-router.ts ~/.pi/agent/extensions/agent-router.ts

# Or install to project-local extensions
mkdir -p .pi/extensions
ln -s ../src/agent-router.ts .pi/extensions/agent-router.ts
```

### Method 2: Manual Copy

```bash
# Copy the extension file to your Pi extensions directory
cp src/agent-router.ts ~/.pi/agent/extensions/agent-router.ts
```

### Method 3: Package Installation (When Published)

```bash
# Install via npm (when package is published)
pi install npm:pi-subagents-router
```

## Starting Pi with the Extension

```bash
# Start Pi normally - the extension will load automatically
pi
```

You should see a notification: **"Agent Router extension loaded - use /assign-agent or automatic routing"**

## Verification

### Check Extension Loading

```bash
# List loaded extensions
pi --list-extensions
```

### Test Automatic Routing

Type a task description and observe the routing:

```
Create documentation for the API endpoint
```

Should show: `[ASSIGNED TO DOCUMENTER] Create documentation for the API endpoint`

### Test Manual Routing

```
/assign-agent Research the latest web development trends
```

Should show the selected agent and routing reason.

## Troubleshooting

### Extension Not Loading

1. **Check file location**: Ensure the file is in `~/.pi/agent/extensions/` or `.pi/extensions/`
2. **Check file permissions**: `chmod +r ~/.pi/agent/extensions/agent-router.ts`
3. **Check syntax**: `node -c ~/.pi/agent/extensions/agent-router.ts`
4. **Reload Pi**: Use `/reload` command or restart Pi
5. **Check logs**: Look for error messages in the Pi console

### Routing Not Working

1. **Check input format**: Make sure you're not using commands (starting with `/`)
2. **Use keywords**: Include terms like "documentation", "research", "implement"
3. **Test with command**: `/assign-agent your task here`
4. **List agents**: Use the `list_agents` tool to see available agents

### Common Issues

**Issue**: No routing prefix appears
- **Solution**: Check that the extension loaded (look for startup notification)
- **Solution**: Use `/reload` to reload extensions

**Issue**: Always routes to general-purpose
- **Solution**: Make task descriptions more specific
- **Solution**: Include trigger keywords from agent definitions
- **Solution**: Check `list_agents` to see available criteria

**Issue**: Wrong agent selected
- **Solution**: Use `/assign-agent` to see the routing reason
- **Solution**: Modify task description to be more specific
- **Solution**: Force a specific agent using the tool

## Uninstallation

```bash
# Remove the symlink or file
rm ~/.pi/agent/extensions/agent-router.ts

# Or for project-local
rm .pi/extensions/agent-router.ts

# Restart Pi
pi
```

## Updating

```bash
# Pull the latest changes
cd pi-subagents-router
git pull origin main

# Restart Pi or reload extensions
pi
# Then: /reload
```

## Configuration

### Customizing Agent Definitions

Edit `src/agent-router.ts` and modify the `agents` array:

```typescript
// Add a new agent
agents.push({
  name: "architect",
  description: "Solution architect specializing in system design",
  thinking: "high",
  triggers: ["architecture", "system design"],
  useWhen: ["system design", "technical architecture"],
  avoidWhen: ["implementation", "documentation"]
});
```

### Modifying Existing Agents

```typescript
// Find the documenter agent and add more triggers
const documenter = agents.find(a => a.name === "documenter");
if (documenter) {
  documenter.triggers.push("wiki", "knowledge base");
  documenter.useWhen.push("wiki creation");
}
```

## Development Setup

```bash
# Install dependencies
npm install

# Run tests
node test/test-routing.ts

# Test with Pi
pi -e ./src/agent-router.ts
```

## System Requirements

- Pi Coding Agent (latest version recommended)
- Node.js 18+ (for development only)
- TypeScript 5+ (for development only)

## Support

For issues, questions, or feature requests:
- Open a GitHub issue
- Check the documentation in `README.md`
- Review the examples in `examples/` directory

## License

MIT License - See `LICENSE` file for details.
