<script>
	import Summary from "./Summary.svelte";
	import ItemSelector from "./ItemSelector.svelte";

	let estimate;
	export let data;
	export let mailingURL;
 

	const whenNewEstimate = (event) => estimate.addToEstimate(event.detail);


</script>

<main class="h-100">

	<div class="container">
		<div class="row">
		  <div class="col-md-6 col-12">
			<ItemSelector on:newEstimate={whenNewEstimate} data={data}/>
		  </div>
		  <div class="col-md-6  col-12">
			<Summary bind:this="{estimate}" mailingURL={mailingURL} />
		  </div>
		</div>
	</div>

	




	
</main>

<style>
	main {
		overflow-y: auto;
	}

	.container {
		max-width: 100% !important;
		padding: 80px;
	}

</style>