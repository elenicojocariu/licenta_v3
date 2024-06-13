document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();

        console.log('Fetched data:', data); // Log the data to see its structure

        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            const periodsData = data[0];
            const artContainer = document.getElementById('art-container');

            Object.keys(periodsData).forEach(periodKey => {
                const periods = periodsData[periodKey];
                if (Array.isArray(periods)) {
                    periods.forEach(period => {
                        if (period.artworks && Array.isArray(period.artworks)) {
                            period.artworks.forEach(artwork => {
                                const artElement = document.createElement('div');
                                artElement.classList.add('art-item');
                                artElement.innerHTML = `
                                    <img src="${artwork.image}" alt="${artwork.title}">
                                    <h3>${artwork.title}</h3>
                                `;
                                artContainer.appendChild(artElement);
                            });
                        } else {
                            console.error('Unexpected period structure:', period);
                        }
                    });
                } else {
                    console.log(`Skipping non-array key: ${periodKey}`);
                }
            });
        } else {
            console.error('Unexpected data structure:', data);
        }
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
});
