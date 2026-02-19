import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Fuwari",
	subtitle: "Demo Site",
	lang: "zh_CN", // 网站语言代码，例如 'en', 'zh_CN', 'ja' 等
	themeColor: {
		hue: 250, // 主题色的默认色相值，范围 0-360。例如：红色: 0，蓝绿色: 200，青色: 250，粉色: 345
		fixed: false, // 是否隐藏主题色选择器，设为 true 访问者无法更改主题色
	},
	banner: {
		enable: false, // 是否启用顶部横幅图片
		src: "assets/images/demo-banner.png", // 横幅图片路径，相对于 /src 目录。如果以 '/' 开头则相对于 /public 目录
		position: "center", // 图片对齐方式，相当于 CSS 的 object-position，仅支持 'top', 'center', 'bottom'，默认 'center'
		credit: {
			enable: false, // 是否显示横幅图片的署名文本
			text: "", // 要显示的署名文本内容
			url: "", // 可选，指向原作品或艺术家页面的 URL 链接
		},
	},
	toc: {
		enable: true, // 是否在文章右侧显示目录
		depth: 2, // 目录中显示的最大标题层级，范围 1-3
	},
	favicon: [
		// 留空数组使用默认 favicon
		// {
		//   src: '/favicon/icon.png',    // favicon 路径，相对于 /public 目录
		//   theme: 'light',              // 可选，'light' 或 'dark'，仅在明暗模式有不同的 favicon 时才需要设置
		//   sizes: '32x32',              // 可选，favicon 尺寸，仅在有多尺寸 favicon 时才需要设置
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [LinkPreset.Home, LinkPreset.Archive, LinkPreset.About],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.png", // 相对于 /src 目录。如果以 '/' 开头则相对于 /public 目录
	name: "gakiyukr",
	bio: " ",
	links: [
		{
			name: "Telegram",
			icon: "fa6-brands:telegram",
			url: "https://t.me/gakiyukr_support_bot",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/gakiyukr",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 注意：某些样式（如背景色）被 astro.config.mjs 文件中的设置覆盖
	// 请选择深色主题，因为此博客主题目前只支持深色背景
	theme: "github-dark",
};
