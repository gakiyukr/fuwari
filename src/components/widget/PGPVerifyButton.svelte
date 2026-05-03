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
	let verifyMessage = "將抓取原文、.asc 和公鑰，並在瀏覽器本地完成驗證。";

	const statusCopy: Record<VerifyStatus, { title: string; icon: string }> = {
		idle: {
			title: "待驗證",
			icon: "material-symbols:info-outline-rounded",
		},
		loading: {
			title: "正在驗證",
			icon: "material-symbols:progress-activity-rounded",
		},
		valid: {
			title: "驗證通過",
			icon: "material-symbols:verified-rounded",
		},
		invalid: {
			title: "簽名不匹配",
			icon: "material-symbols:warning-outline-rounded",
		},
		error: {
			title: "驗證失敗",
			icon: "material-symbols:error-outline-rounded",
		},
	};

	async function togglePanel() {
		if (panelState === "open") {
			panelState = "idle";
			return;
		}

		panelState = "open";
		await verifySignature();
	}

	async function verifySignature() {
		verifyStatus = "loading";
		verifyMessage = "正在下載驗證所需文件...";

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

			verifyMessage = "正在比對原文與 detached signature...";

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
			verifyMessage = "原文與 .asc 匹配，簽名也來自此公鑰。";
		} catch (error) {
			verifyStatus =
				error instanceof Error && error.message.includes("Signature")
					? "invalid"
					: "error";
			verifyMessage =
				error instanceof Error ? error.message : "發生未知錯誤";
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
	<div class:list={["pgp-verify", `pgp-verify--${verifyStatus}`]}>
		<div class="pgp-verify__icon" aria-hidden="true">
			<Icon icon={statusCopy[verifyStatus].icon} />
		</div>
		<div class="pgp-verify__copy">
			<div class="pgp-verify__title">{statusCopy[verifyStatus].title}</div>
			<p>{verifyMessage}</p>
		</div>
	</div>
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

	.pgp-verify {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		margin-top: 0.7rem;
		padding: 0.7rem;
		border: 1px solid color-mix(in oklab, var(--line-divider) 72%, transparent);
		border-radius: 0.85rem;
		background: color-mix(in oklab, var(--btn-regular-bg) 72%, transparent);
	}

	.pgp-verify__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		flex: 0 0 auto;
		border-radius: 0.62rem;
		background: color-mix(in oklab, var(--primary) 12%, transparent);
		color: var(--primary);
		font-size: 1rem;
	}

	.pgp-verify__copy {
		min-width: 0;
	}

	.pgp-verify__title {
		margin-bottom: 0.15rem;
		color: var(--deep-text);
		font-size: 0.82rem;
		font-weight: 800;
		line-height: 1.25;
	}

	.pgp-verify p {
		margin: 0;
		color: color-mix(in oklab, var(--deep-text) 58%, transparent);
		font-size: 0.74rem;
		line-height: 1.45;
	}

	.pgp-verify--loading .pgp-verify__icon {
		animation: pgp-spin 900ms linear infinite;
	}

	.pgp-verify--valid {
		border-color: color-mix(in oklab, var(--admonitions-color-tip) 32%, transparent);
		background: color-mix(in oklab, var(--admonitions-color-tip) 10%, var(--btn-regular-bg));
	}

	.pgp-verify--valid .pgp-verify__icon {
		background: color-mix(in oklab, var(--admonitions-color-tip) 18%, transparent);
		color: color-mix(in oklab, var(--admonitions-color-tip) 78%, var(--deep-text) 22%);
	}

	.pgp-verify--invalid,
	.pgp-verify--error {
		border-color: color-mix(in oklab, var(--admonitions-color-warning) 34%, transparent);
		background: color-mix(in oklab, var(--admonitions-color-warning) 10%, var(--btn-regular-bg));
	}

	.pgp-verify--invalid .pgp-verify__icon,
	.pgp-verify--error .pgp-verify__icon {
		background: color-mix(in oklab, var(--admonitions-color-warning) 18%, transparent);
		color: color-mix(in oklab, var(--admonitions-color-warning) 82%, var(--deep-text) 18%);
	}

	@keyframes pgp-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
