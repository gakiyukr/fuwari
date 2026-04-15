import { execSync } from "child_process";
import fs from "fs";

const POST_DIR = "src/content/posts";

/**
 * Get all files that have changes (both staged and unstaged),
 * filtered to only .md files under the posts directory.
 */
function getChangedPostFiles() {
	const output = execSync("git status --porcelain", { encoding: "utf-8" });
	return output
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => {
			// porcelain format: "XY filename" (XY is 2-char status)
			// Handle renamed files: "R  old -> new"
			const parts = line.slice(3).split(" -> ");
			return parts[parts.length - 1].trim();
		})
		.filter(
			(file) => file.startsWith(POST_DIR + "/") && file.endsWith(".md"),
		);
}

function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;

	const frontmatter = {};
	for (const line of match[1].split("\n")) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value = line.slice(colonIdx + 1).trim();
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
		execSync(`git ls-files --error-unmatch "${file}"`, { encoding: "utf-8" });
		return false;
	} catch {
		return true;
	}
}

function main() {
	const postFiles = getChangedPostFiles();

	if (postFiles.length === 0) {
		console.error(
			"Error: No changed .md files found in src/content/posts/",
		);
		process.exit(1);
	}

	console.log(`Found ${postFiles.length} changed post(s):`);
	postFiles.forEach((f) => console.log(`  - ${f}`));

	for (const postFile of postFiles) {
		const content = fs.readFileSync(postFile, "utf-8");
		const fm = parseFrontmatter(content);

		if (!fm || !fm.title) {
			console.warn(`Warning: Skipping ${postFile} — missing title in frontmatter`);
			continue;
		}

		const title = fm.title;
		const description = fm.description || "";
		const action = isNewFile(postFile) ? "发布" : "更新";
		const commitMsg = `posts: ${action}文章：《${title}》，${description}`;

		execSync(`git add "${postFile}"`, { encoding: "utf-8" });
		execSync(`git commit -m "${commitMsg}"`, { encoding: "utf-8" });
		console.log(`✓ Committed: ${commitMsg}`);
	}

	// Push all commits at once
	execSync("git push", { encoding: "utf-8", stdio: "inherit" });
	console.log("✓ Pushed to remote.");
}

main();
