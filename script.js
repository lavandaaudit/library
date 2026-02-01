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

const subjectMapping = {
    'all': 'subject:literature',
    'space': 'subject:astronomy',
    'history': 'subject:history',
    'ballet': 'ballet history',
    'middle ages': 'subject:middle_ages',
    'classics': 'subject:classic_literature',
    'philosophy': 'subject:philosophy',
    'music': 'subject:music',
    'geometry': 'subject:geometry',
    'mathematics': 'subject:mathematics',
    'literature': 'subject:fiction',
    'physics': 'subject:physics',
    'quantum physics': 'quantum physics',
    'poetry': 'subject:poetry'
};

async function fetchBooks(query, isSearch = false) {
    loader.classList.remove('hidden');
    booksGrid.innerHTML = '';

    // Open Library Search API
    const baseUrl = 'https://openlibrary.org/search.json';
    const finalQuery = isSearch ? query : subjectMapping[query] || 'subject:literature';
    const apiUrl = `${baseUrl}?q=${encodeURIComponent(finalQuery)}&limit=24&fields=key,title,author_name,cover_i,first_publish_year,subject,ia`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();

        loader.classList.add('hidden');

        if (data.docs && data.docs.length > 0) {
            displayBooks(data.docs);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        loader.classList.add('hidden');
        booksGrid.innerHTML = `<p class="api-notice">Помилка підключення до архіву. Спробуйте ще раз.</p>`;
    }
}

function displayBooks(books) {
    books.forEach(book => {
        // Only show books that have a cover for better aesthetics
        if (!book.cover_i) return;

        const card = document.createElement('div');
        card.className = 'book-card';

        const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        const authors = book.author_name ? book.author_name.join(', ') : 'Невідомий автор';
        const title = book.title || 'Без назви';

        card.innerHTML = `
            <img src="${coverUrl}" alt="${title}" class="book-cover" loading="lazy">
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">${authors}</p>
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
    const subjects = book.subject ? book.subject.slice(0, 5).join(', ') : 'Не вказано';

    // Archive.org / Open Library Link
    const bookLink = `https://openlibrary.org${book.key}`;
    const readLink = book.ia ? `https://archive.org/details/${book.ia[0]}` : bookLink;

    modalBody.innerHTML = `
        <img src="${coverUrl}" alt="${book.title}" class="modal-cover">
        <div class="modal-details">
            <h2>${book.title}</h2>
            <div class="meta">
                <p><strong>Автор:</strong> ${authors}</p>
                <p><strong>Перше видання:</strong> ${year}</p>
                <p><strong>Тематика:</strong> ${subjects}</p>
            </div>
            <div class="modal-description">
                Ця книга є частиною світового відкритого архіву. 
                Ви можете переглянути повну версію, цифрову копію або взяти її в оренду через Open Library.
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <a href="${readLink}" target="_blank" class="read-btn">ВІДКРИТИ АРХІВ</a>
                <a href="${bookLink}" target="_blank" class="read-btn" style="background: transparent; border: 1px solid white; color: white;">ДЕТАЛІ OL</a>
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
            <p>В архіві нічого не знайдено за цим запитом.</p>
        </div>
    `;
}

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

// Initial load
fetchBooks('all');
