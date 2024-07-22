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
    } else if (window.location.pathname.endsWith('glossary.html')) {
        const savedJson = localStorage.getItem('uploadedJson');
        if (savedJson) {
            const jsonData = JSON.parse(savedJson);
            parseGlossary(jsonData);
        }
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
                localStorage.setItem('uploadedJson', JSON.stringify(jsonObj));
                parseJson(jsonObj);
                alert('JSON file uploaded and processed.');
                if (window.location.pathname.endsWith('notifications.html')) {
                    displayNotifications();
                }
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
function displayNotifications() {
    const savedJson = localStorage.getItem('uploadedJson');
    if (!savedJson) {
        alert('No notifications available. Please upload a JSON file.');
        return;
    }

    const jsonData = JSON.parse(savedJson);
    const notifications = jsonData.filter(entry => entry.Description.toLowerCase().includes('notification'));
    const notificationList = document.getElementById('notificationList');
    const notificationsPerPage = 5;
    let currentPage = 1;

    function renderNotifications(filteredNotifications) {
        notificationList.innerHTML = '';
        const startIndex = (currentPage - 1) * notificationsPerPage;
        const endIndex = startIndex + notificationsPerPage;
        const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

        currentNotifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-item' + (notification.read ? ' read' : ' unread');
            notificationItem.innerHTML = `
                <h3>${notification.type}</h3>
                <p>${notification.Description}</p>
                <span>${notification.Time}</span>
                <button onclick="markAsRead(${notification.id})">Mark as Read</button>
                <button onclick="deleteNotification(${notification.id})">Delete</button>
            `;
            notificationList.appendChild(notificationItem);
        });

        updatePageInfo(filteredNotifications);
    }

    function updatePageInfo(filteredNotifications) {
        const pageInfo = document.getElementById('pageInfo');
        const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    window.markAsRead = function(id) {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            renderNotifications(notifications);
        }
    };

    window.deleteNotification = function(id) {
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications.splice(index, 1);
            renderNotifications(notifications);
        }
    };

    window.prevPage = function() {
        if (currentPage > 1) {
            currentPage--;
            renderNotifications(notifications);
        }
    };

    window.nextPage = function() {
        const totalPages = Math.ceil(notifications.length / notificationsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderNotifications(notifications);
        }
    };

    function filterNotifications() {
        const searchValue = document.getElementById('searchNotifications').value.toLowerCase();
        const filterType = document.getElementById('filterType').value;

        const filteredNotifications = notifications.filter(notification => {
            const matchesSearch = notification.Description.toLowerCase().includes(searchValue);
            const matchesType = filterType === '' || notification.type === filterType;
            return matchesSearch && matchesType;
        });

        renderNotifications(filteredNotifications);
    }

    document.getElementById('searchNotifications').addEventListener('keyup', filterNotifications);
    document.getElementById('filterType').addEventListener('change', filterNotifications);

    renderNotifications(notifications);
}

// Glossary related functions
function parseGlossary(jsonData) {
    const actions = ["Add", "Cancel", "Close", "Commit", "Copy", "Delete", "Drag", "Edit", "Insert"];
    const userActionCount = {};

    jsonData.forEach(entry => {
        const user = entry.User;
        const description = entry.Description;

        actions.forEach(action => {
            if (description.includes(action)) {
                if (!userActionCount[action]) {
                    userActionCount[action] = {};
                }
                if (!userActionCount[action][user]) {
                    userActionCount[action][user] = 0;
                }
                userActionCount[action][user]++;
            }
        });
    });

    const glossaryTable = document.getElementById('glossaryTable');
    glossaryTable.innerHTML = ''; // Clear default values

    const descriptions = {
        "Add": "Introduce a new element or feature. - Example: \"Add part studio feature.\"",
        "Cancel": "Abort an ongoing operation. - Example: \"Cancel Operation.\"",
        "Close": "Exit a document or tab. - Example: \"Tab Part Studio 3 of type PARTSTUDIO closed.\"",
        "Commit": "Confirm the addition or modification of a feature. - Example: \"Commit add or edit of part studio feature.\"",
        "Copy": "Duplicate an element or feature. - Example: \"Copy paste sketch.\"",
        "Delete": "Remove an existing element or feature. - Example: \"Delete part studio feature.\"",
        "Drag": "Move an element by clicking and holding it. - Example: \"Drag: instance.\"",
        "Edit": "Modify an existing element or feature. - Example: \"Edit: Sketch 1.\"",
        "Insert": "Place a new feature at a specified location."
    };

    for (const action in userActionCount) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${action}</td><td>${descriptions[action]}</td><td><details><summary>Details</summary><ul id="${action}List"></ul></details></td>`;
        glossaryTable.appendChild(row);

        const actionList = document.getElementById(`${action}List`);
        const sortedUsers = Object.entries(userActionCount[action]).sort((a, b) => b[1] - a[1]);
        sortedUsers.forEach(([user, count]) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${user.padEnd(10)}: ${count.toString().padStart(4)}`;
            actionList.appendChild(listItem);
        });
    }
}
