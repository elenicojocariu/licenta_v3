async function fetchPaintings(currentPage, limit) {
    try {
        const response = await fetch(`/api/artworks?page=${currentPage}&limit=${limit}`);
        const data = await response.json();
        paintings = extractArtworks(data);
        paintings.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

function extractArtworks(data) {
    let artworks = [];
    let artworkImages = new Set();

    data.forEach(periodData => {
        Object.keys(periodData).forEach(periodKey => {
            const period = periodData[periodKey];
            if (Array.isArray(period)) {
                period.forEach(item => {
                    const artistName = item.name || 'Unknown Artist';
                    if (item.artworks && Array.isArray(item.artworks)) {
                        item.artworks.forEach(artwork => {
                            if (!artworkImages.has(artwork.image)) {
                                artworkImages.add(artwork.image);
                                let artworkItem = {
                                    image: artwork.image || 'placeholder.jpg', // Fallback image
                                    title: artwork.title || 'Untitled',
                                    name: artistName,
                                    period: periodKey,
                                    paintingId: artwork.paintingId, // Ensure paintingId is included
                                };
                                artworks.push(artworkItem);
                            }
                        });
                    }
                });
            }
        });
    });

    return artworks;
}

//s ar putea totusi sa am nevoie separat si pentru favorite, artist
function showPaintingDetails(art) {
    const modal = document.getElementById('painting-details-modal');
    if (!modal) return;
    document.getElementById('painting-image').src = art.image || 'placeholder.jpg';
    document.getElementById('painting-title').textContent = art.title || 'Untitled';
    document.getElementById('painting-artist').textContent = `Artist: ${art.name || 'Unknown Artist'}`;
    document.getElementById('painting-period').textContent = `Period: ${art.period}`;

    modal.setAttribute('data-painting-id', art.paintingId);

    const isFavorite = checkIfFavorite(art.paintingId);
    const heartIconModal = document.getElementById('modal-heart-icon');

    heartIconModal.classList.toggle('favorite', isFavorite);
    heartIconModal.classList.toggle('fas', isFavorite);
    heartIconModal.classList.toggle('far', !isFavorite);
    heartIconModal.setAttribute('data-favorite', isFavorite);

    heartIconModal.onclick = (event) => {
        event.stopPropagation();
        toggleFavorite(event, art);
    };

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}
