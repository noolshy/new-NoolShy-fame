// ==================== КОНФИГУРАЦИЯ ====================
const API_URL = 'http://localhost:3000/api';
const DEFAULT_AVATAR = 'img/default-avatar.png';

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let members = [];
let currentUser = null;
let currentTheme = 'black';
let currentNeonColor = '#808080';
let currentNeonIntensity = 0.5;
let currentNeonSpeed = 5;
let currentAnimatedBg = 'hooks';
let currentBgSpeed = 10;
let currentBgOpacity = 0.5;

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация...');
    initNavigation();
    initAuthSystem();
    loadMembersFromStorage();
    initSnow();
    initSettings();
    initNeonControls();
    initModals();
    initAuthModals();
    initApplyModal();
    loadSavedSettings();
    initDynamicNeon();
    initAllAvatars();
    
    // Проверяем авторизацию
    checkAuth();
    
    // Инициализация поиска и фильтрации
    initSearchAndFilter();
});

// ==================== ИНИЦИАЛИЗАЦИЯ ПОИСКА И ФИЛЬТРАЦИИ ====================
function initSearchAndFilter() {
    // Поиск
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Поиск:', searchTerm);
            searchMembers(searchTerm);
        });
    }
    
    // Фильтрация
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            console.log('Фильтр:', category);
            filterMembers(category);
        });
    });
}

// ==================== СИСТЕМА АВТОРИЗАЦИИ ====================
function initAuthSystem() {
    // Кнопки входа/регистрации в основной навигации
    document.getElementById('login-btn')?.addEventListener('click', () => openModal('login-modal'));
    document.getElementById('register-btn')?.addEventListener('click', () => openModal('register-modal'));
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    
    // Кнопки в боковом меню
    document.getElementById('side-login-btn')?.addEventListener('click', () => {
        openModal('login-modal');
        closeSideMenu();
    });
    document.getElementById('side-register-btn')?.addEventListener('click', () => {
        openModal('register-modal');
        closeSideMenu();
    });
    document.getElementById('side-logout-btn')?.addEventListener('click', () => {
        logout();
        closeSideMenu();
    });
    
    // Переключение между формами
    document.getElementById('switch-to-register')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(document.getElementById('login-modal'));
        setTimeout(() => openModal('register-modal'), 300);
    });
    
    document.getElementById('switch-to-login')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(document.getElementById('register-modal'));
        setTimeout(() => openModal('login-modal'), 300);
    });
    
    // Отправка форм
    document.getElementById('login-submit')?.addEventListener('click', login);
    document.getElementById('register-submit')?.addEventListener('click', register);
    
    // Кнопка админ-панели
    document.getElementById('admin-btn')?.addEventListener('click', openAdminPanel);
    document.getElementById('side-admin-btn')?.addEventListener('click', () => {
        openAdminPanel();
        closeSideMenu();
    });
    
    // Обработка сообщений от админ-панели
    window.addEventListener('message', function(event) {
        if (event.data === 'admin_logout') {
            console.log('Получен сигнал о выходе из админ-панели');
        }
    });
}

function checkAuth() {
    const userData = localStorage.getItem('fame_user');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUIForAuth();
            console.log('Пользователь авторизован:', currentUser.username);
        } catch (e) {
            console.error('Ошибка парсинга данных пользователя:', e);
            localStorage.removeItem('fame_user');
        }
    }
}

function updateUIForAuth() {
    const authLine = document.getElementById('auth-line');
    const userInfoLine = document.getElementById('user-info-line');
    const usernameDisplay = document.getElementById('username-display');
    const sideLoginBtn = document.getElementById('side-login-btn');
    const sideRegisterBtn = document.getElementById('side-register-btn');
    const sideLogoutBtn = document.getElementById('side-logout-btn');
    const adminBtn = document.getElementById('admin-btn');
    const sideAdminBtn = document.getElementById('side-admin-btn');
    
    if (currentUser) {
        // Основная навигация
        if (authLine) authLine.style.display = 'none';
        if (userInfoLine) userInfoLine.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
        
        // Боковое меню
        if (sideLoginBtn) sideLoginBtn.style.display = 'none';
        if (sideRegisterBtn) sideRegisterBtn.style.display = 'none';
        if (sideLogoutBtn) sideLogoutBtn.style.display = 'block';
        
        // Показываем кнопку админ-панели для админов
        if (adminBtn) {
            adminBtn.style.display = currentUser.isAdmin ? 'block' : 'none';
        }
        if (sideAdminBtn) {
            sideAdminBtn.style.display = currentUser.isAdmin ? 'block' : 'none';
        }
        
        console.log('UI обновлен для авторизованного пользователя');
    } else {
        // Основная навигация
        if (authLine) authLine.style.display = 'flex';
        if (userInfoLine) userInfoLine.style.display = 'none';
        
        // Боковое меню
        if (sideLoginBtn) sideLoginBtn.style.display = 'block';
        if (sideRegisterBtn) sideRegisterBtn.style.display = 'block';
        if (sideLogoutBtn) sideLogoutBtn.style.display = 'none';
        
        // Скрываем кнопки админ-панели
        if (adminBtn) adminBtn.style.display = 'none';
        if (sideAdminBtn) sideAdminBtn.style.display = 'none';
        
        console.log('UI обновлен для неавторизованного пользователя');
    }
}

function openAdminPanel() {
    if (currentUser?.isAdmin) {
        // Сохраняем сессию для админ-панели
        localStorage.setItem('fame_admin_session', 'active');
        window.open('admin-panel/admin.html', '_blank');
    } else {
        alert('Требуются права администратора!');
    }
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const message = document.getElementById('login-message');
    
    if (!username || !password) {
        showMessage(message, 'Заполните все поля', 'error');
        return;
    }
    
    // Симуляция запроса к API
    const users = JSON.parse(localStorage.getItem('fame_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin || false,
            createdAt: user.createdAt
        };
        
        localStorage.setItem('fame_user', JSON.stringify(currentUser));
        updateUIForAuth();
        showMessage(message, 'Вход выполнен успешно!', 'success');
        setTimeout(() => {
            closeModal(document.getElementById('login-modal'));
            clearForm('login');
        }, 1500);
    } else {
        showMessage(message, 'Неверный логин или пароль', 'error');
    }
}

function register() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const message = document.getElementById('register-message');
    
    // Валидация
    if (!username || !password || !confirm) {
        showMessage(message, 'Заполните обязательные поля', 'error');
        return;
    }
    
    if (username.length < 3 || username.length > 20) {
        showMessage(message, 'Логин должен быть от 3 до 20 символов', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(message, 'Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    if (password !== confirm) {
        showMessage(message, 'Пароли не совпадают', 'error');
        return;
    }
    
    // Проверка существующего пользователя
    const users = JSON.parse(localStorage.getItem('fame_users') || '[]');
    if (users.some(u => u.username === username)) {
        showMessage(message, 'Пользователь с таким логином уже существует', 'error');
        return;
    }
    
    if (email && users.some(u => u.email === email)) {
        showMessage(message, 'Пользователь с таким email уже существует', 'error');
        return;
    }
    
    // Создание нового пользователя
    const newUser = {
        id: Date.now(),
        username: username,
        email: email || null,
        password: password,
        isAdmin: users.length === 0,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('fame_users', JSON.stringify(users));
    
    // Автоматический вход
    currentUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        createdAt: newUser.createdAt
    };
    
    localStorage.setItem('fame_user', JSON.stringify(currentUser));
    updateUIForAuth();
    showMessage(message, 'Регистрация успешна! Вы вошли в систему.', 'success');
    
    setTimeout(() => {
        closeModal(document.getElementById('register-modal'));
        clearForm('register');
        
        // Если пользователь админ, показываем уведомление
        if (newUser.isAdmin) {
            alert('Вы первый пользователь системы и назначены администратором!');
        }
    }, 1500);
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        currentUser = null;
        localStorage.removeItem('fame_user');
        localStorage.removeItem('fame_admin_session');
        updateUIForAuth();
        showNotification('Вы вышли из системы', 'info');
    }
}

function clearForm(formType) {
    if (formType === 'login') {
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        const message = document.getElementById('login-message');
        if (message) message.innerHTML = '';
    } else if (formType === 'register') {
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
        const message = document.getElementById('register-message');
        if (message) message.innerHTML = '';
    }
}

// ==================== СИСТЕМА ЗАЯВОК ====================
function initApplyModal() {
    // Кнопки открытия формы заявки
    document.getElementById('apply-website-btn')?.addEventListener('click', openApplyModal);
    document.getElementById('side-apply-btn')?.addEventListener('click', () => {
        openApplyModal();
        closeSideMenu();
    });
    document.getElementById('faq-apply-btn')?.addEventListener('click', openApplyModal);
    
    // Отправка формы заявки
    document.getElementById('apply-submit')?.addEventListener('click', submitApplication);
}

function openApplyModal() {
    if (!currentUser) {
        alert('Для подачи заявки необходимо войти в систему');
        openModal('login-modal');
        return;
    }
    
    // Проверяем, есть ли уже активная заявка у пользователя
    const applications = JSON.parse(localStorage.getItem('fame_applications') || '[]');
    const userApplication = applications.find(app => 
        app.userId === currentUser.id && 
        (app.status === 'pending' || app.status === 'review')
    );
    
    if (userApplication) {
        alert(`У вас уже есть активная заявка (статус: ${getStatusText(userApplication.status)}).\nДождитесь её рассмотрения.`);
        return;
    }
    
    openModal('apply-modal');
}

function submitApplication() {
    if (!currentUser) return;
    
    const nickname = document.getElementById('apply-nickname').value.trim();
    const telegram = document.getElementById('apply-telegram').value.trim();
    const category = document.getElementById('apply-category').value;
    const description = document.getElementById('apply-description').value.trim();
    const links = document.getElementById('apply-links').value.trim();
    const message = document.getElementById('apply-message');
    
    // Валидация
    if (!nickname || !telegram || !category || !description) {
        showMessage(message, 'Заполните все обязательные поля', 'error');
        return;
    }
    
    if (description.length < 50) {
        showMessage(message, 'Описание должно содержать минимум 50 символов', 'error');
        return;
    }
    
    // Создание заявки
    const applications = JSON.parse(localStorage.getItem('fame_applications') || '[]');
    const newApplication = {
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        nickname: nickname,
        telegram: telegram,
        category: category,
        description: description,
        links: links.split('\n').filter(link => link.trim()),
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null
    };
    
    applications.push(newApplication);
    localStorage.setItem('fame_applications', JSON.stringify(applications));
    
    // Показываем уведомление в админ-панели
    showAdminNotification(newApplication);
    
    showMessage(message, 'Заявка успешно отправлена! Ожидайте рассмотрения.', 'success');
    
    setTimeout(() => {
        closeModal(document.getElementById('apply-modal'));
        document.getElementById('apply-nickname').value = '';
        document.getElementById('apply-telegram').value = '';
        document.getElementById('apply-category').value = '';
        document.getElementById('apply-description').value = '';
        document.getElementById('apply-links').value = '';
        message.innerHTML = '';
    }, 2000);
}

function showAdminNotification(application) {
    // Сохраняем уведомление для админов
    const notifications = JSON.parse(localStorage.getItem('fame_notifications') || '[]');
    notifications.push({
        id: Date.now(),
        type: 'new_application',
        applicationId: application.id,
        message: `Новая заявка от ${application.nickname} (${application.username})`,
        createdAt: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('fame_notifications', JSON.stringify(notifications));
}

function getStatusText(status) {
    const statuses = {
        'pending': 'Ожидает рассмотрения',
        'review': 'На рассмотрении',
        'accepted': 'Принята',
        'rejected': 'Отклонена'
    };
    return statuses[status] || status;
}

// ==================== СИСТЕМА УЧАСТНИКОВ ====================
function loadMembersFromStorage() {
    const savedMembers = localStorage.getItem('fame_members');
    if (savedMembers) {
        members = JSON.parse(savedMembers);
    } else {
        // Начальные данные
        members = [
            {
                id: 1,
                nickname: "зорф",
                username: "@tgzorf",
                category: "Владелец",
                role: "Владелец",
                description: "Владелец зорф Fame. Вход 50 зв, галочка 30зв, закреп 50зв.",
                avatar: "img/avatar1.png",
                verified: true,
                pinned: true,
                project: "https://t.me/NoolShy",
                telegram: "tgzorf",
                price: "https://noolshy.github.io/market/",
                chat: "https://t.me/NOOLSHY_CHAT",
                market: "https://noolshy.github.io/market/",
                fameList: "https://noolshy.github.io/fame/",
                github: "https://github.com/noolshy",
                joinDate: "2026-01-08",
                activity: "Постоянная",
                posts: 150,
                followers: 2500,
                priceEntry: "50 зв",
                priceVerified: "30 зв",
                pricePinned: "50 зв",
                details: "Создатель и владелец NoolShy Fame. Занимаюсь развитием сообщества и модерацией. Отвечаю на вопросы по поводу добавления в список и других услуг.",
                skills: ["Администрирование", "Модерация", "Развитие сообщества"],
                socials: {
                    telegram: "@tgzorf",
                    project: "https://t.me/NOOLSHY",
                    price: "https://noolshy.github.io/market/"
                }
            }
        ];
        localStorage.setItem('fame_members', JSON.stringify(members));
    }
    
    // Отображаем участников
    loadMembers();
}

function addMemberFromApplication(application) {
    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    
    const newMember = {
        id: newId,
        nickname: application.nickname,
        username: application.telegram,
        category: application.category,
        role: application.category,
        description: application.description,
        avatar: `img/avatar${newId}.png`,
        verified: false,
        pinned: false,
        project: application.links.length > 0 ? application.links[0] : "",
        telegram: application.telegram.replace('@', ''),
        joinDate: new Date().toISOString().split('T')[0],
        activity: "Постоянная",
        details: application.description,
        skills: ["Новый участник"],
        socials: {
            telegram: application.telegram
        }
    };
    
    members.push(newMember);
    localStorage.setItem('fame_members', JSON.stringify(members));
    
    // Обновляем интерфейс
    loadMembers();
    
    return newMember;
}

// ==================== НАВИГАЦИЯ И ИНТЕРФЕЙС ====================
function initNavigation() {
    console.log('Инициализация навигации...');
    
    // Кнопка открытия/закрытия меню
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sideMenu = document.getElementById('side-menu');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', openSideMenu);
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', closeSideMenu);
    }
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', (event) => {
        if (sideMenu && !sideMenu.contains(event.target) && 
            menuToggle && !menuToggle.contains(event.target) && 
            sideMenu.classList.contains('active')) {
            closeSideMenu();
        }
    });
    
    // Инициализация кнопок навигации
    initNavButtons();
    
    console.log('Навигация инициализирована');
}

function openSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu) {
        sideMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Меню открыто');
    }
}

function closeSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu) {
        sideMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
        console.log('Меню закрыто');
    }
}

function initNavButtons() {
    // Основные кнопки навигации
    const navTabs = document.querySelectorAll('.nav-tab[data-section]');
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const sections = document.querySelectorAll('.section');
    
    function switchSection(sectionId) {
        console.log('Переключение на секцию:', sectionId);
        
        // Скрываем все секции
        sections.forEach(section => {
            section.classList.remove('active-section');
        });
        
        // Показываем выбранную секцию
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active-section');
            console.log('Секция активирована:', sectionId);
            
            // Прокрутка к началу секции
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.error('Секция не найдена:', sectionId);
        }
        
        // Обновляем активные кнопки
        navTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.section === sectionId) {
                tab.classList.add('active');
            }
        });
        
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });
    }
    
    // Обработчики для основных кнопок
    navTabs.forEach(tab => {
        if (tab.dataset.section) {
            tab.addEventListener('click', () => {
                switchSection(tab.dataset.section);
                closeSideMenu();
            });
        }
    });
    
    // Обработчики для кнопок меню
    menuItems.forEach(item => {
        if (item.dataset.section) {
            item.addEventListener('click', () => {
                switchSection(item.dataset.section);
                closeSideMenu();
            });
        }
    });
    
    // Кнопки FAQ
    const faqBtn = document.getElementById('faq-btn');
    const sideFaqBtn = document.getElementById('side-faq-btn');
    
    if (faqBtn) {
        faqBtn.addEventListener('click', () => {
            switchSection('faq-section');
            closeSideMenu();
        });
    }
    
    if (sideFaqBtn) {
        sideFaqBtn.addEventListener('click', () => {
            switchSection('faq-section');
            closeSideMenu();
        });
    }
    
    // Кнопки настроек
    const settingsBtn = document.getElementById('settings-btn');
    const sideSettingsBtn = document.getElementById('side-settings-btn');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            openModal('settings-modal');
            closeSideMenu();
        });
    }
    
    if (sideSettingsBtn) {
        sideSettingsBtn.addEventListener('click', () => {
            openModal('settings-modal');
            closeSideMenu();
        });
    }
}

// ==================== УПРАВЛЕНИЕ УЧАСТНИКАМИ ====================
function loadMembers() {
    const container = document.getElementById('members-container');
    if (!container) {
        console.error('Контейнер участников не найден');
        return;
    }
    
    container.innerHTML = '';
    
    if (members.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">Нет участников для отображения</p>';
        console.log('Нет участников для отображения');
        return;
    }
    
    const sortedMembers = [...members].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        return 0;
    });
    
    sortedMembers.forEach(member => {
        const card = createMemberCard(member);
        container.appendChild(card);
    });
    
    // Добавляем обработчики кликов на карточки
    document.querySelectorAll('.member-card').forEach(card => {
        card.addEventListener('click', function() {
            const memberId = this.dataset.id;
            console.log('Клик по участнику:', memberId);
            showProfile(memberId);
        });
    });
    
    console.log('Участники загружены:', sortedMembers.length);
}

function createMemberCard(member) {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.dataset.id = member.id;
    card.dataset.category = member.category;
    
    if (member.scam) card.classList.add('scam');
    else if (member.pinned) card.classList.add('pinned');
    if (member.verified && !member.scam) card.classList.add('verified');
  
    const avatarId = `avatar-${member.id}`;
    
    card.innerHTML = `
        <div class="member-avatar" data-initial="${member.nickname.charAt(0).toUpperCase()}">
            <img id="${avatarId}" 
                 src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9IiMzMzMzMzMiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGR5PSIwLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0MCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmYiPk48L3RleHQ+PC9zdmc+" 
                 alt="${member.nickname}"
                 loading="lazy">
        </div>
        
        <div class="member-info">
            <h3>${member.nickname} ${member.scam ? '⚠️' : (member.verified ? '✓' : '')}</h3>
            <div class="member-role">${member.role}</div>
            <p class="member-description">${member.description}</p>
            <div class="member-badges">
                ${member.scam ? '⚠️ ' : ''}${member.pinned ? '📍 ' : ''}${member.verified ? '✓ ' : ''}${member.category}
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const img = card.querySelector(`#${avatarId}`);
        if (img) {
            loadAvatarWithFallback(img, member.avatar || DEFAULT_AVATAR, member.nickname);
        }
    }, 10);
    
    return card;
}

function filterMembers(category) {
    const cards = document.querySelectorAll('.member-card');
    console.log('Фильтрация участников по категории:', category, 'найдено карточек:', cards.length);
    
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
            }, 10);
        } else {
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

function searchMembers(term) {
    const cards = document.querySelectorAll('.member-card');
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
    
    cards.forEach(card => {
        const nickname = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.member-description')?.textContent.toLowerCase() || '';
        
        const matchesSearch = nickname.includes(term) || description.includes(term);
        const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
        
        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
            }, 10);
        } else {
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

function showProfile(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) {
        console.error('Участник не найден:', memberId);
        return;
    }
    
    const container = document.getElementById('profile-content');
    if (!container) {
        console.error('Контейнер профиля не найден');
        return;
    }
    
    const joinDate = new Date(member.joinDate);
    const formattedDate = joinDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let badgesHtml = '';
    if (member.scam) {
        badgesHtml += '<span class="badge scam">⚠️ Скам (Осторожно!)</span>';
    } else if (member.verified) {
        badgesHtml += '<span class="badge verified">✓ Верифицирован</span>';
    }
    if (member.pinned) badgesHtml += '<span class="badge pinned">📌 Закреплён</span>';
    badgesHtml += `<span class="badge category">${member.category}</span>`;
    
    let mainButtons = createSocialButton('fab fa-telegram', 'Написать в ЛС', `https://t.me/${member.telegram}`, 'telegram');
    if (member.project) mainButtons += createSocialButton('fas fa-external-link-alt', 'Основной канал', member.project, 'telegram');
    if (member.chat) mainButtons += createSocialButton('fas fa-comments', 'Чат', member.chat, 'telegram');
    if (member.market) mainButtons += createSocialButton('fas fa-shopping-cart', 'Маркет', member.market);
    if (member.fameList) mainButtons += createSocialButton('fas fa-list', 'Фейм лист', member.fameList);
    if (member.github) mainButtons += createSocialButton('fab fa-github', 'GitHub', member.github);
    
    let extraButtons = '';
    const allPossibleLinks = {
        'price': {icon: 'fas fa-tag', text: 'Прайс'},
        'priceList': {icon: 'fas fa-tags', text: 'Прайс-лист'},
        'market': {icon: 'fas fa-shopping-cart', text: 'Маркет'},
        'tiktok': {icon: 'fab fa-tiktok', text: 'TikTok'},
        'youtube': {icon: 'fab fa-youtube', text: 'YouTube'},
        'discord': {icon: 'fab fa-discord', text: 'Discord'},
        'vk': {icon: 'fab fa-vk', text: 'VK'},
        'website': {icon: 'fas fa-globe', text: 'Сайт'},
        'forum': {icon: 'fas fa-users', text: 'Форум'}
    };
    
    Object.keys(allPossibleLinks).forEach(key => {
        if (member[key]) {
            extraButtons += createSocialButton(allPossibleLinks[key].icon, allPossibleLinks[key].text, member[key]);
        }
    });
    
    const stats = {
        'Статус': member.role,
        'Верификация': member.verified ? '✓ Подтверждён' : '✗ Не подтверждён',
        'Закреп': member.pinned ? '📌 Включён' : '✗ Выключен',
        'Дата регистрации': formattedDate,
        'Активность': member.activity,
        'Подписчики': member.followers,
        'ID': member.id
    };
    
    if (member.priceEntry) stats['Цена входа'] = member.priceEntry;
    if (member.priceVerified) stats['Цена галочки'] = member.priceVerified;
    if (member.pricePinned) stats['Цена закрепа'] = member.pricePinned;
    
    let statsHtml = '';
    Object.entries(stats).forEach(([label, value]) => {
        if (value) {
            statsHtml += `
                <div class="stat-item">
                    <span class="stat-label">${label}:</span>
                    <span class="stat-value">${value}</span>
                </div>
            `;
        }
    });
    
    const profileAvatarId = `profile-avatar-${member.id}`;
    
    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar" data-initial="${member.nickname.charAt(0).toUpperCase()}">
                <img id="${profileAvatarId}" 
                     src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9IiMzMzMzMzMiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGR5PSIwLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0MCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmYiPk48L3RleHQ+PC9zdmc+" 
                     alt="${member.nickname}"
                     loading="eager">
            </div>
            
            <h1 class="profile-title">${member.nickname}</h1>
            <p class="profile-username">${member.username}</p>
            
            <div class="profile-badges">
                ${badgesHtml}
            </div>
            
            <div class="profile-actions">
                ${mainButtons}
                <button class="action-btn" onclick="copyProfileLink('${member.nickname}')">
                    <i class="fas fa-share"></i> Поделиться
                </button>
            </div>
        </div>
        
        <div class="profile-content">
            <div class="profile-description">
                <h3>Описание</h3>
                <p>${member.description || 'Нет описания'}</p>
                
                ${member.details ? `
                    <h3 style="margin-top: 30px;">Детали</h3>
                    <p>${member.details}</p>
                ` : ''}
                
                ${member.skills && member.skills.length > 0 ? `
                    <h3 style="margin-top: 30px;">Навыки и специализация</h3>
                    <p>${member.skills.join(' • ')}</p>
                ` : ''}
                
                ${extraButtons ? `
                    <h3 style="margin-top: 30px;">Дополнительные ссылки</h3>
                    <div class="profile-actions">
                        ${extraButtons}
                    </div>
                ` : ''}
            </div>
            
            <div class="profile-stats">
                <h3>Статистика</h3>
                ${statsHtml}
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const img = document.getElementById(profileAvatarId);
        if (img) {
            loadAvatarWithFallback(img, member.avatar || DEFAULT_AVATAR, member.nickname);
        }
    }, 10);
    
    switchSection('profile-details');
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function createSocialButton(icon, text, url, className = '') {
    if (!url) return '';
    return `
        <a href="${url}" class="action-btn ${className}" target="_blank">
            <i class="${icon}"></i> ${text}
        </a>
    `;
}

function loadAvatarWithFallback(imgElement, src, nickname) {
    return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
            imgElement.src = src;
            imgElement.style.opacity = '1';
            resolve(true);
        };
        
        img.onerror = () => {
            const initial = nickname.charAt(0).toUpperCase();
            const color = generateColorFromNickname(nickname);
            
            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="${color}" rx="50"/>
                    <text x="50" y="50" text-anchor="middle" dy="0.35em" 
                          font-family="Arial, sans-serif" font-size="40" 
                          font-weight="bold" fill="#fff">${initial}</text>
                </svg>
            `;
            
            imgElement.src = 'data:image/svg+xml;base64,' + btoa(svg);
            imgElement.style.opacity = '1';
            imgElement.classList.add('avatar-fallback');
            resolve(false);
        };
        
        imgElement.style.opacity = '0';
        if (imgElement.parentElement) {
            imgElement.parentElement.classList.add('loading');
        }
        
        setTimeout(() => img.src = src, 100);
        
        setTimeout(() => {
            if (imgElement.parentElement) {
                imgElement.parentElement.classList.remove('loading');
            }
            imgElement.style.opacity = '1';
        }, 2000);
    });
}

function generateColorFromNickname(nickname) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) {
        hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

function showMessage(element, text, type) {
    if (!element) return;
    
    element.textContent = text;
    element.className = `auth-message ${type}`;
    element.style.display = 'block';
}

function showNotification(text, type = 'info') {
    // Удаляем старые уведомления
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${text}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function switchSection(sectionId) {
    console.log('Переключение секции:', sectionId);
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }
    
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === sectionId) {
            tab.classList.add('active');
        }
    });
}

// ==================== ИНИЦИАЛИЗАЦИЯ АВАТАРОВ ====================
function initAllAvatars() {
    console.log('Инициализация аватаров...');
    loadMembers();
}

// ==================== СИСТЕМА НАСТРОЕК ====================
function initSnow() {
    const snowContainer = document.querySelector('.snow-container');
    if (!snowContainer) return;
    
    createSnowflakes();
    
    const snowToggle = document.getElementById('snow-effect');
    if (snowToggle) {
        snowToggle.addEventListener('change', function() {
            if (this.checked) {
                snowContainer.style.display = 'block';
                createSnowflakes();
            } else {
                snowContainer.style.display = 'none';
                snowContainer.innerHTML = '';
            }
        });
    }
}

function createSnowflakes() {
    const snowContainer = document.querySelector('.snow-container');
    if (!snowContainer) return;
    
    snowContainer.innerHTML = '';
    
    for (let i = 0; i < 60; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        const size = Math.random() * 4 + 2;
        const startX = Math.random() * 100;
        const duration = Math.random() * 5 + 5;
        const opacity = Math.random() * 0.5 + 0.3;
        
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        snowflake.style.left = `${startX}vw`;
        snowflake.style.opacity = opacity;
        snowflake.style.animationDuration = `${duration}s`;
        snowflake.style.animationDelay = `${Math.random() * 5}s`;
        snowflake.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
        
        snowContainer.appendChild(snowflake);
    }
}

function initSettings() {
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab + '-tab';
            
            settingsTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    const themeOptions = document.querySelectorAll('.theme-option');
    
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            
            themeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            applyTheme(theme);
        });
    });
    
    const bgUpload = document.getElementById('bg-upload');
    const bgPreview = document.getElementById('bg-preview');
    
    if (bgUpload) {
        bgUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    bgPreview.innerHTML = `<img src="${e.target.result}" alt="Фон">`;
                    bgPreview.style.display = 'block';
                    
                    localStorage.setItem('fame_background', e.target.result);
                    document.body.style.backgroundImage = `url(${e.target.result})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundAttachment = 'fixed';
                    document.body.style.backgroundPosition = 'center';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const neonFlowEffect = document.getElementById('neon-flow-effect');
    if (neonFlowEffect) {
        neonFlowEffect.addEventListener('change', function() {
            if (this.checked) {
                initDynamicNeon();
            } else {
                removeNeonFlow();
            }
        });
    }
}

function initNeonControls() {
    const neonColor = document.getElementById('neon-color');
    const neonIntensity = document.getElementById('neon-intensity');
    const neonSpeed = document.getElementById('neon-speed');
    const applyNeonBtn = document.getElementById('apply-neon');
    const intensityValue = document.getElementById('intensity-value');
    const speedValue = document.getElementById('speed-value');
    const colorPreview = document.getElementById('neon-color-preview');
    
    if (neonColor && colorPreview) {
        neonColor.addEventListener('input', function() {
            colorPreview.style.backgroundColor = this.value;
        });
        colorPreview.style.backgroundColor = neonColor.value;
    }
    
    if (neonIntensity && intensityValue) {
        neonIntensity.addEventListener('input', function() {
            intensityValue.textContent = this.value + '%';
        });
        intensityValue.textContent = neonIntensity.value + '%';
    }
    
    if (neonSpeed && speedValue) {
        const speedLabels = {
            1: 'Очень медленно',
            2: 'Медленно',
            3: 'Немного медленно',
            4: 'Ниже средней',
            5: 'Средняя',
            6: 'Выше средней',
            7: 'Быстро',
            8: 'Очень быстро',
            9: 'Супер быстро',
            10: 'Максимальная'
        };
        
        neonSpeed.addEventListener('input', function() {
            speedValue.textContent = speedLabels[this.value] || 'Средняя';
        });
        speedValue.textContent = speedLabels[neonSpeed.value] || 'Средняя';
    }
    
    if (applyNeonBtn) {
        applyNeonBtn.addEventListener('click', function() {
            const color = neonColor.value;
            const intensity = parseInt(neonIntensity.value) / 100;
            const speed = parseInt(neonSpeed.value);
            
            applyNeonSettings(color, intensity, speed);
        });
    }
}

function applyNeonSettings(color, intensity, speed) {
    currentNeonColor = color;
    currentNeonIntensity = intensity;
    currentNeonSpeed = speed;
    
    localStorage.setItem('fame_neon_color', color);
    localStorage.setItem('fame_neon_intensity', intensity);
    localStorage.setItem('fame_neon_speed', speed);
    
    initDynamicNeon();
}

function initDynamicNeon() {
    const oldStyle = document.getElementById('dynamic-neon-style');
    if (oldStyle) oldStyle.remove();
    
    const hex = currentNeonColor;
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    
    const duration = (11 - currentNeonSpeed) + 's';
    
    const style = document.createElement('style');
    style.id = 'dynamic-neon-style';
    
    style.textContent = `
        @keyframes neonFlow {
            0%, 100% { 
                box-shadow: 0 0 ${10 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.8 * currentNeonIntensity}),
                          0 0 ${20 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.6 * currentNeonIntensity}),
                          0 0 ${30 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.4 * currentNeonIntensity}),
                          inset 0 0 ${10 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.5 * currentNeonIntensity}); 
            }
            50% { 
                box-shadow: 0 0 ${15 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.9 * currentNeonIntensity}),
                          0 0 ${25 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.7 * currentNeonIntensity}),
                          0 0 ${35 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.5 * currentNeonIntensity}),
                          inset 0 0 ${15 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.6 * currentNeonIntensity}); 
            }
        }
        
        @keyframes textNeonFlow {
            0%, 100% { 
                text-shadow: 0 0 ${5 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.8 * currentNeonIntensity}),
                           0 0 ${10 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.6 * currentNeonIntensity}); 
            }
            50% { 
                text-shadow: 0 0 ${8 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.9 * currentNeonIntensity}),
                           0 0 ${15 * currentNeonIntensity}px rgba(${r}, ${g}, ${b}, ${0.7 * currentNeonIntensity}); 
            }
        }
        
        .neon-flow {
            animation: neonFlow ${duration} ease-in-out infinite !important;
        }
        
        .text-neon-flow {
            animation: textNeonFlow ${duration} ease-in-out infinite !important;
        }
    `;
    
    document.head.appendChild(style);
    
    const neonFlowEffect = document.getElementById('neon-flow-effect');
    if (neonFlowEffect && neonFlowEffect.checked) {
        applyNeonToElements();
    }
}

function applyNeonToElements() {
    document.querySelectorAll('.member-card').forEach(card => {
        card.classList.add('neon-flow');
    });
    
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.classList.add('neon-flow');
    });
    
    document.querySelectorAll('.upload-btn').forEach(btn => {
        btn.classList.add('neon-flow');
    });
    
    const profileHeader = document.querySelector('.profile-header');
    if (profileHeader) {
        profileHeader.classList.add('neon-flow');
    }
}

function removeNeonFlow() {
    document.querySelectorAll('.neon-flow').forEach(el => {
        el.classList.remove('neon-flow');
    });
    document.querySelectorAll('.text-neon-flow').forEach(el => {
        el.classList.remove('text-neon-flow');
    });
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function initModals() {
    console.log('Инициализация модальных окон...');
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Закрытие при нажатии Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal);
            });
            closeSideMenu();
        }
    });
    
    console.log('Модальные окна инициализированы');
}

function initAuthModals() {
    // Переключение между формами входа/регистрации
    const switchToRegisterBtn = document.getElementById('switch-to-register');
    const switchToLoginBtn = document.getElementById('switch-to-login');
    
    if (switchToRegisterBtn) {
        switchToRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(document.getElementById('login-modal'));
            setTimeout(() => openModal('register-modal'), 300);
        });
    }
    
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(document.getElementById('register-modal'));
            setTimeout(() => openModal('login-modal'), 300);
        });
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Модальное окно открыто:', modalId);
    } else {
        console.error('Модальное окно не найдено:', modalId);
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        console.log('Модальное окно закрыто');
    }
}

function loadSavedSettings() {
    console.log('Загрузка сохраненных настроек...');
   
    const savedTheme = localStorage.getItem('fame_theme') || 'black'; 
    if (savedTheme) {
        const themeOption = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
        if (themeOption) {
            themeOption.click();
        } else {
            applyTheme('black');
        }
    } else {
        applyTheme('black');
    }
    
    const savedBg = localStorage.getItem('fame_background');
    if (savedBg) {
        document.body.style.backgroundImage = `url(${savedBg})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
    }
    
    const savedNeonColor = localStorage.getItem('fame_neon_color') || '#808080';
    const savedNeonIntensity = parseFloat(localStorage.getItem('fame_neon_intensity')) || 0.5;
    const savedNeonSpeed = parseInt(localStorage.getItem('fame_neon_speed')) || 5;
    
    const neonColor = document.getElementById('neon-color');
    const neonIntensity = document.getElementById('neon-intensity');
    const neonSpeed = document.getElementById('neon-speed');
    
    if (neonColor) neonColor.value = savedNeonColor;
    if (neonIntensity) neonIntensity.value = savedNeonIntensity * 100;
    if (neonSpeed) neonSpeed.value = savedNeonSpeed;
    
    applyNeonSettings(savedNeonColor, savedNeonIntensity, savedNeonSpeed);
         
    const savedNeonFlow = localStorage.getItem('fame_neon_flow');
    const neonFlowCheckbox = document.getElementById('neon-flow-effect');
    if (neonFlowCheckbox) {
        if (savedNeonFlow === 'disabled') {
            neonFlowCheckbox.checked = false;
            removeNeonFlow();
        } else {
            neonFlowCheckbox.checked = true;
        }
    }
    
    const savedSnow = localStorage.getItem('fame_snow');
    const snowCheckbox = document.getElementById('snow-effect');
    if (snowCheckbox) {
        if (savedSnow === 'disabled') {
            snowCheckbox.checked = false;
            const snowContainer = document.querySelector('.snow-container');
            if (snowContainer) snowContainer.style.display = 'none';
        } else {
            snowCheckbox.checked = true;
        }
    }
}

function applyTheme(theme) {
    currentTheme = theme;
    
    const themeClasses = ['dark-theme', 'black-theme', 'red-theme', 'red-black-theme', 
                         'red-gray-theme', 'purple-theme', 'blue-theme', 'green-theme', 
                         'orange-theme', 'pink-theme'];
    
    document.body.classList.remove(...themeClasses);
    document.body.classList.add(theme + '-theme');
    
    localStorage.setItem('fame_theme', theme);
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.copyProfileLink = function(username) {
    const link = `https://t.me/NOOLSHY?text=Профиль%20${encodeURIComponent(username)}%20на%20NoolShy%20Fame`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Ссылка на профиль скопирована в буфер обмена!');
    });
};

// Сохранение настроек эффектов
document.getElementById('snow-effect')?.addEventListener('change', function() {
    localStorage.setItem('fame_snow', this.checked ? 'enabled' : 'disabled');
});

document.getElementById('neon-flow-effect')?.addEventListener('change', function() {
    localStorage.setItem('fame_neon_flow', this.checked ? 'enabled' : 'disabled');
    if (this.checked) {
        initDynamicNeon();
    } else {
        removeNeonFlow();
    }
});

// Добавляем стили для уведомлений
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(25, 25, 25, 0.95);
        border: 1px solid #333;
        border-radius: 10px;
        padding: 15px 20px;
        color: #fff;
        z-index: 9999;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        max-width: 300px;
        backdrop-filter: blur(10px);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-success {
        border-color: #28a745;
        background: rgba(40, 167, 69, 0.1);
    }
    
    .notification-error {
        border-color: #dc3545;
        background: rgba(220, 53, 69, 0.1);
    }
    
    .notification-info {
        border-color: #007bff;
        background: rgba(0, 123, 255, 0.1);
    }
    
    .notification-success i {
        color: #28a745;
    }
    
    .notification-error i {
        color: #dc3545;
    }
    
    .notification-info i {
        color: #007bff;
    }
`;
document.head.appendChild(notificationStyle);

// Функция для админ-панели
window.addMemberFromApplication = addMemberFromApplication;