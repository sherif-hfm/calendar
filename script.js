(function () {
  'use strict';

  const GREGORIAN_MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Full day names Sat–Fri (Saturday first)
  const DAY_NAMES_AR = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const yearInput = document.getElementById('year-select');
  const yearPrev = document.getElementById('year-prev');
  const yearNext = document.getElementById('year-next');
  const gridEl = document.getElementById('calendar-grid');

  // Use en-US so formatToParts returns ASCII digits (ar-SA returns Arabic-Indic digits → parseInt NaN)
  var HIJRI_FORMAT = 'en-US-u-ca-islamic-umalqura';

  function getHijriParts(date) {
    var formatter = new Intl.DateTimeFormat(HIJRI_FORMAT, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    var parts = formatter.formatToParts(date);
    var obj = { day: null, month: null, year: null };
    parts.forEach(function (p) {
      if (p.type !== 'literal' && obj[p.type] === null) {
        obj[p.type] = parseInt(p.value, 10);
      }
    });
    return obj;
  }

  function getHijriMonthName(date) {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long' }).format(date);
  }

  function getHijriYear(date) {
    var parts = getHijriParts(date);
    return parts.year != null ? parts.year : '';
  }

  function renderYear(year) {
    year = Math.max(1900, Math.min(2100, parseInt(year, 10) || new Date().getFullYear()));
    yearInput.value = year;
    gridEl.innerHTML = '';

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();
    const isCurrentYear = year === todayYear;

    for (let m = 0; m < 12; m++) {
      const first = new Date(year, m, 1);
      const last = new Date(year, m + 1, 0);
      const daysInMonth = last.getDate();
      // Saturday = first column (0). getDay(): Sun=0..Sat=6 → (getDay() + 1) % 7
      const startWeekday = (first.getDay() + 1) % 7;
      const isCurrentMonth = isCurrentYear && m === todayMonth;

      const headerFirst = new Date(year, m, 1);
      const headerLast = new Date(year, m, daysInMonth);
      const hijriMonthFirst = getHijriMonthName(headerFirst);
      const hijriMonthLast = getHijriMonthName(headerLast);
      const hijriYearFirst = getHijriYear(headerFirst);
      const hijriYearLast = getHijriYear(headerLast);
      const y1 = (hijriYearFirst != null && !isNaN(hijriYearFirst)) ? hijriYearFirst : '';
      const y2 = (hijriYearLast != null && !isNaN(hijriYearLast)) ? hijriYearLast : '';
      const hijriHeader = hijriMonthFirst === hijriMonthLast && y1 === y2
        ? hijriMonthFirst + (y1 !== '' ? ' ' + y1 + 'هـ' : '')
        : hijriMonthFirst + (y1 !== '' ? ' ' + y1 + 'هـ' : '') + ' - ' + hijriMonthLast + (y2 !== '' ? ' ' + y2 + 'هـ' : '');

      const card = document.createElement('div');
      card.className = 'month-card' + (isCurrentMonth ? ' current-month' : '');

      const header = document.createElement('div');
      header.className = 'month-header';
      header.innerHTML =
        '<p class="month-title">' + GREGORIAN_MONTHS_AR[m] + ' ' + year + '</p>' +
        '<p class="month-hijri">' + hijriHeader + '</p>';
      card.appendChild(header);

      const daysRow = document.createElement('div');
      daysRow.className = 'days-row';
      DAY_NAMES_AR.forEach(function (name) {
        const d = document.createElement('span');
        d.className = 'day-name';
        d.textContent = name;
        daysRow.appendChild(d);
      });
      card.appendChild(daysRow);

      const daysGrid = document.createElement('div');
      daysGrid.className = 'days-grid';

      const emptyCount = startWeekday;
      for (let i = 0; i < emptyCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell empty';
        cell.innerHTML = '<span class="gregorian"></span><span class="hijri"></span>';
        daysGrid.appendChild(cell);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, m, d);
        const hijri = getHijriParts(date);
        const hijriDay = (hijri.day != null && !isNaN(hijri.day)) ? hijri.day : '';
        const isToday = isCurrentMonth && d === todayDay;
        const cell = document.createElement('div');
        cell.className = 'day-cell' + (isToday ? ' today' : '');
        cell.innerHTML =
          '<span class="gregorian">' + d + '</span>' +
          '<span class="hijri">' + hijriDay + '</span>';
        daysGrid.appendChild(cell);
      }

      const totalCells = emptyCount + daysInMonth;
      const remainder = totalCells % 7;
      const tailEmpty = remainder === 0 ? 0 : 7 - remainder;
      for (let i = 0; i < tailEmpty; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell empty';
        cell.innerHTML = '<span class="gregorian"></span><span class="hijri"></span>';
        daysGrid.appendChild(cell);
      }

      card.appendChild(daysGrid);
      gridEl.appendChild(card);
    }
  }

  function init() {
    const currentYear = new Date().getFullYear();
    yearInput.value = currentYear;
    yearInput.setAttribute('value', currentYear);
    renderYear(currentYear);

    yearInput.addEventListener('change', function () {
      renderYear(yearInput.value);
    });

    yearPrev.addEventListener('click', function () {
      renderYear(parseInt(yearInput.value, 10) - 1);
    });

    yearNext.addEventListener('click', function () {
      renderYear(parseInt(yearInput.value, 10) + 1);
    });
  }

  init();
})();
