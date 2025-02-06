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
        console.warn('Element art-slider not found.');
        return;
    }
    slider.innerHTML = ''; //golesc

    const randomPaintings = getRandomPaintings(15);
    const favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    const loopPaintings = [...randomPaintings, ...randomPaintings];


    loopPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

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


        artElement.querySelector('.heart-icon').addEventListener('click', (event) => {
            toggleFavorite(event, painting);
        });

        slider.appendChild(artElement);
    });

    lazyLoadImages(); // pt a incarca imaginile la scroll
}

function displayRandomPaintingsReverse() {
    const slider = document.getElementById('art-slider-reverse');
    if (!slider) {
        console.warn('Element art-slider not found.');
        return;
    }
    slider.innerHTML = '';

    const randomPaintings = getRandomPaintings(15);
    const favoritePaintings = JSON.parse(localStorage.getItem('favorites')) || [];

    //loop infinit
    const loopPaintings = [...randomPaintings, ...randomPaintings];

    loopPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

        const isFavorite = favoritePaintings.some(fav => fav.painting_id === painting.paintingId);

        artElement.innerHTML = `
            <div class="art-wrapper">
                <img class="lazy-image" data-src="${painting.image}" alt="${painting.title}" loading="lazy">
                <i class="far fa-heart heart-icon ${isFavorite ? 'fas favorite' : 'far'}" data-favorite="${isFavorite}" data-painting-id="${painting.paintingId}"></i>
            </div>
            <h3>${painting.title}</h3>
            <p class="clickable-artist">${painting.name}</p>
        `;

        artElement.querySelector('.heart-icon').addEventListener('click', (event) => {
            toggleFavorite(event, painting);
        });

        slider.appendChild(artElement);
    });

    lazyLoadImages();
}

async function toggleFavorite(event, painting) {
    const heartIcon = event.target;
    const isFavorite = heartIcon.getAttribute('data-favorite') === 'true';
    const paintingId = painting.paintingId;
    if (!userId) {
        alert('Please login.');
        return;
    }
    //daca e deja la fav o elimin
    if (isFavorite) {
        await removeFavorite(userId, paintingId);
        heartIcon.classList.remove('favorite');
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far'); //far-clasa inima goala,fas inima plina

        heartIcon.setAttribute('data-favorite', 'false');
    } else {
        // daca nu e o adaug la fav
        await addToFavorite(userId, paintingId, painting.image, painting.title);
        heartIcon.classList.add('favorite');
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');

        heartIcon.setAttribute('data-favorite', 'true');
    }
}


function getRandomPaintings(count) {
    if (paintings.length === 0) {
        return [];
    }
    const shuffledPaintings = paintings.sort(() => 0.5 - Math.random());
    return shuffledPaintings.slice(0, count);
}




function checkIfFavorite(paintingId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(favorite => favorite.painting_id === paintingId);
}

function closePaintingDetails() {
    const modal = document.getElementById('painting-details-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
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
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

