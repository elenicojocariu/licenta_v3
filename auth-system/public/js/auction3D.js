document.addEventListener('DOMContentLoaded', function () {
    // Funcție utilitară pentru conversia radianilor în grade
    function radToDeg(rad) {
        return rad * (180 / Math.PI);
    }

    // Ascunde ecranul de încărcare când scena este complet încărcată
    const loadingScreen = document.getElementById('loading');
    document.querySelector('a-scene').addEventListener('loaded', function () {
        loadingScreen.style.display = 'none';
    });

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to view the 3D auctions.');
        window.location.href = '/login.html'; // Redirect to login page
        return;
    }

    // Fetch auction paintings and add them to the scene
    fetch('/auction/auctions', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (response.status === 401) {
                alert('Unauthorized. Please log in.');
                window.location.href = '/login.html'; // Redirect to login page
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.json();
        })
        .then(auctions => {
            console.log('Auctions data:', auctions); // Log the entire auctions array

            if (!Array.isArray(auctions)) {
                throw new TypeError('Expected an array of auctions');
            }

            const assets = document.querySelector('a-assets');
            const paintingsEntity = document.getElementById('paintings');

            const radius = 4; // Raza cercului ajustată pentru a fi mai apropiat
            const totalPaintings = auctions.length;
            if (totalPaintings === 0) {
                console.warn('No paintings available to display.');
                return;
            }

            const angleStep = (2 * Math.PI) / totalPaintings; // Pasul unghiular

            auctions.forEach((auction, index) => {
                const paintingUrl = `/uploads-paintings/${auction.painting_pic || 'placeholder.jpg'}`;

                // Adaugă imaginea în assets
                const img = document.createElement('img');
                img.setAttribute('id', `painting-${auction.id_painting}`);
                img.setAttribute('src', paintingUrl);
                assets.appendChild(img);

                // Calculează poziția pe cerc
                const angle = index * angleStep;
                const x = radius * Math.sin(angle);
                const z = radius * Math.cos(angle);

                // Creează un grup pentru fiecare pictură (pictură + ramă + text)
                const paintingGroup = document.createElement('a-entity');
                paintingGroup.setAttribute('position', `${x} 2 ${z}`);
                paintingGroup.setAttribute('rotation', `0 ${radToDeg(angle) + 180} 0`); // Rotește spre centru
                paintingsEntity.appendChild(paintingGroup);

                // Creează o plană pentru a afișa pictura
                const paintingEntity = document.createElement('a-plane');
                paintingEntity.setAttribute('src', `#painting-${auction.id_painting}`);
                //paintingEntity.setAttribute('position', `0 0 0`);
                //paintingEntity.setAttribute('rotation', `0 0 0`);
                paintingEntity.setAttribute('width', '2');
                paintingEntity.setAttribute('height', '2');
                paintingEntity.setAttribute('shadow', 'cast: true');
                paintingEntity.setAttribute('material', 'roughness: 0.7; metalness: 0.3');
                paintingEntity.setAttribute('look-at', '[camera]'); // Folosește componenta look-at

                // Adaugă titlul și numele artistului sub pictură
                const textEntity = document.createElement('a-text');
                textEntity.setAttribute('value', `${auction.painting_name || 'Untitled'} by ${auction.artist_name || 'Unknown'}`);
                textEntity.setAttribute('align', 'center');
                textEntity.setAttribute('position', `0 -0.7 0.5`); // Relativ la pictură
                textEntity.setAttribute('width', '3');
                textEntity.setAttribute('color', '#eac31d');
                textEntity.setAttribute('font', 'https://cdn.aframe.io/fonts/Roboto-msdf.json');

                //backing plate
                const backingPlate = document.createElement('a-box');

                backingPlate.setAttribute('position', `0 0 -0.05`); // Poziționează-l foarte aproape în spate
                backingPlate.setAttribute('width', '2.1'); // Dimensiuni puțin mai mari decât tabloul
                backingPlate.setAttribute('height', '2.1');
                backingPlate.setAttribute('depth', '0.01'); // Grosime mică pentru backing plate
                backingPlate.setAttribute('color', '#703b15'); // Culoarea "backing plate"-ului

                // Creează cadrul picturii
                const frameGroup = document.createElement('a-entity');

                // Top Frame
                const frameTop = document.createElement('a-box');
                frameTop.setAttribute('position', `0 1.1 0`);  // Deasupra picturii
                frameTop.setAttribute('width', '2.2');
                frameTop.setAttribute('height', '0.2');
                frameTop.setAttribute('depth', '0.2');
                frameTop.setAttribute('color', '#8B4513');
                frameTop.setAttribute('src', '#woodTexture');
                frameTop.setAttribute('shadow', 'cast: true');

                // Bottom Frame
                const frameBottom = document.createElement('a-box');
                frameBottom.setAttribute('position', `0 -1 0`);  // Sub pictură
                frameBottom.setAttribute('width', '2.4');
                frameBottom.setAttribute('height', '0.2');
                frameBottom.setAttribute('depth', '0.2'); // Corectat: depth set pe frameBottom
                frameBottom.setAttribute('color', '#8B4513');
                frameBottom.setAttribute('src', '#woodTexture');
                frameBottom.setAttribute('shadow', 'cast: true');

                // Left Frame
                const frameLeft = document.createElement('a-box');
                frameLeft.setAttribute('position', `-1.1 0 0`);  // Stânga picturii
                frameLeft.setAttribute('width', '0.2');
                frameLeft.setAttribute('height', '2.4');
                frameLeft.setAttribute('depth', '0.2'); // Corectat: depth set pe frameLeft
                frameLeft.setAttribute('color', '#8B4513');
                frameLeft.setAttribute('src', '#woodTexture');
                frameLeft.setAttribute('shadow', 'cast: true');

                // Right Frame
                const frameRight = document.createElement('a-box');
                frameRight.setAttribute('position', `1.1 0 0`);  // Dreapta picturii
                frameRight.setAttribute('width', '0.2');
                frameRight.setAttribute('height', '2.4');
                frameRight.setAttribute('depth', '0.2'); // Corectat: depth set pe frameRight
                frameRight.setAttribute('color', '#8B4513');
                frameRight.setAttribute('src', '#woodTexture');
                frameRight.setAttribute('shadow', 'cast: true');

                // Adaugă cadrele la grupul de cadre
                frameGroup.appendChild(frameTop);
                frameGroup.appendChild(frameBottom);
                frameGroup.appendChild(frameLeft);
                frameGroup.appendChild(frameRight);

                // Poziționarea coloanei dorice între picturi
                const nextIndex = (index + 1) % totalPaintings;  // Ne asigurăm că după ultima pictură trecem la prima
                const nextAngle = nextIndex * angleStep;

                const midAngle = (angle + nextAngle) / 2;

                // Adăugarea coloanei dorice între picturi

                const columnEntity = document.createElement('a-entity');
                columnEntity.setAttribute('gltf-model', '/3d/doric_column.glb');
                columnEntity.setAttribute('scale', '0.3 0.5 0.3');
                columnEntity.setAttribute('rotation', `0 ${radToDeg(midAngle) + 180} 0`); // Alinierea estetică
                columnEntity.setAttribute('position', `3 -1 1`);
                columnEntity.setAttribute('rotation', `0 0 0`);
                columnEntity.setAttribute('material', 'src: #columnTexture; roughness: 0.8');

                paintingEntity.appendChild(columnEntity);


                paintingGroup.appendChild(backingPlate);

                // Adaugă componentele la grupul de pictură
                paintingGroup.appendChild(paintingEntity);
                paintingEntity.appendChild(frameGroup);
                paintingGroup.appendChild(textEntity);

            });
        })
        .catch(error => {
            console.error('Error fetching auctions:', error);
        });
});