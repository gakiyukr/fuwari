import { describe, expect, it } from "vitest";
import {
	getHistoryType,
	getHistoryTypeLabel,
	isMeaningfulCommit,
} from "./git-log";

describe("文章歷史提交分類", () => {
	it.each([
		"content: publish parcel guide",
		"content(posts)!: restructure parcel guide",
		"post: publish parcel guide",
		"posts: update parcel guide",
		"article: refine parcel guide",
		"update: refresh parcel guide",
		"Add parcel guide references",
		"Remove redundant heading",
		"Refine parcel guide metadata",
		"Clarify stamp payment rights",
		"Expand delivery notes",
		"Polish parcel guide wording",
		"Refresh carrier details",
		"Update parcel guide links",
		"Publish parcel saving guide",
	])("將文章內容提交分類為 Content：%s", (message) => {
		expect(getHistoryType(message)).toBe("content");
	});

	it.each([
		"fix: correct parcel postage calculation",
		"fix(content)!: replace outdated carrier link",
		"Fix incorrect postage amount",
	])("將內容修正提交分類為 Fix：%s", (message) => {
		expect(getHistoryType(message)).toBe("fix");
	});

	it.each([
		"feat: add article revision history panel",
		"feat(history)!: redesign revision panel",
	])("將功能提交分類為 Feature：%s", (message) => {
		expect(getHistoryType(message)).toBe("feat");
	});

	it.each([
		"docs: document article workflow",
		"refactor: extract history parser",
		"Merge branch 'main'",
	])("將未匹配的提交分類為 Note：%s", (message) => {
		expect(getHistoryType(message)).toBe("other");
	});
});

describe("文章歷史顯示規則", () => {
	it.each([
		"chore: update dependencies",
		"chore(history)!: rebuild generated data",
		"style: format article page",
		"ci: update build workflow",
		"build: update bundle config",
		"test: add history coverage",
		"lint source files",
		"format: normalize source files",
	])("隱藏不應出現在文章歷史中的提交：%s", (message) => {
		expect(isMeaningfulCommit(message)).toBe(false);
	});

	it.each([
		"content: update parcel guide",
		"fix: correct parcel guide link",
		"feat: add article history",
		"docs: document article workflow",
	])("保留讀者可能需要看到的提交：%s", (message) => {
		expect(isMeaningfulCommit(message)).toBe(true);
	});

	it.each([
		["feat", "Feature"],
		["fix", "Fix"],
		["content", "Content"],
		["other", "Note"],
	] as const)("為 %s 類型提供 %s 標籤", (type, label) => {
		expect(getHistoryTypeLabel(type)).toBe(label);
	});
});
