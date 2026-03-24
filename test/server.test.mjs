import assert from "node:assert/strict";
import {
  createServerTransport,
  getTools,
  handleToolCall,
  SERVER_INFO,
} from "../src/index.mjs";

function encodeMessage(message) {
  const payload = Buffer.from(JSON.stringify(message), "utf8");
  return Buffer.from(`Content-Length: ${payload.length}\r\n\r\n${payload.toString("utf8")}`, "utf8");
}

function encodeMessageLfOnly(message) {
  const payload = Buffer.from(JSON.stringify(message), "utf8");
  return Buffer.from(`Content-Length: ${payload.length}\n\n${payload.toString("utf8")}`, "utf8");
}

function encodeJsonLineMessage(message) {
  return Buffer.from(`${JSON.stringify(message)}\n`, "utf8");
}

function createHarness() {
  let buffer = Buffer.alloc(0);
  const responses = [];
  const transport = createServerTransport({
    write(chunk) {
      buffer = Buffer.concat([buffer, chunk]);

      while (true) {
        const trimmedPreview = buffer.toString("utf8", 0, Math.min(buffer.length, 32)).trimStart();
        if (trimmedPreview.startsWith("{")) {
          const newlineIndex = buffer.indexOf("\n");
          if (newlineIndex === -1) {
            break;
          }

          const line = buffer.subarray(0, newlineIndex).toString("utf8").trim();
          buffer = buffer.subarray(newlineIndex + 1);

          if (line !== "") {
            responses.push(JSON.parse(line));
          }

          continue;
        }

        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) {
          break;
        }

        const headerText = buffer.subarray(0, headerEnd).toString("utf8");
        const match = headerText.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
          buffer = Buffer.alloc(0);
          break;
        }

        const contentLength = Number.parseInt(match[1], 10);
        const messageEnd = headerEnd + 4 + contentLength;
        if (buffer.length < messageEnd) {
          break;
        }

        const payload = buffer.subarray(headerEnd + 4, messageEnd).toString("utf8");
        buffer = buffer.subarray(messageEnd);
        responses.push(JSON.parse(payload));
      }
    },
  });

  return {
    send(message) {
      transport.read(encodeMessage(message));
      const response = responses.shift();
      assert.ok(response, "expected a response from the server");
      return response;
    },
    sendLfOnly(message) {
      transport.read(encodeMessageLfOnly(message));
      const response = responses.shift();
      assert.ok(response, "expected a response from the server");
      return response;
    },
    sendJsonLine(message) {
      transport.read(encodeJsonLineMessage(message));
      const response = responses.shift();
      assert.ok(response, "expected a response from the server");
      return response;
    },
    writeJsonLine(message) {
      transport.read(encodeJsonLineMessage(message));
    },
  };
}

async function withMockedFetch(implementation, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = implementation;

  try {
    await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

function createTextResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return body;
    },
  };
}

function testInitializeAndListTools() {
  const client = createHarness();
  const init = client.send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    },
  });

  assert.equal(init.result.serverInfo.name, SERVER_INFO.name);
  assert.equal(init.result.protocolVersion, "2025-06-18");

  const tools = client.send({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  assert.equal(tools.result.tools.length, getTools().length);
  assert.deepEqual(
    tools.result.tools.map((tool) => tool.name),
    getTools().map((tool) => tool.name)
  );
}

function testRejectsToolCallsBeforeInitialize() {
  const client = createHarness();
  const response = client.send({
    jsonrpc: "2.0",
    id: 99,
    method: "tools/list",
    params: {},
  });

  assert.equal(response.error.code, -32002);
  assert.match(response.error.message, /initialize/i);
}

function testMethodNotFound() {
  const client = createHarness();
  client.send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {},
  });

  const response = client.send({
    jsonrpc: "2.0",
    id: 2,
    method: "nope/method",
    params: {},
  });

  assert.equal(response.error.code, -32601);
}

function testInitializeAndListToolsWithLfOnlyHeaders() {
  const client = createHarness();
  const init = client.sendLfOnly({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    },
  });

  assert.equal(init.result.serverInfo.name, SERVER_INFO.name);

  const tools = client.sendLfOnly({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  assert.equal(tools.result.tools.length, getTools().length);
}

function testInitializeAndListToolsWithJsonLines() {
  const client = createHarness();
  const init = client.sendJsonLine({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: {
        name: "cursor-style-client",
        version: "1.0.0",
      },
    },
  });

  assert.equal(init.result.serverInfo.name, SERVER_INFO.name);
  assert.equal(init.result.protocolVersion, "2025-11-25");

  client.writeJsonLine({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {},
  });

  const tools = client.sendJsonLine({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  assert.equal(tools.result.tools.length, getTools().length);
}

async function testEncryptToolUsesFormats() {
  await withMockedFetch(async (url, options) => {
    assert.equal(options.method, "GET");
    assert.equal(url.pathname, "/api/v1/encode");
    assert.equal(url.searchParams.get("cipher"), "caesar");
    assert.equal(url.searchParams.get("key"), "2");
    assert.equal(url.searchParams.get("plaintext"), "HELLO");
    assert.deepEqual(url.searchParams.getAll("format"), ["case:upper", "block:5"]);

    return createJsonResponse(200, {
      normaltext: "HELLO",
      ciphertext: "JGNNQ",
    });
  }, async () => {
    const result = await handleToolCall("encrypt_text", {
      cipher: "caesar",
      key: "2",
      plaintext: "HELLO",
      format: ["case:upper", "block:5"],
    });

    assert.match(result.content[0].text, /Encryption result/);
    assert.match(result.content[0].text, /JGNNQ/);
  });
}

async function testDecryptToolSuccess() {
  await withMockedFetch(async (url) => {
    assert.equal(url.pathname, "/api/v1/decode");
    assert.equal(url.searchParams.get("cipher"), "caesar");
    assert.equal(url.searchParams.get("key"), "2");
    assert.equal(url.searchParams.get("ciphertext"), "JGNNQ");

    return createJsonResponse(200, {
      plaintext: "HELLO",
    });
  }, async () => {
    const result = await handleToolCall("decrypt_text", {
      cipher: "caesar",
      key: "2",
      ciphertext: "JGNNQ",
    });

    assert.match(result.content[0].text, /Decryption result/);
    assert.match(result.content[0].text, /HELLO/);
  });
}

async function testListCiphersSuccess() {
  await withMockedFetch(async (url) => {
    assert.equal(url.pathname, "/api/v1/ciphers");
    return createJsonResponse(200, ["caesar", "affine", "vigenere"]);
  }, async () => {
    const result = await handleToolCall("list_ciphers", {});
    assert.match(result.content[0].text, /Supported ciphers/);
    assert.match(result.content[0].text, /caesar/);
    assert.match(result.content[0].text, /vigenere/);
  });
}

async function testNormalizeText() {
  const result = await handleToolCall("normalize_text", {
    text: "Hello, World! 123",
    preserveSpaces: true,
  });

  assert.match(result.content[0].text, /"normalized": "HELLO WORLD"/);
}

async function testValidateCipherInputValidAffine() {
  const result = await handleToolCall("validate_cipher_input", {
    cipher: "affine",
    key: "5 13",
    text: "Meet me at dawn",
  });

  assert.match(result.content[0].text, /"valid": true/);
  assert.match(result.content[0].text, /"normalizedText": "MEET ME AT DAWN"/);
}

async function testValidateCipherInputRejectsBadAffine() {
  const result = await handleToolCall("validate_cipher_input", {
    cipher: "affine",
    key: "2 13",
  });

  assert.match(result.content[0].text, /coprime with 26/);
  assert.match(result.content[0].text, /"valid": false/);
}

async function testRandomKeyForCaesar() {
  const result = await handleToolCall("random_key", {
    cipher: "caesar",
  });

  assert.match(result.content[0].text, /"cipher": "caesar"/);
  assert.match(result.content[0].text, /"key": "\d+"/);
}

async function testRandomKeyRejectsUnsupportedCipher() {
  await assert.rejects(
    () =>
      handleToolCall("random_key", {
        cipher: "unknown",
      }),
    /No random key generator/
  );
}

async function testHealthCheckSuccess() {
  await withMockedFetch(async (url) => {
    assert.equal(url.pathname, "/api/v1/ciphers");
    return createJsonResponse(200, ["caesar", "affine", "vigenere", "playfair"]);
  }, async () => {
    const result = await handleToolCall("health_check", {});
    assert.match(result.content[0].text, /"ok": true/);
    assert.match(result.content[0].text, /"cipherCount": 4/);
  });
}

async function testExamplesForCipher() {
  const result = await handleToolCall("examples_for_cipher", {
    cipher: "vigenere",
  });

  assert.match(result.content[0].text, /"exampleKey": "LEMON"/);
  assert.match(result.content[0].text, /"plaintext": "ATTACKATDAWN"/);
}

async function testDetectPossibleCiphers() {
  const result = await handleToolCall("detect_possible_ciphers", {
    text: "LXFOPVEFRNHR",
  });

  assert.match(result.content[0].text, /Possible cipher matches/);
  assert.match(result.content[0].text, /vigenere/);
}

async function testOversizedPlaintextRejected() {
  await assert.rejects(
    () =>
      handleToolCall("encrypt_text", {
        cipher: "caesar",
        key: "2",
        plaintext: "A".repeat(501),
      }),
    /500-character API limit/
  );
}

async function testInvalidFormatRejected() {
  await assert.rejects(
    () =>
      handleToolCall("encrypt_text", {
        cipher: "caesar",
        key: "2",
        plaintext: "HELLO",
        format: ["case:upper", ""],
      }),
    /format/
  );
}

async function testUnknownToolRejected() {
  await assert.rejects(() => handleToolCall("unknown_tool", {}), /Unknown tool/);
}

async function testUpstreamHttpErrorSurfaced() {
  await withMockedFetch(async () => createJsonResponse(400, { error: "Bad key" }), async () => {
    await assert.rejects(
      () =>
        handleToolCall("decrypt_text", {
          cipher: "caesar",
          key: "bad",
          ciphertext: "JGNNQ",
        }),
      /HTTP 400/
    );
  });
}

async function testUpstreamTextErrorSurfaced() {
  await withMockedFetch(async () => createTextResponse(502, "gateway unavailable"), async () => {
    await assert.rejects(
      () =>
        handleToolCall("list_ciphers", {}),
      /gateway unavailable/
    );
  });
}

const tests = [
  ["initialize and list tools", testInitializeAndListTools],
  ["rejects tool calls before initialize", testRejectsToolCallsBeforeInitialize],
  ["returns method not found", testMethodNotFound],
  ["supports lf-only headers", testInitializeAndListToolsWithLfOnlyHeaders],
  ["supports newline-delimited json", testInitializeAndListToolsWithJsonLines],
  ["encrypt tool uses formats", testEncryptToolUsesFormats],
  ["decrypt tool succeeds", testDecryptToolSuccess],
  ["list ciphers succeeds", testListCiphersSuccess],
  ["normalize text", testNormalizeText],
  ["validate affine input", testValidateCipherInputValidAffine],
  ["reject bad affine key", testValidateCipherInputRejectsBadAffine],
  ["random key for caesar", testRandomKeyForCaesar],
  ["reject unsupported random key cipher", testRandomKeyRejectsUnsupportedCipher],
  ["health check succeeds", testHealthCheckSuccess],
  ["example for cipher", testExamplesForCipher],
  ["detect possible ciphers", testDetectPossibleCiphers],
  ["rejects oversized plaintext", testOversizedPlaintextRejected],
  ["rejects invalid format", testInvalidFormatRejected],
  ["rejects unknown tool", testUnknownToolRejected],
  ["surfaces upstream JSON http error", testUpstreamHttpErrorSurfaced],
  ["surfaces upstream text http error", testUpstreamTextErrorSurfaced],
];

let passed = 0;

for (const [name, run] of tests) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log(`All ${passed} tests passed.`);
