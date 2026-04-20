// ============================================================
// picker.js — барабан выбора даты и времени
// ============================================================

var selectedDay   = 1;
var selectedMonth = 1;
var selectedYear  = 1990;
var selectedHour  = 12;
var selectedMin   = 0;

var MONTHS = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];

// ---- Открыть барабан ----
function openPicker(type) {
  if (type === 'date') {
    buildDatePicker();
    document.getElementById('picker-date').classList.add('active');
  } else {
    buildTimePicker();
    document.getElementById('picker-time').classList.add('active');
  }
}

// ---- Закрыть барабан ----
function closePicker(type) {
  if (type === 'date') {
    document.getElementById('picker-date').classList.remove('active');
  } else {
    document.getElementById('picker-time').classList.remove('active');
  }
}

// ---- Подтвердить дату ----
function confirmDate() {
  var d = String(selectedDay).padStart(2, '0');
  var m = String(selectedMonth).padStart(2, '0');
  document.getElementById('date-display').textContent =
    d + ' ' + MONTHS[selectedMonth - 1] + ' ' + selectedYear;
  document.getElementById('date-display').classList.add('selected');
  closePicker('date');
}

// ---- Подтвердить время ----
function confirmTime() {
  var h = String(selectedHour).padStart(2, '0');
  var min = String(selectedMin).padStart(2, '0');
  document.getElementById('time-display').textContent = h + ':' + min;
  document.getElementById('time-display').classList.add('selected');
  closePicker('time');
}

// ---- Построить барабан даты ----
function buildDatePicker() {
  var days = [];
  for (var i = 1; i <= 31; i++) days.push(i);

  var years = [];
  for (var y = 1930; y <= 2010; y++) years.push(y);

  buildCol('col-day',   days,   selectedDay,   function(v) { selectedDay = v; });
  buildCol('col-month', MONTHS, selectedMonth, function(v) { selectedMonth = v; }, true);
  buildCol('col-year',  years,  selectedYear,  function(v) { selectedYear = v; });
}

// ---- Построить барабан времени ----
function buildTimePicker() {
  var hours = [];
  for (var h = 0; h <= 23; h++) hours.push(h);

  var minutes = [];
  for (var m = 0; m <= 59; m += 5) minutes.push(m);

  buildCol('col-hour',   hours,   selectedHour, function(v) { selectedHour = v; });
  buildCol('col-minute', minutes, selectedMin,  function(v) { selectedMin = v; });
}

// ---- Построить одну колонку барабана ----
function buildCol(colId, items, currentVal, onChange, isMonth) {
  var col = document.getElementById(colId);
  col.innerHTML = '';

  // Пустые строки сверху и снизу для центрирования
  for (var p = 0; p < 2; p++) {
    var pad = document.createElement('div');
    pad.className = 'picker-item picker-pad';
    col.appendChild(pad);
  }

  items.forEach(function(item, idx) {
    var div = document.createElement('div');
    div.className = 'picker-item';

    var val = isMonth ? (idx + 1) : item;
    var label = isMonth ? item : (typeof item === 'number' && colId !== 'col-year'
      ? String(item).padStart(2, '0') : item);

    div.textContent = label;
    div.dataset.value = val;

    if (val === currentVal) div.classList.add('picker-selected');

    col.appendChild(div);
  });

  for (var p2 = 0; p2 < 2; p2++) {
    var pad2 = document.createElement('div');
    pad2.className = 'picker-item picker-pad';
    col.appendChild(pad2);
  }

  // Прокрутка к выбранному
  setTimeout(function() {
    var selected = col.querySelector('.picker-selected');
    if (selected) {
      col.scrollTop = selected.offsetTop - col.offsetHeight / 2 + selected.offsetHeight / 2;
    }
  }, 50);

  // Слушаем прокрутку
  col.addEventListener('scroll', function() {
    var itemH = 44;
    var idx2 = Math.round(col.scrollTop / itemH);
    var realItems = col.querySelectorAll('.picker-item:not(.picker-pad)');

    col.querySelectorAll('.picker-item').forEach(function(el) {
      el.classList.remove('picker-selected');
    });

    if (realItems[idx2]) {
      realItems[idx2].classList.add('picker-selected');
      onChange(parseInt(realItems[idx2].dataset.value));
    }
  });
}
