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

    let favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    const artworks = paintings.slice((currentPage - 1) * limit, currentPage * limit);
    artworks.forEach(art => {
        const artItem = createArtItem(art);
        artGrid.appendChild(artItem);

        artItem.setAttribute('data-painting-id', art.paintingId);

        const heartIcon = artItem.querySelector('.favorite-btn i');
        if (favoritePaintings.some(fav => fav.paintingId === art.paintingId)) {
            heartIcon.classList.add('favorited'); // Adaug stilul de inimă favorită
        }

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

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (heartIcon.classList.contains('favorited')) {
        heartIcon.classList.remove('favorited');
        favorites = favorites.filter(fav => fav.paintingId !== paintingId)
        removeFavorite(userId, paintingId);
    } else {
        heartIcon.classList.add('favorited');
        favorites.push({paintingId,painting_img,painting_name});
        addToFavorite(userId, paintingId, painting_img, painting_name);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    //actualize iconita din homepage daca trb
    const paintingArtItem = document.querySelector(`[data-painting-id="${paintingId}"]`);
    if (paintingArtItem) {
        const homepageHeartIcon = paintingArtItem.querySelector('.favorite-btn i');
        if (favorites.some(fav => fav.paintingId === paintingId)) {
            homepageHeartIcon.classList.add('favorited');
        } else {
            homepageHeartIcon.classList.remove('favorited');
        }
    }

    const modal = document.getElementById('painting-details-modal');
    if (modal.style.display === 'block') {
        const modalFavoriteBtn = document.getElementById('modal-favorite-btn');
        const modalHeartIcon = modalFavoriteBtn.querySelector('i');
        if (favorites.some(fav => fav.paintingId === paintingId)) {
            modalHeartIcon.classList.add('favorited');
        } else {
            modalHeartIcon.classList.remove('favorited');
        }
    }
    updateSearchFavorites();
}

function showSearchPopup() {
    document.getElementById('search-popup').style.display = 'block';
}
// Function to hide the search popup
function hideSearchPopup() {
    document.getElementById('search-popup').style.display = 'none';
}

let debounceTimeout;
 function searchPaintingsByName() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const query = document.getElementById('search-input').value.toUpperCase();
        const searchResults = document.getElementById('search-results');

        searchResults.innerHTML = '';

        let favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

        const filteredPaintings = paintings.filter(painting => painting.title.toUpperCase().includes(query));
        if (filteredPaintings.length > 0) {
            filteredPaintings.forEach(painting => {
                const artElement = document.createElement('div');
                artElement.classList.add('art-item');

                // Creează elementul de artă
                artElement.innerHTML = `
                <img src="${painting.image}" alt="${painting.title}">
                <h3 style="margin-top: 2rem">${painting.title}</h3>
                <p class="clickable-artist" style="margin-top: 1rem">${painting.name}</p>
                <button class="favorite-btn" onclick="toggleFavorite(this, '${painting.paintingId}', '${painting.image}', '${painting.title}')">
                    <i class="far fa-heart" style="margin-top: 1rem; align-items: end"></i>
                </button>
            `;

                const heartIcon = artElement.querySelector('.favorite-btn i');
                if (favoritePaintings.some(fav => fav.paintingId === painting.paintingId)) {
                    heartIcon.classList.add('favorited');
                }
                else {
                    heartIcon.classList.remove('favorited');
                }

                // Afișează detaliile picturii la click
                artElement.addEventListener('click', () => {
                    showPaintingDetails(painting);
                });

                searchResults.appendChild(artElement);
            });
        } else {
            searchResults.innerHTML = '<p>No paintings found</p>';
        }

    }, 300);
}



// Funcțiile pentru afișarea detaliilor picturii și gestionarea modalului
function showPaintingDetails(art) {
    const modal = document.getElementById('painting-details-modal');
    if (!modal) return;

    document.getElementById('painting-image').src = art.image || 'placeholder.jpg';
    document.getElementById('painting-title').textContent = art.title || 'Untitled';
    document.getElementById('painting-artist').textContent = `Artist: ${art.name || 'Unknown Artist'}`;
    document.getElementById('painting-period').textContent = `Period: ${art.period}`;

    let favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    const favoriteBtn = document.getElementById('modal-favorite-btn');
    const heartIcon = favoriteBtn.querySelector('i');

    if (favoritePaintings.some(fav => fav.paintingId === art.paintingId)) {
        heartIcon.classList.add('favorited'); // Marchez butonul dacă este favorită
    } else {
        heartIcon.classList.remove('favorited'); // Elimin stilul dacă nu este favorită
    }


    favoriteBtn.onclick = function (event) {
        event.stopPropagation();
        toggleFavorite(favoriteBtn, art.paintingId, art.image, art.title);
        updateSearchFavorites();

        if (favoritePaintings.some(fav => fav.paintingId === art.paintingId)) {
            heartIcon.classList.add('favorited');
        } else {
            heartIcon.classList.remove('favorited');
        }
    };

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updateSearchFavorites() {
    const searchResults = document.getElementById('search-results');
    const favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    // Actualizează fiecare pictură din search results
    const artItems = searchResults.querySelectorAll('.art-item');
    artItems.forEach(artItem => {
        const paintingId = artItem.querySelector('button').getAttribute('onclick').match(/'([^']+)'/)[1]; // Extrage paintingId din onclick
        const heartIcon = artItem.querySelector('.favorite-btn i');

        if (favoritePaintings.some(fav => fav.paintingId === paintingId)) {
            heartIcon.classList.add('favorited');
        } else {
            heartIcon.classList.remove('favorited');
        }
    });
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
