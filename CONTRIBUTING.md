# Contributing to Cipher MCP

Thanks for your interest in contributing. Cipher MCP is still early, and contributions of all kinds are welcome.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/CipherMCP.git`
3. Enter the project: `cd CipherMCP`
4. Install or verify your Node environment
5. Create a branch: `git checkout -b my-feature`

## Development

Run the local test suite:

```powershell
node test/server.test.mjs
```

Test the MCP server locally:

```powershell
node bin/cipher-mcp.js
```

### Project Structure

- `src/index.mjs` - MCP server entry point, tool registration, protocol transport
- `bin/cipher-mcp.js` - npm CLI entrypoint
- `test/server.test.mjs` - local test harness and mocked upstream coverage
- `server.json` - MCP distribution metadata
- `README.md` - project overview and user-facing setup docs

## Submitting Changes

1. Make your changes on a feature branch
2. Ensure `node test/server.test.mjs` passes
3. Update `README.md` if the change affects users
4. Update `CHANGELOG.md` for notable releases
5. Open a pull request against `main`

### What Makes a Good PR

- Focused: one fix or feature per PR
- Tested: behavior is verified locally
- Documented: user-facing changes are reflected in the docs
- Small enough to review quickly

## Ideas for Contributions

### Good First Issues

- add validators for more cipher families supported by `cipher.tools`
- improve heuristic detection quality and explanation text
- add more built-in examples for common ciphers
- improve tool output formatting for MCP clients

### Larger Projects

- add true classical-cryptanalysis helpers such as frequency counts and n-grams
- add a human-facing CLI for common cipher tasks
- expand packaging metadata for more MCP registries
- add a broader automated test matrix

## Code Style

- ES modules
- minimal dependencies
- readable code over clever abstractions
- keep helper tools fast and deterministic where possible

## Questions?

Open an issue at [itsalissonsilva/CipherMCP](https://github.com/itsalissonsilva/CipherMCP/issues). Happy to help.
