document.addEventListener('DOMContentLoaded', () => {
    const userId = '14';
    getFavorites(userId);
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
        displayFavoriteArtworks(favoritePaintings);
    } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
    }
}

function displayFavoriteArtworks(artworks) {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';
    artworks.forEach(artwork => {
        const artworkDiv = document.createElement('div');
        artworkDiv.classList.add('grid-art-item');
        artworkDiv.innerHTML = `
            <img src="${artwork.painting_img}" alt="${artwork.painting_name}">
            <p>${artwork.painting_name}</p>
            <button class="delete-btn" onclick="removeFavorite('${14}', '${artwork.painting_id}')"> <i class="fas fa-trash"></i> </button>
        `;
        favoritesList.appendChild(artworkDiv);
    });
}