document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Menu Activation
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
                searchButtonIcon.classList.replace(
                    searchForm.classList.contains('show') ? 'bx-search' : 'bx-x',
                    searchForm.classList.contains('show') ? 'bx-x' : 'bx-search'
                );
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

    // Fetch and Display Active Guests
    async function fetchGuests(apiEndpoint, tableId, countId) {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const responseText = await response.text(); // Get response as text first
            console.log('Response Text:', responseText); // Debug: Inspect response
            const data = JSON.parse(responseText); // Parse manually
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
                        <td><button class="btn-checkout" data-id="${guest._id}" ${guest.checkOutTime ? 'disabled' : ''}>Check Out</button></td>
                    </tr>
                `).join('');

                // Attach event listeners to the newly created buttons
                attachGuestEventListeners();
                attachEventListeners();
            } else {
                console.error('Table or count element not found');
            }
        } catch (error) {
            console.error('Error fetching guests:', error);
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

    // Attach event listeners to check-out buttons
    function attachEventListeners() {
        const checkOutButtons = document.querySelectorAll('.btn-checkout');
        checkOutButtons.forEach(button => {
            button.removeEventListener('click', debouncedHandleCheckOut); // Ensure no duplicate listeners
            button.addEventListener('click', debouncedHandleCheckOut);
        });
    }

    const debouncedHandleCheckOut = debounce(async (event) => {
        const guestId = event.target.getAttribute('data-id');
        console.log(`Handling check-out for guestId: ${guestId}`); // Debug logging

        try {
            const response = await fetch(`http://localhost:5000/api/guests/${guestId}/checkout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
            }
            
            await response.json(); // Get guest data
            alert('Guest checked out successfully!');
            fetchGuests('http://localhost:5000/api/guests/active', 'activeGuestsTable', 'activeGuestsCount');
            fetchGuests('http://localhost:5000/api/guests/total', 'totalGuestsTable', 'totalGuestsCount');
        } catch (error) {
            console.error('Error checking out guest:', error);
            alert(`Failed to check out guest. Error: ${error.message}`);
        }
    }, 300);

    // Fetch and Display Guest Details
    function getDetails(guestId) {
        fetch(`http://localhost:5000/api/guests/${guestId}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
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
                    // Show the modal
                    const detailsModal = document.getElementById("detailsModal");
                    if (detailsModal) {
                        detailsModal.style.display = "block";
                    } else {
                        console.error('Details modal not found');
                    }
                } else {
                    console.error('Details section not found');
                }
            })
            .catch(error => console.error('Error fetching guest details:', error));
    }

    // Close Details Modal
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById("detailsModal").style.display = "none";
    });
    
    // Debounce Function
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Initial Fetch Calls
    fetchGuests('http://localhost:5000/api/guests/active', 'activeGuestsTable', 'activeGuestsCount');
    fetchGuests('http://localhost:5000/api/guests/total', 'totalGuestsTable', 'totalGuestsCount');
});
