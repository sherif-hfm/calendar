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
  const yearLabel = document.getElementById('year-label');
  const gridEl = document.getElementById('calendar-grid');
  const viewGregorianBtn = document.getElementById('view-gregorian');
  const viewHijriBtn = document.getElementById('view-hijri');

  var viewMode = 'gregorian'; // 'gregorian' | 'hijri'

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

  /**
   * Build a lookup: for each (hijriMonth, hijriDay) in the given Hijri year, store the Gregorian date.
   * Single pass over a Gregorian range so the browser doesn't freeze.
   */
  function buildHijriYearLookup(hy) {
    var startYear = 622 + Math.floor((hy - 1) * 354 / 365) - 1;
    var endYear = 622 + Math.ceil((hy + 2) * 354 / 365) + 1;
    var start = new Date(startYear, 0, 1);
    var end = new Date(endYear, 11, 31);
    var byMonth = {};
    var t = start.getTime();
    var endT = end.getTime();
    var oneDay = 24 * 60 * 60 * 1000;
    while (t <= endT) {
      var d = new Date(t);
      var parts = getHijriParts(d);
      if (parts.year === hy && parts.month != null && parts.day != null) {
        if (!byMonth[parts.month]) byMonth[parts.month] = {};
        byMonth[parts.month][parts.day] = new Date(t);
      }
      t += oneDay;
    }
    return byMonth;
  }

  function getHijriMonthLength(lookup, hm) {
    if (!lookup[hm]) return 29;
    if (lookup[hm][30]) return 30;
    if (lookup[hm][29]) return 29;
    return 29;
  }

  function renderYearGregorian(year) {
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
      const hijriFirst = getHijriParts(headerFirst);
      const hijriLast = getHijriParts(headerLast);
      const hijriMonthFirst = getHijriMonthName(headerFirst);
      const hijriMonthLast = getHijriMonthName(headerLast);
      const d1 = (hijriFirst.day != null && !isNaN(hijriFirst.day)) ? hijriFirst.day : '';
      const d2 = (hijriLast.day != null && !isNaN(hijriLast.day)) ? hijriLast.day : '';
      const y1 = (hijriFirst.year != null && !isNaN(hijriFirst.year)) ? hijriFirst.year : '';
      const y2 = (hijriLast.year != null && !isNaN(hijriLast.year)) ? hijriLast.year : '';
      const hijriStartStr = (d1 !== '' ? d1 + ' ' : '') + hijriMonthFirst + (y1 !== '' ? ' ' + y1 + ' هـ' : '');
      const hijriEndStr = (d2 !== '' ? d2 + ' ' : '') + hijriMonthLast + (y2 !== '' ? ' ' + y2 + ' هـ' : '');
      const hijriHeader = hijriStartStr + ' – ' + hijriEndStr;

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

      const hijriMonthsInCard = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const parts = getHijriParts(new Date(year, m, d));
        if (parts.month != null) hijriMonthsInCard[parts.month] = true;
      }
      const hijriMonthsOrdered = Object.keys(hijriMonthsInCard).map(Number).sort(function (a, b) { return a - b; });
      const hijriMonthToSegment = {};
      hijriMonthsOrdered.forEach(function (hm, i) { hijriMonthToSegment[hm] = i; });

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
        const seg = hijri.month != null && hijriMonthToSegment[hijri.month] !== undefined ? hijriMonthToSegment[hijri.month] : 0;
        const cell = document.createElement('div');
        cell.className = 'day-cell other-segment-' + seg + (isToday ? ' today' : '');
        const gregFull = d + ' ' + GREGORIAN_MONTHS_AR[m] + ' ' + year;
        const hijriFull = (hijri.day != null && hijri.year != null)
          ? hijri.day + ' ' + getHijriMonthName(date) + ' ' + hijri.year + ' هـ'
          : '';
        cell.title = hijriFull ? gregFull + '\n' + hijriFull : gregFull;
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

  function renderYearHijri(hijriYear) {
    hijriYear = Math.max(1350, Math.min(1500, parseInt(hijriYear, 10) || getHijriParts(new Date()).year));
    yearInput.value = hijriYear;
    gridEl.innerHTML = '';

    var lookup = buildHijriYearLookup(hijriYear);

    var now = new Date();
    var todayYear = now.getFullYear();
    var todayMonth = now.getMonth();
    var todayDay = now.getDate();

    for (var hm = 1; hm <= 12; hm++) {
      var firstDate = lookup[hm] && lookup[hm][1];
      if (!firstDate) continue;
      var daysInMonth = getHijriMonthLength(lookup, hm);
      var startWeekday = (firstDate.getDay() + 1) % 7;

      var lastDate = lookup[hm][daysInMonth];
      var hijriMonthName = getHijriMonthName(firstDate);
      var gregFirst = firstDate.getDate() + ' ' + GREGORIAN_MONTHS_AR[firstDate.getMonth()] + ' ' + firstDate.getFullYear();
      var gregLast = lastDate ? (lastDate.getDate() + ' ' + GREGORIAN_MONTHS_AR[lastDate.getMonth()] + ' ' + lastDate.getFullYear()) : '';

      var card = document.createElement('div');
      card.className = 'month-card view-hijri-primary';
      var isCurrentMonth = firstDate.getFullYear() === todayYear && firstDate.getMonth() === todayMonth;

      var header = document.createElement('div');
      header.className = 'month-header';
      header.innerHTML =
        '<p class="month-title">' + hijriMonthName + ' ' + hijriYear + ' هـ</p>' +
        '<p class="month-hijri">' + gregFirst + ' – ' + gregLast + '</p>';
      card.appendChild(header);

      var daysRow = document.createElement('div');
      daysRow.className = 'days-row';
      DAY_NAMES_AR.forEach(function (name) {
        var d = document.createElement('span');
        d.className = 'day-name';
        d.textContent = name;
        daysRow.appendChild(d);
      });
      card.appendChild(daysRow);

      var daysGrid = document.createElement('div');
      daysGrid.className = 'days-grid';

      var gregMonthsInCard = {};
      for (var hd = 1; hd <= daysInMonth; hd++) {
        var gd = lookup[hm] && lookup[hm][hd];
        if (gd) gregMonthsInCard[gd.getMonth()] = true;
      }
      var gregMonthsOrdered = Object.keys(gregMonthsInCard).map(Number).sort(function (a, b) { return a - b; });
      var gregMonthToSegment = {};
      gregMonthsOrdered.forEach(function (gm, i) { gregMonthToSegment[gm] = i; });

      for (var i = 0; i < startWeekday; i++) {
        var emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        emptyCell.innerHTML = '<span class="gregorian"></span><span class="hijri"></span>';
        daysGrid.appendChild(emptyCell);
      }

      for (var hd = 1; hd <= daysInMonth; hd++) {
        var gDate = lookup[hm] && lookup[hm][hd];
        var gDay = gDate ? gDate.getDate() : '';
        var isToday = gDate && gDate.getFullYear() === todayYear && gDate.getMonth() === todayMonth && gDate.getDate() === todayDay;
        var seg = gDate && gregMonthToSegment[gDate.getMonth()] !== undefined ? gregMonthToSegment[gDate.getMonth()] : 0;
        var cell = document.createElement('div');
        cell.className = 'day-cell other-segment-' + seg + (isToday ? ' today' : '') + ' view-hijri-primary';
        if (gDate) {
          var gregFull = gDate.getDate() + ' ' + GREGORIAN_MONTHS_AR[gDate.getMonth()] + ' ' + gDate.getFullYear();
          var hijriParts = getHijriParts(gDate);
          var hijriFull = (hijriParts.day != null && hijriParts.year != null)
            ? hijriParts.day + ' ' + getHijriMonthName(gDate) + ' ' + hijriParts.year + ' هـ'
            : '';
          cell.title = hijriFull ? gregFull + '\n' + hijriFull : gregFull;
        }
        cell.innerHTML =
          '<span class="hijri">' + hd + '</span>' +
          '<span class="gregorian">' + gDay + '</span>';
        daysGrid.appendChild(cell);
      }

      var totalCells = startWeekday + daysInMonth;
      var tailEmpty = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (var j = 0; j < tailEmpty; j++) {
        var emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        emptyCell.innerHTML = '<span class="gregorian"></span><span class="hijri"></span>';
        daysGrid.appendChild(emptyCell);
      }

      card.appendChild(daysGrid);
      if (isCurrentMonth) card.classList.add('current-month');
      gridEl.appendChild(card);
    }
  }

  function renderYear(year) {
    if (viewMode === 'gregorian') {
      year = Math.max(1900, Math.min(2100, parseInt(year, 10) || new Date().getFullYear()));
      yearInput.value = year;
      renderYearGregorian(year);
    } else {
      renderYearHijri(year);
    }
  }

  function setViewMode(mode) {
    viewMode = mode;
    document.body.classList.toggle('view-hijri-primary', mode === 'hijri');
    viewGregorianBtn.classList.toggle('active', mode === 'gregorian');
    viewHijriBtn.classList.toggle('active', mode === 'hijri');
    viewGregorianBtn.setAttribute('aria-pressed', mode === 'gregorian');
    viewHijriBtn.setAttribute('aria-pressed', mode === 'hijri');

    if (mode === 'hijri') {
      yearInput.setAttribute('min', 1350);
      yearInput.setAttribute('max', 1500);
      yearLabel.textContent = 'السنة الهجرية';
      renderYear(getHijriParts(new Date()).year);
    } else {
      yearInput.setAttribute('min', 1900);
      yearInput.setAttribute('max', 2100);
      yearLabel.textContent = 'السنة الميلادية';
      renderYear(new Date().getFullYear());
    }
  }

  function init() {
    setViewMode('gregorian');

    yearInput.addEventListener('change', function () {
      renderYear(yearInput.value);
    });

    yearPrev.addEventListener('click', function () {
      renderYear(parseInt(yearInput.value, 10) - 1);
    });

    yearNext.addEventListener('click', function () {
      renderYear(parseInt(yearInput.value, 10) + 1);
    });

    viewGregorianBtn.addEventListener('click', function () {
      setViewMode('gregorian');
    });

    viewHijriBtn.addEventListener('click', function () {
      setViewMode('hijri');
    });
  }

  init();
})();
