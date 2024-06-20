let paintings = [];
let currentIndex = 0;

let currentPage = 1;
const limit = 20;
const artGrid = document.getElementById('art-grid');
const previousBtn = document.getElementById('previous-btn');
const nextBtn = document.getElementById('next-btn');
const pageNumberDisplay = document.getElementById('page-number');

let userId = null;
document.addEventListener('DOMContentLoaded', async () => {
    await authenticateUser();
    await fetchPaintings();
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
        console.log('Sending request to verify token...');
        const response = await fetch('http://localhost:5000/auth/verifyToken', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Token verified successfully:', data);
            userId = data.userId;
        } else {
            const errorData = await response.json();
            console.error('Token verification failed:', errorData);
            throw new Error('Token invalid');
        }
    } catch (error) {
        console.error('Error during token verification:', error);
        alert('Autentificarea a eșuat, te rugăm să te autentifici din nou.');
        localStorage.removeItem('token');
        window.location.href = 'http://localhost:5000/login';
    }
}

async function fetchPaintings() {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        paintings = extractArtworks(data);
        // Sort paintings by title alphabetically by default
        paintings.sort((a, b) => {
            const titleA = a.title.toUpperCase();
            const titleB = b.title.toUpperCase();
            if (titleA < titleB) return -1;
            if (titleA > titleB) return 1;
            return 0;
        });
        console.log('Fetched and sorted paintings:', paintings);

    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

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
                                let artworkItem = {
                                    image: artwork.image || 'placeholder.jpg', // Fallback image
                                    title: artwork.title || 'Untitled',
                                    name: artistName,
                                    period: periodKey,
                                    paintingId: artwork.paintingId, // Ensure paintingId is included
                                };
                                artworks.push(artworkItem);
                            }
                        });
                    }
                });
            }
        });
    });

    return artworks;
}

function sortByPaintingName() {
    paintings.sort((a, b) => {

        const titleA = a.title.toUpperCase();
        const titleB = b.title.toUpperCase();
        if (titleA < titleB) {
            return -1;
        }
        if (titleA > titleB) {
            return 1;
        }
        return 0;
    });


}


function createArtItem(art) {
    //console.log('Creating art item:', art);

    const artItem = document.createElement('div');
    artItem.classList.add('grid-art-item');

    artItem.innerHTML = `
        <img src="${art.image || 'placeholder.jpg'}" alt="${art.title || 'Untitled'}">
        <h3>${art.title || 'Untitled'}</h3>
        <p>${art.name || 'Unknown Artist'}</p>
        <!--<p>${art.period}</p> -->
        <button class="favorite-btn" onclick="toggleFavorite(this, '${art.paintingId}')"><i class="far fa-heart"></i></button>

    `;

    artItem.addEventListener('click', () => {
        showPaintingDetails(art);
    });

    return artItem;
}

async function displayArtworks() {
    sortByPaintingName();
    artGrid.innerHTML = '';
    const artworks = paintings.slice((currentPage - 1) * limit, currentPage * limit);
    artworks.forEach(art => {
        const artItem = createArtItem(art);
        artGrid.appendChild(artItem);
    });
    updatePaginationControls();

}

function updatePaginationControls() {
    pageNumberDisplay.textContent = `Page ${currentPage}`;
    pageNumberDisplay.style.display = currentPage === 1 ? 'none' : 'inline-block';
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


window.addEventListener('DOMContentLoaded', (event) => {
    displayArtworks();
});

// Function to show the search popup
function showSearchPopup() {
    document.getElementById('search-popup').style.display = 'block';
}

// Function to hide the search popup
function hideSearchPopup() {
    document.getElementById('search-popup').style.display = 'none';
}

// Function to search paintings by name
function searchPaintingsByName() {
    const query = document.getElementById('search-input').value.toUpperCase();
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';

    const filteredPaintings = paintings.filter(painting => painting.title.toUpperCase().includes(query));

    if (filteredPaintings.length > 0) {
        filteredPaintings.forEach(painting => {
            const artElement = createArtItem(painting);
            searchResults.appendChild(artElement);
        });
    } else {
        searchResults.innerHTML = '<p>No paintings found</p>';
    }
}


function showPaintingDetails(art) {
    //console.log('Selected art details:', art);

    const modal = document.getElementById('painting-details-modal');
    if (!modal) {
        console.error('Modal element not found.');
        return;
    }
    const paintingImage = document.getElementById('painting-image');
    const paintingTitle = document.getElementById('painting-title');
    const paintingArtist = document.getElementById('painting-artist');
    const paintingPeriod = document.getElementById('painting-period');
    const favoriteBtn = document.getElementById('modal-favorite-btn');

    paintingImage.src = art.image || 'placeholder.jpg';
    paintingTitle.textContent = art.title || 'Untitled';
    paintingArtist.textContent = `Artist: ${art.name || 'Unknown Artist'}`;
    paintingPeriod.textContent = `Period: ${art.period}`;

    // Reset favorite button state
    const heartIcon = favoriteBtn.querySelector('i');
    heartIcon.classList.remove('favorited');

    favoriteBtn.onclick = function (event) {
        event.stopPropagation();
        toggleFavorite(favoriteBtn, art.paintingId);
    };


    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function toggleFavorite(button, paintingId) {
    event.stopPropagation();
    const heartIcon = button.querySelector('i');

    if (heartIcon.classList.contains('favorited')) {
        heartIcon.classList.remove('favorited');
        removeFavorite(userId, paintingId);

    } else {
        heartIcon.classList.add('favorited');
        addFavorite(userId, paintingId);

    }
}

function closePaintingDetails() {
    const modal = document.getElementById('painting-details-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable background scrolling
}

window.addEventListener('click', (event) => {
    const modal = document.getElementById('painting-details-modal');

    if (event.target === modal) {
        closePaintingDetails();
    }
});


async function addFavorite(userId, paintingId) {
    const token = localStorage.getItem('token');

    console.log("token for postman: ", token);
    try {
        const response = await fetch('http://localhost:5000/favorites/addFavorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({userId, paintingId})
        });

        if (response.ok) {
            alert('Pictura adăugată la favorite cu succes!');
        } else {
            // Try to parse JSON response
            try {
                const errorData = await response.json();
                alert(`Eroare: ${errorData.message}`);
            } catch (jsonError) {
                // Handle non-JSON response
                const text = await response.text();
                console.error('Non-JSON error response:', text);
                alert(`Eroare: ${response.status} ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('Error adding favorite:', error);
        alert('A apărut o eroare la adăugarea picturii la favorite.');
    }
}
/*
async function getFavorites(userId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/favorites/getFavorites/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const favoritePaintings = await response.json();
        //afisez picturile cu favoritePaintings
    } else {
        const errorData = await response.json();
        alert(`Eroare: ${errorData.message}`);
    }
} */

async function removeFavorite(userId, paintingId) {
    const token = localStorage.getItem('token');
    const response = await fetch('/favorites/removeFavorite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({userId, paintingId})
    });

    if (response.ok) {
        alert('Pictura a fost ștearsă din favorite cu succes!');
    } else {
        const errorData = await response.json();
        alert(`Eroare: ${errorData.message}`);
    }
}


window.toggleFavorite = toggleFavorite;

let menuContainer = document.getElementById("Menu_Container");
function menu() {
    if (menuContainer.style.visibility === "hidden") {
        menuContainer.style.animationName = "OpenMenu";
        menuContainer.style.visibility = "visible";
    } else if (menuContainer.style.visibility === "visible") {
        menuContainer.style.animationName = "CloseMenu";
        menuContainer.style.visibility = "hidden";
    }

}