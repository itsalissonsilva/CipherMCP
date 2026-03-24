# Changelog

## 0.2.3 - 2026-03-23

- added newline-delimited JSON transport support for clients like Cursor that do not use `Content-Length` framing
- made the server respond in the same transport mode the client uses, fixing Cursor parsing errors on `Content-Length` output
- kept the stdio startup and initialize negotiation fixes from the previous patch releases
- updated the README with the working Cursor `npx.cmd` stdio configuration
- clarified that the upstream `cipher.tools` API currently exposes 72 ciphers

## 0.2.2 - 2026-03-23

- fixed stdio startup by explicitly resuming `stdin` in the server startup path
- improved MCP initialize negotiation by echoing the client protocol version instead of always returning a fixed older version
- updated tests to cover the newer initialize handshake shape

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
