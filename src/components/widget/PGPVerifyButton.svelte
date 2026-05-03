<script lang="ts">
	import Icon from "@iconify/svelte";

	type PanelState = "idle" | "open";
	type VerifyStatus = "idle" | "loading" | "valid" | "invalid" | "error";

	export let signatureUrl: string;
	export let sourceUrl: string;
	export let publicKeyUrl: string;
	export let publicKeyPageUrl: string;

	let panelState: PanelState = "idle";
	let verifyStatus: VerifyStatus = "idle";
	let verifyMessage = "在線驗證會抓取原文、.asc 和公鑰，並在瀏覽器本地完成。";

	async function togglePanel() {
		if (panelState === "open") {
			panelState = "idle";
			return;
		}

		panelState = "open";
		if (verifyStatus === "idle") {
			await verifySignature();
		}
	}

	async function verifySignature() {
		verifyStatus = "loading";
		verifyMessage = "正在驗證簽名...";

		try {
			const openpgp = await import("openpgp");
			const [sourceResponse, signatureResponse, publicKeyResponse] =
				await Promise.all([
					fetch(sourceUrl),
					fetch(signatureUrl),
					fetch(publicKeyUrl),
				]);

			if (!sourceResponse.ok) {
				throw new Error("無法下載原文");
			}
			if (!signatureResponse.ok) {
				throw new Error("無法下載 .asc 簽名");
			}
			if (!publicKeyResponse.ok) {
				throw new Error("無法下載公鑰");
			}

			const sourceBytes = new Uint8Array(await sourceResponse.arrayBuffer());
			const armoredSignature = await signatureResponse.text();
			const armoredPublicKey = await publicKeyResponse.text();

			const verification = await openpgp.verify({
				message: await openpgp.createMessage({ binary: sourceBytes }),
				signature: await openpgp.readSignature({ armoredSignature }),
				verificationKeys: await openpgp.readKey({ armoredKey: armoredPublicKey }),
			});

			await verification.signatures[0]?.verified;
			verifyStatus = "valid";
			verifyMessage = "驗證通過：原文與 .asc 匹配，且簽名來自此公鑰。";
		} catch (error) {
			verifyStatus =
				error instanceof Error && error.message.includes("Signature")
					? "invalid"
					: "error";
			verifyMessage =
				error instanceof Error
					? `驗證失敗：${error.message}`
					: "驗證失敗：未知錯誤";
		}
	}
</script>

<div class="pgp-actions">
	<button
		type="button"
		class="pgp-action"
		onclick={togglePanel}
		aria-expanded={panelState === "open"}
	>
		<span class="pgp-action__icon" aria-hidden="true">
			{#if panelState === "open"}
				<Icon icon="material-symbols:arrow-back-rounded" />
			{:else}
				<Icon icon="material-symbols:fact-check-outline-rounded" />
			{/if}
		</span>
		<span>
			{#if panelState === "open"}
				返回
			{:else}
				在線驗證
			{/if}
		</span>
	</button>

	<a class="pgp-action" href={signatureUrl} download>
		<span class="pgp-action__icon" aria-hidden="true">
			<Icon icon="material-symbols:signature-rounded" />
		</span>
		<span>.asc</span>
	</a>

	<a class="pgp-action" href={sourceUrl} download>
		<span class="pgp-action__icon" aria-hidden="true">
			<Icon icon="material-symbols:article-outline-rounded" />
		</span>
		<span>原文</span>
	</a>

	<a class="pgp-action" href={publicKeyPageUrl}>
		<span class="pgp-action__icon" aria-hidden="true">
			<Icon icon="material-symbols:key-outline-rounded" />
		</span>
		<span>公鑰</span>
	</a>
</div>

{#if panelState === "open"}
	<p class:list={["pgp-verify__message", `pgp-verify__message--${verifyStatus}`]}>
		{verifyMessage}
	</p>
{/if}

<style>
	.pgp-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.55rem;
	}

	.pgp-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.38rem;
		min-height: 2.6rem;
		padding: 0.52rem 0.45rem;
		border: 0;
		border-radius: 0.75rem;
		background: var(--btn-regular-bg);
		color: var(--btn-content);
		font-family: inherit;
		font-size: 0.78rem;
		font-weight: 700;
		transition:
			background 160ms ease,
			color 160ms ease,
			transform 160ms ease,
			opacity 160ms ease;
	}

	.pgp-action:hover {
		background: var(--btn-regular-bg-hover);
		color: var(--primary);
	}

	.pgp-action:active {
		transform: translateY(1px);
		background: var(--btn-regular-bg-active);
	}

	.pgp-action__icon {
		display: inline-flex;
		font-size: 0.95rem;
		line-height: 1;
	}

	.pgp-verify__message {
		margin: 0.55rem 0 0;
		color: color-mix(in oklab, var(--deep-text) 52%, transparent);
		font-size: 0.74rem;
		line-height: 1.45;
	}

	.pgp-verify__message--valid {
		color: color-mix(in oklab, var(--admonitions-color-tip) 76%, var(--deep-text) 24%);
	}

	.pgp-verify__message--invalid,
	.pgp-verify__message--error {
		color: color-mix(in oklab, var(--admonitions-color-warning) 78%, var(--deep-text) 22%);
	}
</style>
