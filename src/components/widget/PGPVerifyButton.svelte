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
	let verifyMessage = "将抓取原文、.asc 和公钥，并在浏览器本地完成验证。";

	const statusCopy: Record<VerifyStatus, { label: string; title: string; icon: string }> = {
		idle: {
			label: "本地验证",
			title: "待验证",
			icon: "material-symbols:info-outline-rounded",
		},
		loading: {
			label: "本地验证",
			title: "正在验证",
			icon: "material-symbols:progress-activity-rounded",
		},
		valid: {
			label: "本地验证",
			title: "验证通过",
			icon: "material-symbols:verified-rounded",
		},
		invalid: {
			label: "本地验证",
			title: "签名不匹配",
			icon: "material-symbols:warning-outline-rounded",
		},
		error: {
			label: "本地验证",
			title: "验证失败",
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
		verifyMessage = "正在下载验证所需文件...";

		try {
			const openpgp = await import("openpgp");
			const [sourceResponse, signatureResponse, publicKeyResponse] =
				await Promise.all([
					fetch(sourceUrl),
					fetch(signatureUrl),
					fetch(publicKeyUrl),
				]);

			if (!sourceResponse.ok) {
				throw new Error("无法下载原文");
			}
			if (!signatureResponse.ok) {
				throw new Error("无法下载 .asc 签名");
			}
			if (!publicKeyResponse.ok) {
				throw new Error("无法下载公钥");
			}

			verifyMessage = "正在比对原文与 detached signature...";

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
			verifyMessage = "原文与 .asc 匹配，签名也来自此公钥。";
		} catch (error) {
			verifyStatus =
				error instanceof Error && error.message.includes("Signature")
					? "invalid"
					: "error";
			verifyMessage =
				error instanceof Error ? error.message : "发生未知错误";
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
				在线验证
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
		<span>公钥</span>
	</a>
</div>

{#if panelState === "open"}
	<div class:list={["pgp-verify", `pgp-verify--${verifyStatus}`]}>
		<div class="pgp-verify__label">{statusCopy[verifyStatus].label}</div>
		<div class="pgp-verify__box">
			<div class="pgp-verify__head">
				<div class="pgp-verify__icon" aria-hidden="true">
					<Icon icon={statusCopy[verifyStatus].icon} />
				</div>
				<div class="pgp-verify__title">{statusCopy[verifyStatus].title}</div>
			</div>
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
		margin-top: 0.95rem;
	}

	.pgp-verify__label {
		margin-bottom: 0.25rem;
		color: color-mix(in oklab, var(--deep-text) 46%, transparent);
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1.2;
		text-transform: uppercase;
	}

	.pgp-verify__box {
		padding: 0.58rem 0.65rem;
		border-radius: 0.85rem;
		background: var(--btn-regular-bg);
	}

	.pgp-verify__head {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.pgp-verify__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.8rem;
		height: 1.8rem;
		flex: 0 0 auto;
		border-radius: 0.65rem;
		background: color-mix(in oklab, var(--primary) 12%, transparent);
		color: var(--primary);
		font-size: 1rem;
	}

	.pgp-verify__title {
		color: var(--deep-text);
		font-size: 0.84rem;
		font-weight: 800;
		line-height: 1.25;
	}

	.pgp-verify p {
		margin: 0.55rem 0 0;
		color: color-mix(in oklab, var(--deep-text) 58%, transparent);
		font-size: 0.74rem;
		line-height: 1.45;
	}

	.pgp-verify--loading .pgp-verify__icon {
		animation: pgp-spin 900ms linear infinite;
	}

	.pgp-verify--valid .pgp-verify__icon {
		background: color-mix(in oklab, var(--admonitions-color-tip) 18%, transparent);
		color: color-mix(in oklab, var(--admonitions-color-tip) 78%, var(--deep-text) 22%);
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
