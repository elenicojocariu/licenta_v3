document.addEventListener('DOMContentLoaded', () => {
    //const userId = '14';
    const userId = localStorage.getItem('userId');
    if (userId) {
        getFavorites(userId);
    }
    else {
        alert('Eroare: UserId nu este definit.');

    }
});

async function getFavorites(userId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/favorite/getFavorites/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (response.ok) {
        const favoritePaintings = await response.json();

        localStorage.setItem('favorites', JSON.stringify(favoritePaintings))
        displayFavoriteArtworks(favoritePaintings, userId);

    } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
    }
}

function displayFavoriteArtworks(artworks, userId) {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) {
        console.log('Elementul "favorites-list" nu se foloseste in aceasta pagina.');
        return;
    }
    favoritesList.innerHTML = '';

    artworks.forEach(artwork => {
        const artworkDiv = document.createElement('div');
        artworkDiv.classList.add('grid-art-item');
        artworkDiv.setAttribute('data-painting-id', artwork.painting_id); // Atribui id-ul picturii
        artworkDiv.innerHTML = `
            <img src="${artwork.painting_img}" alt="${artwork.painting_name}" class="favorite-image" data-title="${artwork.painting_name}" data-img="${artwork.painting_img}">
            <p>${artwork.painting_name}</p>
            
            <button class="delete-btn" onclick="removeFavoriteFromFavoritesPage('${userId}', '${artwork.painting_id}')"> 
                <i class="fas fa-trash"></i> 
            </button>
        `;
        favoritesList.appendChild(artworkDiv);
    });

    // Adaugă un event listener pentru a deschide modalul
    const favoriteImages = document.querySelectorAll('.favorite-image');
    favoriteImages.forEach(image => {
        image.addEventListener('click', () => {
            const modal = document.getElementById('image-modal');
            const modalImage = document.getElementById('modal-image');
            const modalTitle = document.getElementById('modal-title');

            modalImage.src = image.dataset.img; // Setează sursa imaginii în modal
            modalTitle.textContent = image.dataset.title; // Setează numele picturii în modal
            modal.style.display = 'flex'; // Arată modalul

        });
    });
    // Adaugă event listener pentru a închide modalul când utilizatorul apasă pe butonul de închidere
    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.getElementById('image-modal').style.display = 'none';
    });

    // Închide modalul când utilizatorul face clic în afara modalului
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('image-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Adaugă un event listener pentru imaginea din modal pentru a face zoom in/out
document.addEventListener('DOMContentLoaded', () => {
    const modalImage = document.getElementById('modal-image');

    modalImage.addEventListener('click', () => {
        if (!modalImage.classList.contains('zoomed')) {
            modalImage.classList.add('zoomed'); // Adaugă clasa de zoom
        } else {
            modalImage.classList.remove('zoomed'); // Scoate clasa de zoom pentru a reveni la dimensiunea originală
        }
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const modalImage = document.getElementById('modal-image');
    const modalImageContainer = modalImage.parentElement;

    const zoomResult = document.createElement('div');
    zoomResult.classList.add('zoom-result');
    modalImageContainer.appendChild(zoomResult);

    let isZoomed = false;
    let zoomScaleX, zoomScaleY;
    const zoomFactor = 1.1;

    modalImage.addEventListener('click', () => {
        if (!isZoomed) {
            modalImage.classList.add('zoomed');

            const rect = modalImage.getBoundingClientRect();
            zoomScaleX = modalImage.naturalWidth / rect.width;
            zoomScaleY = modalImage.naturalHeight / rect.height;

            isZoomed = true;
        } else {
            modalImage.classList.remove('zoomed');
            zoomResult.style.display = 'none';
            isZoomed = false;
        }
    });

    modalImage.addEventListener('mousemove', (e) => {
        if (isZoomed) {
            zoomResult.style.display = 'block';

            const rect = modalImage.getBoundingClientRect();

            let x = (e.clientX - rect.left) * zoomScaleX;
            let y = (e.clientY - rect.top) * zoomScaleY;

            x = Math.max(0, Math.min(x, modalImage.naturalWidth));
            y = Math.max(0, Math.min(y, modalImage.naturalHeight));

            // Ajustează poziția imaginii mărite în funcție de cursor
            const backgroundPosX = x - (zoomResult.offsetWidth / 2);
            const backgroundPosY = y - (zoomResult.offsetHeight / 2);

            // Setează imaginea de fundal cu factor de zoom suplimentar
            zoomResult.style.backgroundImage = `url(${modalImage.src})`;
            zoomResult.style.backgroundPosition = `-${backgroundPosX}px -${backgroundPosY}px`;
            zoomResult.style.backgroundSize = `${modalImage.naturalWidth * zoomFactor}px ${modalImage.naturalHeight * zoomFactor}px`;
        }
    });

    modalImage.addEventListener('mouseleave', () => {
        zoomResult.style.display = 'none';
    });
});












