
const sheet_columns = ["id", "#", "Category", "Item", "Qty", "Unit", "Mfg Date", "Exp Date"];
const data_columns  = ["id","number","category","item","qtyInitial","unit","mfgDate","expDate"];


let supply = JSON.parse(localStorage.getItem('SUPPLY')) || [];
let used = JSON.parse(localStorage.getItem('USED')) || {};

if (supply.length == 0) {
    localStorage.setItem('SUPPLY', JSON.stringify(supply0))
    supply = JSON.parse(localStorage.getItem('SUPPLY'));

}

if (Object.keys(used).length == 0) {
    supply.forEach(item => {
        used[item.id] = 0;
    });
    localStorage.setItem('USED', JSON.stringify(used))
}

let selectedItem = null;

function getParams() {
    const p = new URLSearchParams(window.location.search);
    const p_iterator = p.entries();
    const kv_pairs = [...p_iterator];
    let params = {};
    params['params'] = Object.fromEntries(kv_pairs);
    params['url'] = window.location.href;
    return params;
}

function searchItems() {
    const query = document.getElementById('searchBar').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (query) {
        //const filteredData = supply.filter(thing => thing.item.toLowerCase().includes(query));
        const filteredData = supply.filter(thing => {
            if (thing.item.toLowerCase().includes(query)) {
                return true;
            }
            else if (thing.id.includes(query)) {
                return true;
            }
            else if (thing.number.includes(query)) {
                return true;
            }
            return false;
        });
        filteredData.forEach(item => {
            const resultItem = document.createElement('p');
            const qty = item.qtyInitial - used[item.id];
            resultItem.textContent = `${item.number}:${item.id}:${item.item.slice(0, 40)}${item.item.length > 40 ? '...' : ''} -- Qty: ${qty} (${item.unit})`;
            resultItem.onclick = () => selectItem(item);
            resultsContainer.appendChild(resultItem);
        });
    }
}


function selectItem(item) {
    selectedItem = item;
    document.getElementById('searchBar').value = item.item;
    document.getElementById('results').innerHTML = '';
    const qty = item.qtyInitial - used[item.id];
    document.getElementById('selectedItemName').textContent = `${item.item} / ${qty} (${item.unit})`;
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
    displayUsageLog();
    resetForm();
}

function saveUsageLog(logEntry) {
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    usageLog.push(logEntry);
    localStorage.setItem('usageLog', JSON.stringify(usageLog));

    used[logEntry.id] += logEntry.quantity
    localStorage.setItem('USED', JSON.stringify(used))
}

function updateUsedByItemID_Amount(id, amount) {
    used[id] = used[id] + amount;
    localStorage.setItem('USED', JSON.stringify(used));
}

function updateUsedByLogEntry(logEntry) {
    updateUsedByItemID_Amount(logEntry.id, logEntry.quantity);
}

function displayUsageLog() {
    const p = getParams();
    p.url = p.url.replace(/\?.*/, '');
    const usageLog = JSON.parse(localStorage.getItem('usageLog')) || [];
    const usageLogTableBody = document.getElementById('usageLog').querySelector('tbody');
    usageLogTableBody.innerHTML = '';

    // Sort log entries in reverse chronological order
    usageLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    usageLog.forEach((entry) => {

        const truncatedItemName = entry.item.length > 40 ? entry.item.slice(0, 40) + '...' : entry.item;

        const row = document.createElement('tr');
        let qty_initial = supply.filter(item => item.id == entry.id)[0]['qtyInitial'];
        let qty_used_total = used[entry.id].toFixed(2).replace(/\.00$/, '');
        let qty_used_now = entry.quantity.toFixed(2).replace(/\.00$/, '');
        row.innerHTML = `
            <td><a href="${p.url}?id=${entry.id}" class="undecorated-link">${truncatedItemName}</a></td>
            <td>${qty_used_now}</td>
            <td>${qty_used_total}/${qty_initial}</td>
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
        const newQuantityText = prompt(`Edit quantity for ${entry.item}:`, entry.quantity);
        let newQuantity;
        try {
            newQuantity = eval(newQuantityText);
        }
        catch(err) {
            alert('Please enter a valid number for the quantity.');
            return;
        }

        if ((newQuantity !== oldQuantity) && (newQuantity != null)){
            entry.quantity = newQuantity;
            localStorage.setItem('usageLog', JSON.stringify(usageLog));
            updateUsedByItemID_Amount(entryId, newQuantity - oldQuantity);
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
        updateUsedByItemID_Amount(entryToDel[0].id, 0 - entryToDel[0].quantity);
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
    let csvContent = "Time-Stamp,Drug-Id,Used,TotalUsed,Supply,Leftover,Drug-Name\n";
    usageLog.forEach(entry => {
        const drugName = entry.item ? `"${entry.item.replace(/"/g, '""')}"` : ''; // Handling undefined item
        const timestamp = `"${entry.timestamp.replace(/"/g, '""')}"`; // Handling commas in timestamp
        const q_used_now = entry.quantity;
        const q_used_total = used[entry.id];
        const q_supply = supply.filter(item => item.id == entry.id)[0].qtyInitial;
        const q_leftover = q_supply - q_used_total;
        csvContent = csvContent + `${timestamp},${entry.id},${q_used_now},${q_used_total},${q_supply},${q_leftover},${drugName}` + "\n";
    });

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
    const supply = JSON.parse(localStorage.getItem('SUPPLY')) || [];
    const used = JSON.parse(localStorage.getItem('USED')) || [];
    if (supply.length == 0) {
        return;
    }
    for (i in supply) {
        supply[i]['qtyInitial'] = supply[i]['qtyInitial'] - used[supply[i].id];
    }

    let csv = "";
    csvHeadline = sheet_columns.join(",");
    csv = csv + csvHeadline + "\n";
    for (let i in supply) {
        let row = [];
        for (j in data_columns) {
            row.push(supply[i][data_columns[j]]);
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
