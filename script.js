document.addEventListener("DOMContentLoaded", () => {
    const map = L.map('map').setView([0, 0], 2);
    const events = JSON.parse(localStorage.getItem("events")) || [];
    const newsApiKey = '6ff76f15ddcd47168df8629e9c6e4164';

    let currentMarker = null;
    let editEventId = null;

    // Initialize Leaflet Map
    function initMap() {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('click', e => {
            const { lat, lng } = e.latlng;
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }
            currentMarker = L.marker([lat, lng]).addTo(map);
            document.getElementById("event-location").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        });
    }

    // Display Events
    function displayEvents() {
        const filteredEvents = filterEvents();
        const eventsList = document.getElementById("events-list");
        eventsList.innerHTML = "";
        filteredEvents.forEach(event => {
            const eventElement = document.createElement("div");
            eventElement.classList.add("event");
            eventElement.innerHTML = `
                <h3>${event.title}</h3>
                <p>Date: ${event.date}</p>
                <p>Type: ${event.type}</p>
                <p>${event.description}</p>
                <p>Location: <a href="https://www.google.com/maps?q=${event.lat},${event.lng}" target="_blank">${event.lat}, ${event.lng}</a></p>
                <div class="event-buttons">
                    <button onclick="editEvent(${event.id})">Edit</button>
                    <button onclick="deleteEvent(${event.id})">Delete</button>
                </div>
            `;
            eventsList.appendChild(eventElement);
        });

        // Update Date Filter Options
        const dates = [...new Set(events.map(event => event.date))];
        const dateFilter = document.getElementById("date-filter");
        dateFilter.innerHTML = '<option value="all">All Dates</option>';
        dates.forEach(date => {
            dateFilter.innerHTML += `<option value="${date}">${date}</option>`;
        });
    }

    // Add Event
    function addEvent(event) {
        event.preventDefault();

        const title = document.getElementById("event-title").value;
        const date = document.getElementById("event-date").value;
        const type = document.getElementById("event-type").value;
        const description = document.getElementById("event-description").value;
        const location = document.getElementById("event-location").value.split(',').map(coord => coord.trim());

        const eventData = {
            id: Date.now(),
            title,
            date,
            type,
            description,
            lat: location[0],
            lng: location[1]
        };

        if (editEventId !== null) {
            // Edit existing event
            const eventIndex = events.findIndex(e => e.id```javascript
            === editEventId);
            events[eventIndex] = eventData;
            editEventId = null;
        } else {
            // Add new event
            events.push(eventData);
        }

        localStorage.setItem("events", JSON.stringify(events));
        displayEvents();
        document.getElementById("event-form-section").style.display = "none";
    }

    // Edit Event
    window.editEvent = function(id) {
        const event = events.find(e => e.id === id);
        document.getElementById("event-title").value = event.title;
        document.getElementById("event-date").value = event.date;
        document.getElementById("event-type").value = event.type;
        document.getElementById("event-description").value = event.description;
        document.getElementById("event-location").value = `${event.lat}, ${event.lng}`;
        document.getElementById("form-title").textContent = "Edit Event";
        document.getElementById("event-form-section").style.display = "block";
        editEventId = id;
    }

    // Delete Event
    window.deleteEvent = function(id) {
        const confirmDelete = confirm("Are you sure you want to delete this event?");
        if (confirmDelete) {
            events = events.filter(event => event.id !== id);
            localStorage.setItem("events", JSON.stringify(events));
            displayEvents();
        }
    }

    // Fetch News
    function fetchNews() {
        fetch(`https://newsapi.org/v2/everything?q=events&apiKey=${newsApiKey}`)
            .then(response => response.json())
            .then(data => {
                const articles = data.articles;
                const newsList = document.getElementById("news-list");
                newsList.innerHTML = "";
                articles.forEach(article => {
                    const newsItem = document.createElement("div");
                    newsItem.classList.add("news-item");
                    newsItem.innerHTML = `
                        <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                        <p>${article.description}</p>
                        <p><small>Source: ${article.source.name}</small></p>
                    `;
                    newsList.appendChild(newsItem);
                });
            })
            .catch(error => console.error('Error fetching news:', error));
    }

    // Show Route
    function showRoute() {
        const location = document.getElementById("event-location").value.split(',').map(coord => coord.trim());
        if (location.length === 2) {
            L.Routing.control({
                waypoints: [
                    L.latLng(map.getCenter().lat, map.getCenter().lng),
                    L.latLng(location[0], location[1])
                ],
                createMarker: function() { return null; },
                routeWhileDragging: true
            }).addTo(map);
        } else {
            alert("Please enter a valid location.");
        }
    }

    // Show Current Location
    function showCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 13);
                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }
                currentMarker = L.marker([latitude, longitude]).addTo(map);
            }, error => console.error("Error getting location:", error));
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

    // Filter Events
    function filterEvents() {
        const searchTerm = document.getElementById("search").value.toLowerCase();
        const dateFilter = document.getElementById("date-filter").value;
        const typeFilter = document.getElementById("type-filter").value;

        return events.filter(event => {
            const matchSearch = event.title.toLowerCase().includes(searchTerm) || event.description.toLowerCase().includes(searchTerm);
            const matchDate = dateFilter === "all" || event.date === dateFilter;
            const matchType = typeFilter === "all" || event.type === typeFilter;
            return matchSearch && matchDate && matchType;
        });
    }

    // Event Listeners
    document.getElementById("event-form").addEventListener("submit", addEvent);
    document.getElementById("add-event-btn").addEventListener("click", () => {
        document.getElementById("form-title").textContent = "Add Event";
        document.getElementById("event-form-section").style.display = "block";
        editEventId = null;
    });
    document.getElementById("cancel-btn").addEventListener("click", () => {
        document.getElementById("event-form-section").style.display = "none";
        editEventId = null;
    });
    document.getElementById("open-google-maps-btn").addEventListener("click", () => {
        const location = document.getElementById("event-location").value.split(',').map(coord => coord.trim());
        if (location.length === 2) {
            window.open(`https://www.google.com/maps?q=${location[0]},${location[1]}`, '_blank');
        }
    });
    document.getElementById("show-route-btn").addEventListener("click", showRoute);
    document.getElementById("current-location-btn").addEventListener("click", showCurrentLocation);
    document.getElementById("search").addEventListener("input", () => displayEvents());
    document.getElementById("date-filter").addEventListener("change", () => displayEvents());
    document.getElementById("type-filter").addEventListener("change", () => displayEvents());

    // Initialize
    initMap();
    displayEvents();
    fetchNews();
});
