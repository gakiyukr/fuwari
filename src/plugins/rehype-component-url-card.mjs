/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a URL Preview Card component.
 */
export function UrlCardComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("url" directive must be leaf type "::url{href="https://..."}")',
		]);

	if (!properties.href)
		return h("div", { class: "hidden" }, 'Missing "href" attribute.');

	const href = properties.href;
	let domain = href;
	try {
		domain = new URL(href).hostname;
	} catch {}

	const cardUuid = `UC${Math.random().toString(36).slice(-6)}`;

	const nImage = h(`div#${cardUuid}-image`, { class: "uc-image" });
	const nFavicon = h(`div#${cardUuid}-favicon`, {
		class: "uc-favicon",
		style: `background-image: url('https://icon.2x.nz/icon/${domain}')`,
	});

	const nTitleText = h(
		`div#${cardUuid}-title`,
		{ class: "uc-title-text" },
		domain,
	);

	const nDescription = h(
		`div#${cardUuid}-description`,
		{ class: "uc-description" },
		href,
	);

	const nScript = h(
		`script#${cardUuid}-script`,
		{ type: "text/javascript", defer: true },
		`
      fetch('https://api.microlink.io?url=' + encodeURIComponent('${href}'), { referrerPolicy: "no-referrer" }).then(response => response.json()).then(res => {
        const data = res.data;
        if (data.title) document.getElementById('${cardUuid}-title').innerText = data.title;
        if (data.description) document.getElementById('${cardUuid}-description').innerText = data.description;
        const imgEl = document.getElementById('${cardUuid}-image');
        if (data.image?.url) {
            imgEl.style.backgroundImage = 'url(' + data.image.url + ')';
        } else if (data.logo?.url) {
            imgEl.style.backgroundImage = 'url(' + data.logo.url + ')';
        } else {
            document.getElementById('${cardUuid}-container').classList.add("no-image");
        }
        document.getElementById('${cardUuid}-card').classList.remove("fetch-waiting");
      }).catch(err => {
        const c = document.getElementById('${cardUuid}-card');
        c?.classList.add("fetch-error");
      })
    `,
	);

	return h(
		`a#${cardUuid}-card`,
		{
			class: "card-url fetch-waiting no-styling",
			href: href,
			target: "_blank",
		},
		[
			h(`div#${cardUuid}-container`, { class: "uc-container" }, [
				h("div", { class: "uc-content" }, [
					h("div", { class: "uc-titlebar" }, [
						h("div", { class: "uc-titlebar-left" }, [
							nFavicon,
							h("div", { class: "uc-domain" }, domain),
						]),
					]),
					nTitleText,
					nDescription,
				]),
				nImage,
			]),
			nScript,
		],
	);
}
