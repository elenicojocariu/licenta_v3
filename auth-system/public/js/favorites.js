const favoritesList = document.getElementById('favorites-list');

// Mock data for favorite artworks
const favoriteArtworks = [
    {
        title: "Boy with a Floral Garland in His Hair",
        image: "https://uploads2.wikiart.org/00210/images/fayum-portrait/boy-with-a-floral-garland-in-his-hair-google-art-project.jpg",
        paintingId: "230d9d00-2082-4ef2-8521-b4ac278cbbd4"
    },
    {
        title: "Bärtiger Mann Mit Lockenfrisur",
        image: "https://uploads8.wikiart.org/00210/images/fayum-portrait/fayum-77.jpg",
        paintingId: "23049d00-2082-4ef2-8521-b4ac278cbcd4"
    },
    {
        title: "Agricultural Scene from the Tomb of Nakht, 18th Dynasty Thebes",
        image: "https://uploads8.wikiart.org/00244/images/ancient-egyptian-painting/tomb-of-nakht-harvest.jpg",
        paintingId: "23049d00-25682-4ef2-8521-b4ac278cbcd4"
    }
];

function displayFavoriteArtworks(artworks) {
    favoritesList.innerHTML = '';
    artworks.forEach(artwork => {
        const artworkDiv = document.createElement('div');
        artworkDiv.classList.add('grid-art-item');
        artworkDiv.innerHTML = `
            <img src="${artwork.image}" alt="${artwork.title}">
            <p>${artwork.title}</p>
            <button class="favorite-btn" onclick="removeFromFavorites('${artwork.paintingId}')">Remove</button>
        `;
        favoritesList.appendChild(artworkDiv);
    });
}

function removeFromFavorites(paintingId) {
    console.log(`Removed painting ${paintingId} from favorites`);
    // Here you can add your logic to remove the favorite from the database or local storage
}

displayFavoriteArtworks(favoriteArtworks);


async function getFavorites(userId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/favorites/getFavorites/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const favoritePaintings = await response.json();
        //afisez picturile cu favoritePaintings
    } else {
        const errorData = await response.json();
        alert(`Eroare: ${errorData.message}`);
    }
}