let paintings = [];
let currentIndex = 0;
let currentPage = 1;
const limit = 20;
const artGrid = document.getElementById('art-grid');
const previousBtn = document.getElementById('previous-btn');
const nextBtn = document.getElementById('next-btn');
const pageNumberDisplay = document.getElementById('page-number');
let userId = null;

// Inițializez pagina când documentul este gata
document.addEventListener('DOMContentLoaded', async () => {
    await authenticateUser();
    await fetchPaintings();
    displayArtworks();
    updatePaginationControls();
});

// Funcția pentru autentificarea utilizatorului
async function authenticateUser() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Nu ești autentificat!');
        window.location.href = 'http://localhost:5000/login';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/auth/verifyToken', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userId = data.userId;
        } else {
            throw new Error('Token invalid');
        }
    } catch (error) {
        alert('Autentificarea a eșuat, te rugăm să te autentifici din nou.');
        localStorage.removeItem('token');
        window.location.href = 'http://localhost:5000/login';
    }
}

// Funcția pentru preluarea picturilor din API
async function fetchPaintings() {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        paintings = extractArtworks(data);
        // Sortez picturile alfabetic
        paintings.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

// Funcția pentru extragerea picturilor din datele API
function extractArtworks(data) {
    let artworks = [];
    let artworkImages = new Set();

    data.forEach(periodData => {
        Object.keys(periodData).forEach(periodKey => {
            const period = periodData[periodKey];
            if (Array.isArray(period)) {
                period.forEach(item => {
                    const artistName = item.name || 'Unknown Artist';
                    if (item.artworks && Array.isArray(item.artworks)) {
                        item.artworks.forEach(artwork => {
                            if (!artworkImages.has(artwork.image)) {
                                artworkImages.add(artwork.image);
                                artworks.push({
                                    image: artwork.image || 'placeholder.jpg',
                                    title: artwork.title || 'Untitled',
                                    name: artistName,
                                    period: periodKey,
                                    paintingId: artwork.paintingId,
                                });
                            }
                        });
                    }
                });
            }
        });
    });

    return artworks;
}

// Funcția pentru afișarea picturilor
function displayArtworks() {
    sortByPaintingName();
    artGrid.innerHTML = '';
    const artworks = paintings.slice((currentPage - 1) * limit, currentPage * limit);
    artworks.forEach(art => {
        const artItem = createArtItem(art);
        artGrid.appendChild(artItem);
    });
    updatePaginationControls();
}

// Funcția pentru sortarea picturilor
function sortByPaintingName() {
    paintings.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));
}



// Funcția pentru crearea elementului de pictură
function createArtItem(art) {
    const artItem = document.createElement('div');
    artItem.classList.add('grid-art-item');
    artItem.innerHTML = `
        <img src="${art.image}" alt="${art.title}">
        <h3>${art.title}</h3>
        <p class="clickable-artist">${art.name}</p>
        <button class="favorite-btn" onclick="toggleFavorite(this, '${art.paintingId}', '${art.image}', '${art.title}')"><i class="far fa-heart"></i></button>
    `;

    artItem.querySelector('.clickable-artist').addEventListener('click', () => {
        window.location.href = `artist.html?name=${encodeURIComponent(art.name)}`;
    });

    artItem.addEventListener('click', () => {
        showPaintingDetails(art);
    });

    return artItem;
}

// Funcția pentru actualizarea controalelor de paginare
function updatePaginationControls() {
    pageNumberDisplay.textContent = `Page ${currentPage}`;
    previousBtn.style.display = currentPage === 1 ? 'none' : 'inline-block';
    nextBtn.style.display = (currentPage * limit >= paintings.length) ? 'none' : 'inline-block';
}

// Funcțiile pentru paginare
function loadPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayArtworks();
    }
}

function loadNextPage() {
    if ((currentPage * limit) < paintings.length) {
        currentPage++;
        displayArtworks();
    }
}

// Funcția pentru adăugarea la favorite
function toggleFavorite(button, paintingId, painting_img, painting_name) {
    event.stopPropagation();
    const heartIcon = button.querySelector('i');

    if (heartIcon.classList.contains('favorited')) {
        heartIcon.classList.remove('favorited');
        removeFavorite(userId, paintingId);
    } else {
        heartIcon.classList.add('favorited');
        addToFavorite(userId, paintingId, painting_img, painting_name);
    }
}

// Funcțiile pentru afișarea detaliilor picturii și gestionarea modalului
function showPaintingDetails(art) {
    const modal = document.getElementById('painting-details-modal');
    if (!modal) return;

    document.getElementById('painting-image').src = art.image || 'placeholder.jpg';
    document.getElementById('painting-title').textContent = art.title || 'Untitled';
    document.getElementById('painting-artist').textContent = `Artist: ${art.name || 'Unknown Artist'}`;
    document.getElementById('painting-period').textContent = `Period: ${art.period}`;

    const favoriteBtn = document.getElementById('modal-favorite-btn');
    favoriteBtn.onclick = function (event) {
        event.stopPropagation();
        toggleFavorite(favoriteBtn, art.paintingId, art.image, art.title);
    };

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePaintingDetails() {
    document.getElementById('painting-details-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Închid modalul la click pe fundal
window.addEventListener('click', (event) => {
    const modal = document.getElementById('painting-details-modal');
    if (event.target === modal) {
        closePaintingDetails();
    }
});

// Asigur că funcția toggleFavorite este disponibilă global
window.toggleFavorite = toggleFavorite;
