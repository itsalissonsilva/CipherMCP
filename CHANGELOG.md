# Changelog

## 0.2.1 - 2026-03-23

- fixed the npm CLI entrypoint so `npx cipher-mcp` starts the stdio server instead of exiting immediately
- exported an explicit server startup function and invoked it from the package bin entrypoint

## 0.2.0 - 2026-03-23

- renamed the npm package to `cipher-mcp`
- added publish-ready CLI packaging through `bin/cipher-mcp.js`
- added README improvements for quick start, tools, workflows, and npm usage
- added helper tools:
  - `normalize_text`
  - `validate_cipher_input`
  - `random_key`
  - `health_check`
  - `examples_for_cipher`
  - `detect_possible_ciphers`
- expanded local verification to 19 tests

## 0.1.0 - 2026-03-23

- initial stdio MCP server
- added `encrypt_text`, `decrypt_text`, and `list_ciphers`
- integrated with the public `cipher.tools` API
