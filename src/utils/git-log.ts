import simpleGit from "simple-git";

const git = simpleGit();

export async function getPostHistory(filePath: string) {
	try {
		const log = await git.log({
			file: filePath,
		});

		return log.all.map((item) => ({
			date: item.date,
			message: item.message,
			hash: item.hash.slice(0, 7),
		}));
	} catch (_e) {
		return [];
	}
}
