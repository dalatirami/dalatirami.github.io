#!/usr/bin/env node
/**
 * webpush/generate-keys.mjs
 * Generates VAPID P-256 ECDSA key pair for Web Push using native Web Crypto.
 * Usage: node generate-keys.mjs
 */

import { webcrypto } from "node:crypto";
const subtle = webcrypto.subtle;

function b64Url(bytes) {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function main() {
  const pair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pub = b64Url(await subtle.exportKey("raw", pair.publicKey));
  const priv = b64Url(await subtle.exportKey("pkcs8", pair.privateKey));

  console.log("\n=== VAPID KEYS FOR DALATI WEBPUSH ===");
  console.log("\nVAPID_PUBLIC_KEY:\n" + pub);
  console.log("\nVAPID_PRIVATE_KEY (Keep secret):\n" + priv);
  console.log("\n--- Store secrets in Cloudflare Worker ---");
  console.log("npx wrangler secret put VAPID_PUBLIC_KEY");
  console.log("npx wrangler secret put VAPID_PRIVATE_KEY\n");
}

main().catch(console.error);
