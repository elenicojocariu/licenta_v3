document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to view the auctions.');
        window.location.href = '/login.html';
        return;
    }
    try {
        const userId = await getUserId();
        const auctionResponse = await fetch('/auction/auctions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (auctionResponse.status === 401) {
            alert('Please log in.');
            window.location.href = 'http://localhost:5000/login';
            return;
        }
        if (!auctionResponse.ok) {
            throw new Error(`HTTP error! Status: ${auctionResponse.status}`);
        }
        const auctionList = await auctionResponse.json();
        console.log('Auctions dataaaa:', auctionList);

        const container = document.getElementById('auctions-container');
        if (!container) {
            console.error("Failed to find 'auctions-container' in the DOM.");
            return;
        }
        auctionList.forEach(auction => {
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

            auctionElement.append(img, name, artist,status);


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
        await checkUserWins();
    }catch (error){
        console.error('Could not fetch auctions', error);

    }
});


async function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in.');
        window.location.href = 'http://localhost:5000/login';
        return;
    }
    try {
        console.log('Verifying token..');
        const userResponse = await fetch('http://localhost:5000/auth/verifyToken', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (userResponse.ok) {
            const data = await userResponse.json();
            console.log('Token verified successfully:', data);
            return data.userId;
        }
    } catch (error) {
        console.error('Error during token verification:', error);
        alert('Authentication failed. Please try again.');
        localStorage.removeItem('token');
        window.location.href = 'http://localhost:5000/login';
    }
}

async function displayAuctionPopup(img, name, paintingId, button) {
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

    sendOfferBtn.onclick = async function () {
        try{
            const offerAmount = offerAmountInput.value;
            const userId = await getUserId(); //astept sa obt userid
            if (!offerAmount || !userId || !paintingId) {
                console.error('Missing required information.');
                return;
            }
            const data = {
                offerAmount: offerAmount.valueOf(),
                userId: userId,
                paintingId: paintingId
            };
            const response = await fetch('/auction/submit-offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if(!response.ok){
                throw new Error(`HTTP error. Status: ${response.status}`);
            }
            const responseData = await response.json();
            if( button){
                button.textContent = "You've already bid. See details.";
                button.onclick= ()=> showBidDetails(responseData.offerAmount);
            }
            closeAuction();

        }catch (error){
            console.error('Failed to submit offer ', error);
            alert('Failed to submit offer. Please try again. ');
        }
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
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
        return `Auction starts on: ${start.toLocaleDateString()}`;
    } else if (now <= end) {
        return `Auction ends on: ${end.toLocaleDateString()}`;
    }
    return `Auction ended on: ${end.toLocaleDateString()}`;
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
    try{
        const response = await fetch('http://localhost:5000/auction/check-win', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const results = await response.json();
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
        } catch(error){
            console.error('Error checking user wins: ', error);
        }
}

function showFAQ() {
    document.getElementById("faqModal").style.display = "block";
}

function hideFAQ() {
    document.getElementById("faqModal").style.display = "none";
}



