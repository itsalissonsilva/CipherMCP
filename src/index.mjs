import { Buffer } from "node:buffer";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const SERVER_INFO = {
  name: "cipher-mcp",
  version: "0.2.1",
};

const API_BASE_URL = process.env.CIPHERTOOLS_API_BASE_URL ?? "https://cipher.tools/api/v1";
const MAX_TEXT_LENGTH = 500;
const UPPERCASE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const CIPHER_EXAMPLES = {
  caesar: {
    description: "Shift each letter by a fixed number.",
    keyFormat: "Integer shift, for example 2 or 13.",
    exampleKey: "2",
    plaintext: "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG",
  },
  affine: {
    description: "Apply a linear transform to each letter index.",
    keyFormat: "Two integers separated by a space, for example '5 13'.",
    exampleKey: "5 13",
    plaintext: "ONCEINABLUEMOON",
  },
  vigenere: {
    description: "Use a repeating keyword to shift letters.",
    keyFormat: "Alphabetic keyword, for example LEMON.",
    exampleKey: "LEMON",
    plaintext: "ATTACKATDAWN",
  },
  beaufort: {
    description: "A reciprocal polyalphabetic substitution related to Vigenere.",
    keyFormat: "Alphabetic keyword, for example FORTIFICATION.",
    exampleKey: "FORTIFICATION",
    plaintext: "DEFENDTHEEASTWALL",
  },
  playfair: {
    description: "Digraph substitution using a keyword square.",
    keyFormat: "Alphabetic keyword, for example MONARCHY.",
    exampleKey: "MONARCHY",
    plaintext: "HIDETHEGOLD",
  },
  railfence: {
    description: "Write text in a zig-zag across rails and read row by row.",
    keyFormat: "Integer rail count, for example 3.",
    exampleKey: "3",
    plaintext: "WEAREDISCOVEREDFLEEATONCE",
  },
  columnartransposition: {
    description: "Write text in rows, then read columns according to a keyword.",
    keyFormat: "Alphabetic keyword, for example ZEBRAS.",
    exampleKey: "ZEBRAS",
    plaintext: "WEAREDISCOVEREDFLEEATONCE",
  },
};

function createTextContent(text) {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

function createToolDefinition(name, description, inputSchema) {
  return { name, description, inputSchema };
}

export function getTools() {
  return [
    createToolDefinition(
      "encrypt_text",
      "Encrypt plaintext with a cipher supported by cipher.tools.",
      {
        type: "object",
        properties: {
          cipher: {
            type: "string",
            description: "Cipher id from cipher.tools, for example caesar or affine.",
          },
          key: {
            type: "string",
            description: "Cipher key exactly as required by the selected cipher.",
          },
          plaintext: {
            type: "string",
            description: `Text to encrypt. The upstream API accepts up to ${MAX_TEXT_LENGTH} characters.`,
          },
          format: {
            oneOf: [
              {
                type: "string",
              },
              {
                type: "array",
                items: {
                  type: "string",
                },
              },
            ],
            description: "Optional output formats, such as block:5 or case:upper.",
          },
        },
        required: ["cipher", "key", "plaintext"],
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "decrypt_text",
      "Decrypt ciphertext with a cipher supported by cipher.tools.",
      {
        type: "object",
        properties: {
          cipher: {
            type: "string",
            description: "Cipher id from cipher.tools, for example caesar or affine.",
          },
          key: {
            type: "string",
            description: "Cipher key exactly as required by the selected cipher.",
          },
          ciphertext: {
            type: "string",
            description: `Text to decrypt. The upstream API accepts up to ${MAX_TEXT_LENGTH} characters.`,
          },
        },
        required: ["cipher", "key", "ciphertext"],
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "list_ciphers",
      "List ciphers currently exposed by cipher.tools.",
      {
        type: "object",
        properties: {},
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "normalize_text",
      "Normalize text for classical cipher workflows by uppercasing, removing punctuation, and optionally preserving spaces.",
      {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Input text to normalize.",
          },
          preserveSpaces: {
            type: "boolean",
            description: "Keep spaces in the normalized output. Defaults to false.",
          },
        },
        required: ["text"],
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "validate_cipher_input",
      "Validate text and key shape for common cipher families before calling cipher.tools.",
      {
        type: "object",
        properties: {
          cipher: {
            type: "string",
            description: "Cipher id, for example caesar, affine, vigenere, or playfair.",
          },
          key: {
            type: "string",
            description: "Cipher key to validate.",
          },
          text: {
            type: "string",
            description: "Optional text to validate for likely compatibility.",
          },
          mode: {
            type: "string",
            enum: ["encrypt", "decrypt"],
            description: "Optional mode label for reporting. Defaults to encrypt.",
          },
        },
        required: ["cipher", "key"],
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "random_key",
      "Generate a plausible random key for supported cipher families.",
      {
        type: "object",
        properties: {
          cipher: {
            type: "string",
            description: "Cipher id to generate a key for.",
          },
        },
        required: ["cipher"],
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "health_check",
      "Verify that the cipher.tools API is reachable and report latency.",
      {
        type: "object",
        properties: {},
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "examples_for_cipher",
      "Return ready-to-run sample input for a supported cipher family.",
      {
        type: "object",
        properties: {
          cipher: {
            type: "string",
            description: "Cipher id to look up.",
          },
        },
        required: ["cipher"],
        additionalProperties: false,
      }
    ),
    createToolDefinition(
      "detect_possible_ciphers",
      "Heuristically guess which classical cipher families may fit a piece of text.",
      {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to inspect.",
          },
        },
        required: ["text"],
        additionalProperties: false,
      }
    ),
  ];
}

function ensureString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`'${fieldName}' must be a non-empty string.`);
  }

  return value;
}

function ensureTextLength(value, fieldName) {
  if (value.length > MAX_TEXT_LENGTH) {
    throw new Error(`'${fieldName}' exceeds the ${MAX_TEXT_LENGTH}-character API limit.`);
  }
}

function normalizeFormats(format) {
  if (format === undefined) {
    return [];
  }

  if (typeof format === "string") {
    return [format];
  }

  if (Array.isArray(format) && format.every((entry) => typeof entry === "string" && entry.trim() !== "")) {
    return format;
  }

  throw new Error("'format' must be a string or an array of non-empty strings.");
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomLetters(length) {
  let output = "";

  for (let i = 0; i < length; i += 1) {
    output += UPPERCASE_ALPHABET[randomInt(0, UPPERCASE_ALPHABET.length - 1)];
  }

  return output;
}

function normalizeTextValue(text, preserveSpaces = false) {
  const normalized = ensureString(text, "text")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toUpperCase()
    .replace(preserveSpaces ? /[^A-Z\s]/g : /[^A-Z]/g, "")
    .replace(/\s+/g, preserveSpaces ? " " : "")
    .trim();

  return normalized;
}

function classifyTextShape(text) {
  return {
    uppercaseOnly: /^[A-Z\s]+$/.test(text),
    digitsOnly: /^[0-9\s]+$/.test(text),
    alphaOnlyNoSpaces: /^[A-Z]+$/.test(text),
    pairsEvenLength: text.replace(/\s+/g, "").length % 2 === 0,
    hasJ: text.includes("J"),
    uniqueChars: new Set(text.replace(/\s+/g, "")).size,
  };
}

function validateCipherInput(args) {
  const cipher = ensureString(args.cipher, "cipher").toLowerCase();
  const key = ensureString(args.key, "key");
  const mode = args.mode ?? "encrypt";
  const text = typeof args.text === "string" ? args.text : undefined;
  const normalizedText = text === undefined ? undefined : normalizeTextValue(text, true);
  const issues = [];
  const warnings = [];

  if (!["encrypt", "decrypt"].includes(mode)) {
    issues.push("mode must be either 'encrypt' or 'decrypt'.");
  }

  switch (cipher) {
    case "caesar":
    case "railfence": {
      if (!/^-?\d+$/.test(key.trim())) {
        issues.push(`${cipher} expects an integer key.`);
      } else if (cipher === "railfence" && Number.parseInt(key, 10) < 2) {
        issues.push("railfence expects a rail count of at least 2.");
      }
      break;
    }
    case "affine": {
      const match = key.trim().match(/^(-?\d+)\s+(-?\d+)$/);
      if (!match) {
        issues.push("affine expects two integers separated by a space, for example '5 13'.");
      } else {
        const a = Number.parseInt(match[1], 10);
        if (gcd(a, 26) !== 1) {
          issues.push("affine requires the first key value to be coprime with 26.");
        }
      }
      break;
    }
    case "vigenere":
    case "beaufort":
    case "playfair":
    case "columnartransposition": {
      if (!/^[A-Za-z]+$/.test(key.trim())) {
        issues.push(`${cipher} expects an alphabetic keyword.`);
      }
      break;
    }
    default:
      warnings.push(`No built-in key validator is defined for '${cipher}', so only basic checks were applied.`);
      break;
  }

  if (normalizedText !== undefined) {
    if (normalizedText.length === 0) {
      issues.push("text becomes empty after normalization.");
    }

    if (cipher === "playfair" && normalizedText.includes("J")) {
      warnings.push("playfair often merges I/J, so text containing J may need preprocessing.");
    }

    if (cipher === "playfair" && normalizedText.replace(/\s+/g, "").length < 2) {
      issues.push("playfair needs at least two letters of text.");
    }
  }

  return {
    cipher,
    mode,
    valid: issues.length === 0,
    issues,
    warnings,
    normalizedText,
  };
}

function generateRandomKey(cipherName) {
  const cipher = ensureString(cipherName, "cipher").toLowerCase();

  switch (cipher) {
    case "caesar":
      return { cipher, key: String(randomInt(1, 25)), notes: ["Integer shift from 1 to 25."] };
    case "railfence":
      return { cipher, key: String(randomInt(2, 8)), notes: ["Rail count from 2 to 8."] };
    case "affine": {
      const validA = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
      const a = validA[randomInt(0, validA.length - 1)];
      const b = randomInt(0, 25);
      return { cipher, key: `${a} ${b}`, notes: ["First value is coprime with 26."] };
    }
    case "vigenere":
    case "beaufort":
    case "playfair":
    case "columnartransposition":
      return { cipher, key: randomLetters(randomInt(5, 8)), notes: ["Random uppercase keyword."] };
    default:
      throw new Error(`No random key generator is defined for '${cipher}'.`);
  }
}

function getExampleForCipher(cipherName) {
  const cipher = ensureString(cipherName, "cipher").toLowerCase();
  const example = CIPHER_EXAMPLES[cipher];

  if (!example) {
    throw new Error(`No built-in example is defined for '${cipher}'.`);
  }

  return {
    cipher,
    ...example,
  };
}

function detectPossibleCiphers(textValue) {
  const original = ensureString(textValue, "text");
  const normalizedNoSpaces = normalizeTextValue(original, false);
  const normalizedWithSpaces = normalizeTextValue(original, true);
  const shape = classifyTextShape(normalizedWithSpaces);
  const suggestions = [];

  if (shape.digitsOnly) {
    suggestions.push({
      cipher: "pollux",
      confidence: "low",
      reason: "The text is numeric-heavy, which can fit digit-based encodings like Pollux.",
    });
  }

  if (shape.uppercaseOnly && shape.alphaOnlyNoSpaces) {
    suggestions.push({
      cipher: "caesar",
      confidence: normalizedNoSpaces.length <= 40 ? "medium" : "low",
      reason: "Short uppercase alphabetic text is a common fit for simple substitution or shift ciphers.",
    });
    suggestions.push({
      cipher: "vigenere",
      confidence: "medium",
      reason: "Uppercase alphabetic text with no punctuation fits polyalphabetic ciphers well.",
    });
  }

  if (shape.pairsEvenLength && normalizedNoSpaces.length >= 4) {
    suggestions.push({
      cipher: "playfair",
      confidence: shape.hasJ ? "low" : "medium",
      reason: "Even-length alphabetic text can match digraph ciphers such as Playfair.",
    });
  }

  if (normalizedWithSpaces.includes(" ") && normalizedNoSpaces.length >= 8) {
    suggestions.push({
      cipher: "columnartransposition",
      confidence: "medium",
      reason: "Preserved word boundaries can appear in transposition-style workflows.",
    });
    suggestions.push({
      cipher: "railfence",
      confidence: "low",
      reason: "Spacing patterns sometimes survive or are reintroduced around transposition ciphers.",
    });
  }

  if (shape.uniqueChars <= Math.max(6, Math.floor(normalizedNoSpaces.length / 3))) {
    suggestions.push({
      cipher: "homophonic",
      confidence: "low",
      reason: "The text has relatively low character variety, which may indicate a patterned substitution output.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      cipher: "caesar",
      confidence: "low",
      reason: "No strong signal was found, so this is only a lightweight fallback guess.",
    });
  }

  return {
    normalizedText: normalizedWithSpaces,
    suggestions,
    notes: [
      "These are heuristics only, not cryptanalysis.",
      "Try normalize_text before encrypting or comparing ciphertext samples.",
    ],
  };
}

async function callCipherTools(endpoint, params) {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);

  for (const [key, value] of params.entries()) {
    url.searchParams.append(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const rawBody = await response.text();
  let parsedBody = rawBody;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    // Preserve raw text if the API responds with a non-JSON error body.
  }

  if (!response.ok) {
    const detail =
      typeof parsedBody === "string"
        ? parsedBody
        : JSON.stringify(parsedBody);

    throw new Error(`cipher.tools returned HTTP ${response.status}: ${detail}`);
  }

  return parsedBody;
}

function formatApiResult(title, data) {
  return `${title}\n\n${JSON.stringify(data, null, 2)}`;
}

export async function handleToolCall(name, args = {}) {
  if (name === "encrypt_text") {
    const cipher = ensureString(args.cipher, "cipher");
    const key = ensureString(args.key, "key");
    const plaintext = ensureString(args.plaintext, "plaintext");
    const formats = normalizeFormats(args.format);

    ensureTextLength(plaintext, "plaintext");

    const params = new URLSearchParams({
      cipher,
      key,
      plaintext,
    });

    for (const format of formats) {
      params.append("format", format);
    }

    const result = await callCipherTools("encode", params);
    return createTextContent(formatApiResult("Encryption result", result));
  }

  if (name === "decrypt_text") {
    const cipher = ensureString(args.cipher, "cipher");
    const key = ensureString(args.key, "key");
    const ciphertext = ensureString(args.ciphertext, "ciphertext");

    ensureTextLength(ciphertext, "ciphertext");

    const params = new URLSearchParams({
      cipher,
      key,
      ciphertext,
    });

    const result = await callCipherTools("decode", params);
    return createTextContent(formatApiResult("Decryption result", result));
  }

  if (name === "list_ciphers") {
    const result = await callCipherTools("ciphers", new URLSearchParams());
    return createTextContent(formatApiResult("Supported ciphers", result));
  }

  if (name === "normalize_text") {
    const normalized = normalizeTextValue(args.text, args.preserveSpaces ?? false);
    return createTextContent(
      formatApiResult("Normalized text", {
        original: args.text,
        normalized,
        preserveSpaces: Boolean(args.preserveSpaces),
      })
    );
  }

  if (name === "validate_cipher_input") {
    const result = validateCipherInput(args);
    return createTextContent(formatApiResult("Cipher input validation", result));
  }

  if (name === "random_key") {
    const result = generateRandomKey(args.cipher);
    return createTextContent(formatApiResult("Random key", result));
  }

  if (name === "health_check") {
    const startedAt = Date.now();
    const result = await callCipherTools("ciphers", new URLSearchParams());
    const latencyMs = Date.now() - startedAt;
    const cipherCount = Array.isArray(result) ? result.length : undefined;

    return createTextContent(
      formatApiResult("Health check", {
        ok: true,
        apiBaseUrl: API_BASE_URL,
        latencyMs,
        cipherCount,
      })
    );
  }

  if (name === "examples_for_cipher") {
    const result = getExampleForCipher(args.cipher);
    return createTextContent(formatApiResult("Cipher example", result));
  }

  if (name === "detect_possible_ciphers") {
    const result = detectPossibleCiphers(args.text);
    return createTextContent(formatApiResult("Possible cipher matches", result));
  }

  throw new Error(`Unknown tool '${name}'.`);
}

export function createServerTransport(output = process.stdout) {
  let initialized = false;
  let buffer = Buffer.alloc(0);

  function writeMessage(message) {
    const payload = Buffer.from(JSON.stringify(message), "utf8");
    const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`, "utf8");
    output.write(Buffer.concat([header, payload]));
  }

  function sendResult(id, result) {
    writeMessage({ jsonrpc: "2.0", id, result });
  }

  function sendError(id, code, message, data) {
    writeMessage({
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        ...(data === undefined ? {} : { data }),
      },
    });
  }

  async function handleRequest(message) {
    const { id, method, params } = message;

    try {
      if (method === "initialize") {
        initialized = true;
        sendResult(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: SERVER_INFO,
        });
        return;
      }

      if (method === "notifications/initialized") {
        return;
      }

      if (!initialized) {
        sendError(id ?? null, -32002, "Server not initialized. Call 'initialize' first.");
        return;
      }

      if (method === "tools/list") {
        sendResult(id, { tools: getTools() });
        return;
      }

      if (method === "tools/call") {
        const toolName = params?.name;
        const argumentsValue = params?.arguments ?? {};
        const result = await handleToolCall(toolName, argumentsValue);
        sendResult(id, result);
        return;
      }

      sendError(id ?? null, -32601, `Method not found: ${method}`);
    } catch (error) {
      sendError(id ?? null, -32000, error instanceof Error ? error.message : "Unexpected server error.");
    }
  }

  function tryReadMessages() {
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");

      if (headerEnd === -1) {
        return;
      }

      const headerText = buffer.subarray(0, headerEnd).toString("utf8");
      const headers = new Map();

      for (const line of headerText.split("\r\n")) {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex === -1) {
          continue;
        }

        const key = line.slice(0, separatorIndex).trim().toLowerCase();
        const value = line.slice(separatorIndex + 1).trim();
        headers.set(key, value);
      }

      const contentLengthValue = headers.get("content-length");
      const contentLength = Number.parseInt(contentLengthValue ?? "", 10);

      if (!Number.isFinite(contentLength) || contentLength < 0) {
        buffer = Buffer.alloc(0);
        return;
      }

      const messageEnd = headerEnd + 4 + contentLength;

      if (buffer.length < messageEnd) {
        return;
      }

      const payload = buffer.subarray(headerEnd + 4, messageEnd).toString("utf8");
      buffer = buffer.subarray(messageEnd);

      let parsedMessage;
      try {
        parsedMessage = JSON.parse(payload);
      } catch {
        sendError(null, -32700, "Invalid JSON payload.");
        continue;
      }

      void handleRequest(parsedMessage);
    }
  }

  return {
    read(chunk) {
      buffer = Buffer.concat([buffer, chunk]);
      tryReadMessages();
    },
  };
}

export function startStdioServer() {
  const transport = createServerTransport(process.stdout);

  process.stdin.on("data", (chunk) => {
    transport.read(chunk);
  });

  process.stdin.on("end", () => {
    process.exit(0);
  });
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  startStdioServer();
}
