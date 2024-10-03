let paintings = [];
let currentIndex = 0;
let currentPage=1;
const limit = 20;
let userId = null;
document.addEventListener('DOMContentLoaded', async () => {
    await authenticateUser();
    await fetchPaintings(currentPage, limit);
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
            //console.log('Token verified successfully:', data);
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


function displayRandomPaintings() {
    const slider = document.getElementById('art-slider');
    slider.innerHTML = '';

    const randomPaintings = getRandomPaintings(5);
    const favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    randomPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

        // Verificăm dacă pictura este deja în favorite
        const isFavorite = favoritePaintings.some(fav => fav.painting_id === painting.paintingId);

        artElement.innerHTML = `
            <div class="art-wrapper">
                <img src="${painting.image}" alt="${painting.title}">
                <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}" data-painting-id="${painting.paintingId}"></i>
            </div>
            <h3 style="margin-top: 2rem">${painting.title}</h3>
            <p class="clickable-artist" style="margin-top: 1rem">${painting.name}</p>
        `;

        // Eveniment click pentru iconița de inimă
        artElement.querySelector('.heart-icon').addEventListener('click', (event) => {
            toggleFavorite(event, painting);
        });

        slider.appendChild(artElement);
    });
}

async function toggleFavorite(event, painting) {
    const heartIcon = event.target;
    const isFavorite = heartIcon.getAttribute('data-favorite') === 'true';
    const paintingId = painting.paintingId;
    if (!userId) {
        alert('Te rugăm să te autentifici pentru a adăuga la favorite.');
        return;
    }
    if (isFavorite) {
        // Dacă pictura este deja în favorite, o eliminăm
        await removeFavorite(userId, paintingId);
        heartIcon.classList.remove('favorite');
        heartIcon.classList.remove('fas'); // Schimbăm la inima goală
        heartIcon.classList.add('far'); // Adăugăm clasa de inimă goală

        heartIcon.setAttribute('data-favorite', 'false');
    } else {
        // Dacă pictura nu este în favorite, o adăugăm
        await addToFavorite(userId, paintingId, painting.image, painting.title);
        heartIcon.classList.add('favorite');
        heartIcon.classList.remove('far'); // Schimbăm la inima plină
        heartIcon.classList.add('fas'); // Adăugăm clasa de inimă plină

        heartIcon.setAttribute('data-favorite', 'true');
    }
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


function checkIfFavorite(paintingId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(favorite => favorite.painting_id === paintingId);
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





