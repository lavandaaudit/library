// --- Floating Stars Background ---
const canvas = document.getElementById('starsCanvas');
const ctx = canvas.getContext('2d');

let stars = [];
const starCount = 200;

function initStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.15 + 0.05,
            opacity: Math.random(),
            pulse: Math.random() * 0.05
        });
    }
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
        star.opacity += Math.sin(Date.now() * 0.001 + star.x) * 0.005;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, star.opacity))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });

    requestAnimationFrame(animateStars);
}

window.addEventListener('resize', initStars);
initStars();
animateStars();

// --- Library Logic (Open Library / Archive.org) ---
const booksGrid = document.getElementById('booksGrid');
const loader = document.getElementById('loader');
const searchInput = document.getElementById('bookSearch');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('bookModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');

// Mappings for specific queries
const subjectMapping = {
    'all': 'subject:literature',
    'trending': 'sort=editions&subject=literature', // Proxy for popular
    'science': 'subject:science',
    'publicistics': 'subject:journalism',
    'space': 'subject:astronomy',
    'history': 'subject:history',
    'ballet': 'ballet history',
    'middle ages': 'subject:middle_ages',
    'classics': 'subject:classic_literature',
    'philosophy': 'subject:philosophy',
    'music': 'subject:music',
    // Music Expansion
    'opera': 'subject:opera',
    'classical_music': 'subject:classical_music',
    'modern_music': 'subject:modern_music', // or contemporary
    'jazz': 'subject:jazz',
    'rock': 'subject:rock_music',
    'folk': 'subject:folk_music',
    'music_theory': 'subject:music_theory',

    'geometry': 'subject:geometry',
    'mathematics': 'subject:mathematics',
    'literature': 'subject:fiction',
    'physics': 'subject:physics',
    'quantum physics': 'quantum physics',
    'poetry': 'subject:poetry',

    // New Categories
    'astronomy': 'subject:astronomy',
    'medicine': 'subject:medicine',
    'biology': 'subject:biology',
    // ukrainian removed
    'atlases': 'subject:historical_atlases',
    'greece': 'subject:ancient_greece',
    'rome': 'subject:ancient_rome',
    'technology': 'subject:technology',
    'comms': 'subject:telecommunication',
    'ornithology': 'subject:ornithology',
    // transhumanism removed
    'scifi': 'subject:science_fiction',
    'politics': 'subject:politics',
    'law': 'subject:law',
    'economics': 'subject:economics',

    // User Requested & Expanded
    'recreation': 'subject:recreation',
    'cooking': 'subject:cooking',
    'maps': 'subject:maps',
    'art': 'subject:art',
    'museums': 'subject:museums',
    'german_philosophy': 'subject:german_philosophy',
    // Replaced Philosophers with Science
    'astrophysics': 'subject:astrophysics',
    'genetics': 'subject:genetics',

    // Additional
    'architecture': 'subject:architecture',
    'psychology': 'subject:psychology',
    'mythology': 'subject:mythology',
    'egypt': 'subject:ancient_egypt',
    'linguistics': 'subject:linguistics',
    'botany': 'subject:botany',
    'cinema': 'subject:cinema',
    'chess': 'subject:chess',
    'design': 'subject:design',
    'ai': 'subject:artificial_intelligence',
    'oceanography': 'subject:oceanography',
    'gardening': 'subject:gardening'
};

async function fetchBooks(key, isSearch = false) {
    loader.classList.remove('hidden');
    booksGrid.innerHTML = '';

    // Open Library Search API
    const baseUrl = 'https://openlibrary.org/search.json';
    let finalQuery;
    let extraParams = '';

    if (isSearch) {
        finalQuery = `q=${encodeURIComponent(key)}`;
    } else {
        // Build query from mapping
        const val = subjectMapping[key];
        if (key === 'trending') {
            // Trending uses a broader search with sort
            finalQuery = `q=subject:fiction&sort=editions`;
        } else if (val) {
            finalQuery = `q=${encodeURIComponent(val)}`;
        } else {
            finalQuery = `q=subject:literature`;
        }
    }

    // Attempt to get more fields and relevant sort
    const apiUrl = `${baseUrl}?${finalQuery}&limit=24&fields=key,title,author_name,cover_i,first_publish_year,subject,ia,language`;

    try {
        console.log("Fetching:", apiUrl);
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();

        loader.classList.add('hidden');

        if (data.docs && data.docs.length > 0) {
            // Filter out results that might not have covers to keep it pretty
            // or just render what we have. Let's render everything but placeholder if missing.
            displayBooks(data.docs);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        loader.classList.add('hidden');
        booksGrid.innerHTML = `<p class="api-notice">Помилка підключення до архіву. Спробуйте ще раз пізніше.</p>`;
    }
}

function displayBooks(books) {
    books.forEach(book => {
        // Optional: Filter strict items without covers if desired, but let's allow placeholder for rare items logic
        // For aesthetics, let's skip items with absolutely no cover ID if user wants "visual core"
        if (!book.cover_i) return;

        const card = document.createElement('div');
        card.className = 'book-card';

        const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        const authors = book.author_name ? book.author_name.slice(0, 2).join(', ') : 'Невідомий автор';
        const title = book.title || 'Без назви';

        card.innerHTML = `
            <div class="card-image-wrap">
                 <img src="${coverUrl}" alt="${title}" class="book-cover" loading="lazy">
            </div>
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">${authors}</p>
                <div class="hover-info">ЧИТАТИ</div>
            </div>
        `;

        card.addEventListener('click', () => showBookDetails(book));
        booksGrid.appendChild(card);
    });
}

function showBookDetails(book) {
    const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
    const authors = book.author_name ? book.author_name.join(', ') : 'Невідомий автор';
    const year = book.first_publish_year || 'Невідомо';
    // Clean subjects
    const subjects = book.subject ? book.subject.slice(0, 5).join(', ') : 'Не вказано';

    // Construct links
    const bookLink = `https://openlibrary.org${book.key}`;
    // Use Archive.org reader link if 'ia' availability exists
    const readLink = book.ia ? `https://archive.org/details/${book.ia[0]}/mode/2up` : bookLink;

    modalBody.innerHTML = `
        <img src="${coverUrl}" alt="${book.title}" class="modal-cover">
        <div class="modal-details">
            <h2>${book.title}</h2>
            <div class="meta">
                <p><strong>Автор:</strong> ${authors}</p>
                <p><strong>Рік видання:</strong> ${year}</p>
                <p><strong>Тематика:</strong> ${subjects}</p>
            </div>
            <div class="modal-description">
                <p>Ця книга доступна в цифровому архіві IBONARIUM через мережу Open Library/Archive.org.</p>
                <p>Ви можете безкоштовно переглянути її або взяти в оренду, якщо це дозволено ліцензією.</p>
            </div>
            <div class="action-buttons">
                <a href="${readLink}" target="_blank" class="read-btn primary-btn">ЧИТАТИ ОНЛАЙН</a>
                <a href="${bookLink}" target="_blank" class="read-btn secondary-btn">КАРТКА OPEN LIBRARY</a>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Event Listeners
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchBooks(btn.dataset.subject);
    });
});

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        fetchBooks(query, true);
        filterBtns.forEach(b => b.classList.remove('active'));
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            fetchBooks(query, true);
            filterBtns.forEach(b => b.classList.remove('active'));
        }
    }
});

function showNoResults() {
    booksGrid.innerHTML = `
        <div class="no-results">
            <p>Нічого не знайдено за цим запитом.</p>
            <p style="font-size: 0.8em; opacity: 0.6;">Спробуйте змінити ключові слова.</p>
        </div>
    `;
}

// Modal closing
closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
});

// Initial load - use "All" (literature) or "Trending"
fetchBooks('all');
