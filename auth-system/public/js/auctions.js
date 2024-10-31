document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to view the auctions.');
        window.location.href = '/login.html'; // Redirect to login page
        return;
    }

    const userId = await getUserId();

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
        .then(auctions => {
            console.log('Auctions dataaaa:', auctions);
            const container = document.getElementById('auctions-container');
            if (!container) {
                console.error("Failed to find 'auctions-container' in the DOM.");
                return;
            }
            auctions.forEach(auction => {
                const auctionElement = document.createElement('div');
                auctionElement.classList.add('auction');
                auctionElement.setAttribute('data-painting-id', auction.id_painting);

                const img = document.createElement('img');
                img.src = `/uploads-paintings/${auction.painting_pic || 'placeholder.jpg'}`;
                img.alt = auction.painting_name || 'Untitled';


                const name = document.createElement('h2');
                name.textContent = auction.painting_name || 'Untitled';

                const artist = document.createElement('p');
                artist.textContent = `Artist: ${auction.artist_name || 'Unknown'}`;

                const status = document.createElement('p');
                const auctionStatus = getAuctionStatus(auction.start_date, auction.end_date);
                status.textContent = auctionStatus;

                auctionElement.appendChild(img);
                auctionElement.appendChild(name);
                auctionElement.appendChild(artist);
                auctionElement.appendChild(status);

                const button = document.createElement('button');
                if (auctionStatus.includes('Auction ended')) {
                    button.textContent = 'Auction ended';
                    button.classList.add('button-ended');
                    button.disabled = true;
                } else if (auction.user_bid) {
                    button.textContent = 'You\'ve already bid. See details';
                    button.addEventListener('click', () => showBidDetails(auction.user_bid));
                } else {
                    if (userId !== auction.artist_id) {
                        button.textContent = 'Make an offer!';
                        button.addEventListener('click', () => displayAuctionPopup(img, name, auction.id_painting, button));
                    } else {
                        button.textContent = 'Posted by you';
                        button.disabled = true;
                        button.classList.add('button-posted-by-you');
                    }
                }
                auctionElement.appendChild(button);

                container.appendChild(auctionElement);
            });
        })

        .catch(error => {
            console.error('Error fetching auctions:', error);
        });
    await checkUserWins();
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

function displayAuctionPopup(img, name, paintingId, button) {
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

            fetch('/auction/submit-offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(data => {
                    if (button) {
                        button.textContent = "You've already bid. See details";
                        button.onclick = () => showBidDetails(data.offerAmount);
                    }
                    closeAuction();
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
    document.body.style.overflow = 'hidden';
}

function closeAuction() {
    const modal = document.getElementById('offer-popup');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}


function getAuctionStatus(startDate, endDate) {
    const now = new Date();

    if (now < new Date(startDate)) {
        return `Auction starts on: ${new Date(startDate).toLocaleDateString()}`;
    } else if (now <= new Date(endDate)) {
        return `Auction ends on: ${new Date(endDate).toLocaleDateString()}`;
    }
    return `Auction ended on: ${new Date(endDate).toLocaleDateString()}`;
}

function showBidDetails(bidAmount) {
    const bidDetailsPopup = document.getElementById('bid-details-popup');
    const bidDetailsText = document.getElementById('bid-details-text');

    bidDetailsText.textContent = `You offered ${bidAmount} RON.`;

    bidDetailsPopup.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeBidDetailsPopup() {
    const bidDetailsPopup = document.getElementById('bid-details-popup');
    bidDetailsPopup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function checkUserWins() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/auction/check-win', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(results => {
            if (results && results.length > 0) {
                const container = document.getElementById('auctions-container');
                results.forEach(result => {
                    const paintingElement = container.querySelector(`[data-painting-id="${result.painting_id}"]`);
                    if (paintingElement) {
                        const message = document.createElement('p');
                        if (result.status === 'won') {
                            message.textContent = "Congrats! You won this bid. Check your email for further details.";
                            message.classList.add('win-message');
                        } else if (result.status === 'sold') {
                            message.textContent = `Congrats, your painting was auctioned for ${result.final_bid} RON! Check your email for further details.`;
                            message.classList.add('sold-message');
                        }
                        paintingElement.appendChild(message);
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error checking user wins: ', error);
        });
}



