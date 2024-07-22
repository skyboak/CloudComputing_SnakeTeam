document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('TeamGraph.html')) {
        const userActionMetrics = JSON.parse(localStorage.getItem('userActionMetrics'));
        if (userActionMetrics) {
            displayTotalActionsChart(userActionMetrics);
            displayActionDistributionChart(userActionMetrics);
            displayActionsPerDayChart(userActionMetrics);
        }
    } else if (window.location.pathname.endsWith('notifications.html')) {
        displayNotifications();
    } else {
        document.getElementById('jsonUploadForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the form from submitting via the browser
            uploadJson();
        });
    }
});

function uploadJson() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const jsonObj = JSON.parse(event.target.result);
                console.log('JSON Object:', jsonObj);
                parseJson(jsonObj);
            } catch (e) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(fileInput.files[0]);
    } else {
        alert('Please select a file');
    }
}

function parseJson(jsonObj) {
    const actions = ["Add", "Cancel", "Close", "Commit", "Copy", "Delete", "Drag", "Edit", "Insert"];
    const userActionMetrics = {};

    jsonObj.forEach(entry => {
        const user = entry.User;
        const description = entry.Description;

        if (!userActionMetrics[user]) {
            userActionMetrics[user] = { totalActions: 0, actionTypes: {}, actionsPerDay: {} };
            actions.forEach(action => userActionMetrics[user].actionTypes[action] = 0);
        }

        userActionMetrics[user].totalActions++;

        actions.forEach(action => {
            if (description.includes(action)) {
                userActionMetrics[user].actionTypes[action]++;
            }
        });

        const date = new Date(entry.Time).toDateString();
        if (!userActionMetrics[user].actionsPerDay[date]) {
            userActionMetrics[user].actionsPerDay[date] = 0;
        }
        userActionMetrics[user].actionsPerDay[date]++;
    });

    localStorage.setItem('userActionMetrics', JSON.stringify(userActionMetrics));
    window.location.href = 'TeamGraph.html';
}

function displayTotalActionsChart(metrics) {
    const ctx = document.getElementById('totalActionsChart').getContext('2d');
    const labels = Object.keys(metrics);
    const data = labels.map(user => metrics[user].totalActions);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Total Actions',
                data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function displayActionDistributionChart(metrics) {
    const ctx = document.getElementById('actionDistributionChart').getContext('2d');
    const labels = Object.keys(metrics);
    const actionTypes = Object.keys(metrics[labels[0]].actionTypes);

    const datasets = actionTypes.map(action => ({
        label: action,
        data: labels.map(user => metrics[user].actionTypes[action]),
        backgroundColor: getRandomColor(),
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
    }));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets
        },
        options: {
            scales: {
                y: { beginAtZero: true },
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

function displayActionsPerDayChart(metrics) {
    const ctx = document.getElementById('actionsPerDayChart').getContext('2d');
    const labels = Object.keys(metrics);
    const allDates = [];

    labels.forEach(user => {
        Object.keys(metrics[user].actionsPerDay).forEach(date => {
            if (!allDates.includes(date)) {
                allDates.push(date);
            }
        });
    });

    const datasets = labels.map(user => ({
        label: user,
        data: allDates.map(date => metrics[user].actionsPerDay[date] || 0),
        fill: false,
        borderColor: getRandomColor(),
        tension: 0.1
    }));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: allDates,
            datasets
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, 0.5)`;
}

// Notifications related functions
const notifications = [
    { id: 1, type: 'System Alert', message: 'System maintenance at 12:00 AM.', timestamp: '2024-07-22 10:00:00', read: false },
    { id: 2, type: 'User Activity', message: 'User John Doe uploaded a new file.', timestamp: '2024-07-22 09:30:00', read: true },
    // Add more notifications here
];

let currentPage = 1;
const notificationsPerPage = 5;

function displayNotifications() {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    const currentNotifications = notifications.slice(startIndex, endIndex);

    currentNotifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item' + (notification.read ? ' read' : ' unread');
        notificationItem.innerHTML = `
            <h3>${notification.type}</h3>
            <p>${notification.message}</p>
            <span>${notification.timestamp}</span>
            <button onclick="markAsRead(${notification.id})">Mark as Read</button>
            <button onclick="deleteNotification(${notification.id})">Delete</button>
        `;
        notificationList.appendChild(notificationItem);
    });

    updatePageInfo();
}

function updatePageInfo() {
    const pageInfo = document.getElementById('pageInfo');
    const totalPages = Math.ceil(notifications.length / notificationsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

window.markAsRead = function(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        displayNotifications();
    }
};

window.deleteNotification = function(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications.splice(index, 1);
        displayNotifications();
    }
};

window.prevPage = function() {
    if (currentPage > 1) {
        currentPage--;
        displayNotifications();
    }
};

window.nextPage = function() {
    const totalPages = Math.ceil(notifications.length / notificationsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayNotifications();
    }
};

function filterNotifications() {
    const searchValue = document.getElementById('searchNotifications').value.toLowerCase();
    const filteredNotifications = notifications.filter(notification =>
        notification.message.toLowerCase().includes(searchValue) ||
        notification.type.toLowerCase().includes(searchValue)
    );
    displayFilteredNotifications(filteredNotifications);
}

function displayFilteredNotifications(filteredNotifications) {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';
    filteredNotifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item' + (notification.read ? ' read' : ' unread');
        notificationItem.innerHTML = `
            <h3>${notification.type}</h3>
            <p>${notification.message}</p>
            <span>${notification.timestamp}</span>
            <button onclick="markAsRead(${notification.id})">Mark as Read</button>
            <button onclick="deleteNotification(${notification.id})">Delete</button>
        `;
        notificationList.appendChild(notificationItem);
    });
}

