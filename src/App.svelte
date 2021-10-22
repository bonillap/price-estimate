<script>
	import Estimate from "./Estimate.svelte";
	import UpdateCalculator from "./UpdateCalculator.svelte";

	let estimate;

	const whenNewEstimate = (event) => estimate.addToEstimate(event.detail);


</script>

<main class="h-100">

	<div class="container">
		<div class="row">
		  <div class="col-md-6 col-12">
			<UpdateCalculator on:newEstimate={whenNewEstimate} />
		  </div>
		  <div class="col-md-6  col-12">
			<Estimate bind:this="{estimate}" />
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