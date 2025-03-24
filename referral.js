// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
  const isDark = localStorage.getItem('theme') === 'dark';
  document.body.classList.toggle('dark', isDark);
  document.getElementById('theme-switch').checked = isDark;
  document.getElementById('sidebar-theme-switch').checked = isDark;

  // Инициализация реферальной программы
  initializeReferralProgram();
});

// Переключение темы
document.getElementById('theme-switch').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.checked);
  localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
  document.getElementById('sidebar-theme-switch').checked = e.target.checked;
});

document.getElementById('sidebar-theme-switch').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.checked);
  localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
  document.getElementById('theme-switch').checked = e.target.checked;
});

// Переключение боковой панели
const sidebar = document.getElementById('sidebar');
document.querySelector('.sidebar-handle').addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  const isSidebarOpen = sidebar.classList.contains('open');
  const isClickInsideSidebar = sidebar.contains(e.target);
  const isClickOnHandle = e.target.closest('.sidebar-handle');
  if (isSidebarOpen && !isClickInsideSidebar && !isClickOnHandle) {
    sidebar.classList.remove('open');
  }
});

// Установка текущего года в футере
document.getElementById('current-year').textContent = new Date().getFullYear();

// Кнопка "Вернуться наверх"
document.getElementById('back-to-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Функции для модального окна
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  const modalContent = modal.querySelector('.modal-content');
  modal.style.display = 'flex';
  modalContent.scrollTo({ top: 0, behavior: 'smooth' });
  modalContent.focus();
  trapFocus(modal);
}

function closeModal(modal) {
  modal.style.display = 'none';
}

document.querySelectorAll('.modal .close').forEach(closeBtn => {
  closeBtn.addEventListener('click', () => {
    closeModal(closeBtn.closest('.modal'));
  });
});

// Уведомления
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add('active');
  }, 10);
  setTimeout(() => {
    notification.classList.remove('active');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Ограничение фокуса в модальном окне
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

// Обработка форм "Оставить отзыв" и "Сообщить об ошибке"
document.getElementById('feedback-form').addEventListener('submit', (e) => {
  e.preventDefault();
  closeModal(document.getElementById('feedback-modal'));
  showNotification('Спасибо за ваш отзыв!');
  e.target.reset();
});

document.getElementById('bug-report-form').addEventListener('submit', (e) => {
  e.preventDefault();
  closeModal(document.getElementById('bug-report-modal'));
  showNotification('Спасибо за сообщение об ошибке!');
  e.target.reset();
});

// Генерация уникального реферального кода
function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Инициализация реферальной программы
function initializeReferralProgram() {
  let referralCode = localStorage.getItem('referralCode');
  if (!referralCode) {
    referralCode = generateReferralCode();
    localStorage.setItem('referralCode', referralCode);
  }

  // Устанавливаем реферальную ссылку
  const referralLinkInput = document.getElementById('referral-link');
  referralLinkInput.value = `https://clientflow.com/ref/${referralCode}`;

  // Инициализация статистики
  let referralStats = JSON.parse(localStorage.getItem(`referralStats_${referralCode}`)) || {
    clicks: 0,
    friends: 0
  };
  updateDashboard(referralStats);

  // Проверка, если страница открыта по реферальной ссылке
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  if (refCode && refCode !== referralCode) {
    // Имитация перехода по ссылке (в реальном приложении это должно быть на сервере)
    referralStats.clicks += 1;
    referralStats.friends += 1; // Для простоты считаем, что каждый клик = 1 друг
    localStorage.setItem(`referralStats_${refCode}`, JSON.stringify(referralStats));
    updateDashboard(referralStats);
    showNotification('Вы перешли по реферальной ссылке!');
  }

  // Для тестов: симуляция перехода по ссылке
  // В реальном приложении это должно быть заменено на серверную логику
  window.simulateClick = function() {
    referralStats.clicks += 1;
    referralStats.friends += 1; // Для простоты считаем, что каждый клик = 1 друг
    localStorage.setItem(`referralStats_${referralCode}`, JSON.stringify(referralStats));
    updateDashboard(referralStats);
    showNotification('Кто-то перешёл по вашей ссылке!');
  };
}

// Обновление дашборда
function updateDashboard(stats) {
  const clicksCount = document.getElementById('clicks-count');
  const friendsCount = document.getElementById('friends-count');
  const progressToBonus = document.getElementById('progress-to-bonus');
  const progressFill = document.getElementById('progress-fill');

  clicksCount.textContent = stats.clicks;
  friendsCount.textContent = stats.friends;

  const friendsNeededForBonus = 5;
  const friendsRemaining = Math.max(0, friendsNeededForBonus - stats.friends);
  progressToBonus.textContent = `${friendsRemaining} ${friendsRemaining === 1 ? 'друг' : 'друзей'}`;

  const progressPercentage = (stats.friends / friendsNeededForBonus) * 100;
  progressFill.style.width = `${Math.min(progressPercentage, 100)}%`;
}

// Функция копирования реферальной ссылки
function copyReferralLink() {
  const referralLink = document.getElementById('referral-link');
  referralLink.select();
  document.execCommand('copy');
  showNotification('Ссылка скопирована!');
}

// Функция шаринга реферальной ссылки
function shareReferralLink() {
  const referralLink = document.getElementById('referral-link').value;
  const shareText = 'Присоединяйтесь к Client Flow и управляйте клиентами легко! Используйте мою реферальную ссылку: ' + referralLink;
  
  if (navigator.share) {
    navigator.share({
      title: 'Приглашение в Client Flow',
      text: shareText,
      url: referralLink
    }).catch(err => {
      console.error('Ошибка шаринга:', err);
      showNotification('Не удалось поделиться ссылкой', 'error');
    });
  } else {
    // Fallback: копируем ссылку в буфер обмена
    copyReferralLink();
    showNotification('Ссылка скопирована! Поделитесь ею вручную.');
  }
}
