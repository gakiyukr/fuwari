// Swup 頁面轉場初始化。
// @swup/astro 1.8.0 的 injectScript('page') 在 Astro 7 下不再注入任何腳本，
// 故改由 Layout.astro 的 <script> 直接載入本檔，選項與原 swup() 整合設定完全一致。
// 上游修復注入後可刪除本檔並還原 astro.config.mjs 的 swup() 整合。
import { onIdleAfterLoad } from "@swup/astro/idle";

async function initSwup() {
	const [Swup, SwupA11yPlugin, SwupPreloadPlugin, SwupScrollPlugin, SwupHeadPlugin, SwupScriptsPlugin] =
		await Promise.all([
			import("@swup/astro/client/Swup").then((m) => m.default),
			import("@swup/astro/client/SwupA11yPlugin").then((m) => m.default),
			import("@swup/astro/client/SwupPreloadPlugin").then((m) => m.default),
			import("@swup/astro/client/SwupScrollPlugin").then((m) => m.default),
			import("@swup/astro/client/SwupHeadPlugin").then((m) => m.default),
			import("@swup/astro/client/SwupScriptsPlugin").then((m) => m.default),
		]);

	const swup = new Swup({
		ignoreVisit: (url, { el } = {}) => el?.closest("[data-no-swup]"),
		animationSelector: '[class*="transition-swup-"]',
		containers: ["main", "#sidebar", "#toc"],
		cache: true,
		native: false,
		plugins: [
			new SwupA11yPlugin(),
			new SwupPreloadPlugin({
				preloadHoveredLinks: true,
				preloadVisibleLinks: false,
			}),
			new SwupScrollPlugin(),
			new SwupHeadPlugin({
				awaitAssets: true,
				persistAssets: false,
				persistTags: false,
			}),
			new SwupScriptsPlugin(),
		],
	});

	const dispatch = (name) => document.dispatchEvent(new Event(name));

	// 橋接 Swup 生命週期至 Astro 頁面事件，維持主題切換等元件的運作假設
	swup.hooks.before("content:replace", () => dispatch("astro:before-swap"));
	swup.hooks.on("content:replace", () => dispatch("astro:after-swap"));
	swup.hooks.on("page:view", () => dispatch("astro:page-load"));

	window.swup = swup;
}

onIdleAfterLoad(initSwup);
