let paintings = [];
let currentIndex = 0;


let userId = null;
document.addEventListener('DOMContentLoaded', async () => {
    await authenticateUser();
    await fetchPaintings();
    displayRandomPaintings();
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

function displayRandomPaintings() {
    const slider = document.getElementById('art-slider');
    slider.innerHTML = '';

    let favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];


    const randomPaintings = getRandomPaintings(5);
    randomPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

        artElement.setAttribute('data-painting-id', painting.paintingId);


        artElement.innerHTML = `
            <img src="${painting.image}" alt="${painting.title}">
            <h3 style="margin-top: 2rem">${painting.title}</h3>
            <p class="clickable-artist" style="margin-top: 1rem" >${painting.name}</p>
            <button class="favorite-btn" onclick="toggleFavorite(this, '${painting.paintingId}', '${painting.image}', '${painting.title}')">
                <i class="far fa-heart" style="margin-top: 1rem; align-items: end"></i>
            </button>

        `;

        const heartIcon = artElement.querySelector('.favorite-btn i');
        if (favoritePaintings.some(fav => fav.paintingId === painting.paintingId)) {
            heartIcon.classList.add('favorited'); // Adaug clasa `favorited` dacă este în favorite
        }

        artElement.querySelector('.clickable-artist').addEventListener('click', () => {
            window.location.href = `artist.html?name=${encodeURIComponent(painting.name)}`;
        });

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
    const heartIcon = favoriteBtn.querySelector('i');

    paintingImage.src = art.image || 'placeholder.jpg';
    paintingTitle.textContent = art.title || 'Untitled';
    paintingArtist.textContent = `Artist: ${art.name || 'Unknown Artist'}`;
    paintingPeriod.textContent = `Period: ${art.period}`;

    let favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favoritePaintings.some(fav => fav.paintingId === art.paintingId)) {
        heartIcon.classList.add('favorited'); // Marchez butonul dacă este favorită
    } else {
        heartIcon.classList.remove('favorited'); // Elimin stilul dacă nu este favorită
    }

    favoriteBtn.onclick = function (event) {
        event.stopPropagation();
        toggleFavorite(favoriteBtn, art.paintingId, art.image, art.title);
    };


    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function toggleFavorite(button, paintingId, painting_img, painting_name) {
    event.stopPropagation();
    const heartIcon = button.querySelector('i');

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];


    if (heartIcon.classList.contains('favorited')) {
        heartIcon.classList.remove('favorited');
        favorites = favorites.filter(fav => fav.paintingId !== paintingId);
        removeFavorite(userId, paintingId);

    } else {
        heartIcon.classList.add('favorited');
        favorites.push({ paintingId, painting_img, painting_name });

        addToFavorite(userId, paintingId, painting_img, painting_name);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));

    const homepagePainting = document.querySelector(`[data-painting-id='${paintingId}']`);
    if (homepagePainting) {
        const homepageHeartIcon = homepagePainting.querySelector('.favorite-btn i');
        if (favorites.some(fav => fav.paintingId === paintingId)) {
            homepageHeartIcon.classList.add('favorited');
        } else {
            homepageHeartIcon.classList.remove('favorited');
        }
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


