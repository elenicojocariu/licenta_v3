document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to view the auctions.');
        window.location.href = '/login.html'; // Redirect to login page
        return;
    }

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

            const container = document.getElementById('auctions-container');
            auctions.forEach(auction => {
                //console.log('Processing auction:', auction); // Log each auction object

                const auctionElement = document.createElement('div');
                auctionElement.classList.add('auction');

                if (auction.painting_pic) {
                    console.log('Painting Pic:', auction.painting_pic);
                } else {
                    console.error('Painting Pic is undefined');
                }
                const img = document.createElement('img');
                img.src = `/uploads-paintings/${auction.painting_pic}`;
                img.alt = auction.painting_name;

                if (auction.painting_name) {
                    console.log('Painting Name:', auction.painting_name);
                } else {
                    console.error('Painting Name is undefined');
                }
                const name = document.createElement('h2');
                name.textContent = auction.painting_name;

                if (auction.artist_name) {
                    console.log('Artist Name:', auction.artist_name);
                } else {
                    console.error('Artist Name is undefined');
                }
                const artist = document.createElement('p');
                artist.textContent = `Artist: ${auction.artist_name}`;

                if (auction.start_date) {
                    console.log('Start Date:', auction.start_date);
                } else {
                    console.error('Start Date is undefined');
                }
                const startDate = new Date(auction.start_date);

                if (auction.end_date) {
                    console.log('End Date:', auction.end_date);
                } else {
                    console.error('End Date is undefined');
                }
                const endDate = new Date(auction.end_date);

                const now = new Date();

                let statusText = '';
                if (now < startDate) {
                    statusText = `Auction starts on: ${startDate.toLocaleDateString()}`;
                } else if (now >= startDate && now <= endDate) {
                    statusText = `Auction started on: ${startDate.toLocaleDateString()}, ends on: ${endDate.toLocaleDateString()}`;
                } else {
                    statusText = `Auction ends on: ${endDate.toLocaleDateString()}`;
                }

                const status = document.createElement('p');
                status.textContent = statusText;

                var button = document.createElement('button');
                button.textContent = 'Make an offer!';
                button.addEventListener('click', function () {
                    displayAuctionPopup(img, name, auction.id_painting)
                });

                auctionElement.appendChild(img);
                auctionElement.appendChild(name);
                auctionElement.appendChild(artist);
                auctionElement.appendChild(status);
                auctionElement.appendChild(button);
                container.appendChild(auctionElement);
            });
        })
        .catch(error => {
            console.error('Error fetching auctions:', error);
        });
});

async function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Nu ești autentificat!');
        window.location.href = 'http://localhost:5000/login';
        return;
    }
    try {
        console.log('Sending request to verify token...');
        const response = await fetch('http://localhost:5000/auth/verifyToken', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Token verified successfully:', data);
            return data.userId;
        }
    } catch (error) {
        console.error('Error during token verification:', error);
        alert('Autentificarea a eșuat, te rugăm să te autentifici din nou.');
        localStorage.removeItem('token');
        window.location.href = 'http://localhost:5000/login';
    }
}

function displayAuctionPopup(img, name, paintingId) {
    const modal = document.getElementById('offer-popup');
    const token = localStorage.getItem('token');

    if (!modal) {
        console.error('Modal element not found.');
        return;
    }

    const paintingImage = document.getElementById('painting-image');
    const paintingTitle = document.getElementById('painting-title');
    const sendOfferBtn = document.getElementById('send-offer');
    const offerAmountInput = document.getElementById('offer-amount');

    paintingImage.src = img.src || 'placeholder.jpg';
    paintingTitle.textContent = name.textContent || 'Untitled';

    sendOfferBtn.onclick = function () {
        const offerAmount = offerAmountInput.value;
        getUserId().then(userId => {
            if (!offerAmount || !userId || !paintingId) {
                console.error('Missing required information.');
                return;
            }

            const data = {
                offerAmount: offerAmount.valueOf(),
                userId: userId,
                paintingId: paintingId
            };

            console.log("Data to submit:", data);

            fetch('/auction/submit-offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })
                .then(response => {
                    console.log("Response status:", response.status);
                    return response.json().then(data => ({ status: response.status, data }));
                })
                .then(({ status, data }) => {
                    if (status >= 400) {
                        console.error('Server responded with an error:', data);
                        alert('Failed to submit offer. Please try again.');
                        return;
                    }

                    console.log('Offer submitted successfully:', data);
                    alert('Offer submitted successfully!');
                    closeAuction(); // Close the popup
                })
                .catch(error => {
                    console.error('Failed to submit offer:', error);
                    alert('Failed to submit offer. Please try again.');
                });
        }).catch(error => {
            console.error('Failed to get user ID:', error);
        });
    };

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeAuction() {
    const modal = document.getElementById('offer-popup');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable background scrolling
}