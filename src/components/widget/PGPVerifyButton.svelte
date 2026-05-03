<script lang="ts">
	import Icon from "@iconify/svelte";

	type VerifyState = "idle" | "open";

	export let signatureUrl: string;
	export let sourceUrl: string;
	export let publicKeyUrl: string;

	let state: VerifyState = "idle";

	function togglePanel() {
		state = state === "idle" ? "open" : "idle";
	}
</script>

<div class="pgp-actions">
	<button
		type="button"
		class="pgp-action"
		onclick={togglePanel}
		aria-expanded={state === "open"}
	>
		<span class="pgp-action__icon" aria-hidden="true">
			{#if state === "open"}
				<Icon icon="material-symbols:arrow-back-rounded" />
			{:else}
				<Icon icon="material-symbols:fact-check-outline-rounded" />
			{/if}
		</span>
		<span>
			{#if state === "open"}
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

	<a class="pgp-action" href={publicKeyUrl}>
		<span class="pgp-action__icon" aria-hidden="true">
			<Icon icon="material-symbols:key-outline-rounded" />
		</span>
		<span>公鑰</span>
	</a>
</div>

{#if state === "open"}
	<p class="pgp-verify__message">
		在線驗證邏輯將在接入 OpenPGP 後啟用。
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
</style>
