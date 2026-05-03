import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as openpgp from "openpgp";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = path.join(rootDir, "src", "content", "posts");
const outputDir = path.join(rootDir, "dist", "pgp", "posts");
const publicKeyOutputPath = path.join(rootDir, "dist", "pgp", "gakiyukr.asc");

await loadDotEnv(path.join(rootDir, ".env"));

const signingEnabled = process.env.PGP_SIGNING_ENABLED === "true";
const requireSignatures = process.env.PGP_REQUIRE_SIGNATURES === "true";
const privateKeyArmored = getPrivateKeyArmored();
const passphrase = process.env.PGP_PRIVATE_KEY_PASSPHRASE ?? "";

if (!signingEnabled) {
	console.log("[pgp] Signing disabled. Set PGP_SIGNING_ENABLED=true to enable.");
	process.exit(0);
}

if (!privateKeyArmored) {
	const message =
		"[pgp] Missing PGP_PRIVATE_KEY_BASE64 or PGP_PRIVATE_KEY. Skipping signatures.";
	if (requireSignatures) {
		throw new Error(message);
	}
	console.warn(message);
	process.exit(0);
}

const signingKey = await readSigningKey(privateKeyArmored, passphrase);
const postFiles = await findPostIndexes(postsDir);
let signedCount = 0;
let skippedCount = 0;

await fs.mkdir(outputDir, { recursive: true });
await writePublicKey(signingKey);

for (const filePath of postFiles) {
	const source = await fs.readFile(filePath);
	if (isDraftPost(source.toString("utf8"))) {
		skippedCount += 1;
		continue;
	}

	const slug = path
		.relative(postsDir, path.dirname(filePath))
		.split(path.sep)
		.join("/");
	const safeSlug = slug.split("/").join("__");
	const message = await openpgp.createMessage({ binary: source });
	const signature = await openpgp.sign({
		message,
		signingKeys: signingKey,
		detached: true,
		format: "armored",
	});

	await fs.writeFile(path.join(outputDir, `${safeSlug}.md.asc`), signature);
	signedCount += 1;
}

console.log(
	`[pgp] Signed ${signedCount} post(s). Skipped ${skippedCount} draft post(s).`,
);

async function writePublicKey(signingKey) {
	await fs.mkdir(path.dirname(publicKeyOutputPath), { recursive: true });
	await fs.writeFile(publicKeyOutputPath, signingKey.toPublic().armor());
}

async function loadDotEnv(envPath) {
	let content;
	try {
		content = await fs.readFile(envPath, "utf8");
	} catch (error) {
		if (error.code === "ENOENT") {
			return;
		}
		throw error;
	}

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		const equalsIndex = trimmed.indexOf("=");
		if (equalsIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, equalsIndex).trim();
		const existingValue = process.env[key];
		if (existingValue !== undefined) {
			continue;
		}

		process.env[key] = parseEnvValue(trimmed.slice(equalsIndex + 1).trim());
	}
}

function parseEnvValue(value) {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function getPrivateKeyArmored() {
	const base64Key = process.env.PGP_PRIVATE_KEY_BASE64?.trim();
	if (base64Key) {
		return Buffer.from(base64Key, "base64").toString("utf8");
	}

	return process.env.PGP_PRIVATE_KEY?.replaceAll("\\n", "\n").trim();
}

async function readSigningKey(armoredKey, keyPassphrase) {
	const privateKey = await openpgp.readPrivateKey({ armoredKey });
	if (!keyPassphrase) {
		return privateKey;
	}

	return openpgp.decryptKey({
		privateKey,
		passphrase: keyPassphrase,
	});
}

async function findPostIndexes(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === ".obsidian" || entry.name.toLowerCase() === "draft") {
				continue;
			}
			files.push(...(await findPostIndexes(entryPath)));
			continue;
		}

		if (entry.isFile() && entry.name === "index.md") {
			files.push(entryPath);
		}
	}

	return files;
}

function isDraftPost(markdown) {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) {
		return false;
	}

	return /^draft:\s*true\s*$/im.test(match[1]);
}
