let paintings = [];
let currentIndex = 0;

let currentPage = 1;
const limit = 20;
const artGrid = document.getElementById('art-grid');
const loadMoreBtn = document.getElementById('load-more-btn');

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
        console.log('Fetched paintings:', paintings);
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
                            artworks.push({
                                image: artwork.image || 'placeholder.jpg', // Fallback image
                                title: artwork.title || 'Untitled',
                                name: artistName
                            });
                        });
                    }
                });
            }
        });
    });
    return artworks;
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
        `;
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
    const artItem = document.createElement('div');
    artItem.classList.add('grid-art-item');
    //artItem.className = 'grid-art-item';

    artItem.innerHTML = `
        <img src="${art.image || 'placeholder.jpg'}" alt="${art.title || 'Untitled'}">
        <h3>${art.title || 'Untitled'}</h3>
        <p>${art.name || 'Unknown Artist'}</p>
    `;
    return artItem;
}

async function displayArtworks() {
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
omNavbar = document.querySelector('.bottom-navbar');
