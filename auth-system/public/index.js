let paintings = [];
let currentIndex = 0;

let currentPage = 1;
const limit = 20;
const artGrid = document.getElementById('art-grid');
const loadMoreBtn = document.getElementById('load-more-btn');
const pageNumberDisplay = document.getElementById('page-number');

document.addEventListener('DOMContentLoaded', async () => {
    await fetchPaintings();
    displayRandomPaintings();
    displayArtworks();
});


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
    data.forEach(periodData => {
        Object.keys(periodData).forEach(periodKey => {
            const period = periodData[periodKey];
            if (Array.isArray(period)) {
                period.forEach(item => {
                    const artistName = item.name || 'Unknown Artist';
                    if (item.artworks && Array.isArray(item.artworks)) {
                        item.artworks.forEach(artwork => {
                            let artworkItem = {
                                image: artwork.image || 'placeholder.jpg', // Fallback image
                                title: artwork.title || 'Untitled',
                                name: artistName,
                                period: periodKey // Asigură-te că `period` este setată corect
                            };
                            // Logăm fiecare obiect artwork pentru verificare
                            console.log('Extracted artwork item:', artworkItem);
                            artworks.push(artworkItem);
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

        const titleA = a.title.toUpperCase(); // Convertire la uppercase pentru a face sortarea case-insensitive
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

function displayRandomPaintings() {
    const slider = document.getElementById('art-slider');
    slider.innerHTML = '';

    const randomPaintings = getRandomPaintings(5);
    randomPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

        artElement.innerHTML = `
            <img src="${painting.image}" alt="${painting.title}">
            <h3>${painting.title}</h3>
            <p>${painting.name}</p>
             <button class="favorite-btn" onclick="toggleFavorite(this)">
                <i class="fas fa-heart"></i>
            </button>
        `;
        artElement.addEventListener('click', () => {
            showPaintingDetails(painting);
        });

        slider.appendChild(artElement);
    });
}


function getRandomPaintings(count) {
    if (paintings.length === 0) {
        return [];
    }
    const shuffled = paintings.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function scrollSlider(direction) {
    currentIndex += direction * 5;

    if (currentIndex < 0) {
        currentIndex = paintings.length - 5;
    } else if (currentIndex >= paintings.length) {
        currentIndex = 0;
    }

    displayRandomPaintings();
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
         <button class="favorite-btn" onclick="toggleFavorite(event, this)">
            <i class="fas fa-heart ${art.isFavorite ? 'favorited' : ''}"></i>
        </button>
    `;

    artItem.addEventListener('click', () => {
        showPaintingDetails(art);
    });

    return artItem;
}
function toggleFavorite(event, button) {
    event.stopPropagation(); // Stop the click event from propagating to parent elements
    const heartIcon = button.querySelector('i');

    if (heartIcon.classList.contains('favorited')) {
        heartIcon.classList.remove('favorited');
        const artIndex = paintings.findIndex(art => art.image === heartIcon.getAttribute('src'));
        if (artIndex !== -1) {
            paintings[artIndex].isFavorite = false;
        }
    } else {
        heartIcon.classList.add('favorited');

    }
}
async function displayArtworks() {
    sortByPaintingName();
    artGrid.innerHTML = '';
    const artworks = paintings.slice((currentPage - 1) * limit, currentPage * limit);
    artworks.forEach(art => {
        const artItem = createArtItem(art);
        artGrid.appendChild(artItem);
    });
    currentPage++;
    if (artworks.length < limit) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

async function loadMoreArtworks() {
    displayArtworks();
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

    favoriteBtn.onclick = function(event) {
        event.stopPropagation(); // Prevent the modal from closing when clicking the favorite button
        toggleFavorite(favoriteBtn);
    };


    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}
function toggleFavorite(button) {
    event.stopPropagation();
    const heartIcon = button.querySelector('i');

    if (heartIcon.classList.contains('favorited')) {
        heartIcon.classList.remove('favorited');
    } else {
        heartIcon.classList.add('favorited');
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


window.toggleFavorite = toggleFavorite;
