<script>
import Number from "./components/Number.svelte";
import { Jumper } from 'svelte-loading-spinners'
import { emailValidator, requiredValidator } from './helpers/validators.js'
import { createFieldValidator } from './helpers/validation.js'

	const MAIL_URL = "your mail url to send estimate data";
	const [ validity, validate, resetValidation ] = createFieldValidator(requiredValidator(), emailValidator())


	let email;
	
	

	$: estimates = [];
	$: total = 0;
	$: isLoading = false;

	$: messageSentResult = {status: true, message: ''};



	export const addToEstimate = (estimate) => {

		total += estimate.item.total;
		estimates = [...estimates, estimate];
	};

	function removeItem(i) {
		total -= estimates[i].item.total;
		estimates.splice(i, 1);
		estimates = estimates;
	}

	async function generate(){
		isLoading = true;
		let mailData = {total: total, items: []};

		for(var i in estimates){
			let estimate = estimates[i];
			var options = [];
			for (var k in estimate.item.options){
				let option = estimate.item.options[k];
				options.push({description: option.description, category: option.category_name});
			}
			mailData.items.push({options: options, title: estimate.item.title, total: estimate.item.total, quantity: estimate.quantity, measure: estimate.item.measure});
		}

        const res = await fetch(
            MAIL_URL,
            {
                method: "POST",
                body: JSON.stringify({
                    data: mailData,
					email: email
                }),
            }
        ).catch((error) => {
            console.log(error);
            isLoading = false;
            showError();
        });

        isLoading = false;

        const json = await res.json();

        if (json.status) {
            showSuccess();
        } else {
            showError();
        }
	}

	function showSuccess() {
		messageSentResult.message = 'Mensaje enviado, te contactaremos pronto';
		messageSentResult.status = true;
		var toastLiveExample = document.getElementById('liveToast')
		var toast = new bootstrap.Toast(toastLiveExample);
		toast.show();
	}

	function showError() {
		messageSentResult.message = 'Ha ocurrido un error al enviar, intentelo mas tarde';
		messageSentResult.status = false;
		var toastLiveExample = document.getElementById('liveToast')
		var toast = new bootstrap.Toast(toastLiveExample);
		toast.show();

	}

</script>

<main id="estimateContent">
	<h1>Estimado</h1>
	
	<div class="estimate-container">
		{#each estimates as estimate, i}
		<div class="estimate-item">			
			<table>
				<th>{estimate.item.title} ({estimate.quantity}{estimate.item.measure})</th>
				<th style="text-align:right">
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"  on:click={() => removeItem(i)}>
						<span aria-hidden="true">&times;</span>
					</button>
				</th>

				{#each estimate.item.options as option}
				<tr>
					<td>{option.description}</td>
					<td>{option.category_name}</td>
				</tr>
				{/each}

				<tr>
					<td><b>Total</b></td>
					<td><Number number={estimate.item.total} locale="en"/> €</td>
				</tr>
			</table>
		</div>
		{/each}

		{#if (estimates.length == 0)}
		<div class="no-items-text">Aun no hay items agregados al estimado</div>
		{/if}

		<div class="d-flex justify-content-center">
			<div class="estimate-total shadow-sm p-3">
				<div>Total estimado</div>
				<h1><Number number={total} locale="en"/> €</h1>
			</div>
		</div>

		{#if (estimates.length > 0)}
		


		<br>
		<div class="container">
			<div class="row">
			  <div class="col-md-8 col-12">
				<input type="email" class="form-control" placeholder="Correo electrónico" use:validate={email} bind:value={email}>
			  </div>
			  <div class="col-md-4  col-12">
				<div class="d-flex flex-row-reverse">
					<button type="button" class="btn btn-success generate" disabled={!$validity.valid} on:click={() => generate()}>Enviar</button>
				</div>
			  </div>
			</div>
		</div>




		
		{/if}

	</div>

	{#if (isLoading)}
	<div class="loader">
		<div>
			<Jumper size="60" color="#0d6efd" unit="px" duration="1s" class="align-self-center"></Jumper>
		</div>
	</div>
	{/if}


	<div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">

		<div id="liveToast" class="toast align-items-center text-white bg-{messageSentResult.status ? 'success':'danger'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
			<div class="d-flex">
			<div class="toast-body">
				{messageSentResult.message}
			</div>
			<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
			</div>
		</div>
	</div>


</main>

<style>
	main{
		position: relative;
		margin-left: 100px;
		border: 1px #dadada solid;
		padding: 16px 20px;
	}

	@media (max-width: 768px) {
		main {
			margin-left: 0px;
			margin-right: 16px;
			margin-top: 20px;
		}

		.generate {
			margin-top: 20px;
		}
	}

	.loader {
		position: absolute;
		left:0;right:0;top:0;bottom:0;
		background-color: rgba(0, 0, 0, .5);
	}

	.loader > div {
		width: 100%;
		height: 100%;
	}
		

	h1 {
		margin-bottom: 0 !important;
	}

	.estimate-item{
		margin-top: 44px;
	}

	.estimate-item table {
		width: 100%;
	}

	tr td:nth-child(2) {
		width: 150px;
		font-weight: bold;
		vertical-align: middle;
		text-align: center;
	}

	tr td {
		padding: 8px 12px;
	}

	tr {
		border-bottom: 1px #A0A0A0 solid;
	}

	.estimate-total {
		text-align: center;
		margin-top: 30px;
		background-color: #dfdfdf;
		padding: 8px 32px !important;
    	border-radius: 8px;
		margin-bottom: 8px;
	}
	
	.no-items-text {
		color:#A0A0A0;
		font-size: 20px;
		text-align: center;
		padding: 20px;
	}

	
	.close {
		background: none;
		border: none;
		font-size: 24px;
		font-weight: normal !important;
	}

</style>