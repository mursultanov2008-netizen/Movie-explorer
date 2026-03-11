// Конфигурация
const API_KEY = '5ed3ebac';
const BASE_URL = 'https://www.omdbapi.com/';
const ITEMS_PER_PAGE = 20;

// Состояние приложения
const state = {
    currentPage: 'search',
    searchQuery: '',
    movies: [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    watchlist: JSON.parse(localStorage.getItem('watchlist')) || [],
    history: JSON.parse(localStorage.getItem('searchHistory')) || [],
    ratings: JSON.parse(localStorage.getItem('userRatings')) || {},
    compareList: [],
    currentPageNum: 1,
    totalResults: 0,
    hasMore: true,
    isLoading: false,
    filters: {
        yearFrom: '',
        yearTo: '',
        rating: '',
        genre: '',
        country: '',
        type: '',
        sort: 'default'
    },
    viewMode: 'grid',
    theme: localStorage.getItem('theme') || 'light',
    settings: JSON.parse(localStorage.getItem('settings')) || {
        cardSize: 'medium',
        saveHistory: true,
        autoplayTrailers: false,
        notifyNewMovies: false
    }
};

// DOM элементы
const elements = {};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    initTheme();
    loadInitialData();
});

// Инициализация DOM элементов
function initElements() {
    elements.sidebar = document.getElementById('sidebar');
    elements.menuToggle = document.getElementById('menuToggle');
    elements.closeSidebar = document.getElementById('closeSidebar');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.globalSearch = document.getElementById('globalSearch');
    elements.pageContainer = document.getElementById('pageContainer');
    elements.moviesGrid = document.getElementById('moviesGrid');
    elements.filtersPanel = document.getElementById('filtersPanel');
    elements.toggleFilters = document.getElementById('toggleFilters');
    elements.applyFilters = document.getElementById('applyFilters');
    elements.resetFilters = document.getElementById('resetFilters');
    elements.resultsCount = document.getElementById('resultsCount');
    elements.loadingState = document.getElementById('loadingState');
    elements.errorState = document.getElementById('errorState');
    elements.emptyState = document.getElementById('emptyState');
    elements.infiniteTrigger = document.getElementById('infiniteScrollTrigger');
    elements.movieModal = document.getElementById('movieModal');
    elements.comparePanel = document.getElementById('comparePanel');
    
    // Фильтры
    elements.yearFrom = document.getElementById('yearFrom');
    elements.yearTo = document.getElementById('yearTo');
    elements.ratingFilter = document.getElementById('ratingFilter');
    elements.genreFilter = document.getElementById('genreFilter');
    elements.countryFilter = document.getElementById('countryFilter');
    elements.typeFilter = document.getElementById('typeFilter');
    elements.sortFilter = document.getElementById('sortFilter');
    
    // Кнопки страниц
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
    
    // Кнопки представления
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            setViewMode(view);
        });
    });
    
    // Табы
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            filterByType(tab);
        });
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Меню
    elements.menuToggle.addEventListener('click', toggleSidebar);
    elements.closeSidebar.addEventListener('click', toggleSidebar);
    
    // Тема
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Поиск с дебаунсом
    elements.globalSearch.addEventListener('input', debounce(handleSearch, 500));
    
    // Фильтры
    elements.toggleFilters.addEventListener('click', () => {
        elements.filtersPanel.classList.toggle('show');
    });
    
    elements.applyFilters.addEventListener('click', applyFilters);
    elements.resetFilters.addEventListener('click', resetFilters);
    
    // Бесконечный скролл
    window.addEventListener('scroll', debounce(handleInfiniteScroll, 200));
    
    // Закрытие модального окна
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    elements.movieModal.addEventListener('click', (e) => {
        if (e.target === elements.movieModal) closeModal();
    });
    
    // Сравнение
    document.getElementById('compareBtn').addEventListener('click', compareMovies);
    document.getElementById('clearCompare').addEventListener('click', clearCompare);
    document.querySelector('.close-compare').addEventListener('click', () => {
        elements.comparePanel.classList.remove('show');
    });
}

// Инициализация темы
function initTheme() {
    if (state.theme === 'dark') {
        document.body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Переключение темы
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    state.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    elements.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Переключение сайдбара
function toggleSidebar() {
    elements.sidebar.classList.toggle('show');
}

// Навигация по страницам
function navigateToPage(page) {
    // Обновляем активный пункт меню
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Переключаем страницу
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`page-${page}`).classList.add('active');
    
    state.currentPage = page;
    
    // Загружаем данные для страницы
    switch(page) {
        case 'search':
            loadInitialData();
            break;
        case 'favorites':
            renderFavorites();
            break;
        case 'watchlist':
            renderWatchlist();
            break;
        case 'history':
            renderHistory();
            break;
        case 'stats':
            renderStats();
            break;
        case 'settings':
            renderSettings();
            break;
    }
}

// Загрузка начальных данных
async function loadInitialData() {
    state.searchQuery = 'matrix';
    state.currentPageNum = 1;
    state.movies = [];
    await searchMovies();
}

// Обработка поиска
function handleSearch(e) {
    const query = e.target.value.trim();
    if (query.length < 2) return;
    
    state.searchQuery = query;
    state.currentPageNum = 1;
    state.movies = [];
    
    // Сохраняем в историю
    if (state.settings.saveHistory) {
        addToHistory(query);
    }
    
    searchMovies();
}

// Поиск фильмов
async function searchMovies() {
    if (state.isLoading || !state.hasMore) return;
    
    try {
        state.isLoading = true;
        hideError();
        hideEmpty();
        
        if (state.currentPageNum === 1) {
            showLoading();
        }
        
        const params = new URLSearchParams({
            apikey: API_KEY,
            s: state.searchQuery,
            page: state.currentPageNum
        });
        
        if (state.filters.type) params.append('type', state.filters.type);
        
        const response = await fetch(`${BASE_URL}?${params}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
            const movies = await getDetailedMovies(data.Search);
            
            // Применяем фильтры
            const filteredMovies = filterMovies(movies);
            
            state.totalResults = data.totalResults;
            state.hasMore = state.currentPageNum * 10 < data.totalResults;
            state.movies = [...state.movies, ...filteredMovies];
            
            if (state.currentPageNum === 1) {
                hideLoading();
                renderMovies(filteredMovies);
            } else {
                appendMovies(filteredMovies);
            }
            
            updateResultsCount();
            state.currentPageNum++;
            
        } else {
            if (state.currentPageNum === 1) {
                hideLoading();
                showEmpty(data.Error);
            }
            state.hasMore = false;
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError();
    } finally {
        state.isLoading = false;
    }
}

// Получение детальной информации
async function getDetailedMovies(movies) {
    const detailedPromises = movies.map(async (movie) => {
        try {
            const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`);
            return await response.json();
        } catch (error) {
            return movie;
        }
    });
    
    return Promise.all(detailedPromises);
}

// Применение фильтров
function filterMovies(movies) {
    return movies.filter(movie => {
        // Год
        const year = parseInt(movie.Year);
        if (state.filters.yearFrom && year < parseInt(state.filters.yearFrom)) return false;
        if (state.filters.yearTo && year > parseInt(state.filters.yearTo)) return false;
        
        // Рейтинг
        const rating = parseFloat(movie.imdbRating);
        if (state.filters.rating && rating < parseFloat(state.filters.rating)) return false;
        
        // Жанр
        if (state.filters.genre && !movie.Genre?.includes(state.filters.genre)) return false;
        
        // Страна
        if (state.filters.country && !movie.Country?.includes(state.filters.country)) return false;
        
        return true;
    }).sort((a, b) => {
        switch(state.filters.sort) {
            case 'year_desc':
                return parseInt(b.Year) - parseInt(a.Year);
            case 'year_asc':
                return parseInt(a.Year) - parseInt(b.Year);
            case 'rating_desc':
                return parseFloat(b.imdbRating) - parseFloat(a.imdbRating);
            case 'rating_asc':
                return parseFloat(a.imdbRating) - parseFloat(b.imdbRating);
            case 'title_asc':
                return a.Title.localeCompare(b.Title);
            case 'title_desc':
                return b.Title.localeCompare(a.Title);
            default:
                return 0;
        }
    });
}

// Отрисовка фильмов
function renderMovies(movies) {
    if (!elements.moviesGrid) return;
    
    elements.moviesGrid.innerHTML = '';
    elements.moviesGrid.className = `movies-grid ${state.viewMode === 'list' ? 'list-view' : ''}`;
    
    if (movies.length === 0) {
        showEmpty();
        return;
    }
    
    movies.forEach(movie => {
        const card = createMovieCard(movie);
        elements.moviesGrid.appendChild(card);
    });
}

// Добавление фильмов (для бесконечного скролла)
function appendMovies(movies) {
    movies.forEach(movie => {
        const card = createMovieCard(movie);
        elements.moviesGrid.appendChild(card);
    });
}

// Создание карточки фильма
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.imdbId = movie.imdbID;
    
    const isFavorite = state.favorites.some(f => f.imdbID === movie.imdbID);
    const isInWatchlist = state.watchlist.some(w => w.imdbID === movie.imdbID);
    const isInCompare = state.compareList.includes(movie.imdbID);
    
    const posterUrl = movie.Poster && movie.Poster !== 'N/A' 
        ? movie.Poster 
        : 'https://via.placeholder.com/300x450?text=No+Poster';
    
    const rating = parseFloat(movie.imdbRating);
    const ratingColor = getRatingColor(rating);
    
    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" alt="${movie.Title}" loading="lazy">
            <div class="movie-rating" style="background: ${ratingColor}">
                ⭐ ${movie.imdbRating || 'N/A'}
            </div>
            <div class="movie-actions">
                <button class="action-btn favorite ${isFavorite ? 'active' : ''}" title="В избранное">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="action-btn watchlist ${isInWatchlist ? 'active' : ''}" title="К просмотру">
                    <i class="fas fa-clock"></i>
                </button>
                <button class="action-btn compare ${isInCompare ? 'active' : ''}" title="Сравнить">
                    <i class="fas fa-balance-scale"></i>
                </button>
                <button class="action-btn share" title="Поделиться">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.Title}</h3>
            <div class="movie-meta">
                <span class="movie-year">${movie.Year}</span>
                <span class="movie-type">${movie.Type}</span>
            </div>
        </div>
    `;
    
    // Добавляем обработчики
    addCardEventListeners(card, movie);
    
    return card;
}

// Добавление обработчиков для карточки
function addCardEventListeners(card, movie) {
    // Избранное
    card.querySelector('.favorite').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(movie);
    });
    
    // Watchlist
    card.querySelector('.watchlist').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(movie);
    });
    
    // Сравнение
    card.querySelector('.compare').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCompare(movie);
    });
    
    // Поделиться
    card.querySelector('.share').addEventListener('click', (e) => {
        e.stopPropagation();
        shareMovie(movie);
    });
    
    // Открыть детали
    card.addEventListener('click', () => showMovieDetails(movie));
}

// Получение цвета для рейтинга
function getRatingColor(rating) {
    if (isNaN(rating)) return '#666';
    if (rating >= 8) return '#4CAF50';
    if (rating >= 7) return '#8BC34A';
    if (rating >= 6) return '#FFC107';
    if (rating >= 5) return '#FF9800';
    return '#F44336';
}

// Переключение избранного
function toggleFavorite(movie) {
    const index = state.favorites.findIndex(f => f.imdbID === movie.imdbID);
    
    if (index === -1) {
        state.favorites.push(movie);
        showNotification('Добавлено в избранное', 'success');
    } else {
        state.favorites.splice(index, 1);
        showNotification('Удалено из избранного', 'info');
    }
    
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    updateFavoritesCount();
    updateUI();
}

// Переключение watchlist
function toggleWatchlist(movie) {
    const index = state.watchlist.findIndex(w => w.imdbID === movie.imdbID);
    
    if (index === -1) {
        state.watchlist.push(movie);
        showNotification('Добавлено в список просмотра', 'success');
    } else {
        state.watchlist.splice(index, 1);
        showNotification('Удалено из списка просмотра', 'info');
    }
    
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
    updateWatchlistCount();
    updateUI();
}

// Переключение сравнения
function toggleCompare(movie) {
    const index = state.compareList.indexOf(movie.imdbID);
    
    if (index === -1) {
        if (state.compareList.length >= 3) {
            showNotification('Можно сравнивать не более 3 фильмов', 'warning');
            return;
        }
        state.compareList.push(movie.imdbID);
        updateComparePanel();
    } else {
        state.compareList.splice(index, 1);
        updateComparePanel();
    }
    
    updateUI();
    
    // Показываем панель сравнения
    if (state.compareList.length > 0) {
        elements.comparePanel.classList.add('show');
    } else {
        elements.comparePanel.classList.remove('show');
    }
}

// Обновление панели сравнения
function updateComparePanel() {
    const container = document.getElementById('compareItems');
    if (!container) return;
    
    if (state.compareList.length === 0) {
        container.innerHTML = '<p class="empty-compare">Добавьте фильмы для сравнения</p>';
        document.getElementById('compareBtn').disabled = true;
        return;
    }
    
    const compareMovies = state.movies.filter(m => state.compareList.includes(m.imdbID));
    
    container.innerHTML = compareMovies.map(movie => `
        <div class="compare-item">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/50x75'}" alt="${movie.Title}">
            <span>${movie.Title}</span>
            <button onclick="removeFromCompare('${movie.imdbID}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    document.getElementById('compareBtn').disabled = state.compareList.length < 2;
}

// Удаление из сравнения
window.removeFromCompare = function(movieId) {
    const index = state.compareList.indexOf(movieId);
    if (index !== -1) {
        state.compareList.splice(index, 1);
        updateComparePanel();
        updateUI();
        
        if (state.compareList.length === 0) {
            elements.comparePanel.classList.remove('show');
        }
    }
};

// Сравнение фильмов
function compareMovies() {
    if (state.compareList.length < 2) return;
    
    const movies = state.movies.filter(m => state.compareList.includes(m.imdbID));
    
    const modalContent = document.createElement('div');
    modalContent.className = 'compare-modal-content';
    
    modalContent.innerHTML = `
        <h2>Сравнение фильмов</h2>
        <div class="compare-table-wrapper">
            <table class="compare-table">
                <tr>
                    <th>Параметр</th>
                    ${movies.map(m => `<th>${m.Title} (${m.Year})</th>`).join('')}
                </tr>
                <tr>
                    <td>Постер</td>
                    ${movies.map(m => `
                        <td>
                            <img src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/100x150'}" 
                                 style="width:100px; border-radius:5px;">
                        </td>
                    `).join('')}
                </tr>
                <tr>
                    <td>Рейтинг IMDb</td>
                    ${movies.map(m => `
                        <td>
                            <span style="color:${getRatingColor(parseFloat(m.imdbRating))}">
                                ⭐ ${m.imdbRating || 'N/A'}
                            </span>
                        </td>
                    `).join('')}
                </tr>
                <tr>
                    <td>Жанр</td>
                    ${movies.map(m => `<td>${m.Genre || 'N/A'}</td>`).join('')}
                </tr>
                <tr>
                    <td>Режиссер</td>
                    ${movies.map(m => `<td>${m.Director || 'N/A'}</td>`).join('')}
                </tr>
                <tr>
                    <td>Актеры</td>
                    ${movies.map(m => `<td>${m.Actors || 'N/A'}</td>`).join('')}
                </tr>
                <tr>
                    <td>Длительность</td>
                    ${movies.map(m => `<td>${m.Runtime || 'N/A'}</td>`).join('')}
                </tr>
                <tr>
                    <td>Страна</td>
                    ${movies.map(m => `<td>${m.Country || 'N/A'}</td>`).join('')}
                </tr>
                <tr>
                    <td>Сюжет</td>
                    ${movies.map(m => `<td class="plot-cell">${m.Plot || 'N/A'}</td>`).join('')}
                </tr>
            </table>
        </div>
    `;
    
    showModal(modalContent);
}

// Очистка сравнения
function clearCompare() {
    state.compareList = [];
    updateComparePanel();
    elements.comparePanel.classList.remove('show');
    updateUI();
}

// Показать детали фильма
async function showMovieDetails(movie) {
    try {
        // Получаем полную информацию
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${movie.imdbID}&plot=full`);
        const details = await response.json();
        
        const content = document.createElement('div');
        content.className = 'movie-details';
        
        const isFavorite = state.favorites.some(f => f.imdbID === movie.imdbID);
        const isInWatchlist = state.watchlist.some(w => w.imdbID === movie.imdbID);
        
        content.innerHTML = `
            <div class="movie-details-poster">
                <img src="${details.Poster !== 'N/A' ? details.Poster : 'https://via.placeholder.com/300x450'}" 
                     alt="${details.Title}">
            </div>
            <div class="movie-details-info">
                <h2>${details.Title} (${details.Year})</h2>
                
                <div class="movie-details-meta">
                    <span><i class="far fa-clock"></i> ${details.Runtime || 'N/A'}</span>
                    <span><i class="fas fa-film"></i> ${details.Genre || 'N/A'}</span>
                    <span><i class="fas fa-globe"></i> ${details.Country || 'N/A'}</span>
                </div>
                
                <div class="movie-details-ratings">
                    <div class="rating-item">
                        <span>IMDb</span>
                        <strong>⭐ ${details.imdbRating || 'N/A'}</strong>
                    </div>
                    <div class="rating-item">
                        <span>Metascore</span>
                        <strong>${details.Metascore || 'N/A'}</strong>
                    </div>
                    ${details.Ratings && details.Ratings[2] ? `
                        <div class="rating-item">
                            <span>Rotten Tomatoes</span>
                            <strong>${details.Ratings[2].Value}</strong>
                        </div>
                    ` : ''}
                </div>
                
                <div class="movie-details-plot">
                    <h3>Сюжет</h3>
                    <p>${details.Plot || 'Нет описания'}</p>
                </div>
                
                <div class="movie-details-cast">
                    <h3>Режиссер</h3>
                    <p>${details.Director || 'N/A'}</p>
                    
                    <h3>Актеры</h3>
                    <p>${details.Actors || 'N/A'}</p>
                    
                    <h3>Награды</h3>
                    <p>${details.Awards || 'N/A'}</p>
                </div>
                
                <div class="movie-details-actions">
                    <button class="btn-primary favorite-btn ${isFavorite ? 'active' : ''}">
                        <i class="fas fa-heart"></i>
                        ${isFavorite ? 'В избранном' : 'В избранное'}
                    </button>
                    <button class="btn-primary watchlist-btn ${isInWatchlist ? 'active' : ''}">
                        <i class="fas fa-clock"></i>
                        ${isInWatchlist ? 'В списке' : 'К просмотру'}
                    </button>
                    <button class="btn-secondary share-btn">
                        <i class="fas fa-share-alt"></i>
                        Поделиться
                    </button>
                </div>
            </div>
        `;
        
        showModal(content);
        
        // Добавляем обработчики
        content.querySelector('.favorite-btn').addEventListener('click', () => {
            toggleFavorite(details);
            const btn = content.querySelector('.favorite-btn');
            const isFav = state.favorites.some(f => f.imdbID === details.imdbID);
            btn.innerHTML = `<i class="fas fa-heart"></i> ${isFav ? 'В избранном' : 'В избранное'}`;
            btn.classList.toggle('active', isFav);
        });
        
        content.querySelector('.watchlist-btn').addEventListener('click', () => {
            toggleWatchlist(details);
            const btn = content.querySelector('.watchlist-btn');
            const isWatch = state.watchlist.some(w => w.imdbID === details.imdbID);
            btn.innerHTML = `<i class="fas fa-clock"></i> ${isWatch ? 'В списке' : 'К просмотру'}`;
            btn.classList.toggle('active', isWatch);
        });
        
        content.querySelector('.share-btn').addEventListener('click', () => shareMovie(details));
        
    } catch (error) {
        console.error('Error loading details:', error);
        showNotification('Ошибка загрузки деталей фильма', 'error');
    }
}

// Показать модальное окно
function showModal(content) {
    const modalBody = document.getElementById('movieDetails');
    modalBody.innerHTML = '';
    modalBody.appendChild(content);
    elements.movieModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Закрыть модальное окно
function closeModal() {
    elements.movieModal.classList.remove('show');
    document.body.style.overflow = '';
}

// Поделиться фильмом
function shareMovie(movie) {
    const url = `${window.location.origin}${window.location.pathname}?movie=${movie.imdbID}`;
    
    if (navigator.share) {
        navigator.share({
            title: movie.Title,
            text: `Посмотрите фильм: ${movie.Title} (${movie.Year})`,
            url: url
        }).catch(() => {
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

// Копирование в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Ссылка скопирована в буфер обмена', 'success');
    }).catch(() => {
        prompt('Скопируйте ссылку:', text);
    });
}

// Добавление в историю
function addToHistory(query) {
    if (!query) return;
    
    state.history = [query, ...state.history.filter(q => q !== query)].slice(0, 20);
    localStorage.setItem('searchHistory', JSON.stringify(state.history));
    
    if (state.currentPage === 'history') {
        renderHistory();
    }
}

// Отрисовка истории
function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    if (state.history.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>История поиска пуста</p></div>';
        return;
    }
    
    container.innerHTML = state.history.map((query, index) => `
        <div class="history-item">
            <div class="history-item-content" onclick="searchFromHistory('${query}')">
                <i class="fas fa-search"></i>
                <span>${query}</span>
            </div>
            <div class="history-item-time">
                <button class="history-item-delete" onclick="removeFromHistory(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Поиск из истории
window.searchFromHistory = function(query) {
    navigateToPage('search');
    elements.globalSearch.value = query;
    handleSearch({ target: { value: query } });
};

// Удаление из истории
window.removeFromHistory = function(index) {
    state.history.splice(index, 1);
    localStorage.setItem('searchHistory', JSON.stringify(state.history));
    renderHistory();
};

// Отрисовка избранного
function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;
    
    if (state.favorites.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>Избранное пусто</p><p class="hint">Добавляйте фильмы в избранное, чтобы они появились здесь</p></div>';
        return;
    }
    
    grid.innerHTML = '';
    state.favorites.forEach(movie => {
        const card = createMovieCard(movie);
        grid.appendChild(card);
    });
}

// Отрисовка списка просмотра
function renderWatchlist() {
    const grid = document.getElementById('watchlistGrid');
    if (!grid) return;
    
    if (state.watchlist.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-clock"></i><p>Список просмотра пуст</p><p class="hint">Добавляйте фильмы, которые хотите посмотреть</p></div>';
        return;
    }
    
    grid.innerHTML = '';
    state.watchlist.forEach(movie => {
        const card = createMovieCard(movie);
        grid.appendChild(card);
    });
}

// Отрисовка статистики
function renderStats() {
    document.getElementById('statFavorites').textContent = state.favorites.length;
    document.getElementById('statWatchlist').textContent = state.watchlist.length;
    document.getElementById('statRated').textContent = Object.keys(state.ratings).length;
    document.getElementById('statSearches').textContent = state.history.length;
    
    // Генерация жанров
    renderGenreChart();
}

// Отрисовка графика жанров
function renderGenreChart() {
    const container = document.getElementById('genreChart');
    if (!container) return;
    
    const genres = {};
    
    // Собираем статистику по жанрам из избранного
    state.favorites.forEach(movie => {
        if (movie.Genre) {
            movie.Genre.split(', ').forEach(genre => {
                genres[genre] = (genres[genre] || 0) + 1;
            });
        }
    });
    
    if (Object.keys(genres).length === 0) {
        container.innerHTML = '<p class="hint">Нет данных для отображения</p>';
        return;
    }
    
    const sorted = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCount = Math.max(...sorted.map(g => g[1]));
    
    container.innerHTML = sorted.map(([genre, count]) => `
        <div class="genre-bar">
            <span class="genre-name">${genre}</span>
            <div class="bar-container">
                <div class="bar" style="width: ${(count / maxCount) * 100}%"></div>
            </div>
            <span class="genre-count">${count}</span>
        </div>
    `).join('');
}

// Отрисовка настроек
function renderSettings() {
    document.getElementById('themeSetting').value = state.theme;
    document.getElementById('cardSizeSetting').value = state.settings.cardSize;
    document.getElementById('saveHistorySetting').checked = state.settings.saveHistory;
    document.getElementById('autoplayTrailers').checked = state.settings.autoplayTrailers;
    document.getElementById('notifyNewMovies').checked = state.settings.notifyNewMovies;
    
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('resetSettings').addEventListener('click', resetSettings);
}

// Сохранение настроек
function saveSettings() {
    state.settings = {
        cardSize: document.getElementById('cardSizeSetting').value,
        saveHistory: document.getElementById('saveHistorySetting').checked,
        autoplayTrailers: document.getElementById('autoplayTrailers').checked,
        notifyNewMovies: document.getElementById('notifyNewMovies').checked
    };
    
    localStorage.setItem('settings', JSON.stringify(state.settings));
    showNotification('Настройки сохранены', 'success');
}

// Сброс настроек
function resetSettings() {
    state.settings = {
        cardSize: 'medium',
        saveHistory: true,
        autoplayTrailers: false,
        notifyNewMovies: false
    };
    renderSettings();
    showNotification('Настройки сброшены', 'info');
}

// Применение фильтров
function applyFilters() {
    state.filters = {
        yearFrom: elements.yearFrom.value,
        yearTo: elements.yearTo.value,
        rating: elements.ratingFilter.value,
        genre: elements.genreFilter.value,
        country: elements.countryFilter.value,
        type: elements.typeFilter.value,
        sort: elements.sortFilter.value
    };
    
    state.currentPageNum = 1;
    state.movies = [];
    searchMovies();
}

// Сброс фильтров
function resetFilters() {
    elements.yearFrom.value = '';
    elements.yearTo.value = '';
    elements.ratingFilter.value = '';
    elements.genreFilter.value = '';
    elements.countryFilter.value = '';
    elements.typeFilter.value = '';
    elements.sortFilter.value = 'default';
    
    state.filters = {
        yearFrom: '',
        yearTo: '',
        rating: '',
        genre: '',
        country: '',
        type: '',
        sort: 'default'
    };
    
    state.currentPageNum = 1;
    state.movies = [];
    searchMovies();
}

// Установка режима просмотра
function setViewMode(mode) {
    state.viewMode = mode;
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });
    
    elements.moviesGrid.className = `movies-grid ${mode === 'list' ? 'list-view' : ''}`;
    
    if (state.movies.length > 0) {
        renderMovies(state.movies);
    }
}

// Фильтрация по типу
function filterByType(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === type);
    });
    
    if (type === 'all') {
        renderMovies(state.movies);
    } else {
        const filtered = state.movies.filter(m => m.Type === type);
        renderMovies(filtered);
    }
}

// Обновление счетчика результатов
function updateResultsCount() {
    if (elements.resultsCount) {
        elements.resultsCount.textContent = `Найдено: ${state.totalResults} фильмов`;
    }
}

// Обновление счетчиков в сайдбаре
function updateFavoritesCount() {
    const badges = document.querySelectorAll('#sidebar-favorites-count, #favorites-count');
    badges.forEach(badge => {
        if (badge) badge.textContent = state.favorites.length;
    });
}

function updateWatchlistCount() {
    const badges = document.querySelectorAll('#sidebar-watchlist-count, #watchlist-count');
    badges.forEach(badge => {
        if (badge) badge.textContent = state.watchlist.length;
    });
}

// Обновление UI
function updateUI() {
    document.querySelectorAll('.favorite').forEach(btn => {
        const card = btn.closest('[data-imdbid]');
        if (card) {
            const imdbId = card.dataset.imdbId;
            btn.classList.toggle('active', state.favorites.some(f => f.imdbID === imdbId));
        }
    });
    
    document.querySelectorAll('.watchlist').forEach(btn => {
        const card = btn.closest('[data-imdbid]');
        if (card) {
            const imdbId = card.dataset.imdbId;
            btn.classList.toggle('active', state.watchlist.some(w => w.imdbID === imdbId));
        }
    });
    
    document.querySelectorAll('.compare').forEach(btn => {
        const card = btn.closest('[data-imdbid]');
        if (card) {
            const imdbId = card.dataset.imdbId;
            btn.classList.toggle('active', state.compareList.includes(imdbId));
        }
    });
    
    updateFavoritesCount();
    updateWatchlistCount();
}

// Состояния загрузки
function showLoading() {
    elements.loadingState.style.display = 'block';
    elements.moviesGrid.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.emptyState.style.display = 'none';
}

function hideLoading() {
    elements.loadingState.style.display = 'none';
    elements.moviesGrid.style.display = 'grid';
}

function showError() {
    elements.errorState.style.display = 'block';
    elements.moviesGrid.style.display = 'none';
    elements.loadingState.style.display = 'none';
    elements.emptyState.style.display = 'none';
}

function hideError() {
    elements.errorState.style.display = 'none';
}

function showEmpty(message = 'Фильмы не найдены') {
    elements.emptyState.style.display = 'block';
    elements.emptyState.querySelector('p').textContent = message;
    elements.moviesGrid.style.display = 'none';
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'none';
}

function hideEmpty() {
    elements.emptyState.style.display = 'none';
}

// Бесконечный скролл
function handleInfiniteScroll() {
    if (state.isLoading || !state.hasMore || state.currentPage !== 'search') return;
    
    const trigger = elements.infiniteTrigger;
    if (!trigger) return;
    
    const rect = trigger.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    if (rect.top <= windowHeight + 100) {
        searchMovies();
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type];
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : type === 'warning' ? '#ecc94b' : '#4299e1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Дебаунс
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Повторная загрузка
window.retryLoad = function() {
    state.currentPageNum = 1;
    state.movies = [];
    searchMovies();
};
