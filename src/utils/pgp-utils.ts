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
	const articleStatus =
		import.meta.env.PGP_SIGNING_ENABLED === "true" ? "signed" : "pending";

	return {
		signer: siteConfig.pgp.signer,
		fingerprint: siteConfig.pgp.fingerprint,
		articleStatus,
		gitCommit: {
			shortHash: commitSignature?.shortHash ?? "pending",
			verified: commitSignature?.signed ?? false,
			reason: commitSignature?.reason ?? "Commit signature not inspected yet",
			format: commitSignature?.format ?? "unknown",
		},
		publicKeyUrl: url("/about/#pgp-public-key"),
		sourceUrl: `${rawBaseUrl}/${slug}/index.md`,
		signatureUrl: url(`/pgp/posts/${safeSlug}.md.asc`),
	};
}
