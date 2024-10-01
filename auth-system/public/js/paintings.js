let paintings = [];
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

        artItem.setAttribute('data-painting-id', art.paintingId);


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
    const isFavorite = checkIfFavorite(art.paintingId); // Verifică dacă pictura este în favorite

    artItem.innerHTML = `
        <div class="art-wrapper">
            <img src="${art.image}" alt="${art.title}">
            <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}"></i> <!-- Iconița de inimă -->
        </div>
        
        <h3>${art.title}</h3>
        <p class="clickable-artist">${art.name}</p>
    `;

    artItem.querySelector('.clickable-artist').addEventListener('click', () => {
        window.location.href = `artist.html?name=${encodeURIComponent(art.name)}`;
    });

    artItem.addEventListener('click', () => {
        showPaintingDetails(art);
    });

    // Eveniment click pentru iconița de inimă
    artItem.querySelector('.heart-icon').addEventListener('click', (event) => {
        event.stopPropagation(); // Prevenim ca evenimentul să declanșeze showPaintingDetails
        toggleFavorite(event, art); // Transmit întregul obiect art
    });

    return artItem;
}
function checkIfFavorite(paintingId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(favorite => favorite.painting_id === paintingId);
}



async function toggleFavorite(event, art) {
    const heartIcon = event.target;
    const isFavorite = heartIcon.getAttribute('data-favorite') === 'true';

    if (!userId) {
        alert('Te rugăm să te autentifici pentru a adăuga la favorite.');
        return;
    }
    try {
        if (isFavorite) {
            await removeFavorite(userId, art.paintingId);
            heartIcon.classList.remove('favorite');
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
            heartIcon.setAttribute('data-favorite', 'false');
        } else {
            await addToFavorite(userId, art.paintingId, art.image, art.title);
            heartIcon.classList.add('favorite');
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            heartIcon.setAttribute('data-favorite', 'true');
        }

        // Actualizează pictura în grila principală
        const artGridItem = artGrid.querySelector(`[data-painting-id="${art.paintingId}"]`);
        if (artGridItem) {
            const gridHeartIcon = artGridItem.querySelector('.heart-icon');
            gridHeartIcon.classList.toggle('favorite', !isFavorite);
            gridHeartIcon.classList.toggle('fas', !isFavorite); // Plină dacă a fost adăugată
            gridHeartIcon.classList.toggle('far', isFavorite); // Goală dacă a fost eliminată
            gridHeartIcon.setAttribute('data-favorite', !isFavorite);
        }
    } catch (error) {
        console.error('Eroare la actualizarea favoritei:', error);
        alert('A apărut o eroare. Te rugăm să încerci din nou.');
    }
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

function showSearchPopup() {
    document.getElementById('search-popup').style.display = 'block';
}

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
                
            `;

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

    // Setează iconița de inimă
    const heartIconModal = document.getElementById('modal-heart-icon');
    const isFavorite = checkIfFavorite(art.paintingId);
    heartIconModal.classList.toggle('favorite', isFavorite);
    heartIconModal.classList.toggle('fas', isFavorite); // Iconiță plină dacă este în favorite
    heartIconModal.classList.toggle('far', !isFavorite); // Iconiță goală dacă nu este în favorite
    heartIconModal.setAttribute('data-favorite', isFavorite);

    // Adaugă funcționalitatea de click pentru inima din modal
    heartIconModal.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(event, art);
    });

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePaintingDetails() {
    document.getElementById('painting-details-modal').style.display = 'none';
    document.body.style.overflow = 'auto';

// Actualizează doar inima picturii selectate în grilă
    }

// Închid modalul la click pe fundal
window.addEventListener('click', (event) => {
    const modal = document.getElementById('painting-details-modal');
    if (event.target === modal) {
        closePaintingDetails();
    }
});


