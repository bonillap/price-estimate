export default {
    infinite: false,
    slidesToShow: 7,
    slidesToScroll: 2,
    variableWidth:false,

    responsive: [
      {
        breakpoint: 2100,
        settings: {
          slidesToShow: 6,
          slidesToScroll: 2,
          infinite: false,
          dots: false
        }
      },
      {
        breakpoint: 1700,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 2,
          infinite: false,
          dots: false
        }
      },
      {
        breakpoint: 1500,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
          infinite: false,
          dots: false
        }
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: false,
          dots: false
        }
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: false,
          dots: false
        }
      },
      
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: false,
          dots: false
        }
      },        
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: false,
          dots: false
        }
      },        
      {
        breakpoint: 436,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: false,
          dots: false
        }
      }
    ],
    prevArrow:'<button type="button" data-role="none" class="slick-prev"><i class="bi bi-chevron-left"></i></button>',
    nextArrow:'<button type="button" data-role="none" class="slick-next"><i class="bi bi-chevron-right"></i></button>'
  }