// Эта функция показывает нужный экран и скрывает остальные
function showScreen(id) {
  // Находим ВСЕ экраны и убираем класс active
  document.querySelectorAll('[id^="screen-"]').forEach(function(screen) {
    screen.classList.remove('active');
  });

  // Находим НУЖНЫЙ экран и добавляем класс active
  document.getElementById(id).classList.add('active');

  // Прокручиваем страницу наверх
  window.scrollTo(0, 0);
}
