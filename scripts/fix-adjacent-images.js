#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "src", "content", "posts");
const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);
const writeChanges = process.argv.includes("--write");

function isFenceStart(line) {
	const match = line.match(/^\s*(```+|~~~+)/);
	return match?.[1] ?? null;
}

function isFenceEnd(line, fence) {
	if (!fence) return false;
	const escapedFence = fence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^\\s*${escapedFence}\\s*$`).test(line);
}

function isImageOnlyLine(line) {
	const trimmed = line.trim();
	if (!trimmed) return false;

	return (
		/^!\[[^\]]*]\([^)]+\)$/.test(trimmed) ||
		/^<img\b[^>]*\bsrc=(["']).+?\1[^>]*>\s*$/i.test(trimmed)
	);
}

function fixAdjacentImages(content) {
	const eol = content.includes("\r\n") ? "\r\n" : "\n";
	const hasFinalNewline = content.endsWith("\n");
	const lines = content.split(/\r?\n/);
	const output = [];
	let fence = null;
	let changed = false;
	let insertedBlankLines = 0;

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		output.push(line);

		if (fence) {
			if (isFenceEnd(line, fence)) fence = null;
			continue;
		}

		const nextFence = isFenceStart(line);
		if (nextFence) {
			fence = nextFence;
			continue;
		}

		const nextLine = lines[index + 1];
		if (
			nextLine !== undefined &&
			isImageOnlyLine(line) &&
			isImageOnlyLine(nextLine)
		) {
			output.push("");
			changed = true;
			insertedBlankLines++;
		}
	}

	let nextContent = output.join(eol);
	if (hasFinalNewline && !nextContent.endsWith(eol)) {
		nextContent += eol;
	}

	return { changed, insertedBlankLines, content: nextContent };
}

async function listMarkdownFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await listMarkdownFiles(fullPath)));
			continue;
		}

		if (entry.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(entry.name))) {
			files.push(fullPath);
		}
	}

	return files;
}

async function main() {
	const files = await listMarkdownFiles(POSTS_DIR);
	const changedFiles = [];
	let totalInsertedBlankLines = 0;

	for (const file of files) {
		const content = await fs.readFile(file, "utf8");
		const result = fixAdjacentImages(content);

		if (!result.changed) continue;

		changedFiles.push({
			file,
			insertedBlankLines: result.insertedBlankLines,
		});
		totalInsertedBlankLines += result.insertedBlankLines;

		if (writeChanges) {
			await fs.writeFile(file, result.content, "utf8");
		}
	}

	if (changedFiles.length === 0) {
		console.log("No adjacent image formatting issues found.");
		return;
	}

	const action = writeChanges ? "Updated" : "Would update";
	console.log(
		`${action} ${changedFiles.length} file(s), ${totalInsertedBlankLines} blank line(s).`,
	);

	for (const item of changedFiles) {
		console.log(
			`- ${path.relative(process.cwd(), item.file)} (${item.insertedBlankLines})`,
		);
	}

	if (!writeChanges) {
		console.log("Run `pnpm fix-images -- --write` to apply these changes.");
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
