# cipher-mcp

Classical cipher tools for AI agents.

Install one MCP server and get encryption, decryption, normalization, key generation, validation, examples, and lightweight cipher detection in one place.

[cipher.tools](https://cipher.tools/) powers the live encode/decode/cipher-list endpoints. Everything else is local, fast, and works even when the upstream API is unavailable.

---

## Why?

Most MCP clients can call tools, but they still need a good cryptography workflow around them:

- text often needs to be normalized before classical ciphers behave predictably
- keys need basic validation before an API call fails
- agents benefit from examples and random key generation when exploring ciphers
- heuristic guidance helps when you only have a mystery ciphertext sample

`cipher-mcp` wraps the public `cipher.tools` API and adds the local ergonomics around it.

## Quick Start

Run it with `npx` once published:

```powershell
npx cipher-mcp
```

Or run it locally with Node:

```powershell
node C:\Users\Lenovo\Documents\CipherMCP\bin\cipher-mcp.js
```

Add it to an MCP client:

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

For local development without publishing:

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

This server combines two layers:

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

That split is intentional. The upstream API handles the actual cipher operations, while the local tools make the MCP more useful in real agent workflows.

## Example Workflows

Normalize before encryption:

```text
normalize_text({
  "text": "Meet me at dawn!",
  "preserveSpaces": true
})
```

Validate and generate a key:

```text
random_key({
  "cipher": "affine"
})

validate_cipher_input({
  "cipher": "affine",
  "key": "5 13",
  "text": "MEET ME AT DAWN"
})
```

Encrypt with the live API:

```text
encrypt_text({
  "cipher": "caesar",
  "key": "2",
  "plaintext": "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG"
})
```

Explore an unfamiliar cipher:

```text
examples_for_cipher({
  "cipher": "vigenere"
})

detect_possible_ciphers({
  "text": "LXFOPVEFRNHR"
})
```

## Built-in Support

The strongest local support currently targets a curated set of common classical ciphers:

- `caesar`
- `affine`
- `vigenere`
- `beaufort`
- `playfair`
- `railfence`
- `columnartransposition`

For other cipher names, the MCP still supports upstream encryption and decryption as long as `cipher.tools` does, but local validation and key generation may fall back to generic behavior.

## Upstream API

This project wraps the public endpoints documented on [cipher.tools](https://cipher.tools/):

- `GET /api/v1/encode`
- `GET /api/v1/decode`
- `GET /api/v1/ciphers`

Current assumptions:

- the upstream API accepts up to 500 characters for `plaintext` and `ciphertext`
- cipher-specific key formats are passed through directly

## Development

Requirements:

- Node.js 18+ with global `fetch`

Run tests:

```powershell
node C:\Users\Lenovo\Documents\CipherMCP\test\server.test.mjs
```

Recent verification:

- local test suite passed: 19/19 tests
- live `health_check` succeeded against `https://cipher.tools/api/v1`

## Roadmap

- polish responses into richer structured MCP output
- add more built-in cipher validators and key generators
- add true ciphertext analysis helpers like frequency counts and index of coincidence
- package for easier npm-style installation
- publish distribution metadata for MCP directories and registries
