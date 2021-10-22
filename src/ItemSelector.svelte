<script>
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import sliderConfig from './helpers/sliderConfig'

	const jq = window.$;

  const dispatch = createEventDispatcher();

	export let data;

  let showErrors = false;
  let quantity;

  var selected;


	var upgrades = data;

  onMount(async () => {
    selectUpgrade(upgrades[0]);
	});

  jq(document).ready(function(){
    jq('.upgrades-slider').slick(sliderConfig);
  });


  function unselectAllUpgrades(){
    for(var i in upgrades){
      upgrades[i].selected = false;
    }
  }

  function selectUpgrade(upgrade){
    unselectAllUpgrades();
    upgrade.selected = true;
    let _upgrade =  JSON.parse(JSON.stringify(upgrade)); 

    
    

    selected = {title: _upgrade.title, options: _upgrade.items, unique: _upgrade.unique, measure: _upgrade.measure, category_name: _upgrade.category_name };

  }
  
  function addUpgradeToEstimate(){
    var total = 0;

    if (quantity || selected.unique){
      showErrors = false
    } else {
      showErrors = true;
      return;
    }
    
    for(var i in selected.options){
      let selectedOption = selected.options[i].selected;
      let category = selected.options[i].category[selectedOption];

      selected.options[i].category_name = category.label;


      category.price_ranges.forEach(function(range){
        let currentMin = quantity - (range.from_quantity ?? 0);
        let maxQuantity = Math.min(currentMin, (range.to_quantity ?? currentMin));
        if (currentMin < 0) return;
        //console.log(`${maxQuantity} / ${range.step} * ${range.price}`);
        if (range.step){
          total += Math.ceil(maxQuantity / range.step) * range.price;
        } else {
          total += range.price;
        }
      });
    }

    selected.total = total; 

    let item = JSON.parse(JSON.stringify(selected));

    if (selected.unique){
      quantity = 1;
    }
		dispatch('newEstimate', {item, quantity});
    
    for(var i in upgrades){
      if (upgrades[i].selected){
        selectUpgrade(upgrades[i]);
      }
    }
    quantity = null;
  }

</script>

<main>
  {#if selected}
  <div id="slider-container">
    <div class="slider upgrades-slider">
      {#each upgrades as upgrade}
      <div class="d-flex justify-content-center" on:click={() => selectUpgrade(upgrade)}>
        <div class="upgrade-element {upgrade.selected ? 'selected':''}">
          <img src="{upgrade.icon}" alt="{upgrade.name}"/>
          <div>{upgrade.name}</div>
          
        </div>
      </div>
      {/each}
    </div>
  </div>






  <div id="upgrade-content">
    <h3>{selected.title}</h3>
    <div id="form-container">
      <table class="h-100 w-100">
        <thead>
          <tr>
            <th></th>
            <th>{selected.category_name}</th>
          </tr>
        </thead>
        <tbody>
          {#each selected.options as option}

          <tr>
            <td>
              {option.description}
            </td>
            <td>
              <select class="form-control" bind:value={option.selected}>
                {#each Object.entries(option.category) as [type, price]}
                <option value="{type}">{option.category[type].label}</option>
                {/each}
              </select>
            </td>
          </tr>
          {/each}
        </tbody>
      </table>
      <br>
      <br>
      {#if (showErrors)}
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <strong>¡Campo requerido!</strong> Es necesario ingresar la cantidad
      </div>
      {/if}
      {#if (!selected.unique)}
      <div class="form-group">
        <label for="square-meters">{selected.measure.name} ({selected.measure.short_name})</label>
        <input type="number" class="form-control" id="square-meters" placeholder="{selected.measure.short_name}" bind:value={quantity}>
      </div>
      {/if}
      <div>
        <button type="button" class="btn btn-primary add-to-estimate"  on:click={() => addUpgradeToEstimate()}>Add to Estimate</button>
      </div>
    </div>
  </div>
  {/if}
</main>

<style>
  .upgrade-element{
    font-size: 12px;
    text-align: center;
    width: 80px;
    height: 80px;
    
  }

  .upgrade-element:hover{
    cursor: pointer;
    background-color: rgb(235, 235, 235);
    border-radius: 8px;
  }

  .upgrade-element.selected {
    background-color: rgb(235, 235, 235);
    border-radius: 8px;
  }

  .upgrade-element img{
    height: 54px;
    padding-top: 8px;
    margin-right: auto;
    margin-left: auto;
  }

  .upgrade-element div {
    margin-left: -100%;
    margin-right: -100%;
    margin-top: 4px;
    text-align: center;
  }

  #upgrade-content {
    padding-top: 50px;
    padding-right: 16px;
  }
  
  #form-container table select{
    text-align: center;
    margin: 0 auto;
  }

  #form-container table th {
    text-align: center;
  }

  #form-container table tr {
		border-bottom: 1px #dadada solid;
	}

  #form-container table tr td:nth-child(1) {
		padding-right: 16px;
	}

  #form-container table tr td:nth-child(2) {
    width: 100px;
	}

  #form-container table tr td {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .add-to-estimate {
    float: right;
    margin-top: 20px;
  }

</style>

<svelte:head>
  <style>
    .slider button {
      position: absolute;
      background: white;
      border: none;
      z-index: 100;
    }
    .slick-prev {
      left: 0;
      top: 0px;
      bottom: 0px;
    }

    .slick-next {
      right: 0;
      top: 0px;
      bottom: 0px;
    }
  </style>
</svelte:head>