import { templates } from '../settings.js';
import utils from '../utils.js';

class Alert {
  constructor(element) {
    const thisAlert = this;
    thisAlert.messages = [];
    thisAlert.init(element);
  }

  init(element) {
    const thisAlert = this;
    thisAlert.dom = {};
    thisAlert.dom.wrapper = element;
  }

  uid() {
    return String(Date.now().toString(32) + Math.random().toString(16)).replace(
      /\./g,
      ''
    );
  }

  pushMessage(type, text, id) {
    const thisAlert = this;

    const exists = thisAlert.messages.some((msg) => msg.id === id);

    if (exists) {
      thisAlert.emphasizeMessage(id);
    } else {
      const message = {
        type,
        text,
        id: id || thisAlert.uid(),
      };
      thisAlert.messages.push(message);
      thisAlert.renderMessage(message);
    }
  }

  emphasizeMessage(id) {
    const thisAlert = this;
    const existingMessage = thisAlert.dom.wrapper.querySelector(
      `div[data-message-id="${id}"]`
    );
    existingMessage.classList.remove('emphasize');
    void existingMessage.offsetWidth;
    existingMessage.classList.add('emphasize');
  }

  renderMessage(message) {
    const thisAlert = this;
    const messageHTML = templates.alertMessage(message);
    const messageElement = utils.createDOMFromHTML(messageHTML);

    messageElement.addEventListener('click', function () {
      const index = thisAlert.messages.findIndex(
        (msg) => msg.id === messageElement.dataset.messageId
      );
      thisAlert.messages.splice(index, 1);
      messageElement.remove();
    });

    thisAlert.dom.wrapper.append(messageElement);
  }
}

export default Alert;
