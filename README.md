<div align="center">

# Cipher MCP

Classical cipher workflows for AI agents.

Install one MCP server. Your agent can encrypt, decrypt, normalize, validate, and explore ciphers in one place.

[![npm version](https://img.shields.io/npm/v/cipher-mcp.svg)](https://www.npmjs.com/package/cipher-mcp)
[![npm downloads](https://img.shields.io/npm/dm/cipher-mcp.svg)](https://www.npmjs.com/package/cipher-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[npm](https://www.npmjs.com/package/cipher-mcp) · [GitHub](https://github.com/itsalissonsilva/CipherMCP) · [Contributing](./CONTRIBUTING.md)

</div>

---

Cipher MCP is an MCP server built for classical cipher workflows. It wraps the public [cipher.tools](https://cipher.tools/) API for live encryption and decryption, then adds the local helper tools that agents actually need in practice: text normalization, key validation, random key generation, examples, and heuristic cipher detection.

## Why?

Most MCP setups can call tools, but classical ciphers still involve a lot of manual setup around the actual cipher operation:

- plaintext often needs normalization before results are predictable
- keys need shape checks before an upstream API call fails
- agents benefit from examples when exploring unfamiliar cipher families
- mystery ciphertext often needs some lightweight local analysis before choosing a tool

Cipher MCP closes that gap:

```text
Agent needs to work with a cipher
  -> normalize_text(...)
  -> validate_cipher_input(...)
  -> encrypt_text(...) or decrypt_text(...)
  -> detect_possible_ciphers(...) when the input is unknown
  -> examples_for_cipher(...) for fast experimentation
```

## Quick Start

Run it directly:

```powershell
npx cipher-mcp
```

Then add it to your MCP client.

Claude Code / Codex / other stdio MCP clients:

```json
{
  "mcpServers": {
    "ciphertools": {
      "command": "npx",
      "args": ["-y", "cipher-mcp"]
    }
  }
}
```

For local development:

```json
{
  "mcpServers": {
    "ciphertools": {
      "command": "node",
      "args": ["C:\\Users\\Lenovo\\Documents\\CipherMCP\\bin\\cipher-mcp.js"]
    }
  }
}
```

Optional environment variable:

```powershell
$env:CIPHERTOOLS_API_BASE_URL="https://cipher.tools/api/v1"
```

## Tools

| Tool | Description |
| --- | --- |
| `encrypt_text` | Encrypt plaintext with a selected cipher and key via `cipher.tools` |
| `decrypt_text` | Decrypt ciphertext with a selected cipher and key via `cipher.tools` |
| `list_ciphers` | Fetch the current upstream cipher list |
| `normalize_text` | Uppercase text, strip punctuation, and optionally preserve spaces |
| `validate_cipher_input` | Catch bad key shapes and text compatibility issues before API calls |
| `random_key` | Generate a plausible key for supported cipher families |
| `health_check` | Verify upstream reachability and report latency |
| `examples_for_cipher` | Return ready-to-run sample inputs for common ciphers |
| `detect_possible_ciphers` | Heuristically guess likely cipher families from text shape |

## How It Works

Cipher MCP combines two layers:

1. Upstream API wrappers
   - `encrypt_text`
   - `decrypt_text`
   - `list_ciphers`
   - `health_check`
2. Local workflow helpers
   - `normalize_text`
   - `validate_cipher_input`
   - `random_key`
   - `examples_for_cipher`
   - `detect_possible_ciphers`

That split is intentional. The upstream API handles the actual cipher operations, while the local tools make the MCP much easier to use in real agent workflows.

### Example Flow

```text
normalize_text({
  "text": "Meet me at dawn!",
  "preserveSpaces": true
})

validate_cipher_input({
  "cipher": "affine",
  "key": "5 13",
  "text": "MEET ME AT DAWN"
})

encrypt_text({
  "cipher": "affine",
  "key": "5 13",
  "plaintext": "MEET ME AT DAWN"
})
```

### Built-in Support

The strongest local support currently targets a curated set of common classical ciphers:

- `caesar`
- `affine`
- `vigenere`
- `beaufort`
- `playfair`
- `railfence`
- `columnartransposition`

For other cipher names, Cipher MCP still supports upstream encryption and decryption as long as `cipher.tools` does, but local validation and key generation may fall back to generic behavior.

## Security

Important:

- live cipher operations call the public `cipher.tools` API over the network
- helper tools such as normalization, validation, key generation, examples, and heuristic detection run locally
- no private backend is involved in this project

If you are working with sensitive material, treat `encrypt_text` and `decrypt_text` as remote API calls rather than offline cryptography primitives.

## Upstream API

Cipher MCP currently wraps the public endpoints documented on [cipher.tools](https://cipher.tools/):

- `GET /api/v1/encode`
- `GET /api/v1/decode`
- `GET /api/v1/ciphers`

Current assumptions:

- the upstream API accepts up to 500 characters for `plaintext` and `ciphertext`
- cipher-specific key formats are passed through directly

## Development

```powershell
git clone https://github.com/itsalissonsilva/CipherMCP.git
cd CipherMCP
node test/server.test.mjs
```

Test locally with an MCP client:

```json
{
  "mcpServers": {
    "cipher-dev": {
      "command": "node",
      "args": ["C:\\Users\\Lenovo\\Documents\\CipherMCP\\bin\\cipher-mcp.js"]
    }
  }
}
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## Roadmap

### Features

- richer structured MCP outputs instead of text-only JSON blocks
- more built-in validators and key generators for additional ciphers
- better ciphertext analysis helpers such as frequency counts and index of coincidence
- registry metadata and distribution polish for MCP directories
- optional CLI helpers for humans working with cipher samples
