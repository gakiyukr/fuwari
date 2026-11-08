// PGP 模組已整體注釋停用；文章頁唯一呼叫點位於 src/pages/posts/[...slug].astro（已注釋）。
// 恢復時取消本檔注釋，並同步還原 src/config.ts 的 pgp 設定與 src/types/pgp.ts。
// import { siteConfig } from "@/config";
// import type { PGPSignatureInfo } from "@/types/pgp";
// import type { CommitSignatureStatus } from "./git-log";
// import { url } from "./url-utils";

// export function getPostPGPSignature(
// 	slug: string,
// 	commitSignature?: CommitSignatureStatus,
// ): PGPSignatureInfo | undefined {
// 	if (!siteConfig.pgp.enable) {
// 		return undefined;
// 	}
//
// 	const rawBaseUrl = siteConfig.pgp.rawPostBaseUrl.replace(/\/$/, "");
// 	const safeSlug = slug.split("/").join("__");
// 	const hasSigningKey = Boolean(
// 		process.env.PGP_PRIVATE_KEY_BASE64?.trim() ||
// 			process.env.PGP_PRIVATE_KEY?.trim(),
// 	);
// 	const articleStatus =
// 		process.env.PGP_SIGNING_ENABLED === "true" && hasSigningKey
// 			? "signed"
// 			: "pending";
//
// 	return {
// 		signer: siteConfig.pgp.signer,
// 		fingerprint: siteConfig.pgp.fingerprint,
// 		articleStatus,
// 		gitCommit: {
// 			shortHash: commitSignature?.shortHash ?? "pending",
// 			fullHash: commitSignature?.fullHash ?? "",
// 			verified: commitSignature?.signed ?? false,
// 			reason: commitSignature?.reason ?? "Commit signature not inspected yet",
// 			format: commitSignature?.format ?? "unknown",
// 		},
// 		publicKeyUrl: url(siteConfig.pgp.publicKeyPath),
// 		publicKeyPageUrl: url("/about/#pgp-public-key"),
// 		sourceUrl: `${rawBaseUrl.replace("/main/", `/${commitSignature?.fullHash || "main"}/`)}/${slug}/index.md`,
// 		signatureUrl: url(`/pgp/posts/${safeSlug}.md.asc`),
// 	};
// }
