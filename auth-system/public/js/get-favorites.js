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


