document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    const startDatePicker = flatpickr(startDateInput, {
        dateFormat: 'Y-m-d',
        minDate: 'today',
        onChange: function(selectedDates, dateStr, instance) {
            endDatePicker.set("minDate", dateStr); // Setează minDate pentru endDate
            endDatePicker.open(); // Deschide endDate picker automat
        }
    });

    // Inițializează flatpickr pentru endDate
    const endDatePicker = flatpickr(endDateInput, {
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr, instance) {
            // Cod pentru a colora perioada dintre startDate și endDate
            highlightRange(startDateInput.value, dateStr);
        }
    });



    function highlightRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const daysBetween = (end - start) / (1000 * 60 * 60 * 24);

        for (let i = 0; i <= daysBetween; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(currentDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            //document.querySelector(`[data-date='${dateStr}']`).classList.add('highlight');
            const dayElements = document.querySelectorAll('.flatpickr-day');
            dayElements.forEach(dayElement => {
                if (dayElement.dateObj.toISOString().split('T')[0] === dateStr) {
                    dayElement.classList.add('highlight');
                }
            });
        }
    }


    document.getElementById('contactForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const paintingName = document.getElementById('name').value;
        const artistName = document.getElementById('artist-name').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const paintingPic = document.getElementById('profile-pic-input').files[0];

        if (!paintingPic) {
            alert('Please upload a picture of the painting.');
            return;
        }

        const formData = new FormData();
        formData.append('name', paintingName);
        formData.append('artistName', artistName);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('paintingPic', paintingPic);

        fetch('/auction/list', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    showPopup();
                    resetForm();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to list painting.');
            });
    });
    function resetForm() {
        document.getElementById('contactForm').reset();
        // Resetează valorile Flatpickr
        startDatePicker.clear();
        endDatePicker.clear();
    }
});
function showPopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'block';
}

// Funcția pentru închiderea popup-ului
function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}
