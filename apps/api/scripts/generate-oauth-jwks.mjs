import { exportJWK, generateKeyPair } from "jose";

const { privateKey } = await generateKeyPair("RS256", { extractable: true });
const key = await exportJWK(privateKey);
key.alg = "RS256";
key.use = "sig";
key.kid = crypto.randomUUID();
process.stdout.write(`${JSON.stringify({ keys: [key] })}\n`);
