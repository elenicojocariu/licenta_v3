// profile.js
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('No token found. Please login first.');
        window.location.href = 'login.html';
        return;
    }

    // Fetch profile data
    fetch('http://localhost:5000/profile', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching profile:', data.error);
                return;
            }
            document.getElementById('first-name').value = data.first_name;
            document.getElementById('last-name').value = data.last_name;
            document.getElementById('email').value = data.email;
            if (data.profile_pic) {
                document.getElementById('profile-image').src = data.profile_pic;
            }
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
        });

    // Update profile
    document.getElementById('profile-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const email = document.getElementById('email').value;

        fetch('http://localhost:5000/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Profile updated successfully!');
                } else {
                    alert('Failed to update profile.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while updating the profile.');
            });
    });
});

//update profile pic
document.getElementById('profile-pic-input').addEventListener('change', function(event) {

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('profile-pic', file);

    const token = localStorage.getItem('token'); // Obține token-ul din localStorage

    fetch('http://localhost:5000/profile/upload-profile-pic', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('profile-image').src = data.profilePicUrl;
                alert('Profile picture updated successfully!');
            } else {
                alert('Failed to update profile picture.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating the profile picture.');
        });
});
    // Delete account
document.getElementById('delete-account').addEventListener('click', function() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        fetch('http://localhost:5000/profile', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Account deleted successfully!');
                    window.location.href = '/login.html';
                } else {
                    alert('Failed to delete account.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while deleting the account.');
            });
    }
});


document.getElementById('profile-pic-input').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profile-image').src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

