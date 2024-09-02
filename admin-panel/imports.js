/*document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed'); // Debugging

    const fileInput = document.getElementById('importFile');
    if (fileInput) {
        console.log('File input element found'); // Debugging
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                console.log('File selected:', file.name); // Debugging
                readFile(file);
            }
        });
    } else {
        console.error('File input element not found'); // Debugging
    }
});

function readFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);

            console.log('Data read from file:', json); // Debugging

            // Create a FormData object to handle file upload
            const formData = new FormData();
            formData.append('file', file);

            // Send the data to the server
            await sendToServer(formData);

            // Process and update the table with the imported data
            processImportedData(json);
        } catch (error) {
            console.error('Error reading file:', error);
        }
    };
    reader.readAsArrayBuffer(file);
}

async function sendToServer(formData) {
    try {
        const response = await fetch('http://localhost:5000/api/residents/import', {
            method: 'POST',
            body: formData,
        });

        console.log('Response status:', response.status); // Debugging

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Import successful:', result);
        alert('Data imported successfully!');
    } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Check console for details.');
    }
}

function processImportedData(data) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = ''; // Clear existing table data

    data.forEach(row => {
        const { Name, FlatNumber, PhoneNumber } = row;

        // Add a new row to the table
        addRowToTable(Name, FlatNumber, PhoneNumber);
    });
}

function addRowToTable(name, flatNumber, phoneNumber) {
    const tbody = document.querySelector('table tbody');
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td>${name}</td>
        <td>${flatNumber}</td>
        <td><button class="get-details">Get Details</button></td>
        <td><button class="update-details">Update Details</button></td>
    `;
    
    tbody.appendChild(tr);
}
