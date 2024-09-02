document.addEventListener('DOMContentLoaded', () => {
    // Side Menu Activation
    const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');
    allSideMenu.forEach(item => {
        item.addEventListener('click', () => {
            allSideMenu.forEach(i => i.parentElement.classList.remove('active'));
            item.parentElement.classList.add('active');
        });
    });

    // Toggle Sidebar
    const menuBar = document.querySelector('#content nav .bx.bx-menu');
    const sidebar = document.getElementById('sidebar');
    if (menuBar && sidebar) {
        menuBar.addEventListener('click', () => sidebar.classList.toggle('hide'));
    }

    // Search Form Toggle
    const searchButton = document.querySelector('#content nav form .form-input button');
    const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
    const searchForm = document.querySelector('#content nav form');
    if (searchButton && searchButtonIcon && searchForm) {
        searchButton.addEventListener('click', (e) => {
            if (window.innerWidth < 576) {
                e.preventDefault();
                searchForm.classList.toggle('show');
                if (searchForm.classList.contains('show')) {
                    searchButtonIcon.classList.replace('bx-search', 'bx-x');
                } else {
                    searchButtonIcon.classList.replace('bx-x', 'bx-search');
                }
            }
        });
    }

    // Responsive Adjustments
    function adjustForScreenSize() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('hide');
        } else {
            sidebar.classList.remove('hide');
        }
        if (window.innerWidth > 576) {
            if (searchButtonIcon) {
                searchButtonIcon.classList.replace('bx-x', 'bx-search');
            }
            if (searchForm) {
                searchForm.classList.remove('show');
            }
        }
    }

    // Debounced Resize Event
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(adjustForScreenSize, 200);
    });

    // Initial Call
    adjustForScreenSize();

    // Dark Mode Toggle
    const switchMode = document.getElementById('switch-mode');
    if (switchMode) {
        // Load saved theme preference
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark');
            switchMode.checked = true;
        }

        switchMode.addEventListener('change', () => {
            if (switchMode.checked) {
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Fetch and Display Guests
    async function fetchGuests(apiEndpoint, tableId, countId) {
        try {
            const response = await fetch(apiEndpoint);
            const data = await response.json();
            const tableBody = document.querySelector(`#${tableId} tbody`);
            const countElement = document.querySelector(`#${countId}`);
            if (tableBody && countElement) {
                countElement.textContent = data.length;
                tableBody.innerHTML = data.map(guest => `
                    <tr>
                        <td>${guest.name}</td>
                        <td>${guest.residentFlatNumber}</td>
                        <td><span class="status ${guest.checkOutTime ? 'checked-out' : 'checked-in'}">${guest.checkOutTime ? 'Checked Out' : 'Checked In'}</span></td>
                        <td><button class="btn-details" data-id="${guest._id}">Get Details</button></td>
                    </tr>
                `).join('');

                // Attach event listeners to the newly created buttons
                attachGuestEventListeners();
            } else {
                console.error('Table or count element not found');
            }
        } catch (error) {
            console.error('Error fetching guests:', error);
        }
    }

    // Fetch and Display Twilio Status
    async function fetchTwilioStatus() {
        try {
            const response = await fetch('http://localhost:5000/api/twilio/status');
            const data = await response.json();
            const statusElement = document.querySelector('#twilioStatus');
            if (statusElement) {
                statusElement.textContent = data.status; // Update the text with Twilio status
            } else {
                console.error('Twilio status element not found');
            }
        } catch (error) {
            console.error('Error fetching Twilio status:', error);
        }
    }

    // Attach event listeners to guest detail buttons
    function attachGuestEventListeners() {
        document.querySelectorAll('.btn-details').forEach(button => {
            button.addEventListener('click', () => {
                const guestId = button.getAttribute('data-id');
                getDetails(guestId);
            });
        });
    }

    // Fetch and Display Guest Details
    function getDetails(guestId) {
        fetch(`http://localhost:5000/api/guests/${guestId}`)
            .then(response => response.json())
            .then(guest => {
                const detailsSection = document.getElementById("guestDetails");
                if (detailsSection) {
                    detailsSection.innerHTML = `
                        <p>Name: ${guest.name}</p>
                        <p>Contact Number: ${guest.contactNumber}</p>
                        <p>Purpose of Visit: ${guest.purposeOfVisit}</p>
                        <p>Resident Flat Number: ${guest.residentFlatNumber}</p>
                        <p>Resident Name: ${guest.residentName}</p>
                        <p>Visit Time: ${new Date(guest.visitTime).toLocaleString()}</p>
                        <p>Number of Guests: ${guest.numberOfGuests}</p>
                        <p>Check-Out Time: ${guest.checkOutTime ? new Date(guest.checkOutTime).toLocaleString() : 'N/A'}</p>
                    `;
                    // Show the modal and backdrop
                    const detailsModal = document.getElementById("detailsModal");
                    const backdrop = document.querySelector('.modal-overlay');
                    if (backdrop) {
                        backdrop.style.display = 'block';
                    } else {
                        console.error('Modal overlay not found');
                    }

                    if (detailsModal) {
                        detailsModal.classList.add('active');
                    } else {
                        console.error('Details modal not found');
                    }
                } else {
                    console.error('Details section not found');
                }
            })
            .catch(error => console.error('Error fetching guest details:', error));
    }

    // Close Modal
    function closeModal() {
        const detailsModal = document.getElementById("detailsModal");
        const backdrop = document.querySelector('.modal-overlay');
        if (detailsModal) {
            detailsModal.classList.remove('active');
        }
        if (backdrop) {
            backdrop.style.display = 'none';
        }
    }

    // Attach event listeners to the close buttons
    const closeButtons = document.querySelectorAll('.modal .close, .modal .close-profile');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Close the modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        const detailsModal = document.getElementById('detailsModal');
        const backdrop = document.querySelector('.modal-overlay');
        if (detailsModal && backdrop && event.target === backdrop) {
            closeModal();
        }
    });

    // Optional: Implement search functionality for guests
    const searchActiveGuests = document.getElementById('searchActiveGuests');
    if (searchActiveGuests) {
        searchActiveGuests.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            filterTable('activeGuestsTable', query);
        });
    }

    const searchTotalGuests = document.getElementById('searchTotalGuests');
    if (searchTotalGuests) {
        searchTotalGuests.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            filterTable('totalGuestsTable', query);
        });
    }

    function filterTable(tableId, query) {
        const rows = document.querySelector(`#${tableId} tbody`).rows;
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            let match = false;
            for (let j = 0; j < cells.length - 1; j++) {
                if (cells[j].textContent.toLowerCase().includes(query)) {
                    match = true;
                    break;
                }
            }
            rows[i].style.display = match ? '' : 'none';
        }
    }

    // Call functions to load data
    fetchGuests('http://localhost:5000/api/guests/active', 'activeGuestsTable', 'activeGuestsCount');
    fetchGuests('http://localhost:5000/api/guests/total', 'totalGuestsTable', 'totalGuestsCount');
    fetchTwilioStatus(); // Fetch Twilio status
});

async function downloadGuestData() {
    try {
        // Fetch guest data from the API
        const response = await fetch('http://localhost:5000/api/guests/total'); // Adjust the endpoint as needed
        const data = await response.json();
        
        // Prepare CSV data
        const csvRows = [];
        const headers = ['Name', 'Flat Number', 'Status', 'Contact Number', 'Purpose of Visit', 'Visit Time', 'Check-Out Time'];
        csvRows.push(headers.join(','));

        data.forEach(guest => {
            const row = [
                guest.name,
                guest.residentFlatNumber,
                guest.checkOutTime ? 'Checked Out' : 'Checked In',
                guest.contactNumber,
                guest.purposeOfVisit,
                new Date(guest.visitTime).toLocaleString(),
                guest.checkOutTime ? new Date(guest.checkOutTime).toLocaleString() : 'N/A'
            ];
            csvRows.push(row.join(','));
        });

        // Create CSV blob
        const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);

        // Create a link element and trigger download
        const a = document.createElement('a');
        a.href = csvUrl;
        a.download = 'guest_data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading guest data:', error);
    }
}

// Attach event listener to the download button
document.getElementById('downloadGuestData').addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default anchor behavior
    downloadGuestData();
});
