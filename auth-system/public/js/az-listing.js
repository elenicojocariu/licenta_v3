const artistsList = document.getElementById('artists-list');
const pageNumberElement = document.getElementById('page-number');
const itemsPerPage = 20;
let currentPage = 1;
let artists = [];

async function fetchArtists() {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        artists = extractArtists(data);
        artists.sort((a, b) => a.name.localeCompare(b.name)); // Sort artists alphabetically by name
        displayArtists();
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

function extractArtists(data) {
    let artists = [];
    let artistNames = new Set();

    data.forEach(periodData => {
        Object.values(periodData).forEach(period => {
            if (Array.isArray(period)) {
                period.forEach(item => {
                    let artistName = item.name || 'Unknown Artist';
                    if (!artistNames.has(artistName)) {
                        artistNames.add(artistName);
                        let artist = {
                            name: artistName,
                            image: item.image || 'placeholder.jpg' // Fallback image
                        };
                        artists.push(artist);
                    }
                });
            }
        });
    });

    return artists;
}

function displayArtists() {
    artistsList.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedArtists = artists.slice(start, end);

    paginatedArtists.forEach(artist => {
        const artistDiv = document.createElement('div');
        artistDiv.classList.add('artist');
        artistDiv.innerHTML = `
            <a href="artist.html?name=${encodeURIComponent(artist.name)}">
                <img src="${artist.image}" alt="${artist.name}">
                <p>${artist.name}</p>
            </a>
        `;
        artistsList.appendChild(artistDiv);
    });

    pageNumberElement.textContent = currentPage;
}

function nextPage() {
    if (currentPage * itemsPerPage < artists.length) {
        currentPage++;
        displayArtists();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayArtists();
    }
}

fetchArtists();

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