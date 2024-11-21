document.addEventListener('DOMContentLoaded', function () {
    //  conversia radianilor in grade
    function radToDeg(rad) {
        return rad * (180 / Math.PI);
    }

    // ascund ecranul de incarcare cand scena este fully incarcata
    const loadingScreen = document.getElementById('loading');
    document.querySelector('a-scene').addEventListener('loaded', function () {
        loadingScreen.style.display = 'none';
    });

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to view the 3D auctions.');
        window.location.href = '/login.html';
        return;
    }

    // fetch auction paintings si le adaug la scena
    fetch('/auction/auctions', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (response.status === 401) {
                alert('Unauthorized. Please log in.');
                window.location.href = '/login.html';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.json();
        })
        .then(async auctions => {
            //console.log('Auctions data:', auctions);

            if (!Array.isArray(auctions)) {
                throw new TypeError('Expected an array of auctions');
            }

            const assets = document.querySelector('a-assets');
            const paintingsEntity = document.getElementById('paintings');

            const radius = 4; // raza cercului  pentru a fi mai apropiat
            const totalPaintings = auctions.length;
            //console.log("yoooo", totalPaintings);
            if (totalPaintings === 0) {
                console.warn('No paintings available to display.');
                return;
            }

            const angleStep = (2 * Math.PI) / totalPaintings; // pas unghiular

            for (const [index, auction] of auctions.entries()) {
                const paintingUrl = `/uploads-paintings/${auction.painting_pic || 'placeholder.jpg'}`;

                // Trimitem imaginea pentru extrudare și așteptăm rezultatul
                const extrudedUrl = await sendImageToExtrudeAPI(paintingUrl, auction.id_painting);

                // Adăugăm imaginea extrudată în assets
                const img = document.createElement('img');
                img.setAttribute('id', `painting-${auction.id_painting}`);
                img.setAttribute('src', extrudedUrl);  // Setăm src-ul cu URL-ul extrudat
                assets.appendChild(img);


                // calc pozitia pe cerc
                const angle = index * angleStep;
                const x = radius * Math.sin(angle);
                const z = radius * Math.cos(angle);

                // grup pentru fiecare pictura (pictura + rama + text)
                const paintingGroup = document.createElement('a-entity');
                paintingGroup.setAttribute('position', `${x} 2 ${z}`);
                paintingGroup.setAttribute('rotation', `0 ${radToDeg(angle) + 180} 0`); // rotesc spre centru
                paintingsEntity.appendChild(paintingGroup);

                // plane pt a afisa pictura
                const paintingEntity = document.createElement('a-plane');
                paintingEntity.setAttribute('src', `#painting-${auction.id_painting}`);
                paintingEntity.setAttribute('width', '2');
                paintingEntity.setAttribute('height', '2');
                paintingEntity.setAttribute('shadow', 'cast: true');
                paintingEntity.setAttribute('material', 'roughness: 0.7; metalness: 0.3');
                paintingEntity.setAttribute('look-at', '[camera]');

                //  titlu si nume artist
                const textEntity = document.createElement('a-text');
                textEntity.setAttribute('value', `${auction.painting_name || 'Untitled'} by ${auction.artist_name || 'Unknown'}`);
                textEntity.setAttribute('align', 'center');
                textEntity.setAttribute('position', `0 -0.7 0.5`); // Relativ la pictură
                textEntity.setAttribute('width', '3');
                textEntity.setAttribute('color', '#eac31d');
                textEntity.setAttribute('font', 'https://cdn.aframe.io/fonts/Roboto-msdf.json');

                //backing plate
                const backingPlate = document.createElement('a-box');

                backingPlate.setAttribute('position', `0 0 -0.05`);
                backingPlate.setAttribute('width', '2.1');
                backingPlate.setAttribute('height', '2.1');
                backingPlate.setAttribute('depth', '0.01');
                backingPlate.setAttribute('color', '#703b15');

                //  cadrul picturii
                const frameGroup = document.createElement('a-entity');
                const frameTop = document.createElement('a-box');
                frameTop.setAttribute('position', `0 1.1 0`);
                frameTop.setAttribute('width', '2.2');
                frameTop.setAttribute('height', '0.2');
                frameTop.setAttribute('depth', '0.2');
                frameTop.setAttribute('color', '#8B4513');
                frameTop.setAttribute('src', '#woodTexture');
                frameTop.setAttribute('shadow', 'cast: true');

                const frameBottom = document.createElement('a-box');
                frameBottom.setAttribute('position', `0 -1 0`);
                frameBottom.setAttribute('width', '2.4');
                frameBottom.setAttribute('height', '0.2');
                frameBottom.setAttribute('depth', '0.2');
                frameBottom.setAttribute('color', '#8B4513');
                frameBottom.setAttribute('src', '#woodTexture');
                frameBottom.setAttribute('shadow', 'cast: true');

                const frameLeft = document.createElement('a-box');
                frameLeft.setAttribute('position', `-1.1 0 0`);
                frameLeft.setAttribute('width', '0.2');
                frameLeft.setAttribute('height', '2.4');
                frameLeft.setAttribute('depth', '0.2');
                frameLeft.setAttribute('color', '#8B4513');
                frameLeft.setAttribute('src', '#woodTexture');
                frameLeft.setAttribute('shadow', 'cast: true');

                const frameRight = document.createElement('a-box');
                frameRight.setAttribute('position', `1.1 0 0`);
                frameRight.setAttribute('width', '0.2');
                frameRight.setAttribute('height', '2.4');
                frameRight.setAttribute('depth', '0.2');
                frameRight.setAttribute('color', '#8B4513');
                frameRight.setAttribute('src', '#woodTexture');
                frameRight.setAttribute('shadow', 'cast: true');

                // add cadrele la grupul de cadre
                frameGroup.appendChild(frameTop);
                frameGroup.appendChild(frameBottom);
                frameGroup.appendChild(frameLeft);
                frameGroup.appendChild(frameRight);

                // poz coloanei intre picturi
                for (let index = 0; index < totalPaintings; index++) {
                    const angle = index * angleStep;
                    const nextAngle = ((index + 1) % totalPaintings) * angleStep;
                    const midAngle = (angle + nextAngle) / 2;
                    const columnRadius = radius + 1; // distanța pentru coloane
                    const midX = columnRadius * Math.sin(midAngle);
                    const midZ = columnRadius * Math.cos(midAngle);

                    const columnEntity = document.createElement('a-entity');
                    columnEntity.setAttribute('gltf-model', '/3d/doric_column.glb');
                    columnEntity.setAttribute('scale', '0.3 0.55 0.3');
                    columnEntity.setAttribute('rotation', `0 ${radToDeg(midAngle) + 180} 0`);
                    columnEntity.setAttribute('position', `${midX} 0.8 ${midZ}`);
                    columnEntity.setAttribute('material', 'src: #columnTexture; roughness: 0.8');

                    paintingsEntity.appendChild(columnEntity);
                }

                // col in plus intre prima si ultima
                const lastAngle = (totalPaintings - 1) * angleStep;
                const firstAngle = 0;
                const finalMidAngle = (lastAngle + firstAngle + 2 * Math.PI) / 2;
                const finalMidX = (radius + 1) * Math.sin(finalMidAngle);
                const finalMidZ = (radius + 1) * Math.cos(finalMidAngle);

                const closingColumnEntity = document.createElement('a-entity');
                closingColumnEntity.setAttribute('gltf-model', '/3d/doric_column.glb');
                closingColumnEntity.setAttribute('scale', '0.3 0.5 0.3');
                closingColumnEntity.setAttribute('rotation', `0 ${radToDeg(finalMidAngle) + 180} 0`);
                closingColumnEntity.setAttribute('position', `${finalMidX} 0.7 ${finalMidZ}`);
                closingColumnEntity.setAttribute('material', 'src: #columnTexture; roughness: 0.8');

                paintingsEntity.appendChild(closingColumnEntity);

                paintingGroup.appendChild(backingPlate);

                paintingGroup.appendChild(paintingEntity);
                paintingEntity.appendChild(frameGroup);
                paintingGroup.appendChild(textEntity);
            }


        })
        .catch(error => {
            console.error('Error fetching auctions:', error);
        });

    // Funcție pentru trimiterea imaginii la API-ul de extrudare
    async function sendImageToExtrudeAPI(paintingUrl, auctionId) {
        try {
            // Verificăm dacă harta există deja
            const responseCheck = await fetch('http://localhost:5001/depth_exists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_name: `painting-${auctionId}.jpg` })
            });

            if (responseCheck.ok) {
                const data = await responseCheck.json();
                if (data.exists) {
                    console.log(`Harta de adâncime există deja pentru ${paintingUrl}`);
                    return `http://localhost:5001${data.processed_image_path}`; // Returnăm direct calea
                }
            }

            const response = await fetch(paintingUrl);
            if (!response.ok) throw new Error(`Failed to load image: ${response.statusText}`);

            const blob = await response.blob();
            const formData = new FormData();
            formData.append('image', blob, `painting-${auctionId}.jpg`);

            const extrudeResponse = await fetch('http://localhost:5001/extrude', {
                method: 'POST',
                body: formData
            });
            if (!extrudeResponse.ok) throw new Error(`Extrusion failed with status: ${extrudeResponse.status}`);

            const extrudedBlob = await extrudeResponse.blob();
            return URL.createObjectURL(extrudedBlob);
        } catch (error) {
            console.error('Extrusion error:', error);
        }
    }
});

