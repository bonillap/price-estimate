<script>
	export let number;
	export let locale = "en";
/*
	const testLocales = [
		"en",
		"ko-KR",
		"de-DE",
		"ru-RU",
		"zh-CN"
	];
*/
	$: formattedNumber = number.toLocaleString(locale, {
		/*notation: "compact",
		compactDisplay: "short"*/
	});
</script>

<style>
	span {
		font-variant-numeric: tabular-nums;
	}
</style>

<span>{formattedNumber}</span>
