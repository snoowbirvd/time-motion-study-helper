// --- Class Definitions ---
class TableEntry {
    constructor() {
        this.element = "";
        this.category = "";
        this.startTime = "";
        this.stopTime = "";
        this.observedTime = "";
        this.rating = "";
        this.normalTime = "";
        this.notes = "";
    }
}

// --- Global Variables ---
let elapsedTimer = new Timer();
let currentProcessTimer = new Timer();
let table = [];
let elements = [];
let currentElement = null;
let isDelayActive = false;

const TIMER_UPDATE_INTERVAL_MILLISECONDS = 50;
const MILISECONDS_PER_HOUR = 3600000;

// --- DOM Element References ---
const elementInput = document.getElementById('element-input');
const addElementButton = document.getElementById('add-element-button');
const elementList = document.getElementById('element-list');
const categoryInput = document.getElementById('category-input');
const notesInput = document.getElementById('notes-input');
const ratingInput = document.getElementById('rating-input');
const startButton = document.getElementById('start-button'); // This button is now decorative
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const clearButton = document.getElementById('clear-button');
const exportButton = document.getElementById('export-button');
const delayButton = document.getElementById('delay-button');
const entriesTable = document.getElementById('entries-table');
const totalTimeDisplay = document.getElementById('stopwatch-total-elapsed-time');
const processTimeDisplay = document.getElementById('stopwatch-current-process-time');
const currentTaskDisplay = document.getElementById('current-task-display');
const elementProgress = document.getElementById('element-progress');
const elementProgressText = document.getElementById('element-progress-text');

// --- Event Listeners ---
addElementButton.addEventListener('click', addElement);
elementInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addElement();
    }
});
pauseButton.addEventListener('click', pauseTimer);
delayButton.addEventListener('click', handleDelay);
resetButton.addEventListener('click', resetTimers);
clearButton.addEventListener('click', clearTable);
exportButton.addEventListener('click', exportToCSV);

// --- Functions ---
function addElement() {
    const elementName = elementInput.value.trim();
    if (elementName && !elements.includes(elementName)) {
        elements.push(elementName);
        elementInput.value = '';
        renderElements();
        updateElementProgress();
    }
}

function renderElements() {
    elementList.innerHTML = '';
    elements.forEach(element => {
        const li = document.createElement('li');
        li.textContent = element;
        
        // Add a visual indicator of which elements have been timed
        if (element === currentElement) {
            li.classList.add('active-element');
        } else if (table.some(entry => entry.element === element)) {
            li.classList.add('completed-element');
        }
        
        // Add a play icon to make it obvious these are clickable
        const playIcon = document.createElement('span');
        playIcon.innerHTML = ' ▶️';
        playIcon.className = 'play-icon';
        li.appendChild(playIcon);
        
        li.addEventListener('click', () => startElementTimer(element));
        elementList.appendChild(li);
    });
}

function startElementTimer(elementName) {
    if (currentProcessTimer.isActive() && !currentProcessTimer.isPaused()) {
        // Provide visual feedback that we're logging the previous process
        showTransitionNotification(`Finished timing "${currentElement}". Now timing "${elementName}"`);
        logProcess();
    }
    
    // Clear any previous active element styling
    const elements = document.querySelectorAll('#element-list li');
    elements.forEach(el => {
        if (el.textContent.includes(currentElement)) {
            el.classList.remove('active-element');
            el.classList.add('completed-element');
        }
        if (el.textContent.includes(elementName)) {
            el.classList.add('active-element');
        }
    });
    
    currentElement = elementName;
    isDelayActive = false;
    startTimer();
    
    // Update the current task display
    currentTaskDisplay.textContent = elementName;
}

function handleDelay() {
    if (currentProcessTimer.isActive() && !currentProcessTimer.isPaused()) {
        showTransitionNotification(`Pausing "${currentElement}" for a delay period`);
        logProcess();
    }
    
    // Clear any previous active element styling
    const elements = document.querySelectorAll('#element-list li');
    elements.forEach(el => {
        if (el.textContent.includes(currentElement)) {
            el.classList.remove('active-element');
            el.classList.add('completed-element');
        }
    });
    
    currentElement = "Delay";
    isDelayActive = true;
    startTimer();
    
    // Update the current task display
    currentTaskDisplay.textContent = "⏸️ DELAY";
}

function showTransitionNotification(message) {
    // Create a notification div
    const notification = document.createElement('div');
    notification.className = 'transition-notification';
    notification.textContent = message;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Automatically remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

function startTimer() {
    if (!elapsedTimer.isActive() || elapsedTimer.isPaused()) {
        elapsedTimer.start();
    }
    // The corrected Timer.js `stop` method makes this safe
    currentProcessTimer.stop(); 
    currentProcessTimer.start();
    updateButtonStates();
}

function pauseTimer() {
    if (!currentProcessTimer.isActive()) return;
    elapsedTimer.pause();
    currentProcessTimer.pause();
    showTransitionNotification(`Paused timing of "${currentElement}"`);
    updateButtonStates();
}

function logProcess() {
    if (!currentProcessTimer.isActive()) return;

    // Store the current time before stopping the timer
    const stopTime = new Date();
    
    // CRITICAL FIX: Get the elapsed time BEFORE stopping the timer
    const elapsedTimeInMs = currentProcessTimer.getElapsedTime();
    
    // Now we can safely stop the timer
    currentProcessTimer.stop();
    
    let entry = new TableEntry();
    
    // Calculate start time by subtracting elapsed time from stop time
    const startTime = new Date(stopTime.getTime() - elapsedTimeInMs);
    
    const rating = isDelayActive ? 100 : parseInt(ratingInput.value) || 100;
    const normalTimeMs = (elapsedTimeInMs * rating) / 100;

    entry.element = currentElement || "N/A";
    entry.category = categoryInput.value;
    
    // Use a more precise time format that includes seconds
    entry.startTime = formatDateTime(startTime);
    entry.stopTime = formatDateTime(stopTime);
    
    entry.observedTime = timeToString(elapsedTimeInMs);
    entry.rating = isDelayActive ? "N/A" : `${rating}%`;
    entry.normalTime = isDelayActive ? entry.observedTime : timeToString(normalTimeMs);
    entry.notes = notesInput.value;

    // For debugging
    console.log("Elapsed time:", elapsedTimeInMs, "ms");
    console.log("Observed time:", entry.observedTime);

    table.push(entry);
    insertRowIntoTable(entriesTable, entry);
    notesInput.value = "";
    updateElementProgress();
}

// Helper function to format date and time consistently
function formatDateTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

function resetTimers() {
    if (currentProcessTimer.isActive()) {
        logProcess();
    }
    elapsedTimer.stop();
    currentProcessTimer.stop();
    updateButtonStates();
    
    // Clear visual indicators
    const elements = document.querySelectorAll('#element-list li');
    elements.forEach(el => {
        el.classList.remove('active-element');
    });
    
    currentElement = null;
    isDelayActive = false;
    currentTaskDisplay.textContent = "None";
    showTransitionNotification("Timers have been reset");
}

function clearTable() {
    if (confirm("Are you sure you want to clear all recorded data? This cannot be undone.")) {
        resetTimers();
        table = [];
        entriesTable.getElementsByTagName('tbody')[0].innerHTML = '';
        updateElementProgress();
        showTransitionNotification("All recorded data has been cleared");
    }
}

function insertRowIntoTable(domReference, entry) {
    let newRow = domReference.tBodies[0].insertRow();
    newRow.classList.add('recent-entry'); // Highlight the new row temporarily
    
    newRow.insertCell(0).textContent = entry.element;
    newRow.insertCell(1).textContent = entry.category;
    newRow.insertCell(2).textContent = entry.startTime;
    newRow.insertCell(3).textContent = entry.stopTime;
    newRow.insertCell(4).textContent = entry.observedTime;
    newRow.insertCell(5).textContent = entry.rating;
    newRow.insertCell(6).textContent = entry.normalTime;
    newRow.insertCell(7).textContent = entry.notes;
    
    // Scroll to the new row
    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateButtonStates() {
    const isRunning = currentProcessTimer.isActive() && !currentProcessTimer.isPaused();
    const isPaused = currentProcessTimer.isPaused();

    // The main "Start" button is effectively disabled as tasks are started from the element list
    startButton.disabled = true; 
    
    if (isRunning) {
        pauseButton.disabled = false;
        delayButton.disabled = false;
        pauseButton.textContent = "Pause";
    } else if (isPaused) {
        pauseButton.disabled = false;
        delayButton.disabled = false; // You can start a delay from pause
        pauseButton.textContent = "Resume";
    } else { // Stopped
        pauseButton.disabled = true;
        delayButton.disabled = false;
        pauseButton.textContent = "Pause";
    }
}

function timeToString(time) {
    if (typeof time !== 'number' || time < 0) return "00:00:00.000";
    
    let remainder = time;
    let hh = Math.floor(remainder / 3600000);
    remainder %= 3600000;
    let mm = Math.floor(remainder / 60000);
    remainder %= 60000;
    let ss = Math.floor(remainder / 1000);
    let ms = remainder % 1000;

    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function exportToCSV() {
    if (table.length === 0) {
        alert("No data to export!");
        return;
    }
    
    const headers = ["Element", "Category", "Start Time", "Stop Time", "Observed Time", "Rating", "Normal Time", "Notes"];
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    
    table.forEach(entry => {
        let row = [
            entry.element,
            entry.category,
            entry.startTime,
            entry.stopTime,
            entry.observedTime,
            entry.rating,
            entry.normalTime,
            `"${entry.notes.replace(/"/g, '""')}"`  // Properly escape quotes in notes
        ];
        csvContent += row.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "time_study_export_" + new Date().toISOString().slice(0,10) + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showTransitionNotification("Data exported to CSV file");
}

function updateElementProgress() {
    const totalElements = elements.length;
    const completedElements = new Set();
    
    table.forEach(entry => {
        if (entry.element !== "Delay") {
            completedElements.add(entry.element);
        }
    });
    
    const completionPercentage = totalElements > 0 
        ? Math.round((completedElements.size / totalElements) * 100) 
        : 0;
    
    elementProgress.style.width = completionPercentage + '%';
    elementProgressText.textContent = 
        `${completedElements.size}/${totalElements} (${completionPercentage}%)`;
}

// --- Initial Setup ---
setInterval(() => {
    totalTimeDisplay.textContent = timeToString(elapsedTimer.getElapsedTime());
    processTimeDisplay.textContent = timeToString(currentProcessTimer.getElapsedTime());
}, TIMER_UPDATE_INTERVAL_MILLISECONDS);

updateButtonStates();
startButton.textContent = "Click Elements to Start"; // Clarify UI
updateElementProgress();