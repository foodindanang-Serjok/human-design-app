// ============================================================
// app.js — логика приложения с Claude API
// ============================================================

// Переключение экранов
function showScreen(id) {
  document.querySelectorAll('[id^="screen-"]').forEach(function(screen) {
    screen.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// Показать/скрыть загрузку
function showLoading(show) {
  document.getElementById('screen-loading').style.display = show ? 'flex' : 'none';
  document.getElementById('screen-form').style.display = show ? 'none' : 'flex';
}

// Главная функция расчёта
async function calculate() {
  var name = document.getElementById('input-name').value.trim() || 'Пользователь';
  var city = document.getElementById('input-city').value.trim() || 'не указан';
  var day   = selectedDay;
  var month = selectedMonth;
  var year  = selectedYear;
  var hour  = selectedHour;
  var min   = selectedMin;

  if (!day || !month || !year) {
    alert('Пожалуйста, выбери дату рождения');
    return;
  }

  var monthNames = ['января','февраля','марта','апреля','мая','июня',
                    'июля','августа','сентября','октября','ноября','декабря'];
  var birthStr = day + ' ' + monthNames[month-1] + ' ' + year + ' года, ' +
                 String(hour).padStart(2,'0') + ':' + String(min).padStart(2,'0') +
                 ', город: ' + city;

  // Показываем загрузку
  showLoading(true);

  try {
    var result = await askClaude(name, birthStr);
    showResult(name, result);
    showScreen('screen-result');
  } catch(e) {
    alert('Ошибка расчёта. Проверь подключение к интернету.');
    console.error(e);
  } finally {
    showLoading(false);
  }
}

// Запрос к Claude API
async function askClaude(name, birthStr) {
  var prompt = 'Ты эксперт по системе Human Design. Рассчитай карту для человека:\n' +
    'Имя: ' + name + '\n' +
    'Дата и время рождения: ' + birthStr + '\n\n' +
    'Используй точные швейцарские эфемериды (Swiss Ephemeris).\n' +
    'Учти часовой пояс по городу рождения.\n\n' +
    'Ответь СТРОГО в формате JSON без лишнего текста:\n' +
    '{\n' +
    '  "type": "тип (Генератор/Манифестирующий Генератор/Проектор/Манифестор/Рефлектор)",\n' +
    '  "profile": "профиль например 6/2",\n' +
    '  "profile_name": "название профиля например Ролевая модель / Отшельник",\n' +
    '  "strategy": "стратегия",\n' +
    '  "authority": "авторитет",\n' +
    '  "sun_personality": "ворота и линия Солнца личности например 46.2",\n' +
    '  "sun_design": "ворота и линия Солнца дизайна например 25.4",\n' +
    '  "recommendations": [\n' +
    '    "персональная рекомендация 1",\n' +
    '    "персональная рекомендация 2",\n' +
    '    "персональная рекомендация 3",\n' +
    '    "персональная рекомендация 4"\n' +
    '  ]\n' +
    '}';

  var response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  var data = await response.json();
  var text = data.content[0].text;

  // Убираем markdown если есть
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

// Заполняем экран результата
function showResult(name, result) {
  document.getElementById('res-name').textContent     = name;
  document.getElementById('res-type').textContent     = result.type;
  document.getElementById('res-strategy').textContent = result.strategy;
  document.getElementById('res-authority').textContent = result.authority;
  document.getElementById('res-profile').textContent  =
    result.profile + ' — ' + result.profile_name;

  // Рекомендации от Claude
  var html = '';
  var icons = ['⚡','🎯','🌙','💡','🔮','🌿'];
  if (result.recommendations && result.recommendations.length) {
    result.recommendations.forEach(function(rec, i) {
      html += '<div class="rec-item">' +
        '<span class="rec-icon">' + (icons[i] || '✦') + '</span>' +
        '<p>' + rec + '</p>' +
        '</div>';
    });
  }

  document.getElementById('rec-text').innerHTML = html;
}

// PWA: регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js');
  });
}
