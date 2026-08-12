import simpleGit from "simple-git";

const git = simpleGit();

const LOG_RECORD_SEPARATOR = "\u001e";
const LOG_FIELD_SEPARATOR = "\u001f";

const HIDDEN_COMMIT_PATTERNS = [
	/^(chore|style|ci|build|test)(\(.+\))?!?:/i,
	/^(lint|format)(\b|:)/i,
];
const FEATURE_COMMIT_PATTERN = /^feat(\(.+\))?!?:/i;
const FIX_COMMIT_PATTERNS = [/^fix(\(.+\))?!?:/i, /^fix\b/i];
const CONTENT_COMMIT_PATTERNS = [
	/^(content|posts?|article|update)(\(.+\))?!?:/i,
	/^(add|remove|refine|clarify|expand|polish|refresh|update|publish)\b/i,
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
	fullHash: string;
	signed: boolean;
	format: "openpgp" | "ssh" | "x509" | "unknown" | "none";
	reason: string;
}

export function isMeaningfulCommit(message: string) {
	return !HIDDEN_COMMIT_PATTERNS.some((pattern) =>
		pattern.test(message.trim()),
	);
}

export function getHistoryType(message: string): PostHistoryType {
	const normalized = message.trim();

	if (FEATURE_COMMIT_PATTERN.test(normalized)) {
		return "feat";
	}
	if (FIX_COMMIT_PATTERNS.some((pattern) => pattern.test(normalized))) {
		return "fix";
	}
	if (CONTENT_COMMIT_PATTERNS.some((pattern) => pattern.test(normalized))) {
		return "content";
	}
	return "other";
}

export function getHistoryTypeLabel(type: PostHistoryType) {
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
			fullHash: "",
			signed: false,
			format: "unknown",
			reason: "No commit found for this article",
		};
	}

	try {
		const githubStatus = await getGitHubCommitSignatureStatus(hash);
		if (githubStatus) {
			return githubStatus;
		}

		const raw = await git.raw(["cat-file", "-p", hash]);
		const signatureHeader = raw.match(/^gpgsig (.+)$/m)?.[1] ?? "";
		const format = getCommitSignatureFormat(signatureHeader);

		return {
			shortHash: hash.slice(0, 7),
			fullHash: hash,
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
			fullHash: hash,
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

async function getGitHubCommitSignatureStatus(
	hash: string,
): Promise<CommitSignatureStatus | undefined> {
	const repoSlug = await getGitHubRepoSlug();
	if (!repoSlug) {
		return undefined;
	}

	try {
		const response = await fetch(
			`https://api.github.com/repos/${repoSlug}/commits/${hash}`,
			{
				headers: {
					Accept: "application/vnd.github+json",
					"User-Agent": "fuwari-pgp-signature-check",
				},
				signal: AbortSignal.timeout(3500),
			},
		);
		if (!response.ok) {
			return undefined;
		}

		const payload = (await response.json()) as {
			commit?: {
				verification?: {
					verified?: boolean;
					reason?: string;
					signature?: string | null;
				};
			};
		};
		const verification = payload.commit?.verification;
		if (!verification) {
			return undefined;
		}

		const format = getCommitSignatureFormat(verification.signature ?? "");
		return {
			shortHash: hash.slice(0, 7),
			fullHash: hash,
			signed: verification.verified === true,
			format,
			reason: verification.reason ?? "GitHub verification status unavailable",
		};
	} catch (_e) {
		return undefined;
	}
}

async function getGitHubRepoSlug() {
	const owner = process.env.VERCEL_GIT_REPO_OWNER;
	const repo = process.env.VERCEL_GIT_REPO_SLUG;
	if (owner && repo) {
		return `${owner}/${repo}`;
	}

	try {
		const remoteUrl = (
			await git.raw(["config", "--get", "remote.origin.url"])
		).trim();
		return parseGitHubRepoSlug(remoteUrl);
	} catch (_e) {
		return "gakiyukr/fuwari";
	}
}

function parseGitHubRepoSlug(remoteUrl: string) {
	const match =
		remoteUrl.match(
			/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/,
		) ??
		remoteUrl.match(
			/^https:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/,
		);

	if (!match?.groups) {
		return "gakiyukr/fuwari";
	}

	return `${match.groups.owner}/${match.groups.repo}`;
}
