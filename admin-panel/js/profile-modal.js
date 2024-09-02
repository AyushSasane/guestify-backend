document.addEventListener('DOMContentLoaded', () => {
    const profileIcon = document.getElementById('profile');
    const profileModal = document.getElementById('profileModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeProfileModal = profileModal.querySelector('.close-profile');
    const profileInfoForm = document.getElementById('profileInfoForm');
    const passwordForm = document.getElementById('passwordForm');
    const tabButtons = document.querySelectorAll('.tab-button');
    const token = localStorage.getItem('token');
    let lastFocusedElement = null;
    let focusTrapHandler = null;

    // Fetch and display user profile details
    const fetchUserProfile = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                document.getElementById('username').value = userData.username;
            } else {
                console.error('Failed to fetch user profile');
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };

    // Trap focus inside the modal
    const trapFocus = (modal) => (event) => {
        const focusableElements = modal.querySelectorAll('a[href], button, input, select, textarea');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.key === 'Tab') {
            if (event.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    };

    // Open the modal and set focus
    const openModal = (modal) => {
        lastFocusedElement = document.activeElement; // Save the last focused element
        modal.style.display = 'block';  // Use block instead of class toggle for visibility
        modalOverlay.style.display = 'block'; // Show overlay with blur effect
        fetchUserProfile(); // Fetch user profile details
        const firstFocusableElement = modal.querySelector('button, input, select, textarea');
        if (firstFocusableElement) {
            firstFocusableElement.focus(); // Focus the first focusable element
        }
        // Remove existing focus trap if it exists
        if (focusTrapHandler) {
            document.removeEventListener('keydown', focusTrapHandler);
        }
        focusTrapHandler = trapFocus(modal);
        document.addEventListener('keydown', focusTrapHandler); // Trap focus inside the modal
    };

    // Close the modal and return focus to the trigger element
    const closeModal = (modal) => {
        modal.style.display = 'none'; // Hide the modal instead of removing it
        modalOverlay.style.display = 'none'; // Hide overlay
        if (lastFocusedElement) {
            lastFocusedElement.focus(); // Return focus to the last focused element
        }
        // Remove the focus trap handler
        if (focusTrapHandler) {
            document.removeEventListener('keydown', focusTrapHandler);
            focusTrapHandler = null;
        }
    };

    // Switch tabs
    const switchTab = (event) => {
        const targetId = event.target.dataset.target;
        tabButtons.forEach(button => button.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById(targetId).classList.add('active');
    };

    // Open the profile modal when profile icon is clicked
    profileIcon.addEventListener('click', (event) => {
        event.preventDefault();
        openModal(profileModal);
    });

    // Close the profile modal when the close button is clicked
    closeProfileModal.addEventListener('click', () => {
        closeModal(profileModal);
    });

    // Close the profile modal if the overlay is clicked
    modalOverlay.addEventListener('click', () => {
        closeModal(profileModal);
    });

    // Handle profile info form submission
    profileInfoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        // No action needed for profile info form as it's read-only
    });

    // Handle password form submission
    passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const response = await fetch('http://localhost:5000/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (response.ok) {
                alert('Password updated successfully');
                closeModal(profileModal); // Close the modal after successful update
            } else {
                alert('Failed to update password');
            }
        } catch (error) {
            console.error('Error updating password:', error);
        }
    });

    // Handle logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // Initialize tabs
    tabButtons.forEach(button => button.addEventListener('click', switchTab));
});
