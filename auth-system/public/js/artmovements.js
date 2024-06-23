document.addEventListener("DOMContentLoaded", () => {
    fetchArtMovements();
});

async function fetchArtMovements() {
    try {
        const response = await fetch('/api/artworks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Log the fetched data

        // Check if the data is an array and has at least one element
        if (Array.isArray(data) && data.length > 0) {
            displayArtMovementNames(data[0]);
        } else {
            console.error('Unexpected data structure:', data);
        }
    } catch (error) {
        console.error('Failed to fetch art movements', error);
    }
}

function displayArtMovementNames(data) {
    const container = document.getElementById('art-movements-container');
    container.innerHTML = ''; // Clear the container before adding new content

    const periods = Object.keys(data).slice(1); // Skip the first key
    periods.forEach(period => {
        const movementNames = document.createElement('div');
        movementNames.className = 'movement-names';

        const periodTitle = document.createElement('h2');
        periodTitle.innerText = period;
        periodTitle.onclick = () => {
            // Redirect to the page for the specific art movement
            window.location.href = `artmovement.html?name=${encodeURIComponent(period)}`;
        };
        movementNames.appendChild(periodTitle);

        container.appendChild(movementNames);
    });
}


