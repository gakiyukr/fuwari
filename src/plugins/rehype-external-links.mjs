import { visit } from "unist-util-visit";

const INTERNAL_PROTOCOLS = new Set(["#", "/", "mailto:", "tel:"]);

function isExternalHref(href) {
	if (typeof href !== "string") return false;
	const value = href.trim();
	if (!value) return false;
	if (INTERNAL_PROTOCOLS.has(value[0])) return false;
	if (value.startsWith("//")) return true;

	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function mergeRel(value, additions) {
	const current = Array.isArray(value)
		? value
		: typeof value === "string"
			? value.split(/\s+/)
			: [];

	return Array.from(new Set([...current, ...additions].filter(Boolean)));
}

export function rehypeExternalLinks() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "a") return;
			if (!isExternalHref(node.properties?.href)) return;

			node.properties.target = "_blank";
			node.properties.rel = mergeRel(node.properties.rel, [
				"noopener",
				"noreferrer",
			]);
		});
	};
}
