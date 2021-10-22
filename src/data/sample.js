const data = [
    {
      selected: false, icon: 'clean.png', name: 'Baño', title: 'Reforma baño completa',
      unique: false,
      measure: {name : 'Metros', short_name: 'm²'}, 
      items: [
        {
          description: 'Mobiliario, sanitarios, ducha con mampara, griferia, mueble lavado y espejo y extractor electrico', 
          category: {
            medium: {
              label: 'Medio',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 1000, step: 6},
                {from_quantity:6, price: 100, step: 1}
              ]
            }, 
            high: {
              label: 'Alto',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 2000, step: 6},
                {from_quantity:6, price: 200, step: 1}
              ]
            }
          },
          selected: 'medium'
        },
        {
          description: 'Instalaciones, fontaneria, electricidad y saneamientos', 
          category: {
            medium: {
              label: 'Medio',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 500, step: 6},
                {from_quantity:6, price: 50, step: 1}
              ]
            }, 
            high: {
              label: 'Alto',
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
      selected: false, icon: 'kitchen.png', name: 'Kitchen', title: 'Kitchen design',
      unique: false,
      measure: {name : 'Metros', short_name: 'm²'}, 
      items: [
        {
          description: 'kitchen, sanitarios, ducha con mampara, griferia, mueble lavado y espejo y extractor electrico', 
          category: {
            medium: {
              label: 'Medio',
              price_ranges: [
                { price: 120, step: 1}
              ]
            }, 
            high: {
              label: 'Alto',
              price_ranges: [
                { price: 210, step: 1}
              ]
            }
          },
          selected: 'medium'
        },
        {
          description: 'kitchen, fontaneria, electricidad y saneamientos', 
          category: {
            medium: {
              label: 'Medio',
              price_ranges: [
                {from_quantity:0, to_quantity: 6, price: 1230, step: 6},
                {from_quantity:6, price: 200, step: 1}
              ]
            }, 
            high: {
              label: 'Alto',
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
      selected: false, icon: 'heater.png', name: 'Calefacción', title: 'Calefacción',
      unique: true,
      measure: {name : 'Unidad', short_name: 'und'},
      items: [
        {
          description: 'Circuito de calefacción, radiadores, caldera', 
          category: {
            low: {
              label: 'Baja',
              price_ranges: [
                {price: 1230}
              ]
            }, 
            medium: {
              label: 'Medio',
              price_ranges: [
                {price: 1890}
              ]
            }
          },
          selected: 'medium'
        }
      ]
    },
    
    
    
  ];

  const categoryTranslation = {
    'medium': 'Media',
    'low':'Baja',
    'high': 'Alta',
    'none': 'N/A'
  };

  export { data, categoryTranslation }