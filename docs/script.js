
const sheet_columns = ["id", "#", "Category", "Item", "Qty", "Unit", "Mfg Date", "Exp Date"];
const data_columns  = ["id","number","category","item","qtyInitial","unit","mfgDate","expDate"];


let data = JSON.parse(localStorage.getItem('SUPPLY')) || [];
let used = JSON.parse(localStorage.getItem('USED')) || {};

if (data.length == 0) {
    localStorage.setItem('SUPPLY', JSON.stringify(data0))
    data = JSON.parse(localStorage.getItem('SUPPLY'));

}

if (Object.keys(used).length == 0) {
    data.forEach(item => {
        used[item.id] = 0;
    });
    localStorage.setItem('USED', JSON.stringify(used))
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
            resultItem.textContent = `${item.item.slice(0, 40)}${item.item.length > 40 ? '...' : ''} -- Qty: ${item.qtyInitial} (${item.unit})`;
            resultItem.onclick = () => selectItem(item);
            resultsContainer.appendChild(resultItem);
        });
    }
}


function selectItem(item) {
    selectedItem = item;
    document.getElementById('searchBar').value = item.item;
    document.getElementById('results').innerHTML = '';
    document.getElementById('selectedItemName').textContent = `${item.item} / ${item.qtyInitial} (${item.unit})`;
    document.getElementById('selectedItem').classList.remove('hidden');
}

function submitUsage() {
    const usageInput = document.getElementById('usageInput').value.trim();
    if (!usageInput) {
        alert('Please enter the quantity used.');
        return;
    }


    let quantity = 0;
    try {
        quantity = eval(usageInput);
    }
    catch(err) {
        alert('Please enter a valid number for the quantity.');
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
            data[i].qtyInitial -= amount;
            break;
        }
    }
    localStorage.setItem('SUPPLY', JSON.stringify(data));
}

function updateSupplyByLogEntry(logEntry) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].id == logEntry.id) {
            data[i].qtyInitial -= logEntry.quantity;
            break;
        }
    }
    localStorage.setItem('SUPPLY', JSON.stringify(data));
}

function displayUsageLog() {
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    const usageLogTableBody = document.getElementById('usageLog').querySelector('tbody');
    usageLogTableBody.innerHTML = '';

    // Sort log entries in reverse chronological order
    usageLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    usageLog.forEach((entry) => {

        const truncatedItemName = entry.item.length > 40 ? entry.item.slice(0, 40) + '...' : entry.item;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${truncatedItemName}</td>
            <td>${entry.quantity}</td>
            <td>${entry.timestamp}</td>
            <td>
                <div class="button-container">
                    <button class="button button_any" onclick="editUsage('${entry.timestamp}')">Edit</button>
                    <button class="button button_red" onclick="deleteUsageByTimestamp('${entry.timestamp}')">Delete</button>
                </div>
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
        const entryId = entry.id;
        const oldQuantity = entry.quantity;
        const newQuantity = prompt(`Edit quantity for ${entry.item}:`, entry.quantity);
        if (newQuantity !== null) {
            entry.quantity = newQuantity;
            localStorage.setItem('usageLog', JSON.stringify(usageLog));
            displayUsageLog();
            updateSupplyByItemID_Amount(entryId, newQuantity - oldQuantity);
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


function exportUsageToCSV() {
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    if (usageLog.length === 0) {
        alert('Usage log is empty.');
        return;
    }

    // Construct CSV content
    const csvContent = "Time-Stamp,Drug-Id,Quantity,Drug-Name\n" +
        usageLog.map(entry => {
            const drugName = entry.item ? `"${entry.item.replace(/"/g, '""')}"` : ''; // Handling undefined item
            const timestamp = `"${entry.timestamp.replace(/"/g, '""')}"`; // Handling commas in timestamp
            return `${timestamp},${entry.id},${entry.quantity},${drugName}`;
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

function exportRemainingToCSV() {
    const data = JSON.parse(localStorage.getItem('SUPPLY')) || [];
    if (data.length == 0) {
        return;
    }

    let csv = "";
    csvHeadline = sheet_columns.join(",");
    csv = csv + csvHeadline + "\n";
    for (let i in data) {
        let row = [];
        for (j in data_columns) {
            row.push(data[i][data_columns[j]]);
        }
        const rowline = row.map(item => {
            let position = item.toString().search(/,/);
            if (position == -1) {
                return item;
            }
            else {
                return `"${item}"`;
            }
        }).join(",");
        csv = csv + rowline + "\n";
    }

    // Create and download CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'remaining-supply.csv');
    a.click();
    window.URL.revokeObjectURL(url);
}

function clearUsageData() {
    const confirmation = prompt("Are you sure you want to clear the usage data? Type 'YES' in capital letters to confirm.");
    if (confirmation === "YES") {

        //localStorage.removeItem('usageLog');
        //localStorage.removeItem('SUPPLY');

        // Clear all data
        localStorage.clear();

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
