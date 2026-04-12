const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type PostFreshnessLevel = "aging" | "stale" | "legacy";
export type PostActivityKind = "new" | "updated";

export interface PostFreshness {
	days: number;
	level: PostFreshnessLevel;
	label: string;
	title: string;
	icon: string;
	description: string;
}

export interface PostActivityBadge {
	kind: PostActivityKind;
	label: string;
	icon: string;
}

function getElapsedDays(date: Date, now = new Date()) {
	return Math.max(0, Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY));
}

export function getPostFreshness(
	published: Date,
	updated?: Date,
	now = new Date(),
) {
	const lastDate = updated ?? published;
	const publishedDays = getElapsedDays(published, now);
	const days = getElapsedDays(lastDate, now);

	if (days > 180) {
		return {
			days,
			level: "legacy",
			label: "严重过时",
			title: "这篇文章可能已经明显落后于当前情况",
			icon: "material-symbols:alarm-on-rounded",
			description: `此文章发布于 ${publishedDays} 天前，部分信息可能已经严重过时`,
		} satisfies PostFreshness;
	}

	if (days > 90) {
		return {
			days,
			level: "stale",
			label: "建议复核",
			title: "这篇文章已有一段时间没有更新",
			icon: "material-symbols:history-rounded",
			description: `此文章发布于 ${publishedDays} 天前，部分信息可能已与当前情况不一致`,
		} satisfies PostFreshness;
	}

	return {
		days,
		level: "aging",
		label: "轻度过期",
		title: "这篇文章可能需要留意时效性",
		icon: "material-symbols:schedule-rounded",
		description: `此文章发布于 ${publishedDays} 天前，部分信息可能需要重新确认`,
	} satisfies PostFreshness;
}

export function getPostActivityBadges(
	published: Date,
	updated?: Date,
	now = new Date(),
) {
	const badges: PostActivityBadge[] = [];
	const publishedDays = getElapsedDays(published, now);
	const updatedDays =
		updated && updated.getTime() !== published.getTime()
			? getElapsedDays(updated, now)
			: null;

	if (publishedDays <= 14) {
		badges.push({
			kind: "new",
			label: "NEW",
			icon: "material-symbols:auto-awesome-rounded",
		});
	}

	if (updatedDays !== null && updatedDays <= 30) {
		badges.push({
			kind: "updated",
			label: "UPDATED",
			icon: "material-symbols:bolt-rounded",
		});
	}

	return badges;
}
