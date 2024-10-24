let paintings = [];
let currentIndex = 0;
let currentPage = 1;
const limit = 20;
let userId = null;
document.addEventListener('DOMContentLoaded', async () => {
    await authenticateUser();
    await fetchPaintings(currentPage, limit);
    displayRandomPaintings();
    displayRandomPaintingsReverse();
});


function displayRandomPaintings() {
    const slider = document.getElementById('art-slider');
    if (!slider) {
        console.warn('Elementul art-slider nu a fost găsit.');
        return;
    }
    slider.innerHTML = '';

    const randomPaintings = getRandomPaintings(15); // Selectăm 10 picturi random
    const favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    const loopPaintings = [...randomPaintings, ...randomPaintings];


    loopPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

        // Verificăm dacă pictura este în favorite
        const isFavorite = favoritePaintings.some(fav => fav.painting_id === painting.paintingId);

        artElement.innerHTML = `
            <div class="art-wrapper">
                <img class="lazy-image" data-src="${painting.image}" alt="${painting.title}" loading="lazy">
                <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}" data-painting-id="${painting.paintingId}"></i>
            </div>
            <h3>${painting.title}</h3>
                <p class="clickable-artist" style="margin-top: 1rem">${painting.name}</p>
        `;

        artElement.querySelector('.clickable-artist').addEventListener('click', () => {
            window.location.href = `artist.html?name=${encodeURIComponent(painting.name)}`;
        })


        // Eveniment click pentru iconița de inimă
        artElement.querySelector('.heart-icon').addEventListener('click', (event) => {
            toggleFavorite(event, painting);
        });

        slider.appendChild(artElement);
    });

    lazyLoadImages(); // Apelăm funcția pentru a încărca imaginile la scroll
}

function displayRandomPaintingsReverse() {
    const slider = document.getElementById('art-slider-reverse');
    if (!slider) {
        console.warn('Elementul art-slider nu a fost găsit.');
        return;
    }
    slider.innerHTML = '';

    const randomPaintings = getRandomPaintings(15); // Selectăm picturile random
    const favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    // Dublăm picturile pentru a crea efectul de loop infinit
    const loopPaintings = [...randomPaintings, ...randomPaintings];

    loopPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

        // Verificăm dacă pictura este în favorite
        const isFavorite = favoritePaintings.some(fav => fav.painting_id === painting.paintingId);

        artElement.innerHTML = `
            <div class="art-wrapper">
                <img class="lazy-image" data-src="${painting.image}" alt="${painting.title}" loading="lazy">
                <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}" data-painting-id="${painting.paintingId}"></i>
            </div>
            <h3>${painting.title}</h3>
            <p class="clickable-artist">${painting.name}</p>
        `;

        // Eveniment click pentru iconița de inimă
        artElement.querySelector('.heart-icon').addEventListener('click', (event) => {
            toggleFavorite(event, painting);
        });

        slider.appendChild(artElement);
    });

    lazyLoadImages(); // Apelăm funcția pentru a încărca imaginile la scroll
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

function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('img.lazy-image');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-image');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => {
            observer.observe(img);
        });
    } else {
        // Fallback pentru browserele care nu suportă IntersectionObserver
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

