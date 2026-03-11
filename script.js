// Конфигурация
const API_KEY = '5ed3ebac'; // Ваш ключ OMDb API
const BASE_URL = 'https://www.omdbapi.com/';
const YOUTUBE_API_KEY = 'AIzaSyDp4Qp7vK4Q8K4Q8K4Q8K4Q8K4Q8K4Q8K4'; // Замените на свой YouTube API ключ

// Состояние приложения
const state = {
    searchQuery: '',
    currentPage: 1,
    totalResults: 0,
    movies: [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    watchlist: JSON.parse(localStorage.getItem('watchlist')) || [],
    userRatings: JSON.parse(localStorage.getItem('userRatings')) || {},
    comments: JSON.parse(localStorage.getItem('comments')) || {},
    searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
    isLoading: false,
    hasMore: true,
    filters: {
        yearFrom: '',
        yearTo: '',
        type: '',
        minRating: '',
        country: '',
        genre: ''
    },
    currentView: 'search',
    viewMode: 'grid', // 'grid' или 'list'
    sortBy: 'default', // 'year', 'rating', 'title'
    itemsPerPage: 20,
    compareList: [], // Для сравнения фильмов
    recommendations: [] // Рекомендации
};

// DOM элементы
const elements = {
    searchInput: document.getElementById('search-input'),
    yearFrom: document.getElementById('year-from'),
    yearTo: document.getElementById('year-to'),
    typeFilter: document.getElementById('type-filter'),
    minRating: document.getElementById('min-rating'),
    countryFilter: document.getElementById('country-filter'),
    genreFilter: document.getElementById('genre-filter'),
    moviesGrid: document.getElementById('movies-grid'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    noResults: document.getElementById('no-results'),
    infiniteLoader: document.getElementById('infinite-scroll-loader'),
    favoritesBtn: document.getElementById('toggle-favorites'),
    watchlistBtn: document.getElementById('toggle-watchlist'),
    favoritesCount: document.getElementById('favorites-count'),
    watchlistCount: document.getElementById('watchlist-count'),
    searchHistory: document.getElementById('search-history'),
    viewModeGrid: document.getElementById('view-mode-grid'),
    viewModeList: document.getElementById('view-mode-list'),
    sortBy: document.getElementById('sort-by'),
    itemsPerPage: document.getElementById('items-per-page'),
    comparePanel: document.getElementById('compare-panel'),
    recommendationsContainer: document.getElementById('recommendations')
};

// Инициализация
async function init() {
    try {
        // Добавляем все недостающие элементы в DOM
        addMissingElements();
        
        // Заполняем фильтры
        populateFilters();
        
        // Добавляем стили
        addAllStyles();
        
        // Загружаем популярные фильмы
        state.searchQuery = 'matrix';
        await searchMovies();
        
        // Обновляем счетчики
        updateCounters();
        
        // Отображаем историю поиска
        renderSearchHistory();
        
        // Добавляем обработчики событий
        setupEventListeners();
        
        // Проверяем URL для шаринга
        checkShareUrl();
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Ошибка подключения. Проверьте API ключ.');
    }
}

// Добавление недостающих элементов в DOM
function addMissingElements() {
    const filtersDiv = document.querySelector('.filters');
    
    // Добавляем фильтр по году (диапазон)
    const yearRangeHTML = `
        <div class="filter-group year-range">
            <label>Годы:</label>
            <input type="number" id="year-from" placeholder="От" min="1900" max="2026">
            <input type="number" id="year-to" placeholder="До" min="1900" max="2026">
        </div>
    `;
    
    // Добавляем фильтр по рейтингу
    const ratingFilterHTML = `
        <div class="filter-group">
            <label>Рейтинг от:</label>
            <select id="min-rating">
                <option value="">Любой</option>
                <option value="9">9+</option>
                <option value="8">8+</option>
                <option value="7">7+</option>
                <option value="6">6+</option>
                <option value="5">5+</option>
            </select>
        </div>
    `;
    
    // Добавляем фильтр по стране
    const countryFilterHTML = `
        <div class="filter-group">
            <label>Страна:</label>
            <select id="country-filter">
                <option value="">Все страны</option>
                <option value="USA">США</option>
                <option value="UK">Великобритания</option>
                <option value="France">Франция</option>
                <option value="Germany">Германия</option>
                <option value="Japan">Япония</option>
                <option value="Russia">Россия</option>
            </select>
        </div>
    `;
    
    // Добавляем фильтр по жанру
    const genreFilterHTML = `
        <div class="filter-group">
            <label>Жанр:</label>
            <select id="genre-filter">
                <option value="">Все жанры</option>
                <option value="Action">Боевик</option>
                <option value="Comedy">Комедия</option>
                <option value="Drama">Драма</option>
                <option value="Horror">Ужасы</option>
                <option value="Sci-Fi">Фантастика</option>
                <option value="Romance">Мелодрама</option>
                <option value="Thriller">Триллер</option>
                <option value="Documentary">Документальный</option>
            </select>
        </div>
    `;
    
    // Добавляем панель управления отображением
    const viewControlsHTML = `
        <div class="view-controls">
            <div class="view-mode">
                <button id="view-mode-grid" class="active" title="Сетка">📱</button>
                <button id="view-mode-list" title="Список">📋</button>
            </div>
            <select id="sort-by">
                <option value="default">По умолчанию</option>
                <option value="year">По году</option>
                <option value="rating">По рейтингу</option>
                <option value="title">По названию</option>
            </select>
            <select id="items-per-page">
                <option value="10">10</option>
                <option value="20" selected>20</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
        </div>
    `;
    
    // Добавляем историю поиска
    const searchHistoryHTML = `
        <div class="search-history" id="search-history">
            <h3>История поиска</h3>
            <div class="history-items"></div>
        </div>
    `;
    
    // Добавляем панель сравнения
    const comparePanelHTML = `
        <div class="compare-panel" id="compare-panel">
            <h3>Сравнение фильмов</h3>
            <div class="compare-items"></div>
            <button id="compare-btn" disabled>Сравнить</button>
            <button id="clear-compare">Очистить</button>
        </div>
    `;
    
    // Добавляем секцию рекомендаций
    const recommendationsHTML = `
        <div class="recommendations" id="recommendations">
            <h3>Рекомендации для вас</h3>
            <div class="recommendations-grid"></div>
        </div>
    `;
    
    // Вставляем элементы на страницу
    filtersDiv.insertAdjacentHTML('beforeend', yearRangeHTML);
    filtersDiv.insertAdjacentHTML('beforeend', ratingFilterHTML);
    filtersDiv.insertAdjacentHTML('beforeend', countryFilterHTML);
    filtersDiv.insertAdjacentHTML('beforeend', genreFilterHTML);
    
    document.querySelector('.search-section').insertAdjacentHTML('beforeend', searchHistoryHTML);
    document.querySelector('.search-section').insertAdjacentHTML('beforeend', viewControlsHTML);
    document.querySelector('main').insertAdjacentHTML('beforeend', comparePanelHTML);
    document.querySelector('main').insertAdjacentHTML('beforeend', recommendationsHTML);
    
    // Добавляем кнопки для watchlist
    const favoritesSection = document.querySelector('.favorites-section');
    favoritesSection.insertAdjacentHTML('beforeend', `
        <button id="toggle-watchlist" class="watchlist-btn">
            📺 К просмотру (<span id="watchlist-count">0</span>)
        </button>
    `);
}

// Заполнение фильтров
function populateFilters() {
    // Годы
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Поиск с дебаунсом
    elements.searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            addToSearchHistory(query);
            state.searchQuery = query;
            state.currentPage = 1;
            state.movies = [];
            clearMoviesGrid();
            searchMovies();
        }
    }, 500));
    
    // Фильтры
    document.getElementById('year-from')?.addEventListener('change', updateFilters);
    document.getElementById('year-to')?.addEventListener('change', updateFilters);
    document.getElementById('min-rating')?.addEventListener('change', updateFilters);
    document.getElementById('country-filter')?.addEventListener('change', updateFilters);
    document.getElementById('genre-filter')?.addEventListener('change', updateFilters);
    elements.typeFilter?.addEventListener('change', updateFilters);
    
    // Режимы отображения
    document.getElementById('view-mode-grid')?.addEventListener('click', () => setViewMode('grid'));
    document.getElementById('view-mode-list')?.addEventListener('click', () => setViewMode('list'));
    
    // Сортировка
    document.getElementById('sort-by')?.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        sortMovies();
    });
    
    // Количество на странице
    document.getElementById('items-per-page')?.addEventListener('change', (e) => {
        state.itemsPerPage = parseInt(e.target.value);
        state.currentPage = 1;
        state.movies = [];
        searchMovies();
    });
    
    // Избранное и watchlist
    elements.favoritesBtn?.addEventListener('click', () => toggleView('favorites'));
    document.getElementById('toggle-watchlist')?.addEventListener('click', () => toggleView('watchlist'));
    
    // Сравнение
    document.getElementById('compare-btn')?.addEventListener('click', compareMovies);
    document.getElementById('clear-compare')?.addEventListener('click', clearCompare);
    
    // Бесконечный скролл
    window.addEventListener('scroll', debounce(handleInfiniteScroll, 200));
}

// Обновление фильтров
function updateFilters() {
    state.filters.yearFrom = document.getElementById('year-from')?.value || '';
    state.filters.yearTo = document.getElementById('year-to')?.value || '';
    state.filters.minRating = document.getElementById('min-rating')?.value || '';
    state.filters.country = document.getElementById('country-filter')?.value || '';
    state.filters.genre = document.getElementById('genre-filter')?.value || '';
    state.filters.type = elements.typeFilter?.value || '';
    
    state.currentPage = 1;
    state.movies = [];
    clearMoviesGrid();
    searchMovies();
}

// Установка режима отображения
function setViewMode(mode) {
    state.viewMode = mode;
    document.getElementById('view-mode-grid')?.classList.toggle('active', mode === 'grid');
    document.getElementById('view-mode-list')?.classList.toggle('active', mode === 'list');
    document.querySelector('.movies-grid')?.classList.toggle('list-view', mode === 'list');
    renderMovies(state.movies);
}

// Сортировка фильмов
function sortMovies() {
    const sorted = [...state.movies];
    
    switch(state.sortBy) {
        case 'year':
            sorted.sort((a, b) => (b.Year || '0').localeCompare(a.Year || '0'));
            break;
        case 'rating':
            sorted.sort((a, b) => {
                const ratingA = parseFloat(a.imdbRating) || 0;
                const ratingB = parseFloat(b.imdbRating) || 0;
                return ratingB - ratingA;
            });
            break;
        case 'title':
            sorted.sort((a, b) => (a.Title || '').localeCompare(b.Title || ''));
            break;
    }
    
    clearMoviesGrid();
    renderMovies(sorted);
}

// Добавление в историю поиска
function addToSearchHistory(query) {
    if (!query || query.length < 2) return;
    
    state.searchHistory = [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
    renderSearchHistory();
}

// Отображение истории поиска
function renderSearchHistory() {
    const container = document.querySelector('.history-items');
    if (!container) return;
    
    if (state.searchHistory.length === 0) {
        container.innerHTML = '<p class="no-history">История поиска пуста</p>';
        return;
    }
    
    container.innerHTML = state.searchHistory.map(query => `
        <span class="history-item" onclick="document.getElementById('search-input').value='${query}'; document.getElementById('search-input').dispatchEvent(new Event('input'))">
            🔍 ${query}
        </span>
    `).join('');
}

// Поиск фильмов
async function searchMovies() {
    if (state.isLoading || !state.hasMore) return;
    
    try {
        state.isLoading = true;
        showLoading();
        hideError();
        hideNoResults();
        
        let searchTerm = state.searchQuery || 'matrix';
        
        if (state.currentPage === 1) {
            showSkeletons();
        }
        
        const params = new URLSearchParams({
            apikey: API_KEY,
            s: searchTerm,
            page: state.currentPage
        });
        
        if (state.filters.type) params.append('type', state.filters.type);
        if (state.filters.yearFrom) params.append('y', state.filters.yearFrom); // OMDb не поддерживает диапазон, используем начальный год
        
        const response = await fetch(`${BASE_URL}?${params}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
            let movies = data.Search;
            
            // Получаем детальную информацию
            const detailedMovies = await getDetailedMovies(movies);
            
            // Применяем дополнительные фильтры
            const filteredMovies = filterMovies(detailedMovies);
            
            state.totalResults = filteredMovies.length;
            state.hasMore = state.currentPage * 10 < data.totalResults;
            state.movies = [...state.movies, ...filteredMovies];
            
            if (state.currentPage === 1) {
                hideSkeletons();
                clearMoviesGrid();
            }
            
            renderMovies(filteredMovies);
            generateRecommendations(filteredMovies[0]);
            state.currentPage++;
            
        } else {
            if (state.currentPage === 1) {
                hideSkeletons();
                clearMoviesGrid();
                showNoResults(data.Error);
            }
            state.hasMore = false;
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Ошибка при загрузке фильмов');
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

// Фильтрация фильмов
function filterMovies(movies) {
    return movies.filter(movie => {
        // Фильтр по году (диапазон)
        const year = parseInt(movie.Year);
        if (state.filters.yearFrom && year < parseInt(state.filters.yearFrom)) return false;
        if (state.filters.yearTo && year > parseInt(state.filters.yearTo)) return false;
        
        // Фильтр по рейтингу
        const rating = parseFloat(movie.imdbRating);
        if (state.filters.minRating && rating < parseFloat(state.filters.minRating)) return false;
        
        // Фильтр по стране
        if (state.filters.country && !movie.Country?.includes(state.filters.country)) return false;
        
        // Фильтр по жанру
        if (state.filters.genre && !movie.Genre?.includes(state.filters.genre)) return false;
        
        return true;
    });
}

// Получение детальной информации
async function getDetailedMovies(movies) {
    const detailedPromises = movies.map(async (movie) => {
        try {
            const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${movie.imdbID}`);
            const data = await response.json();
            
            // Получаем трейлер с YouTube
            const trailer = await searchYouTubeTrailer(movie.Title);
            
            return {
                ...movie,
                ...data,
                trailer: trailer,
                userRating: state.userRatings[movie.imdbID] || 0,
                comments: state.comments[movie.imdbID] || []
            };
        } catch (error) {
            return movie;
        }
    });
    
    return Promise.all(detailedPromises);
}

// Поиск трейлера на YouTube
async function searchYouTubeTrailer(title) {
    // В реальном проекте здесь был бы запрос к YouTube API
    // Для демо возвращаем заглушку
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`;
}

// Отрисовка фильмов
function renderMovies(movies) {
    if (!movies || movies.length === 0) return;
    
    const container = elements.moviesGrid;
    container.innerHTML = '';
    
    movies.forEach(movie => {
        const card = state.viewMode === 'grid' ? createMovieCard(movie) : createMovieListItem(movie);
        container.appendChild(card);
    });
}

// Создание карточки фильма (сетка)
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.imdbId = movie.imdbID;
    
    const isFavorite = state.favorites.some(fav => fav.imdbID === movie.imdbID);
    const isInWatchlist = state.watchlist.some(w => w.imdbID === movie.imdbID);
    const isInCompare = state.compareList.includes(movie.imdbID);
    
    const posterUrl = movie.Poster && movie.Poster !== 'N/A' 
        ? movie.Poster 
        : 'https://via.placeholder.com/300x450?text=No+Poster';
    
    const rating = parseFloat(movie.imdbRating);
    let ratingColor = '#666';
    if (!isNaN(rating)) {
        if (rating >= 8) ratingColor = '#4CAF50';
        else if (rating >= 7) ratingColor = '#8BC34A';
        else if (rating >= 6) ratingColor = '#FFC107';
        else if (rating >= 5) ratingColor = '#FF9800';
        else ratingColor = '#F44336';
    }
    
    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" alt="${movie.Title}" loading="lazy">
            <div class="rating-badge" style="background-color: ${ratingColor};">
                ⭐ ${movie.imdbRating || 'N/A'}
            </div>
            <div class="movie-actions">
                <button class="action-btn favorite ${isFavorite ? 'active' : ''}" title="В избранное">❤️</button>
                <button class="action-btn watchlist ${isInWatchlist ? 'active' : ''}" title="К просмотру">📺</button>
                <button class="action-btn compare ${isInCompare ? 'active' : ''}" title="Сравнить">⚖️</button>
                <button class="action-btn share" title="Поделиться">📤</button>
            </div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.Title}</h3>
            <div class="movie-meta">
                <span class="movie-year">${movie.Year}</span>
                <span class="movie-type">${movie.Type}</span>
            </div>
            <div class="user-rating">
                ${createUserRatingStars(movie.imdbID, movie.userRating)}
            </div>
        </div>
    `;
    
    // Добавляем обработчики
    addCardEventListeners(card, movie);
    
    return card;
}

// Создание элемента списка
function createMovieListItem(movie) {
    const item = document.createElement('div');
    item.className = 'movie-list-item';
    item.dataset.imdbId = movie.imdbID;
    
    const isFavorite = state.favorites.some(fav => fav.imdbID === movie.imdbID);
    const isInWatchlist = state.watchlist.some(w => w.imdbID === movie.imdbID);
    
    item.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/100x150'}" alt="${movie.Title}">
        <div class="list-item-info">
            <h3>${movie.Title} (${movie.Year})</h3>
            <p><strong>Рейтинг:</strong> ⭐ ${movie.imdbRating || 'N/A'}</p>
            <p><strong>Жанр:</strong> ${movie.Genre || 'N/A'}</p>
            <p><strong>Режиссер:</strong> ${movie.Director || 'N/A'}</p>
            <p class="plot">${movie.Plot?.substring(0, 200)}${movie.Plot?.length > 200 ? '...' : ''}</p>
        </div>
        <div class="list-item-actions">
            <button class="action-btn favorite ${isFavorite ? 'active' : ''}">❤️</button>
            <button class="action-btn watchlist ${isInWatchlist ? 'active' : ''}">📺</button>
            <button class="action-btn share">📤</button>
        </div>
    `;
    
    addCardEventListeners(item, movie);
    
    return item;
}

// Создание звезд для рейтинга
function createUserRatingStars(movieId, currentRating) {
    let stars = '<div class="star-rating">';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= currentRating ? 'active' : ''}" data-rating="${i}">★</span>`;
    }
    stars += '</div>';
    return stars;
}

// Добавление обработчиков для карточки
function addCardEventListeners(card, movie) {
    // Избранное
    card.querySelector('.favorite')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(movie);
    });
    
    // Watchlist
    card.querySelector('.watchlist')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(movie);
    });
    
    // Сравнение
    card.querySelector('.compare')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCompare(movie.imdbID);
    });
    
    // Поделиться
    card.querySelector('.share')?.addEventListener('click', (e) => {
        e.stopPropagation();
        shareMovie(movie);
    });
    
    // Рейтинг
    card.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            const rating = parseInt(star.dataset.rating);
            rateMovie(movie.imdbID, rating);
        });
    });
    
    // Открыть детали
    card.addEventListener('click', () => showMovieDetails(movie));
}

// Переключение избранного
function toggleFavorite(movie) {
    const index = state.favorites.findIndex(fav => fav.imdbID === movie.imdbID);
    
    if (index === -1) {
        state.favorites.push(movie);
        showNotification('Добавлено в избранное', 'success');
    } else {
        state.favorites.splice(index, 1);
        showNotification('Удалено из избранного', 'info');
    }
    
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    updateCounters();
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
    updateCounters();
    updateUI();
}

// Переключение сравнения
function toggleCompare(movieId) {
    const index = state.compareList.indexOf(movieId);
    
    if (index === -1) {
        if (state.compareList.length >= 3) {
            showNotification('Можно сравнивать не более 3 фильмов', 'warning');
            return;
        }
        state.compareList.push(movieId);
    } else {
        state.compareList.splice(index, 1);
    }
    
    updateComparePanel();
    updateUI();
}

// Оценить фильм
function rateMovie(movieId, rating) {
    state.userRatings[movieId] = rating;
    localStorage.setItem('userRatings', JSON.stringify(state.userRatings));
    updateUI();
    showNotification(`Вы оценили фильм на ${rating} ★`, 'success');
}

// Поделиться фильмом
function shareMovie(movie) {
    const url = `${window.location.origin}${window.location.pathname}?movie=${movie.imdbID}`;
    
    // Копируем в буфер обмена
    navigator.clipboard.writeText(url).then(() => {
        showNotification('Ссылка скопирована в буфер обмена', 'success');
    }).catch(() => {
        // Если не получилось, показываем модальное окно с ссылкой
        prompt('Скопируйте ссылку:', url);
    });
}

// Проверка URL для шаринга
function checkShareUrl() {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('movie');
    
    if (movieId) {
        // Ищем фильм по ID и показываем его
        fetch(`${BASE_URL}?apikey=${API_KEY}&i=${movieId}`)
            .then(res => res.json())
            .then(movie => {
                if (movie.Response === 'True') {
                    showMovieDetails(movie);
                }
            });
    }
}

// Обновление панели сравнения
function updateComparePanel() {
    const panel = document.getElementById('compare-panel');
    const container = panel?.querySelector('.compare-items');
    const compareBtn = document.getElementById('compare-btn');
    
    if (!container) return;
    
    if (state.compareList.length === 0) {
        container.innerHTML = '<p>Выберите фильмы для сравнения</p>';
        compareBtn.disabled = true;
        return;
    }
    
    const compareMovies = state.movies.filter(m => state.compareList.includes(m.imdbID));
    
    container.innerHTML = compareMovies.map(movie => `
        <div class="compare-item">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/50x75'}" alt="${movie.Title}">
            <span>${movie.Title}</span>
            <button onclick="toggleCompare('${movie.imdbID}')">✕</button>
        </div>
    `).join('');
    
    compareBtn.disabled = state.compareList.length < 2;
}

// Сравнение фильмов
function compareMovies() {
    if (state.compareList.length < 2) return;
    
    const movies = state.movies.filter(m => state.compareList.includes(m.imdbID));
    
    const modal = document.createElement('div');
    modal.className = 'compare-modal';
    
    modal.innerHTML = `
        <div class="compare-modal-content">
            <h2>Сравнение фильмов</h2>
            <table class="compare-table">
                <tr>
                    <th>Параметр</th>
                    ${movies.map(m => `<th>${m.Title}</th>`).join('')}
                </tr>
                <tr>
                    <td>Постер</td>
                    ${movies.map(m => `<td><img src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/100x150'}" style="width:100px"></td>`).join('')}
                </tr>
                <tr>
                    <td>Год</td>
                    ${movies.map(m => `<td>${m.Year}</td>`).join('')}
                </tr>
                <tr>
                    <td>Рейтинг</td>
                    ${movies.map(m => `<td>⭐ ${m.imdbRating || 'N/A'}</td>`).join('')}
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
            </table>
            <button onclick="this.closest('.compare-modal').remove()">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Очистка списка сравнения
function clearCompare() {
    state.compareList = [];
    updateComparePanel();
    updateUI();
}

// Генерация рекомендаций
function generateRecommendations(baseMovie) {
    if (!baseMovie) return;
    
    // Простой алгоритм: ищем фильмы по жанру
    const genre = baseMovie.Genre?.split(',')[0]?.trim();
    
    if (!genre) return;
    
    fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(genre)}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response === 'True') {
                state.recommendations = data.Search.slice(0, 5);
                renderRecommendations();
            }
        });
}

// Отображение рекомендаций
function renderRecommendations() {
    const container = document.querySelector('.recommendations-grid');
    if (!container) return;
    
    if (state.recommendations.length === 0) {
        container.innerHTML = '<p>Нет рекомендаций</p>';
        return;
    }
    
    container.innerHTML = state.recommendations.map(movie => `
        <div class="recommendation-item" onclick="searchMovie('${movie.Title}')">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/100x150'}" alt="${movie.Title}">
            <span>${movie.Title}</span>
            <small>${movie.Year}</small>
        </div>
    `).join('');
}

// Поиск по названию фильма
window.searchMovie = function(title) {
    document.getElementById('search-input').value = title;
    document.getElementById('search-input').dispatchEvent(new Event('input'));
};

// Переключение между представлениями
function toggleView(view) {
    state.currentView = view;
    
    if (view === 'favorites') {
        renderMovies(state.favorites);
    } else if (view === 'watchlist') {
        renderMovies(state.watchlist);
    } else {
        state.currentPage = 1;
        state.movies = [];
        searchMovies();
    }
}

// Обновление счетчиков
function updateCounters() {
    elements.favoritesCount.textContent = state.favorites.length;
    const watchlistCount = document.getElementById('watchlist-count');
    if (watchlistCount) watchlistCount.textContent = state.watchlist.length;
}

// Обновление UI
function updateUI() {
    // Обновляем все кнопки и состояния
    const buttons = document.querySelectorAll('.favorite, .watchlist, .compare');
    buttons.forEach(btn => {
        const card = btn.closest('[data-imdbid]');
        if (!card) return;
        
        const imdbId = card.dataset.imdbId;
        
        if (btn.classList.contains('favorite')) {
            btn.classList.toggle('active', state.favorites.some(f => f.imdbID === imdbId));
        } else if (btn.classList.contains('watchlist')) {
            btn.classList.toggle('active', state.watchlist.some(w => w.imdbID === imdbId));
        } else if (btn.classList.contains('compare')) {
            btn.classList.toggle('active', state.compareList.includes(imdbId));
        }
    });
}

// Показ детальной информации
function showMovieDetails(movie) {
    const modal = document.createElement('div');
    modal.className = 'movie-details-modal';
    
    const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450';
    
    // Получаем комментарии для этого фильма
    const movieComments = state.comments[movie.imdbID] || [];
    
    modal.innerHTML = `
        <div class="details-content">
            <span class="close">&times;</span>
            <div class="details-body">
                <img src="${posterUrl}" alt="${movie.Title}">
                <div class="details-info">
                    <h2>${movie.Title} (${movie.Year})</h2>
                    
                    <div class="details-ratings">
                        <div class="rating-box" style="background-color: ${getRatingColor(movie.imdbRating)}">
                            <span>IMDb</span>
                            <strong>${movie.imdbRating || 'N/A'}</strong>
                        </div>
                        <div class="rating-box">
                            <span>Ваша оценка</span>
                            <div class="details-stars">
                                ${createUserRatingStars(movie.imdbID, state.userRatings[movie.imdbID] || 0)}
                            </div>
                        </div>
                    </div>
                    
                    <p><strong>Жанр:</strong> ${movie.Genre || 'N/A'}</p>
                    <p><strong>Режиссер:</strong> ${movie.Director || 'N/A'}</p>
                    <p><strong>Актеры:</strong> ${movie.Actors || 'N/A'}</p>
                    <p><strong>Длительность:</strong> ${movie.Runtime || 'N/A'}</p>
                    <p><strong>Страна:</strong> ${movie.Country || 'N/A'}</p>
                    <p><strong>Сюжет:</strong> ${movie.Plot || 'Нет описания'}</p>
                    
                    ${movie.trailer ? `
                        <a href="${movie.trailer}" target="_blank" class="trailer-btn">
                            ▶ Смотреть трейлер
                        </a>
                    ` : ''}
                    
                    <div class="comments-section">
                        <h3>Комментарии</h3>
                        <div class="comments-list">
                            ${movieComments.map(comment => `
                                <div class="comment">
                                    <strong>${comment.author}:</strong>
                                    <p>${comment.text}</p>
                                    <small>${new Date(comment.date).toLocaleDateString()}</small>
                                </div>
                            `).join('')}
                        </div>
                        <div class="add-comment">
                            <input type="text" id="comment-author" placeholder="Ваше имя">
                            <textarea id="comment-text" placeholder="Ваш комментарий"></textarea>
                            <button onclick="addComment('${movie.imdbID}')">Отправить</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие модального окна
    modal.querySelector('.close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Обновляем звезды в модальном окне
    modal.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            const rating = parseInt(star.dataset.rating);
            rateMovie(movie.imdbID, rating);
            
            // Обновляем отображение звезд
            const stars = modal.querySelectorAll('.star');
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < rating);
            });
        });
    });
}

// Добавление комментария
window.addComment = function(movieId) {
    const author = document.getElementById('comment-author')?.value.trim();
    const text = document.getElementById('comment-text')?.value.trim();
    
    if (!author || !text) {
        showNotification('Заполните все поля', 'warning');
        return;
    }
    
    if (!state.comments[movieId]) {
        state.comments[movieId] = [];
    }
    
    state.comments[movieId].push({
        author,
        text,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('comments', JSON.stringify(state.comments));
    
    // Очищаем поля
    document.getElementById('comment-author').value = '';
    document.getElementById('comment-text').value = '';
    
    showNotification('Комментарий добавлен', 'success');
    
    // Обновляем модальное окно
    const modal = document.querySelector('.movie-details-modal');
    if (modal) {
        const movie = state.movies.find(m => m.imdbID === movieId);
        if (movie) {
            modal.remove();
            showMovieDetails(movie);
        }
    }
};

// Получение цвета для рейтинга
function getRatingColor(rating) {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#666';
    if (r >= 8) return '#4CAF50';
    if (r >= 7) return '#8BC34A';
    if (r >= 6) return '#FFC107';
    if (r >= 5) return '#FF9800';
    return '#F44336';
}

// Добавление всех стилей
function addAllStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Фильтры */
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
            min-width: 120px;
        }
        
        .year-range {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 5px;
        }
        
        .year-range input {
            width: 80px;
            padding: 8px;
        }
        
        /* История поиска */
        .search-history {
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 10px;
        }
        
        .history-items {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
        }
        
        .history-item {
            padding: 5px 12px;
            background: #f0f0f0;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }
        
        .history-item:hover {
            background: #667eea;
            color: white;
        }
        
        /* Панель управления */
        .view-controls {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            flex-wrap: wrap;
        }
        
        .view-mode {
            display: flex;
            gap: 5px;
        }
        
        .view-mode button {
            padding: 8px 15px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .view-mode button.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        /* Список */
        .movies-grid.list-view {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .movie-list-item {
            display: flex;
            gap: 20px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .movie-list-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .movie-list-item img {
            width: 100px;
            height: 150px;
            object-fit: cover;
            border-radius: 5px;
        }
        
        .list-item-info {
            flex: 1;
        }
        
        .list-item-info h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .list-item-info p {
            margin-bottom: 5px;
            color: #666;
        }
        
        .list-item-info .plot {
            font-size: 0.9rem;
            color: #888;
        }
        
        .list-item-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        /* Кнопки действий на карточке */
        .movie-actions {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            z-index: 3;
        }
        
        .action-btn {
            width: 35px;
            height: 35px;
            border: none;
            border-radius: 50%;
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .action-btn:hover {
            transform: scale(1.1);
            background: rgba(0,0,0,0.9);
        }
        
        .action-btn.active {
            background: #ffd700;
            color: black;
        }
        
        /* Звездный рейтинг */
        .star-rating {
            display: flex;
            gap: 2px;
        }
        
        .star {
            color: #ddd;
            font-size: 1.2rem;
            cursor: pointer;
            transition: color 0.2s ease;
        }
        
        .star:hover,
        .star.active {
            color: #ffd700;
        }
        
        /* Панель сравнения */
        .compare-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 100;
        }
        
        .compare-items {
            margin: 15px 0;
        }
        
        .compare-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 5px;
            margin-bottom: 5px;
        }
        
        .compare-item img {
            width: 30px;
            height: 45px;
            object-fit: cover;
            border-radius: 3px;
        }
        
        .compare-item button {
            margin-left: auto;
            background: none;
            border: none;
            color: #f44336;
            cursor: pointer;
            font-size: 1.2rem;
        }
        
        /* Модальное окно сравнения */
        .compare-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        .compare-modal-content {
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .compare-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .compare-table th,
        .compare-table td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        
        .compare-table th {
            background: #f5f5f5;
        }
        
        /* Рекомендации */
        .recommendations {
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 15px;
        }
        
        .recommendations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .recommendation-item {
            cursor: pointer;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .recommendation-item:hover {
            transform: scale(1.05);
        }
        
        .recommendation-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        
        .recommendation-item span {
            display: block;
            font-weight: 600;
            color: #333;
        }
        
        .recommendation-item small {
            color: #666;
        }
        
        /* Детальная информация */
        .movie-details-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        .details-content {
            background: white;
            border-radius: 15px;
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            padding: 20px;
        }
        
        .details-body {
            display: flex;
            gap: 30px;
        }
        
        .details-body img {
            width: 300px;
            height: 450px;
            object-fit: cover;
            border-radius: 10px;
        }
        
        .details-info {
            flex: 1;
        }
        
        .details-info h2 {
            margin-bottom: 20px;
            color: #333;
        }
        
        .details-info p {
            margin-bottom: 15px;
            line-height: 1.6;
            color: #666;
        }
        
        .details-ratings {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .rating-box {
            flex: 1;
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            background: #f5f5f5;
        }
        
        .rating-box span {
            display: block;
            margin-bottom: 5px;
        }
        
        .rating-box strong {
            font-size: 1.5rem;
        }
        
        .trailer-btn {
            display: inline-block;
            padding: 12px 25px;
            background: #ff0000;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        /* Комментарии */
        .comments-section {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        
        .comments-list {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        
        .comment {
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        
        .comment strong {
            color: #333;
        }
        
        .comment p {
            margin: 5px 0;
            color: #666;
        }
        
        .comment small {
            color: #999;
        }
        
        .add-comment {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .add-comment input,
        .add-comment textarea {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .add-comment textarea {
            height: 80px;
            resize: vertical;
        }
        
        .add-comment button {
            padding: 10px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        
        /* Адаптивность */
        @media (max-width: 768px) {
            .details-body {
                flex-direction: column;
                align-items: center;
            }
            
            .details-body img {
                width: 200px;
                height: 300px;
            }
            
            .view-controls {
                flex-direction: column;
            }
            
            .movie-list-item {
                flex-direction: column;
            }
            
            .list-item-actions {
                flex-direction: row;
                justify-content: flex-end;
            }
            
            .compare-panel {
                left: 20px;
                right: 20px;
                width: auto;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Остальные вспомогательные функции
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function clearMoviesGrid() {
    if (elements.moviesGrid) elements.moviesGrid.innerHTML = '';
}

function showLoading() {
    if (elements.loading) elements.loading.classList.remove('hidden');
}

function hideLoading() {
    if (elements.loading) elements.loading.classList.add('hidden');
}

function showError(message) {
    if (elements.errorMessage) {
        const p = elements.errorMessage.querySelector('p');
        if (p) p.textContent = '⚠️ ' + message;
        elements.errorMessage.classList.remove('hidden');
    }
}

function hideError() {
    if (elements.errorMessage) elements.errorMessage.classList.add('hidden');
}

function showNoResults(message) {
    if (elements.noResults) {
        const p = elements.noResults.querySelector('p');
        if (p) p.textContent = '😕 ' + message;
        elements.noResults.classList.remove('hidden');
    }
}

function hideNoResults() {
    if (elements.noResults) elements.noResults.classList.add('hidden');
}

function showSkeletons() {
    for (let i = 0; i < 10; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-poster"></div>
            <div class="skeleton-info">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line" style="width: 60%"></div>
            </div>
        `;
        elements.moviesGrid?.appendChild(skeleton);
    }
}

function hideSkeletons() {
    const skeletons = document.querySelectorAll('.skeleton');
    skeletons.forEach(s => s.remove());
}

function handleInfiniteScroll() {
    if (state.isLoading || !state.hasMore || state.currentView !== 'search') return;
    
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollY + windowHeight >= documentHeight - 1000) {
        searchMovies();
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);