import simpleGit from "simple-git";

const git = simpleGit();

const LOG_RECORD_SEPARATOR = "\u001e";
const LOG_FIELD_SEPARATOR = "\u001f";

const HIDDEN_COMMIT_PATTERNS = [
	/^(chore|style|ci|build|test)(\(.+\))?!?:/i,
	/^(lint|format)(\b|:)/i,
];

export type PostHistoryType = "feat" | "fix" | "content" | "other";

export interface PostHistoryItem {
	date: string;
	message: string;
	hash: string;
	fullHash: string;
	type: PostHistoryType;
	typeLabel: string;
}

export interface CommitSignatureStatus {
	shortHash: string;
	signed: boolean;
	format: "openpgp" | "ssh" | "x509" | "unknown" | "none";
	reason: string;
}

function isMeaningfulCommit(message: string) {
	return !HIDDEN_COMMIT_PATTERNS.some((pattern) =>
		pattern.test(message.trim()),
	);
}

function getHistoryType(message: string): PostHistoryType {
	const normalized = message.trim().toLowerCase();

	if (normalized.startsWith("feat")) {
		return "feat";
	}
	if (normalized.startsWith("fix")) {
		return "fix";
	}
	if (/^(content|post|article|update)(\(.+\))?!?:/.test(normalized)) {
		return "content";
	}
	return "other";
}

function getHistoryTypeLabel(type: PostHistoryType) {
	switch (type) {
		case "feat":
			return "Feature";
		case "fix":
			return "Fix";
		case "content":
			return "Content";
		default:
			return "Note";
	}
}

export async function getPostHistory(filePath: string) {
	if (!filePath) {
		return [];
	}

	try {
		const raw = await git.raw([
			"log",
			"--follow",
			`--format=%H${LOG_FIELD_SEPARATOR}%aI${LOG_FIELD_SEPARATOR}%s${LOG_RECORD_SEPARATOR}`,
			"--",
			filePath.replaceAll("\\", "/"),
		]);

		return raw
			.split(LOG_RECORD_SEPARATOR)
			.map((record) => record.trim())
			.filter(Boolean)
			.map((record) => {
				const [hash, date, rawMessage] = record.split(LOG_FIELD_SEPARATOR);
				const message = rawMessage?.trim() ?? "";
				const type = getHistoryType(message);

				return {
					date,
					fullHash: hash,
					hash: hash.slice(0, 7),
					rawMessage: message,
					message,
					type,
					typeLabel: getHistoryTypeLabel(type),
				};
			})
			.filter((item) => isMeaningfulCommit(item.rawMessage))
			.map<PostHistoryItem>(({ rawMessage: _rawMessage, ...item }) => item);
	} catch (_e) {
		return [];
	}
}

export async function getCommitSignatureStatus(
	hash: string | undefined,
): Promise<CommitSignatureStatus> {
	if (!hash) {
		return {
			shortHash: "pending",
			signed: false,
			format: "unknown",
			reason: "No commit found for this article",
		};
	}

	try {
		const raw = await git.raw(["cat-file", "-p", hash]);
		const signatureHeader = raw.match(/^gpgsig (.+)$/m)?.[1] ?? "";
		const format = getCommitSignatureFormat(signatureHeader);

		return {
			shortHash: hash.slice(0, 7),
			signed: format !== "none",
			format,
			reason:
				format === "none"
					? "No signature embedded in this commit"
					: `${format.toUpperCase()} signature embedded in this commit`,
		};
	} catch (_e) {
		return {
			shortHash: hash.slice(0, 7),
			signed: false,
			format: "unknown",
			reason: "Unable to inspect this commit signature",
		};
	}
}

function getCommitSignatureFormat(
	signatureHeader: string,
): CommitSignatureStatus["format"] {
	if (!signatureHeader) {
		return "none";
	}

	if (signatureHeader.includes("SSH SIGNATURE")) {
		return "ssh";
	}
	if (signatureHeader.includes("PGP SIGNATURE")) {
		return "openpgp";
	}
	if (signatureHeader.includes("SIGNED MESSAGE")) {
		return "x509";
	}
	return "unknown";
}
