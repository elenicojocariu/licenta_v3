let paintings = [];
let currentPage = 1;
const limit = 20;
const artGrid = document.getElementById('art-grid');
const previousBtn = document.getElementById('previous-btn');
const nextBtn = document.getElementById('next-btn');
const pageNumberDisplay = document.getElementById('page-number');
let userId = null;
document.addEventListener('DOMContentLoaded', async () => {
    await authenticateUser();

    await fetchPaintings(currentPage, limit);

    displayArtworks();
    updatePaginationControls();

});


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




function displayArtworks() {
    sortByPaintingName();
    artGrid.innerHTML = ''; // Curăță grid-ul

    const fragment = document.createDocumentFragment(); // Creează un fragment în memorie

    const artworks = paintings.slice((currentPage - 1) * limit, currentPage * limit);
    artworks.forEach(art => {
        const artItem = createArtItem(art);
        fragment.appendChild(artItem);
    });

    artGrid.appendChild(fragment); // Adaugă tot fragmentul în DOM odată

    updatePaginationControls();
}


function sortByPaintingName() {
    paintings.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));
}

function createArtItem(art) {
    const artItem = document.createElement('div');
    artItem.classList.add('grid-art-item');
    artItem.setAttribute('data-painting-id', art.paintingId); // Atribuie un ID unic

    const isFavorite = checkIfFavorite(art.paintingId); // Verifică dacă pictura este în favorite

    artItem.innerHTML = `
        <div class="art-wrapper">
            <img src="${art.image}" alt="${art.title}" loading="lazy">
            <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}"></i>
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

    artItem.querySelector('.heart-icon').addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(event, art);
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

        // Actualizează iconița corespunzătoare din grid (dacă există)
        const gridHeartIcon = document.querySelector(`.grid-art-item[data-painting-id="${art.paintingId}"] .heart-icon`);
        if (gridHeartIcon) {
            gridHeartIcon.classList.toggle('favorite', !isFavorite);
            gridHeartIcon.classList.toggle('fas', !isFavorite);
            gridHeartIcon.classList.toggle('far', isFavorite);
            gridHeartIcon.setAttribute('data-favorite', !isFavorite);
        }

    } catch (error) {
        console.error('Eroare la actualizarea favoritei:', error);
        alert('A apărut o eroare. Te rugăm să încerci din nou.');
    }
}

function updatePaginationControls() {
    pageNumberDisplay.textContent = `Page ${currentPage}`;
    previousBtn.style.display = currentPage === 1 ? 'none' : 'inline-block';
    nextBtn.style.display = (currentPage * limit >= paintings.length) ? 'none' : 'inline-block';
}

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

                artElement.innerHTML = `
                <img src="${painting.image}" alt="${painting.title}" loading="lazy">
                <h3 style="margin-top: 2rem">${painting.title}</h3>
                <p class="clickable-artist" style="margin-top: 1rem">${painting.name}</p>
                
            `;

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




function closePaintingDetails() {
    document.getElementById('painting-details-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
 }

window.addEventListener('click', (event) => {
    const modal = document.getElementById('painting-details-modal');
    if (event.target === modal) {
        closePaintingDetails();
    }
});


