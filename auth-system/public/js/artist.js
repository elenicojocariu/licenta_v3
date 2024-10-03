const artistNameElement = document.getElementById('artist-name');
const artistImageElement = document.getElementById('artist-image');
const artworksList = document.getElementById('artworks-list');
const paginationControls = document.querySelector('.pagination-controls');

let currentPage = 1;
const artworksPerPage=20;
let totalArtworks = 0;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', async () => {
    await authenticateUser();
    const artistName = getArtistNameFromURL();
    if (artistName) {
        fetchArtworksByArtist(artistName);
    } else {
        displayArtistInfo(null, 'Unknown Artist');
    }
});

function getArtistNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
}

async function fetchArtworksByArtist(artistName) {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        const artistData = extractArtworksByArtist(data, artistName);
        if (artistData) {
            displayArtistInfo(artistData.artistImage, artistName);
            displayArtworks(artistData.artworks);
        } else {
            displayArtistInfo(null, 'Unknown Artist');
        }
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

function extractArtworksByArtist(data, artistName) {
    let artworks = [];
    let artistImage = null;

    data.forEach(periodData => {
        Object.values(periodData).forEach(period => {
            if (Array.isArray(period)) {
                period.forEach(item => {
                    if (item.name === artistName) {
                        artistImage = item.image;
                        item.artworks.forEach(artwork => {
                            artworks.push({
                                title: artwork.title,
                                image: artwork.image,
                                paintingId: artwork.paintingId
                            });
                        });
                    }
                });
            }
        });
    });

    if (artworks.length > 0) {
        return {artistImage, artworks};
    } else {
        return null;
    }
}

function displayArtistInfo(artistImage, artistName) {
    artistNameElement.textContent = artistName;
    if (artistImage) {
        artistImageElement.src = artistImage;
        artistImageElement.alt = artistName;
    } else {
        artistImageElement.src = '';
        artistImageElement.alt = 'No Image Available';
    }
}

function displayArtworks(artworks) {
    artworksList.innerHTML = ''; // Golește lista de picturi existente

    artworks.forEach(artwork => {
        const isFavorite = checkIfFavorite(artwork.paintingId); // Verifică dacă pictura este favorită
        const artworkDiv = document.createElement('div');
        artworkDiv.classList.add('grid-art-item');

        artworkDiv.innerHTML = `
            <div class="art-wrapper">
                <img src="${artwork.image}" alt="${artwork.title}" loading="lazy">
                <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}"></i> <!-- Iconița de inimă -->
            </div>
            <p>${artwork.title}</p>
        `;

        // Adaugă evenimentul de click pentru iconița de inimă
        artworkDiv.querySelector('.heart-icon').addEventListener('click', (event) => {
            event.stopPropagation(); // Previne declanșarea altor evenimente
            toggleFavorite(event, artwork); // Transmite obiectul artwork
        });

        artworksList.appendChild(artworkDiv);
    });

    if (artworks.length <= 20) {
        paginationControls.style.display = 'none';
    } else {
        paginationControls.style.display = 'flex';
    }
}

function checkIfFavorite(paintingId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(favorite => favorite.painting_id === paintingId);
}

// Funcția de toggle pentru favorite
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
    } catch (error) {
        console.error('Eroare la actualizarea favoritei:', error);
        alert('A apărut o eroare. Te rugăm să încerci din nou.');
    }
}

const artistName = getArtistNameFromURL();
if (artistName) {
    fetchArtworksByArtist(artistName);
} else {
    displayArtistInfo(null, 'Unknown Artist');
}
