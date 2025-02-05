
document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('No token found. Please login first.');
        window.location.href = 'login.html';
        return;
    }
    try {
        // fetch profile data
        const response = await fetch('http://localhost:5000/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Error fetching profile ', data.error);
            return;
        }


        document.getElementById('first-name').value = data.first_name;
        document.getElementById('last-name').value = data.last_name;
        document.getElementById('email').value = data.email;

        if (data.profile_pic) {
            document.getElementById('profile-image').src = data.profile_pic;
        }
    } catch (error) {
        console.error('Error fethcing profile ', error);
    }


    // Update profile
    document.getElementById('profile-form').addEventListener('submit', async function (event) {
        event.preventDefault();

        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const email = document.getElementById('email').value;
        try {
            const response = await fetch('http://localhost:5000/profile', {
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
            });

            const data = await response.json();
            if(!response.ok){
                console.error('Server errror ', data.error);
                throw new Error(data.message || 'Failed to update profile.'); //sare direct in catch
            }
            alert('Profile updated successfully!')
        } catch(error){
                console.error('Error:', error);
                alert('An error occurred while updating the profile.');
        }
    });
});

//update profile pic
document.getElementById('profile-pic-input').addEventListener('change', async function (event) {

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('profile-pic', file);

    const token = localStorage.getItem('token'); // Obține token-ul din localStorage

    try {
        const response = await fetch('http://localhost:5000/profile/upload-profile-pic', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await response.json();
        if(!response.ok){
            console.error('Error updating profile-pic ', data.error);
            return;
        }
        document.getElementById('profile-image').src = data.profilePicUrl;
    }catch(error) {
        console.error('Error:', error);
        alert('An error occurred while updating the profile picture.');
    }
});



// Delete account
document.getElementById('delete-account').addEventListener('click', async function () {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return; }
    try{
        const response = await fetch('http://localhost:5000/profile', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if(!response.ok){
            console.error('Error: ', error);
            throw new Error(data.message || 'Failes to delete the account.');
        }
        alert('Account deleted successfully!');
        window.location.href = '/login.html';
    }catch (error){
        console.error('Error: ', error);
        alert('An error occured while deleting the account.');
    }
});


document.getElementById('profile-pic-input').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('profile-image').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

//change pass
document.addEventListener('DOMContentLoaded', function () {
    const changePasswordButton = document.getElementById('change-password');
    const passwordPopup = document.getElementById('password-popup');
    const popupOverlay = document.getElementById('popup-overlay');
    const changePasswordForm = document.getElementById('change-password-form');
    const newPasswordForm = document.getElementById('new-password-form');
    const currentPasswordField = document.getElementById('current-password');
    const newPasswordField = document.getElementById('new-password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const token = localStorage.getItem('token');

    changePasswordButton.addEventListener('click', function () {
        popupOverlay.style.display = 'block';
        passwordPopup.style.display = 'block';
    });

    popupOverlay.addEventListener('click', function () {
        popupOverlay.style.display = 'none';
        passwordPopup.style.display = 'none';
        newPasswordForm.style.display = 'none';
        changePasswordForm.style.display = 'block';
        currentPasswordField.value = '';
        newPasswordField.value = '';
        confirmPasswordField.value = '';
    });

    changePasswordForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const currentPassword = currentPasswordField.value;

        try {
            const response = await fetch('/auth/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` //pt autentif si autorizare

                },
                body: JSON.stringify({password: currentPassword})
            });

            const result = await response.json();
            if (response.ok) {
                changePasswordForm.style.display = 'none';
                newPasswordForm.style.display = 'block';
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    });

    newPasswordForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const newPassword = newPasswordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (newPassword !== confirmPassword) {
            alert('New password and confirm password do not match.');
            return;
        }

        try {
            const response = await fetch('/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`

                },
                body: JSON.stringify({newPassword})
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                popupOverlay.style.display = 'none';
                passwordPopup.style.display = 'none';
                newPasswordForm.style.display = 'none';
                changePasswordForm.style.display = 'block';
                currentPasswordField.value = '';
                newPasswordField.value = '';
                confirmPasswordField.value = '';
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    });
});

