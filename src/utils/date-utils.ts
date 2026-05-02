const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_TIME_ZONE = "Asia/Shanghai";

export function formatDateToYYYYMMDD(date: Date): string {
	return date.toISOString().substring(0, 10);
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const values = Object.fromEntries(
		parts
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, Number(part.value)]),
	);

	return {
		year: values.year,
		month: values.month,
		day: values.day,
	};
}

function getCalendarDayNumber(date: Date, timeZone: string) {
	const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
	return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function getElapsedCalendarDays(
	date: Date,
	now = new Date(),
	timeZone = DEFAULT_TIME_ZONE,
) {
	return Math.max(
		0,
		getCalendarDayNumber(now, timeZone) -
			getCalendarDayNumber(date, timeZone),
	);
}
