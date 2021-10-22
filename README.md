

<h1 align="center">Project Title</h1>

<!--div align="center">

[![Status](https://img. /badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/kylelobo/The-Documentation-Compendium.svg)](https://github.com/kylelobo/The-Documentation-Compendium/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/kylelobo/The-Documentation-Compendium.svg)](https://github.com/kylelobo/The-Documentation-Compendium/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div-->

<p align="justify"> This is a sample application for those who needs an easy way to show a basic estimate of their services or products. It works with dynamic content, dynamic estimate list, estimate resume and email validator. Just like the price calculator from <a href="https://cloud.google.com/products/calculator">here </a> (kind of 😆). I know there is a lot to work to do.
    <br> 
</p>

## 🚥 Getting Started <a name = "getting_started"></a>

All you have to do is install this component via npm:


```
npm install bonillap/price-estimate
```
You have to import these js and css in your index.html :
- bootstrap, only for styles
- jquery, we need to slik to work
- slick, carousel for category selector

## ▶️ Running <a name = "running"></a>

Import this component in any of your svelte files:
```javascript
import PriceEstimate from "price-estimate";
```
Add the component tag inside your html
```html
<PriceEstimate data={data} mailingURL={mail}></PriceEstimate>
```
The "data" attribute is explained above and the "mailingURL" is the URL of your endpoint or service to process the estimate data with the email that users set in the email field. 

Then, you can access it by default in http://localhost:5000 and watch the app running with changes in real time. You can check this <a>sample</a> repository.

## 🛠️ Tools and libraries <a name = "tools"></a>
<ul>
    <li><a href="https://svelte.dev/">Svelte</a></li>
    <li><a href="https://getbootstrap.com/">Bootstrap</a></li>
    <li><a href="https://jquery.com/">JQuery</a></li>
    <li><a href="https://kenwheeler.github.io/slick/">Slick</a></li>
</ul>


## 📔 Data definition <a name = "data"></a>
The data field in PriceEstimate is defined as an array. This is an example:

```javascript
[
    {
      icon: 'assets/icons/clean.png', 
      name: 'Bathroom', 
      title: 'Bathroom Renovation ',
      category_name: 'Quality',
      unique: false,
      measure: {name : 'Meters', short_name: 'm²'}, 
      items: [
        {
          description: 'Toilet, bath, faucets, furnishings and mirrors', 
          category: {
            medium: {
              label: 'Medium',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 1000, step: 6},
                {from_quantity:6, price: 100, step: 1}
              ]
            }, 
            high: {
              label: 'High',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 2000, step: 6},
                {from_quantity:6, price: 200, step: 1}
              ]
            }
          },
          selected: 'medium'
        },
        {
          description: 'Instalation, plumbing, electrical wiring and veneer', 
          category: {
            medium: {
              label: 'Medium',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 500, step: 6},
                {from_quantity:6, price: 50, step: 1}
              ]
            }, 
            high: {
              label: 'High',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 1000, step: 6},
                {from_quantity:6, price: 100, step: 1}
              ]
            }
          },
          selected: 'medium'
        }
      ]
    },
    {
      icon: 'assets/icons/kitchen.png', 
      name: 'Kitchen', 
      title: 'Kitchen Design',
      category_name: 'Quality',
      unique: false,
      measure: {name : 'Meters', short_name: 'm²'}, 
      items: [
        {
          description: 'Furniture from bottom to top', 
          category: {
            medium: {
              label: 'Medium',
              price_ranges: [
                { price: 120, step: 1}
              ]
            }, 
            high: {
              label: 'High',
              price_ranges: [
                { price: 210, step: 1}
              ]
            }
          },
          selected: 'medium'
        },
        {
          description: 'Installations, plumbing and electrical wiring', 
          category: {
            medium: {
              label: 'Medium',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 1230, step: 6},
                {from_quantity:6, price: 200, step: 1}
              ]
            }, 
            high: {
              label: 'High',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 1230, step: 6},
                {from_quantity:6, price: 200, step: 1}
              ]
            }
          },
          selected: 'medium'
        }
      ]
    },
    {
      icon: 'assets/icons/heater.png', 
      name: 'Heater', 
      title: 'Heater',
      category_name: 'Rank',
      unique: true,
      measure: {name : 'Unidad', short_name: 'und'},
      items: [
        {
          description: 'Heating circuit, radiators and boiler', 
          category: {
            one_room: {
              label: 'One room',
              price_ranges: [
                {price: 1230}
              ]
            }, 
            full_house: {
              label: 'Full house',
              price_ranges: [
                {price: 1890}
              ]
            }
          },
          selected: 'full_house'
        }
      ]
    }
]
```
This sample shows something like this:
![ScreenShot](https://raw.github.com/bonillap/price-estimate/master/screenshots/estimate1.jpg)

It's look pretty ugly and complex, but is pretty easy to understand:
- First, every item in the array is a category