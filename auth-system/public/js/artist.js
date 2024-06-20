const artistNameElement = document.getElementById('artist-name');
const artworksList = document.getElementById('artworks-list');

function getArtistNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
}

async function fetchArtworksByArtist(artistName) {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        const artworks = extractArtworksByArtist(data, artistName);
        displayArtworks(artworks);
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

function extractArtworksByArtist(data, artistName) {
    let artworks = [];

    data.forEach(periodData => {
        Object.values(periodData).forEach(period => {
            if (Array.isArray(period)) {
                period.forEach(item => {
                    if (item.name === artistName) {
                        item.artworks.forEach(artwork => {
                            artworks.push({
                                title: artwork.title,
                                image: artwork.image,
                                paintingId: artwork.paintingId
                            });
                        });
                    }
                });
            }
        });
    });

    return artworks;
}

function displayArtworks(artworks) {
    artworksList.innerHTML = ''; // Clear the previous artworks
    artworks.forEach(artwork => {
        const artworkDiv = document.createElement('div');
        artworkDiv.classList.add('grid-art-item');
        artworkDiv.innerHTML = `
            <img src="${artwork.image}" alt="${artwork.title}">
            <p>${artwork.title}</p>
        `;
        artworksList.appendChild(artworkDiv);
    });
    if (artworks.length <= 20) {
        paginationControls.style.display = 'none';
    } else {
        paginationControls.style.display = 'flex';
    }
}



const artistName = getArtistNameFromURL();
if (artistName) {
    artistNameElement.textContent = artistName;
    fetchArtworksByArtist(artistName);
} else {
    artistNameElement.textContent = 'Unknown Artist';
}

let menuContainer = document.getElementById("Menu_Container");
function menu() {
    if (menuContainer.style.visibility === "hidden") {
        menuContainer.style.animationName = "OpenMenu";
        menuContainer.style.visibility = "visible";
    } else if (menuContainer.style.visibility === "visible") {
        menuContainer.style.animationName = "CloseMenu";
        menuContainer.style.visibility = "hidden";
    }

}