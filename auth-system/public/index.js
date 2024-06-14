let paintings = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchPaintings();
    displayPaintings();
});

async function fetchPaintings() {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        paintings = extractArtworks(data);
        console.log('Fetched paintingssss:', paintings);

    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

function extractArtworks(data) {
    let artworks = [];
    data.forEach(periodData => {
        Object.keys(periodData).forEach(periodKey => {
            const period = periodData[periodKey];
            if (Array.isArray(period)) {
                period.forEach(item => {
                    const artistName = item.name;
                    if (item.artworks && Array.isArray(item.artworks)) {
                        item.artworks.forEach(artwork => {
                            // Construct artwork object and push it to the artworks array
                            artworks.push({
                                image: artwork.image,
                                title: artwork.title,
                                name: artistName   // Fallback to 'Unknown Artist' if artist is undefined
                            });
                        });
                    }
                });

            }
        })
    });
    return artworks;
}

function displayPaintings() {
    const slider = document.getElementById('art-slider');
    slider.innerHTML = '';

    const randomPaintings = getRandomPaintings(5);
    randomPaintings.forEach(painting => {
        const artElement = document.createElement('div');
        artElement.classList.add('art-item');

        // Logging to check image URLs
        console.log('Painting image URL:', painting.image);

        // Ensure painting.image is defined
        if (painting.image) {
            artElement.innerHTML = `
            <img src="${painting.image}" alt="${painting.title}">
            <h3>${painting.title}</h3>
                        <p>${painting.name}</p>

        `;
        } else {
            console.warn('Image URL is undefined for painting:', painting);
            artElement.innerHTML = `
                <div class="placeholder-image">No Image Available</div>
                <h3>${painting.title}</h3>
                <p>${painting.name}</p>
            `;

        }
        slider.appendChild(artElement);
    });
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

    displayPaintings();
}
