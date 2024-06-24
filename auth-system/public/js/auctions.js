document.addEventListener('DOMContentLoaded', function() {
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
                console.log('Processing auction:', auction); // Log each auction object

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
                    statusText = `Auction status: starts on: ${startDate.toLocaleDateString()}`;
                } else if (now >= startDate && now <= endDate) {
                    statusText = `Ongoing: started on: ${startDate.toLocaleDateString()}, ends: ${endDate.toLocaleDateString()}`;
                } else {
                    statusText = `Auction ended on: ${endDate.toLocaleDateString()}`;
                }

                const status = document.createElement('p');
                status.textContent = statusText;

                auctionElement.appendChild(img);
                auctionElement.appendChild(name);
                auctionElement.appendChild(artist);
                auctionElement.appendChild(status);
                container.appendChild(auctionElement);
            });
        })
        .catch(error => {
            console.error('Error fetching auctions:', error);
        });
});
