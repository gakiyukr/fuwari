import { siteConfig } from "@/config";
import type { PGPSignatureInfo } from "@/types/pgp";
import { url } from "./url-utils";

export function getPostPGPSignature(slug: string): PGPSignatureInfo | undefined {
	if (!siteConfig.pgp.enable) {
		return undefined;
	}

	const rawBaseUrl = siteConfig.pgp.rawPostBaseUrl.replace(/\/$/, "");
	const safeSlug = slug.split("/").join("__");

	return {
		signer: siteConfig.pgp.signer,
		fingerprint: siteConfig.pgp.fingerprint,
		articleStatus: "pending",
		gitCommit: {
			shortHash: "pending",
			verified: true,
			reason: "GitHub Verified",
		},
		publicKeyUrl: url("/about/#pgp-public-key"),
		sourceUrl: `${rawBaseUrl}/${slug}/index.md`,
		signatureUrl: url(`/pgp/posts/${safeSlug}.md.asc`),
	};
}
