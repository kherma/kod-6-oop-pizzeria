import { select, templates } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;
    thisHome.render(element);
    thisHome.hideElements();
    thisHome.slider();
  }

  hideElements() {
    ['hashchange', 'load'].forEach((eventType) =>
      window.addEventListener(eventType, function () {
        [select.containerOf.cart, select.containerOf.mainNav].forEach(
          (selector) => {
            document.querySelector(selector).style.display =
              window.location.hash === '#/home' ? 'none' : '';
          }
        );
      })
    );
  }

  render(element) {
    const thisHome = this;
    const generatedHTML = templates.homeWidget();
    thisHome.dom = {};

    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }

  slider() {
    const thisHome = this;
    thisHome.currentSlide = 0;
    thisHome.slides = document.querySelectorAll('.slide');
    const maxSlides = thisHome.slides.length;

    // Infinite slider
    setInterval(() => {
      if (thisHome.currentSlide === maxSlides - 1) {
        thisHome.currentSlide = -1;
      }

      thisHome.currentSlide++;
      thisHome.goToSlide(thisHome.currentSlide);
      thisHome.activeDot(thisHome.currentSlide);
    }, 3000);

    // Change slide on click
    document.querySelector('.dots').addEventListener('click', function (event) {
      if (event.target.classList.contains('dot')) {
        thisHome.currentSlide = Number(event.target.dataset.slide);
        thisHome.activeDot(thisHome.currentSlide);
        thisHome.goToSlide(thisHome.currentSlide);
      }
    });
    thisHome.activeDot(thisHome.currentSlide);
  }

  activeDot(current) {
    document.querySelectorAll('.dot').forEach((dot) => {
      dot.classList.remove('dot--active');
      if (Number(dot.dataset.slide) === current) {
        dot.classList.add('dot--active');
      }
    });
  }

  goToSlide(current) {
    const thisHome = this;
    thisHome.slides.forEach((slide, index) => {
      slide.style.transform = `translateX(${(index - current) * 100}%)`;
    });
  }
}

export default Home;
