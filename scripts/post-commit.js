import { execFileSync } from "node:child_process";
import fs from "node:fs";

const POST_DIR = "src/content/posts";
const POST_EXTENSIONS = new Set([".md", ".mdx"]);

function runGit(args, options = {}) {
	return execFileSync("git", args, {
		encoding: "utf-8",
		stdio: options.stdio ?? "pipe",
	});
}

function getChangedPostFiles() {
	const output = runGit(["status", "--porcelain"]);

	return output
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => {
			const status = line.slice(0, 2);
			const pathPart = line.slice(3);
			const parts = pathPart.split(" -> ");
			return {
				status,
				file: parts[parts.length - 1].trim(),
			};
		})
		.filter(({ status, file }) => {
			const isDeleted = status.includes("D");
			const isPost = file.startsWith(`${POST_DIR}/`);
			const hasPostExtension = POST_EXTENSIONS.has(
				file.slice(file.lastIndexOf(".")),
			);
			return !isDeleted && isPost && hasPostExtension;
		})
		.map(({ file }) => file);
}

function parseFrontmatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;

	const frontmatter = {};
	for (const line of match[1].split(/\r?\n/)) {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;

		const key = line.slice(0, colonIndex).trim();
		let value = line.slice(colonIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		frontmatter[key] = value;
	}

	return frontmatter;
}

function isNewFile(file) {
	try {
		runGit(["ls-files", "--error-unmatch", "--", file]);
		return false;
	} catch {
		return true;
	}
}

function buildCommitMessage(file, frontmatter) {
	const action = isNewFile(file) ? "publish" : "update";
	const title = frontmatter.title.trim();
	const description = frontmatter.description?.trim();
	const suffix = description ? `: ${description}` : "";

	return `posts: ${action} "${title}"${suffix}`;
}

function main() {
	const postFiles = getChangedPostFiles();

	if (postFiles.length === 0) {
		console.error("Error: No changed .md/.mdx files found in src/content/posts/");
		process.exit(1);
	}

	console.log(`Found ${postFiles.length} changed post(s):`);
	postFiles.forEach((file) => console.log(`  - ${file}`));

	for (const postFile of postFiles) {
		const content = fs.readFileSync(postFile, "utf-8");
		const frontmatter = parseFrontmatter(content);

		if (!frontmatter?.title?.trim()) {
			console.warn(
				`Warning: Skipping ${postFile}: missing title in frontmatter.`,
			);
			continue;
		}

		const commitMessage = buildCommitMessage(postFile, frontmatter);

		runGit(["add", "--", postFile]);
		runGit(["commit", "-m", commitMessage, "--", postFile], { stdio: "inherit" });
		console.log(`Committed: ${commitMessage}`);
	}

	runGit(["push"], { stdio: "inherit" });
	console.log("Pushed to remote.");
}

main();
