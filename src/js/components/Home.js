import { select, templates } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;
    thisHome.render(element);
    thisHome.hideElements();
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
}

export default Home;
