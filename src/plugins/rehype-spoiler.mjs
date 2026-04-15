import { visit } from "unist-util-visit";

export function rehypeSpoiler() {
	return (tree) => {
		visit(tree, "text", (node, index, parent) => {
			if (!node.value || !node.value.includes("||")) return;

			// Match all occurrences of ||...||
			const regex = /\|\|(.*?)\|\|/g;
			const parts = node.value.split(regex);
			
			// No matches found
			if (parts.length === 1) return;

			const children = [];
			for (let i = 0; i < parts.length; i++) {
				if (i % 2 === 0) {
					// Outside ||...||
					if (parts[i]) children.push({ type: "text", value: parts[i] });
				} else {
					// Inside ||...|| - transform to span
					children.push({
						type: "element",
						tagName: "span",
						properties: { className: ["spoiler"] },
						children: [{ type: "text", value: parts[i] }],
					});
				}
			}

			// Replace node safely
			parent.children.splice(index, 1, ...children);
			return index + children.length;
		});
	};
}
