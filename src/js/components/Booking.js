import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element, alert) {
    const thisBooking = this;
    thisBooking.selectedTable = null;
    thisBooking.alert = alert;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    const urls = {
      bookings: `${settings.db.url}/${
        settings.db.bookings
      }?${params.bookings.join('&')}`,
      eventsCurrent: `${settings.db.url}/${
        settings.db.events
      }?${params.eventsCurrent.join('&')}`,
      eventsRepeat: `${settings.db.url}/${
        settings.db.events
      }?${params.eventsRepeat.join('&')}`,
    };

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    for (const item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] === 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let i = startHour; i < startHour + duration; i += 0.5) {
      if (typeof thisBooking.booked[date][i] === 'undefined') {
        thisBooking.booked[date][i] = [];
      }
      thisBooking.booked[date][i].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] === 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ===
        'undefined'
    ) {
      allAvailable = true;
    }

    for (const table of thisBooking.dom.tables) {
      const tableId = parseInt(
        table.getAttribute(settings.booking.tableIdAttribute)
      );

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element) {
    const thisBooking = this;
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(
      select.booking.floor
    );
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(
      select.booking.form
    );
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.starters
    );
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(
      select.booking.phone
    );
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(
      select.booking.address
    );
  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      thisBooking.unselectCurrentTable();
    });

    thisBooking.dom.floor.addEventListener('click', function (e) {
      const isTable = e.target.classList.contains(classNames.booking.table);
      if (isTable) {
        thisBooking.initTables(e.target);
      }
    });

    thisBooking.dom.form.addEventListener('submit', function (e) {
      e.preventDefault();
      console.log(thisBooking.dom.phone.value);
      console.log(thisBooking.dom.address.value);

      thisBooking.sendBooking();
    });
  }

  initTables(selectedTable) {
    const thisBooking = this;

    const isBooked = selectedTable.classList.contains(
      classNames.booking.tableBooked
    );

    if (isBooked) {
      thisBooking.alert.pushMessage(
        settings.alert.types.warning,
        settings.alert.messages.tableUnavailable,
        settings.alert.ids.tableUnavailable
      );

      return;
    }

    const tableId = selectedTable.dataset.table;
    thisBooking.selectedTable =
      tableId === thisBooking.selectedTable ? null : tableId;

    for (let table of thisBooking.dom.tables) {
      table.classList.toggle(
        classNames.booking.selected,
        table.dataset.table === thisBooking.selectedTable
      );
    }
  }

  unselectCurrentTable() {
    const thisBooking = this;
    if (thisBooking.selectedTable) {
      thisBooking.selectedTable = null;
      thisBooking.dom.floor
        .querySelector(`.${classNames.booking.selected}`)
        .classList.remove(classNames.booking.selected);
    }
  }

  sendBooking() {
    const thisBooking = this;
    const url = `${settings.db.url}/${settings.db.bookings}`;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.selectedTable) || null,
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    thisBooking.dom.starters.forEach((starter) => {
      starter.checked && payload.starters.push(starter.value);
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.alert.pushMessage(
          settings.alert.types.success,
          settings.alert.messages.reservationConfirmed
        );
        if (parsedResponse.table) {
          thisBooking.unselectCurrentTable();
          thisBooking.makeBooked(
            parsedResponse.date,
            parsedResponse.hour,
            parsedResponse.duration,
            parsedResponse.table
          );
          thisBooking.updateDOM();
        }
      });
  }
}

export default Booking;
