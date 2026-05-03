import { siteConfig } from "@/config";
import type { PGPSignatureInfo } from "@/types/pgp";
import type { CommitSignatureStatus } from "./git-log";
import { url } from "./url-utils";

export function getPostPGPSignature(
	slug: string,
	commitSignature?: CommitSignatureStatus,
): PGPSignatureInfo | undefined {
	if (!siteConfig.pgp.enable) {
		return undefined;
	}

	const rawBaseUrl = siteConfig.pgp.rawPostBaseUrl.replace(/\/$/, "");
	const safeSlug = slug.split("/").join("__");
	const hasSigningKey = Boolean(
		process.env.PGP_PRIVATE_KEY_BASE64?.trim() ||
			process.env.PGP_PRIVATE_KEY?.trim(),
	);
	const articleStatus =
		process.env.PGP_SIGNING_ENABLED === "true" && hasSigningKey
			? "signed"
			: "pending";

	return {
		signer: siteConfig.pgp.signer,
		fingerprint: siteConfig.pgp.fingerprint,
		articleStatus,
		gitCommit: {
			shortHash: commitSignature?.shortHash ?? "pending",
			fullHash: commitSignature?.fullHash ?? "",
			verified: commitSignature?.signed ?? false,
			reason: commitSignature?.reason ?? "Commit signature not inspected yet",
			format: commitSignature?.format ?? "unknown",
		},
		publicKeyUrl: url(siteConfig.pgp.publicKeyPath),
		publicKeyPageUrl: url("/about/#pgp-public-key"),
		sourceUrl: `${rawBaseUrl.replace("/main/", `/${commitSignature?.fullHash || "main"}/`)}/${slug}/index.md`,
		signatureUrl: url(`/pgp/posts/${safeSlug}.md.asc`),
	};
}
