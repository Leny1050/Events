document.addEventListener("DOMContentLoaded", () => {
    const events = JSON.parse(localStorage.getItem("events")) || [];
    const map = L.map('map').setView([0, 0], 2);
    let currentMarker = null;
    let routeControl = null;
    const newsApiKey = '6ff76f15ddcd47168df8629e9c6e4164';
    const eventFormContainer = document.getElementById("event-form-section");
    const eventForm = document.getElementById("event-form");
    const formTitle = document.getElementById("form-title");
    const addEventBtn = document.getElementById("add-event-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const openGoogleMapsBtn = document.getElementById("open-google-maps-btn");
    const showRouteBtn = document.getElementById("show-route-btn");
    const currentLocationBtn = document.getElementById("current-location-btn");
    const searchInput = document.getElementById("search");
    const dateFilter = document.getElementById("date-filter");
    const typeFilter = document.getElementById("type-filter");
    const eventsList = document.getElementById("events-list");
    const newsList = document.getElementById("news-list");

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
        eventsList.innerHTML = "";
        events.forEach(event => {
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
        dateFilter.innerHTML = '<option value="all">All Dates</option>';
        dates.forEach(date => {
            dateFilter.innerHTML += `<option value="${date}">${date}</option>`;
        });
    }

    // Add Event
    function addEvent(event) {
        event.preventDefault();

        const title = document.getElementById("event-title").value;
       ```javascript
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
            const eventIndex = events.findIndex(e => e.id === editEventId);
            events[eventIndex] = eventData;
            editEventId = null;
        } else {
            // Add new event
            events.push(eventData);
        }

        localStorage.setItem("events", JSON.stringify(events));
        displayEvents();
        eventFormContainer.style.display = "none";
    }

    // Edit Event
    function editEvent(id) {
        const event = events.find(e => e.id === id);
        document.getElementById("event-title").value = event.title;
        document.getElementById("event-date").value = event.date;
        document.getElementById("event-type").value = event.type;
        document.getElementById("event-description").value = event.description;
        document.getElementById("event-location").value = `${event.lat}, ${event.lng}`;
        formTitle.textContent = "Edit Event";
        eventFormContainer.style.display = "block";
        editEventId = id;
    }

    // Delete Event
    function deleteEvent(id) {
        events = events.filter(event => event.id !== id);
        localStorage.setItem("events", JSON.stringify(events));
        displayEvents();
    }

    // Fetch News
    function fetchNews() {
        fetch(`https://newsapi.org/v2/everything?q=events&apiKey=${newsApiKey}`)
            .then(response => response.json())
            .then(data => {
                const articles = data.articles;
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
        if (routeControl) {
            map.removeControl(routeControl);
        }
        const location = document.getElementById("event-location").value.split(',').map(coord => coord.trim());
        if (location.length === 2) {
            routeControl = L.Routing.control({
                waypoints: [
                    L.latLng(map.getCenter().lat, map.getCenter().lng),
                    L.latLng(location[0], location[1])
                ],
                createMarker: function() { return null; },
                routeWhileDragging: true
            }).addTo(map);
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

    // Event Listeners
    document.getElementById("event-form").addEventListener("submit", addEvent);
    document.getElementById("add-event-btn").addEventListener("click", () => {
        formTitle.textContent = "Add Event";
        eventFormContainer.style.display = "block";
        editEventId = null;
    });
    document.getElementById("cancel-btn").addEventListener("click", () => {
        eventFormContainer.style.display = "none";
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
    document.getElementById("search").addEventListener("input", () => {
        const searchTerm = document.getElementById("search").value.toLowerCase();
        const filteredEvents = events.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm)
        );
        displayEvents(filteredEvents);
    });
    document.getElementById("date-filter").addEventListener("change", () => {
        const filterValue = document.getElementById("date-filter").value;
        const filteredEvents = filterValue === "all"
            ? events
            : events.filter(event => event.date === filterValue);
        displayEvents(filteredEvents);
    });
    document.getElementById("type-filter").addEventListener("change", () => {
        const filterValue = document.getElementById("type-filter").value;
        const filteredEvents = filterValue === "all"
            ? events
            : events.filter(event => event.type === filterValue);
        displayEvents(filteredEvents);
    });

    // Initialize
    initMap();
    displayEvents();
    fetchNews();
});
