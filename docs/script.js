
let data = JSON.parse(localStorage.getItem('remainingSupply')) || [];
if (data.length == 0) {
    localStorage.setItem('remainingSupply', JSON.stringify(data0))
    data = JSON.parse(localStorage.getItem('remainingSupply'));
}

let selectedItem = null;

function searchItems() {
    const query = document.getElementById('searchBar').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (query) {
        const filteredData = data.filter(item => item.item.toLowerCase().includes(query));
        filteredData.forEach(item => {
            const resultItem = document.createElement('p');
            resultItem.textContent = `${item.item.slice(0, 40)}${item.item.length > 40 ? '...' : ''} -- Qty: ${item.qty} (${item.unit})`;
            resultItem.onclick = () => selectItem(item);
            resultsContainer.appendChild(resultItem);
        });
    }
}

/*
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No matches found</p>';
    } else {
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
            resultItem.innerHTML = `
                <p class="highlight">${result.item} ${result.qty}</p>
                <p><strong>Quantity:</strong> ${result.qty}</p>
                <p><strong>Unit:</strong> ${result.unit}</p>
            `;
            resultItem.onclick = () => selectItem(result);
            resultsContainer.appendChild(resultItem);
        });
    }
}
*/

function selectItem(item) {
    selectedItem = item;
    document.getElementById('searchBar').value = item.item;
    document.getElementById('results').innerHTML = '';
    document.getElementById('selectedItemName').textContent = `${item.item} / ${item.qty} (${item.unit})`;
    document.getElementById('selectedItem').classList.remove('hidden');
}

function submitUsage() {
    const usageInput = document.getElementById('usageInput').value.trim();
    if (!usageInput) {
        alert('Please enter the quantity used.');
        return;
    }

    const quantity = parseFloat(usageInput);
    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid positive number for the quantity.');
        return;
    }

    if (!selectedItem) {
        alert('Please select an item first.');
        return;
    }

    const logEntry = {
        id: selectedItem.id, // Use the id property as the unique identifier
        item: selectedItem.item,
        quantity: quantity,
        timestamp: new Date().toLocaleString()
    };

    saveUsageLog(logEntry);
    updateSupplyByLogEntry(logEntry);
    displayUsageLog();
    resetForm();
}

function saveUsageLog(logEntry) {
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    usageLog.push(logEntry);
    localStorage.setItem('usageLog', JSON.stringify(usageLog));
}

function updateSupplyByItemID_Amount(id, amount) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].id == id) {
            data[i].qty -= amount;
            break;
        }
    }
    localStorage.setItem('remainingSupply', JSON.stringify(data));
}

function updateSupplyByLogEntry(logEntry) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].id == logEntry.id) {
            data[i].qty -= logEntry.quantity;
            break;
        }
    }
    localStorage.setItem('remainingSupply', JSON.stringify(data));
}

function displayUsageLog() {
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    const usageLogTableBody = document.getElementById('usageLog').querySelector('tbody');
    usageLogTableBody.innerHTML = '';

    // Sort log entries in reverse chronological order
    usageLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    usageLog.forEach((entry) => {
        /*
        // Find the corresponding item in the data array based on the drugid
        const item = data.find(item => item.id === entry.drugid);
        if (!item) {
            console.error(`Item not found for usage log entry with drugid: ${entry.drugid}`);
            return; // Skip this entry if corresponding item not found
        }
        */

        //const truncatedItemName = item.item.length > 40 ? item.item.slice(0, 40) + '...' : item.item;
        const truncatedItemName = entry.item.length > 40 ? entry.item.slice(0, 40) + '...' : entry.item;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${truncatedItemName}</td>
            <td>${entry.quantity}</td>
            <td>${entry.timestamp}</td>
            <td>
                <button onclick="editUsage('${entry.timestamp}')">Edit</button>
                <button onclick="deleteUsageByTimestamp('${entry.timestamp}')">Delete</button>
            </td>
        `;
        usageLogTableBody.appendChild(row);
    });
}

function resetForm() {
    document.getElementById('searchBar').value = '';
    document.getElementById('usageInput').value = '';
    document.getElementById('selectedItemName').textContent = '';
    document.getElementById('selectedItem').classList.add('hidden');
    selectedItem = null;
}

// TODO Update the editUsage function
function editUsage(timestamp) {
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    const entryIndex = usageLog.findIndex(entry => entry.timestamp === timestamp);
    if (entryIndex !== -1) {
        const entry = usageLog[entryIndex];
        const newQuantity = prompt(`Edit quantity for ${entry.item}:`, entry.quantity);
        if (newQuantity !== null) {
            entry.quantity = newQuantity;
            localStorage.setItem('usageLog', JSON.stringify(usageLog));
            displayUsageLog();
        }
    } else {
        alert('Entry not found.');
    }
}

function deleteUsageByTimestamp(timestamp) {
    const confirmDelete = confirm('Are you sure you want to delete this entry?');
    if (confirmDelete) {
        const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
        const updatedLog = usageLog.filter(entry => entry.timestamp !== timestamp);
        const entryToDel = usageLog.filter(entry => entry.timestamp == timestamp);
        localStorage.setItem('usageLog', JSON.stringify(updatedLog));
        updateSupplyByItemID_Amount(entryToDel[0].id, 0 - entryToDel[0].quantity);
        location.reload();
    }
}


function exportToCSV() {
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    if (usageLog.length === 0) {
        alert('Usage log is empty.');
        return;
    }

    // Construct CSV content
    const csvContent = "timestamp,drugid,drugname,quantity\n" +
        usageLog.map(entry => {
            const drugName = entry.item ? `"${entry.item.replace(/"/g, '""')}"` : ''; // Handling undefined item
            const timestamp = `"${entry.timestamp.replace(/"/g, '""')}"`; // Handling commas in timestamp
            return `${timestamp},${entry.id},${drugName},${entry.quantity}`;
        }).join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'usage_log.csv');
    a.click();
    window.URL.revokeObjectURL(url);
}

function clearUsageData() {
    const confirmation = prompt("Are you sure you want to clear the usage data? Type 'YES' in capital letters to confirm.");
    if (confirmation === "YES") {
        localStorage.removeItem('usageLog');
        localStorage.removeItem('remainingSupply');
        location.reload();
        alert('Usage data cleared successfully.');
    } else {
        alert('Clear operation canceled.');
    }
}

function reloadPage() {
    location.reload();
}

// Initialize the usage log display
document.addEventListener('DOMContentLoaded', displayUsageLog);
