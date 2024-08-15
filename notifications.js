document.addEventListener('DOMContentLoaded', function() {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
        notifications.push(...JSON.parse(savedNotifications));
    }
    displayNotifications();
});

const notifications = [];
let currentPage = 1;
const notificationsPerPage = 5;

function displayNotifications(filteredNotifications = notifications) {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

    currentNotifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item' + (notification.read ? ' read' : ' unread');
        notificationItem.innerHTML = `
            <h3>${notification.type}</h3>
            <p>${notification.message}</p>
            <span>${notification.timestamp}</span>
            <div class="notification-actions">
                <button onclick="markAsRead(${notification.id})">Mark as Read</button>
                <button onclick="deleteNotification(${notification.id})">Delete</button>
            </div>
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
        filterNotifications();
    }
};

window.deleteNotification = function(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications.splice(index, 1);
        filterNotifications();
    }
};

window.prevPage = function() {
    if (currentPage > 1) {
        currentPage--;
        filterNotifications();
    }
};

window.nextPage = function() {
    const totalPages = Math.ceil(notifications.length / notificationsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        filterNotifications();
    }
};

function filterNotifications() {
    const searchValue = document.getElementById('searchNotifications').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.message.toLowerCase().includes(searchValue) || notification.type.toLowerCase().includes(searchValue);
        const matchesType = filterType === '' || notification.type === filterType;
        return matchesSearch && matchesType;
    });

    displayNotifications(filteredNotifications);
}
