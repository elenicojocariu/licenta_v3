const artistNameElement = document.getElementById('artist-name');
const artistImageElement = document.getElementById('artist-image');
const artworksList = document.getElementById('artworks-list');
const paginationControls = document.querySelector('.pagination-controls');

function getArtistNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
}

async function fetchArtworksByArtist(artistName) {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        const artistData = extractArtworksByArtist(data, artistName);
        if (artistData) {
            displayArtistInfo(artistData.artistImage, artistName);
            displayArtworks(artistData.artworks);
        } else {
            displayArtistInfo(null, 'Unknown Artist');
        }
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

function extractArtworksByArtist(data, artistName) {
    let artworks = [];
    let artistImage = null;

    data.forEach(periodData => {
        Object.values(periodData).forEach(period => {
            if (Array.isArray(period)) {
                period.forEach(item => {
                    if (item.name === artistName) {
                        artistImage = item.image;
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

    if (artworks.length > 0) {
        return { artistImage, artworks };
    } else {
        return null;
    }
}

function displayArtistInfo(artistImage, artistName) {
    artistNameElement.textContent = artistName;
    if (artistImage) {
        artistImageElement.src = artistImage;
        artistImageElement.alt = artistName;
    } else {
        artistImageElement.src = '';
        artistImageElement.alt = 'No Image Available';
    }
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
    fetchArtworksByArtist(artistName);
} else {
    displayArtistInfo(null, 'Unknown Artist');
}
