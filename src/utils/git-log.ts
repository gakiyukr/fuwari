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
	type: PostHistoryType;
	typeLabel: string;
}

function isMeaningfulCommit(message: string) {
	return !HIDDEN_COMMIT_PATTERNS.some((pattern) => pattern.test(message.trim()));
}

function stripCommitPrefix(message: string) {
	return message.trim().replace(/^[a-z]+(\(.+\))?!?:\s*/i, "");
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
					hash: hash.slice(0, 7),
					rawMessage: message,
					message: stripCommitPrefix(message),
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
