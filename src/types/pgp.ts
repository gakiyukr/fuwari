export type PGPSignatureInfo = {
	signer: string;
	fingerprint: string;
	articleStatus: "signed" | "unsigned" | "pending";
	gitCommit: {
		shortHash: string;
		verified: boolean;
		reason: string;
		format: "openpgp" | "ssh" | "x509" | "unknown" | "none";
	};
	publicKeyUrl: string;
	sourceUrl: string;
	signatureUrl: string;
};
