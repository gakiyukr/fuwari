<script lang="ts">
	import Icon from "@iconify/svelte";

	export let signatureUrl: string;
	export let sourceUrl: string;
	export let publicKeyPageUrl: string;
</script>

<div class="pgp-actions">
	<a class="pgp-action pgp-action--signature" href={signatureUrl} download>
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

	.pgp-action--signature {
		grid-column: 1 / -1;
	}

	.pgp-action__icon {
		display: inline-flex;
		font-size: 0.95rem;
		line-height: 1;
	}
</style>
