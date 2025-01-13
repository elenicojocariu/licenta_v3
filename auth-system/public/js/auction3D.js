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

            const radius = 5; // raza cercului  pentru a fi mai apropiate-----merge si 7
            const totalPaintings = auctions.length;
            //console.log("yoooo this is nb of total paintings", totalPaintings);
            if (totalPaintings === 0) {
                console.warn('No paintings available to display.');
                return;
            }

            const angleStep = (2 * Math.PI) / totalPaintings; // pas unghiular

            for (const [index, auction] of auctions.entries()) {
                const paintingUrl = `/uploads-paintings/${auction.painting_pic || 'placeholder.jpg'}`;

                // trim img pentru extrudare si astept rezultat
                const extrudedUrl = await sendImageToExtrudeAPI(paintingUrl, auction.id_painting);

                // add imagine extrudata in assets
                const img = document.createElement('img');
                img.setAttribute('id', `painting-${auction.id_painting}`);
                img.setAttribute('src', extrudedUrl);
                assets.appendChild(img);


                // calc pozitia pe cerc
                const angle = index * angleStep;
                const x = radius * Math.sin(angle);
                const z = radius * Math.cos(angle);

                // grup pentru fiecare pictura (pictura  + text)
                const paintingGroup = document.createElement('a-entity');
                paintingGroup.setAttribute('position', `${x} 1 ${z}`);
                paintingGroup.setAttribute('rotation', `0 ${radToDeg(angle) + 180} 0`); // rotesc spre centru
                paintingsEntity.appendChild(paintingGroup);

                const paintingEntity = document.createElement('a-entity');
                paintingEntity.setAttribute('gltf-model', extrudedUrl);
                paintingEntity.setAttribute('scale', '0.01 0.01 0.01');
                paintingEntity.setAttribute('position', '-2.5 0 -1.4');
                paintingEntity.setAttribute('look-at', '[camera]');
                paintingEntity.setAttribute('shadow', 'cast: true; receive: false;');
                paintingEntity.addEventListener('model-loaded', () => {
                    const mesh = paintingEntity.getObject3D('mesh');
                    if (mesh) {
                        mesh.traverse((node) => {
                            if (node.isMesh) {
                                node.material.side = THREE.DoubleSide;
                                node.material.roughness = 0.5;
                                node.material.metalness = 0.0;
                                node.material.emissive = new THREE.Color(0.1, 0.1, 0.1);
                                node.material.emissiveIntensity = 0.3;
                                node.geometry.computeVertexNormals();
                                node.material.flatShading = false;
                                node.material.needsUpdate = true;                            }
                        });
                    }
                });

                //  titlu si nume artist
                const textEntity = document.createElement('a-text');
                textEntity.setAttribute('value', `${auction.painting_name || 'Untitled'} by ${auction.artist_name || 'Unknown'}`);
                textEntity.setAttribute('align', 'center');
                textEntity.setAttribute('position', `-0.15 0 0.5`); // Relativ la pictură
                textEntity.setAttribute('width', '6');
                textEntity.setAttribute('color', 'rgba(234,195,29,0.61)');
                textEntity.setAttribute('font', 'https://cdn.aframe.io/fonts/Roboto-msdf.json');

                // poz coloanei intre picturi
                for (let index = 0; index < totalPaintings; index++) {
                    const angle = index * angleStep;
                    const nextAngle = ((index + 1) % totalPaintings) * angleStep;
                    const midAngle = (angle + nextAngle) / 2;
                    const columnRadius = radius + 1; // dist pt coloane
                    const midX = columnRadius * Math.sin(midAngle);
                    const midZ = columnRadius * Math.cos(midAngle);

                    const columnEntity = document.createElement('a-entity');
                    columnEntity.setAttribute('gltf-model', '/3d/doric_column.glb');
                    columnEntity.setAttribute('scale', '0.3 0.65 0.3');
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
                closingColumnEntity.setAttribute('scale', '0.3 0.65 0.3');
                closingColumnEntity.setAttribute('rotation', `0 ${radToDeg(finalMidAngle) + 180} 0`);
                closingColumnEntity.setAttribute('position', `${finalMidX} 0.7 ${finalMidZ}`);
                closingColumnEntity.setAttribute('material', 'src: #columnTexture; roughness: 0.8');

                paintingsEntity.appendChild(closingColumnEntity);


                paintingGroup.appendChild(paintingEntity);
                paintingGroup.appendChild(textEntity);
            }


        })
        .catch(error => {
            console.error('Error fetching auctions:', error);
        });

    // fct pt trim img la api din python pt extrudare
    async function sendImageToExtrudeAPI(paintingUrl, auctionId) {
        try {
            // Verificăm dacă harta există deja
            const responseCheck = await fetch('http://localhost:5001/depth_exists', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({image_name: `painting-${auctionId}.jpg`})
            });

            if (responseCheck.ok) {
                const data = await responseCheck.json();
                if (data.exists) {
                    console.log(`Depth map already exists for ${paintingUrl}`);
                    return `http://localhost:5001${data.processed_image_path}`; // ii dau direct calea
                }
            }
            // vf daca mesh gltf exista deja
            const responseCheckMesh = await fetch('http://localhost:5001/gltf_exists', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({image_name: `painting-${auctionId}.jpg`})
            });

            if (responseCheckMesh.ok) {
                const dataMesh = await responseCheckMesh.json();
                if (dataMesh.exists) {
                    console.log(`Mesh-ul GLTF există deja pentru ${paintingUrl}`);
                    // return `http://localhost:5001${dataMesh.gltf_path}`; // dau calea la gtlf

                    // fac cerere de la backend pt mesh
                    const responseMesh = await fetch('http://localhost:5001/send_mesh', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({image_name: `painting-${auctionId}.jpg`})
                    });
                    if (responseMesh.ok) {
                        const blob = await responseMesh.blob();
                        const meshUrl = URL.createObjectURL(blob);
                        return meshUrl; // dau return la url catre mesh
                    }
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

