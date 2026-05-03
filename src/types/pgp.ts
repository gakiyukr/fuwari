export type PGPSignatureInfo = {
	signer: string;
	fingerprint: string;
	articleStatus: "signed" | "unsigned" | "pending";
	gitCommit: {
		shortHash: string;
		verified: boolean;
		reason: string;
	};
	publicKeyUrl: string;
	sourceUrl: string;
	signatureUrl: string;
};
