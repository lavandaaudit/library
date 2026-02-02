// --- Stars Background ---
const canvas = document.getElementById('starsCanvas');
const ctx = canvas.getContext('2d');
let stars = [];
function initStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.15 + 0.05,
            opacity: Math.random()
        });
    }
}
function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
    });
    requestAnimationFrame(animateStars);
}
window.addEventListener('resize', initStars);
initStars();
animateStars();

// --- Library Logic ---
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
    'modern_music': 'subject:modern_music',
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
    'atlases': 'subject:historical_atlases',
    'greece': 'subject:ancient_greece',
    'rome': 'subject:ancient_rome',
    'technology': 'subject:technology',
    'comms': 'subject:telecommunication',
    'ornithology': 'subject:ornithology',
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

    let finalQuery;
    if (isSearch) {
        finalQuery = `q=${encodeURIComponent(key)}`;
    } else {
        const val = subjectMapping[key];
        if (key === 'trending') {
            finalQuery = `q=subject:fiction&sort=editions`;
        } else if (val) {
            finalQuery = `q=${encodeURIComponent(val)}`;
        } else {
            finalQuery = `q=subject:literature`;
        }
    }

    const url = `https://openlibrary.org/search.json?${finalQuery}&limit=24&fields=key,title,author_name,cover_i,first_publish_year,subject,ia`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        loader.classList.add('hidden');
        if (data.docs) {
            data.docs.forEach(book => {
                if (!book.cover_i) return;
                const card = document.createElement('div');
                card.className = 'book-card';
                card.innerHTML = `
                    <img src="https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg" class="book-cover">
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">${book.author_name ? book.author_name[0] : 'Автор невідомий'}</p>
                    </div>
                `;
                card.onclick = () => showBookDetails(book);
                booksGrid.appendChild(card);
            });
        }
    } catch (e) { loader.classList.add('hidden'); }
}

// Функція пошуку в Вікіпедії українською
async function getWikiDescription(title) {
    try {
        const url = `https://uk.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            return data.extract_html || `<p>${data.extract}</p>`;
        }
    } catch (e) { console.log("Wiki error", e); }
    return null;
}

async function showBookDetails(book) {
    const authors = book.author_name ? book.author_name.join(', ') : 'Невідомий автор';
    const readLink = book.ia ? `https://archive.org/details/${book.ia[0]}/mode/2up` : `https://openlibrary.org${book.key}`;

    // Показуємо базове вікно
    modalBody.innerHTML = `
        <img src="https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg" class="modal-cover">
        <div class="modal-details">
            <h2>${book.title}</h2>
            <p class="meta"><strong>Автор:</strong> ${authors} | <strong>Рік:</strong> ${book.first_publish_year || '---'}</p>
            <div id="wikiDesc" class="modal-description">Завантажуємо опис з Вікіпедії...</div>
            <div class="action-buttons">
                <a href="${readLink}" target="_blank" class="read-btn">ЧИТАТИ ОНЛАЙН</a>
            </div>
        </div>
    `;

    modal.classList.add('active');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Завантажуємо опис
    const desc = await getWikiDescription(book.title);
    const descDiv = document.getElementById('wikiDesc');
    if (desc) {
        descDiv.innerHTML = desc;
    } else {
        descDiv.innerHTML = `
            <p>Ця книга доступна в цифровому архіві IBONARIUM через мережу Open Library/Archive.org.</p>
            <p>Ви можете безкоштовно переглянути її або взяти в оренду в оригінальному форматі.</p>
        `;
    }
}

// Listeners
filterBtns.forEach(btn => btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    fetchBooks(btn.dataset.subject === 'all' ? 'literature' : btn.dataset.subject);
});

searchBtn.onclick = () => fetchBooks(searchInput.value, true);
searchInput.onkeypress = (e) => e.key === 'Enter' && fetchBooks(searchInput.value, true);
closeModal.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = 'auto'; };
window.onclick = (e) => { if (e.target === modal) closeModal.onclick(); };

fetchBooks('literature');
