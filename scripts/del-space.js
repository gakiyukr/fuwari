import fs from "fs";
import path from "path";
import {
	POSTS_DIR,
	buildMarkdownGlob,
	listFiles,
} from "./utils/content-files.js";

/**
 * 获取所有 markdown 文件
 */
async function getAllMarkdownFiles() {
	try {
			return await listFiles(buildMarkdownGlob(POSTS_DIR, ["md"]));
	} catch (error) {
		console.error("获取 markdown 文件失敗:", error.message);
		return [];
	}
}

/**
 * 处理单个 Markdown 文件
 */
async function processMarkdownFile(filePath) {
	let content = fs.readFileSync(filePath, "utf-8");
	let hasChanges = false;
	let changedCount = 0;

	const replacements = [];

	// 1. 处理 YAML frontmatter 中的 image 字段
	const yamlImageRegex = /^---[\s\S]*?image:\s*(?:['"]([^'"]+)['"]|([^\s\n]+))[\s\S]*?^---/m;
	let match = yamlImageRegex.exec(content);
	if (match) {
		const imagePath = match[1] || match[2];
		if (imagePath && (imagePath.includes(" ") || imagePath.includes("%20") || imagePath.includes(",") || hasExtraDots(imagePath))) {
			const result = await handleImageRename(filePath, imagePath);
			if (result) {
				replacements.push({ original: imagePath, new: result });
			}
		}
	}

	// 2. 处理 Markdown 图片语法 ![alt](url)
	const markdownImageRegex = /!\[.*?\]\(((?:[^()]+|\([^()]*\))+)\)/g;
	while ((match = markdownImageRegex.exec(content)) !== null) {
		const fullUrl = match[1];
		let url = fullUrl;
		const titleMatch = url.match(/^(\S+)\s+["'].*["']$/);
		if (titleMatch) url = titleMatch[1];
		if (url.startsWith('<') && url.endsWith('>')) url = url.slice(1, -1);

		if (url.includes(" ") || url.includes("%20") || url.includes(",") || hasExtraDots(url)) {
			const result = await handleImageRename(filePath, url);
			if (result) {
				replacements.push({ original: url, new: result, fullMatch: fullUrl });
			}
		}
	}

	// 3. 处理 HTML img 标签 <img src="...">
	const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
	while ((match = htmlImageRegex.exec(content)) !== null) {
		const url = match[1];
		if (url.includes(" ") || url.includes("%20") || url.includes(",") || hasExtraDots(url)) {
			const result = await handleImageRename(filePath, url);
			if (result) {
				replacements.push({ original: url, new: result });
			}
		}
	}

	// 执行替换
	if (replacements.length > 0) {
		replacements.sort((a, b) => b.original.length - a.original.length);
		const uniqueReplacements = new Map();
		replacements.forEach(item => {
			if (!uniqueReplacements.has(item.original)) {
				uniqueReplacements.set(item.original, item.new);
			}
		});

		for (const [original, newPath] of uniqueReplacements) {
			const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(escapedOriginal, 'g');
			if (content.match(regex)) {
				content = content.replace(regex, newPath);
				hasChanges = true;
				changedCount++;
				console.log(`  🔄 更新引用: "${original}" -> "${newPath}"`);
			}
		}
	}

	if (hasChanges) {
		fs.writeFileSync(filePath, content, "utf-8");
		console.log(`💾 已保存文件: ${path.relative(process.cwd(), filePath)} (更新了 ${changedCount} 處引用)`);
	}
}

/**
 * 处理图片重命名
 */
async function handleImageRename(markdownPath, imagePath) {
	let decodedPath = imagePath;
	try { decodedPath = decodeURIComponent(imagePath); } catch (e) {}

	if (decodedPath.startsWith("http://") || decodedPath.startsWith("https://")) return null;
	if (decodedPath.startsWith("/")) return null;

	const markdownDir = path.dirname(markdownPath);
	const absolutePath = path.resolve(markdownDir, decodedPath);

	if (!fs.existsSync(absolutePath)) {
		console.warn(`  ⚠️  圖片不存在 (跳過): ${decodedPath}`);
		return null;
	}

	const dir = path.dirname(absolutePath);
	const filename = path.basename(absolutePath);
	const ext = path.extname(filename);
	const nameWithoutExt = path.basename(filename, ext);

	const newName = nameWithoutExt
		.replace(/\s+/g, "")
		.replace(/%20/g, "")
		.replace(/,/g, "")
		.replace(/\./g, "");

	const newFilename = newName + ext;
	if (filename === newFilename) return null;

	const newAbsolutePath = path.join(dir, newFilename);
	try {
		if (!fs.existsSync(newAbsolutePath)) {
			fs.renameSync(absolutePath, newAbsolutePath);
			console.log(`  ✨ 重命名圖片: "${filename}" -> "${newFilename}"`);
		} else {
			console.warn(`  ⚠️  目標文件已存在: ${path.basename(newAbsolutePath)} (將使用已存在的文件)`);
		}
	} catch (error) {
		console.error(`  ❌ 重命名失敗: ${error.message}`);
		return null;
	}

	const lastSeparatorIndex = Math.max(imagePath.lastIndexOf('/'), imagePath.lastIndexOf('\\'));
	let newReferencePath = lastSeparatorIndex === -1 ? newFilename : imagePath.substring(0, lastSeparatorIndex + 1) + newFilename;
	return newReferencePath.replace(/%20/g, "");
}

function hasExtraDots(imagePath) {
	try {
		let decodedPath = imagePath;
		try { decodedPath = decodeURIComponent(imagePath); } catch (e) {}
		const filename = path.basename(decodedPath);
		if (filename.startsWith('.')) {
			return filename.split('.').length > 2;
		}
		const ext = path.extname(filename);
		const nameWithoutExt = path.basename(filename, ext);
		return nameWithoutExt.includes('.');
	} catch (error) { return false; }
}

async function main() {
	console.log("🔍 開始掃描 Markdown 文件中的空格圖片路徑...");
	if (!fs.existsSync(POSTS_DIR)) {
		console.error(`❌ Posts 目錄不存在: ${POSTS_DIR}`);
		return;
	}
	const files = await getAllMarkdownFiles();
	console.log(`📄 找到 ${files.length} 個 Markdown 文件`);
	for (const file of files) await processMarkdownFile(file);
	console.log("✅ 完成！");
}

main().catch(err => {
	console.error("❌ 發生錯誤:", err);
	process.exit(1);
});
