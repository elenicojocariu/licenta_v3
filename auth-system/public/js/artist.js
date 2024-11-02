const artistNameElement = document.getElementById('artist-name');
const artistImageElement = document.getElementById('artist-image');
const artworksList = document.getElementById('artworks-list');

const itemsPerPage = 20;
let currentPage = 1;
let totalPages = 1;
let currentArtworks = []; // Picturile curente pentru artistul selectat


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

    // Stocăm picturile și calculăm numărul de pagini
    currentArtworks = artworks;
    totalPages = Math.ceil(artworks.length / itemsPerPage);

    // Calculăm indexul de început și de sfârșit pentru pagina curentă
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const paginatedArtworks = artworks.slice(start, end);

    paginatedArtworks.forEach(artwork => {
        const isFavorite = checkIfFavorite(artwork.paintingId); // Verifică dacă pictura este favorită
        const artworkDiv = document.createElement('div');
        artworkDiv.classList.add('grid-art-item');

        artworkDiv.innerHTML = `
            <div class="art-wrapper">
                <img data-src="${artwork.image}" alt="${artwork.title}" class="lazy-image">
                <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}"></i>
            </div>
            <p>${artwork.title}</p>
        `;

        artworkDiv.addEventListener('click', () =>{
            openModal(artwork.image, artwork.title);
        })

        artworkDiv.querySelector('.heart-icon').addEventListener('click', (event) => {
            event.stopPropagation();
            toggleFavorite(event, artwork);
        });

        artworksList.appendChild(artworkDiv);
    });

    updatePaginationControls();
    lazyLoadImages()
}
function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src'); // Încarcă imaginea
                img.removeAttribute('data-src'); // Elimină atributul după încărcare
                observer.unobserve(img); // Oprim observarea imaginii încărcate
            }
        });
    });

    lazyImages.forEach(img => {
        observer.observe(img); // Începem observarea fiecărei imagini
    });
}
function openModal(imageUrl, title){
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');

    modalImage.src = imageUrl;
    modalTitle.textContent = title;

    modal.style.display = 'block';
}
function closeModal(){
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
}
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('image-modal');
    const closeButton = document.querySelector('.close-button');

    // Închide modalul când se apasă pe butonul 'x'
    closeButton.addEventListener('click', closeModal);

    // Închide modalul când utilizatorul face click în afara conținutului modalului
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
});

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayArtworks(currentArtworks);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        displayArtworks(currentArtworks);
    }
}

function updatePaginationControls() {
    const previousBtn = document.getElementById('previous-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageNumberElement = document.getElementById('page-number');

    // Actualizează numărul paginii
    pageNumberElement.textContent = currentPage;

    // Ascunde butonul "Previous" dacă suntem pe prima pagină
    if (currentPage === 1) {
        previousBtn.style.display = 'none';
    } else {
        previousBtn.style.display = 'block';
    }

    // Ascunde butonul "Next" dacă suntem pe ultima pagină
    if (currentPage >= totalPages || totalPages <= 1) {
        nextBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'block';
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
