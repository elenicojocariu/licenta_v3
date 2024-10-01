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
        artworkDiv.innerHTML = `
            <img src="${artwork.painting_img}" alt="${artwork.painting_name}">
            <p>${artwork.painting_name}</p>
            <button class="delete-btn" onclick="removeFavorite('${userId}', '${artwork.painting_id}')"> <i class="fas fa-trash"></i> </button>
        `;
        favoritesList.appendChild(artworkDiv);
    });
}