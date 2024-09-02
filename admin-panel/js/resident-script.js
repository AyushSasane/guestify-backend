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
                searchButtonIcon.classList.toggle('bx-search', !searchForm.classList.contains('show'));
                searchButtonIcon.classList.toggle('bx-x', searchForm.classList.contains('show'));
            }
        });
    }

    // Responsive Adjustments
    function adjustForScreenSize() {
        const sidebar = document.getElementById('sidebar');
        const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
        if (sidebar) {
            if (window.innerWidth < 768) {
                sidebar.classList.add('hide');
            } else {
                sidebar.classList.remove('hide');
            }
        }
        if (searchButtonIcon) {
            if (window.innerWidth > 576) {
                searchButtonIcon.classList.replace('bx-x', 'bx-search');
                const searchForm = document.querySelector('#content nav form');
                if (searchForm) {
                    searchForm.classList.remove('show');
                }
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

    // Fetch and Display Residents
    async function fetchResidents(apiEndpoint, tableId) {
        try {
            const response = await fetch(apiEndpoint);
            const data = await response.json();
            const tableBody = document.querySelector(`#${tableId} tbody`);
            if (tableBody) {
                tableBody.innerHTML = data.map(resident => 
                    `<tr>
                        <td>${resident.name}</td>
                        <td>${resident.flatNumber}</td>
                        <td><button class="btn-details" data-id="${resident._id}">Get Details</button></td>
                        <td><button class="btn-update-resident" data-id="${resident._id}">Update</button></td>
                    </tr>`
                ).join('');
                attachResidentEventListeners();
            } else {
                console.error('Table body element not found');
            }
        } catch (error) {
            console.error('Error fetching residents:', error);
        }
    }

    function attachResidentEventListeners() {
        document.querySelectorAll('.btn-details').forEach(button => {
            button.addEventListener('click', () => {
                const residentId = button.getAttribute('data-id');
                getResidentDetails(residentId);
            });
        });

        document.querySelectorAll('.btn-update-resident').forEach(button => {
            button.addEventListener('click', () => {
                const residentId = button.getAttribute('data-id');
                showUpdateModal(residentId);
            });
        });
    }

    // Fetch and Display Resident Details
    function getResidentDetails(residentId) {
        fetch(`http://localhost:5000/api/residents/${residentId}`)
            .then(response => response.json())
            .then(resident => {
                const detailsSection = document.getElementById("guestDetails");
                if (detailsSection) {
                    detailsSection.innerHTML = 
                        `<p>Name: ${resident.name}</p>
                        <p>Flat Number: ${resident.flatNumber}</p>
                        <p>Phone Number: ${resident.phoneNumber}</p>`;
                    const detailsModal = document.getElementById("detailsModal");
                    if (detailsModal) {
                        showModal(detailsModal);
                    }
                }
            })
            .catch(error => console.error('Error fetching resident details:', error));
    }

    // Show Update Modal
    function showUpdateModal(residentId) {
        fetch(`http://localhost:5000/api/residents/${residentId}`)
            .then(response => response.json())
            .then(resident => {
                const updateForm = document.getElementById('updateForm');
                if (updateForm) {
                    const residentIdInput = updateForm.querySelector('input[name="residentId"]');
                    const residentNameInput = updateForm.querySelector('input[name="residentName"]');
                    const flatNumberInput = updateForm.querySelector('input[name="residentFlatNumber"]');
                    const phoneNumberInput = updateForm.querySelector('input[name="phoneNumber"]');

                    if (residentIdInput && residentNameInput && flatNumberInput && phoneNumberInput) {
                        residentIdInput.value = resident._id;
                        residentNameInput.value = resident.name;
                        flatNumberInput.value = resident.flatNumber;
                        phoneNumberInput.value = resident.phoneNumber;

                        const updateModal = document.getElementById('updateModal');
                        if (updateModal) {
                            showModal(updateModal);
                        }
                    } else {
                        console.error('Form fields are missing or incorrectly referenced');
                    }
                } else {
                    console.error('Update form element not found');
                }
            })
            .catch(error => console.error('Error fetching resident details:', error));
    }

    // Show Modal Function
    function showModal(modal) {
        modal.style.display = "block";
        modal.classList.add("modal-focus");
        document.body.classList.add("blur-background");
    }

    // Close Modals
    function closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = "none";
            modal.classList.remove("modal-focus");
        });
        document.body.classList.remove("blur-background");
    }

    // Event listeners for close buttons and outside click
    function addCloseListeners() {
        const closeButtons = document.querySelectorAll('.modal .close-btn, .modal .close-profile');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModals);
        });

        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    closeModals();
                }
            });
        });
    }

    addCloseListeners();

    // Submit Update Form
    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const residentId = updateForm.querySelector('input[name="residentId"]').value;
            const updatedData = {
                name: updateForm.querySelector('input[name="residentName"]').value,
                flatNumber: updateForm.querySelector('input[name="residentFlatNumber"]').value,
                phoneNumber: updateForm.querySelector('input[name="phoneNumber"]').value
            };

            fetch(`http://localhost:5000/api/residents/${residentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Server response:', data);
                    if (data._id) {
                        closeModals();
                        fetchResidents('http://localhost:5000/api/residents', 'residentsTable');
                    } else {
                        console.error('Error updating resident:', 'No valid response data received');
                    }
                })
                .catch(error => console.error('Error updating resident:', error));
        });
    }

    // Import Residents Data
    const importButton = document.getElementById('importButton');
    if (importButton) {
        importButton.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
    }

    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', handleFileSelect);
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            readExcelFile(file);
            sendToServer(file);
        }
    }

    function readExcelFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                processImportedData(jsonData);
            } catch (error) {
                console.error('Error reading file:', error);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    async function sendToServer(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:5000/api/residents/import', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            alert('Data imported successfully!');
        } catch (error) {
            console.error('Error importing data:', error);
        }
    }

    function processImportedData(data) {
        console.log('Imported Data:', data);
    }

    // Fetch initial residents data
    fetchResidents('http://localhost:5000/api/residents', 'residentsTable');

    // Download Data
    const downloadButton = document.querySelector('.btn-download');
    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            fetch('http://localhost:5000/api/residents/download')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'residents.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url); // Clean up
                })
                .catch(error => console.error('Error downloading data:', error));
        });
    }
});
