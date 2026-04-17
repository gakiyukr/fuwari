import { visit } from "unist-util-visit";

function getCodeLanguage(node) {
	const className = node.properties?.className;
	const classes = Array.isArray(className) ? className : [];
	const languageClass = classes.find(
		(item) => typeof item === "string" && item.startsWith("language-"),
	);

	return languageClass?.replace("language-", "") ?? "";
}

function getText(node) {
	return (node.children ?? [])
		.map((child) => {
			if (child.type === "text") return child.value;
			return "";
		})
		.join("");
}

export function rehypeMermaid() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;
			if (node.tagName !== "pre") return;

			const code = node.children?.[0];
			if (!code || code.type !== "element" || code.tagName !== "code") return;
			if (getCodeLanguage(code) !== "mermaid") return;

			parent.children[index] = {
				type: "element",
				tagName: "div",
				properties: {
					className: ["mermaid"],
				},
				children: [
					{
						type: "text",
						value: getText(code),
					},
				],
			};
		});
	};
}
