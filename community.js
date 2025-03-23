// Инициализация Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyDsg5PpWmQt1kFH5IhhLWbJiJGg3lEZ8d0",
    authDomain: "clientflowforum.firebaseapp.com",
    projectId: "clientflowforum",
    storageBucket: "clientflowforum.firebasestorage.app",
    messagingSenderId: "353821221112",
    appId: "1:353821221112:web:dee046f57135cc7d805b0d",
    measurementId: "G-CE2YMXV1LK"
  };

// Инициализация приложения Firebase
firebase.initializeApp(firebaseConfig);

// Инициализация Firestore и Auth
const db = firebase.firestore();
const auth = firebase.auth();

// Анонимная аутентификация
let currentUser = null;
auth.signInAnonymously()
  .then((userCredential) => {
    currentUser = userCredential.user;
    console.log("Анонимный пользователь вошёл:", currentUser.uid);
    loadThreadsFromFirestore(); // Загружаем темы после входа
  })
  .catch((error) => {
    console.error("Ошибка анонимной аутентификации:", error);
  });

// Инициализация темы
document.addEventListener('DOMContentLoaded', () => {
  const isDark = localStorage.getItem('theme') === 'dark';
  document.body.classList.toggle('dark', isDark);
  document.getElementById('theme-switch').checked = isDark;
  document.getElementById('sidebar-theme-switch').checked = isDark;
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

// Закрытие боковой панели кликом вне неё
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

// Загрузка тем из Firestore
function loadThreadsFromFirestore(filterCategory = 'all', sortBy = 'newest', searchTerm = '') {
  let query = db.collection('threads');

  // Фильтрация по категории
  if (filterCategory !== 'all') {
    query = query.where('category', '==', filterCategory);
  }

  // Поиск
  if (searchTerm) {
    query = query.where('title', '>=', searchTerm).where('title', '<=', searchTerm + '\uf8ff');
  }

  // Сортировка
  if (sortBy === 'newest') {
    query = query.orderBy('date', 'desc');
  } else if (sortBy === 'oldest') {
    query = query.orderBy('date', 'asc');
  } else if (sortBy === 'popular') {
    query = query.orderBy('replies', 'desc');
  }

  query.get().then((snapshot) => {
    const threads = [];
    snapshot.forEach((doc) => {
      threads.push({ id: doc.id, ...doc.data() });
    });
    loadThreads(threads);
  }).catch((error) => {
    console.error("Ошибка загрузки тем:", error);
    showNotification('Ошибка загрузки тем!', 'error');
  });
}

// Загрузка тем в интерфейс
function loadThreads(threads) {
  const threadGrid = document.getElementById('thread-grid');
  threadGrid.innerHTML = '';

  threads.forEach(thread => {
    const threadCard = document.createElement('div');
    threadCard.classList.add('thread-card');
    threadCard.setAttribute('data-category', thread.category);
    threadCard.innerHTML = `
      <h3>${thread.title}</h3>
      <div class="thread-meta">
        <span class="author"><span class="material-icons">person</span> ${thread.author}</span>
        <span class="date">${thread.date}</span>
        <span class="replies"><span class="material-icons">chat_bubble</span> ${thread.replies}</span>
      </div>
      <div class="thread-category">${thread.category === 'general' ? 'Общее' : thread.category === 'support' ? 'Поддержка' : 'Идеи'}</div>
      <div class="thread-content">${thread.content}</div>
      <div class="thread-actions">
        <button class="btn view-thread-btn" data-thread-id="${thread.id}">Открыть</button>
      </div>
      <div class="thread-comments" id="comments_${thread.id}" style="display: none;">
        <h4>Комментарии</h4>
        <div class="comment-list" id="comment-list_${thread.id}"></div>
        <form class="comment-form" data-thread-id="${thread.id}">
          <textarea placeholder="Ваш комментарий..." required></textarea>
          <button type="submit" class="btn gradient-btn">Отправить</button>
        </form>
      </div>
    `;
    threadGrid.appendChild(threadCard);

    // Открытие/закрытие комментариев
    threadCard.querySelector('.view-thread-btn').addEventListener('click', () => {
      const commentsSection = threadCard.querySelector('.thread-comments');
      if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        loadComments(thread.id);
      } else {
        commentsSection.style.display = 'none';
      }
    });

    // Обработка отправки комментария
    threadCard.querySelector('.comment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const content = e.target.querySelector('textarea').value;
      addComment(thread.id, content);
      e.target.reset();
    });
  });
}

// Загрузка комментариев
function loadComments(threadId) {
  const commentList = document.getElementById(`comment-list_${threadId}`);
  commentList.innerHTML = '';

  db.collection('threads').doc(threadId).collection('comments')
    .orderBy('timestamp', 'asc')
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const comment = doc.data();
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');
        commentDiv.innerHTML = `
          <p><strong>${comment.author}</strong> (${new Date(comment.timestamp.toDate()).toLocaleString()}):</p>
          <p>${comment.content}</p>
        `;
        commentList.appendChild(commentDiv);
      });
    })
    .catch((error) => {
      console.error("Ошибка загрузки комментариев:", error);
    });
}

// Добавление комментария
function addComment(threadId, content) {
  if (!currentUser) {
    showNotification('Пожалуйста, войдите, чтобы оставить комментарий!', 'error');
    return;
  }

  const comment = {
    author: currentUser.uid.substring(0, 8), // Используем часть UID как имя
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  };

  db.collection('threads').doc(threadId).collection('comments')
    .add(comment)
    .then(() => {
      // Увеличиваем счётчик ответов
      db.collection('threads').doc(threadId).update({
        replies: firebase.firestore.FieldValue.increment(1)
      });
      loadComments(threadId);
      showNotification('Комментарий добавлен!');
    })
    .catch((error) => {
      console.error("Ошибка добавления комментария:", error);
      showNotification('Ошибка добавления комментария!', 'error');
    });
}

// Фильтрация тем по категории
document.querySelectorAll('.category-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const category = btn.getAttribute('data-category');
    const sortBy = document.getElementById('sort-threads').value;
    const searchTerm = document.getElementById('thread-search').value.toLowerCase();
    loadThreadsFromFirestore(category, sortBy, searchTerm);
  });
});

// Сортировка тем
document.getElementById('sort-threads').addEventListener('change', (e) => {
  const sortBy = e.target.value;
  const activeCategory = document.querySelector('.category-filter.active').getAttribute('data-category');
  const searchTerm = document.getElementById('thread-search').value.toLowerCase();
  loadThreadsFromFirestore(activeCategory, sortBy, searchTerm);
});

// Поиск по темам
document.getElementById('thread-search').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const activeCategory = document.querySelector('.category-filter.active').getAttribute('data-category');
  const sortBy = document.getElementById('sort-threads').value;
  loadThreadsFromFirestore(activeCategory, sortBy, searchTerm);
});

// Создание новой темы
document.getElementById('create-thread-btn').addEventListener('click', () => {
  if (!currentUser) {
    showNotification('Пожалуйста, войдите, чтобы создать тему!', 'error');
    return;
  }
  openModal('create-thread-modal');
});

document.getElementById('create-thread-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('thread-title').value;
  const category = document.getElementById('thread-category').value;
  const content = document.getElementById('thread-content').value;

  const newThread = {
    title,
    category,
    author: currentUser.uid.substring(0, 8), // Используем часть UID как имя
    date: new Date().toISOString().split('T')[0],
    content,
    replies: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  db.collection('threads').add(newThread)
    .then(() => {
      loadThreadsFromFirestore();
      closeModal(document.getElementById('create-thread-modal'));
      showNotification('Тема успешно создана!');
      e.target.reset();
    })
    .catch((error) => {
      console.error("Ошибка создания темы:", error);
      showNotification('Ошибка создания темы!', 'error');
    });
});

// Обработка формы "Оставить отзыв"
document.getElementById('feedback-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const feedbackText = document.getElementById('feedback-text').value;
  db.collection('feedback').add({
    text: feedbackText,
    userId: currentUser ? currentUser.uid : 'anonymous',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  }).then(() => {
    closeModal(document.getElementById('feedback-modal'));
    showNotification('Спасибо за ваш отзыв!');
    e.target.reset();
  }).catch((error) => {
    console.error("Ошибка отправки отзыва:", error);
    showNotification('Ошибка отправки отзыва!', 'error');
  });
});

// Обработка формы "Сообщить об ошибке"
document.getElementById('bug-report-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const bugText = document.getElementById('bug-report-text').value;
  db.collection('bug-reports').add({
    text: bugText,
    userId: currentUser ? currentUser.uid : 'anonymous',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  }).then(() => {
    closeModal(document.getElementById('bug-report-modal'));
    showNotification('Спасибо за сообщение об ошибке!');
    e.target.reset();
  }).catch((error) => {
    console.error("Ошибка отправки сообщения об ошибке:", error);
    showNotification('Ошибка отправки сообщения об ошибке!', 'error');
  });
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
