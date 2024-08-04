document.addEventListener("DOMContentLoaded", function() {
    const events = JSON.parse(localStorage.getItem("events")) || [];
    const calendar = document.getElementById("events-list");
    const searchInput = document.getElementById("search");
    const dateFilter = document.getElementById("date-filter");
    const typeFilter = document.getElementById("type-filter");
    const eventFormContainer = document.getElementById("event-form-container");
    const eventForm = document.getElementById("event-form");
    const formTitle = document.getElementById("form-title");
    const addEventBtn = document.getElementById("add-event-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const eventLocationInput = document.getElementById("event-location");
    const openGoogleMapsBtn = document.getElementById("open-google-maps-btn");
    const showRouteBtn = document.getElementById("show-route-btn");
    const currentLocationBtn = document.getElementById("current-location-btn");
    const newsContainer = document.getElementById("news-container");
    const newsList = document.getElementById("news-list");
    const newsApiKey = '6ff76f15ddcd47168df8629e9c6e4164';
    let editEventId = null;
    let map;
    let currentMarker = null;

    // Initialize map
    function initMap() {
        map = L.map('map').setView([0, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('click', function(e) {
            const { lat, lng } = e.latlng;

            if (currentMarker) {
                map.removeLayer(currentMarker);
            }

            currentMarker = L.marker([lat, lng]).addTo(map)
                .bindPopup(`Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
                .openPopup();

            eventLocationInput.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        });
    }

    // Show current location
    function showCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                map.setView([lat, lng], 13);

                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }

                currentMarker = L.marker([lat, lng]).addTo(map)
                    .bindPopup(`Current Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
                    .openPopup();

                eventLocationInput.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            }, () => {
                alert```javascript
                alert("Unable to retrieve your location.");
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

    function displayEvents(eventsToDisplay) {
        calendar.innerHTML = "";
        eventsToDisplay.forEach(event => {
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
            calendar.appendChild(eventElement);
        });

        // Update date filter options
        const dates = [...new Set(events.map(event => event.date))];
        dateFilter.innerHTML = '<option value="all">All</option>';
        dates.forEach(date => {
            dateFilter.innerHTML += `<option value="${date}">${date}</option>`;
        });
    }

    function addEvent(event) {
        event.preventDefault();

        const title = document.getElementById("event-title").value;
        const date = document.getElementById("event-date").value;
        const type = document.getElementById("event-type").value;
        const description = document.getElementById("event-description").value;
        const location = document.getElementById("event-location").value.split(',').map(coord => coord.trim());

        if (editEventId !== null) {
            // Editing an existing event
            const eventIndex = events.findIndex(e => e.id === editEventId);
            events[eventIndex] = {
                id: editEventId,
                title,
                date,
                type,
                description,
                lat: location[0],
                lng: location[1]
            };
            editEventId = null;
        } else {
            // Adding a new event
            events.push({
                id: Date.now(),
                title,
                date,
                type,
                description,
                lat: location[0],
                lng: location[1]
            });
        }

        localStorage.setItem("events", JSON.stringify(events));
        displayEvents(events);
        eventFormContainer.style.display = "none";
    }

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

    function deleteEvent(id) {
        events = events.filter(event => event.id !== id);
        localStorage.setItem("events", JSON.stringify(events));
        displayEvents(events);
    }

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

    function showRoute() {
        if (routeControl) {
            map.removeControl(routeControl);
        }
        const location = eventLocationInput.value.split(',').map(coord => coord.trim());
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

    function handleFormSubmit(event) {
        event.preventDefault();
        addEvent(event);
    }

    eventForm.addEventListener("submit", handleFormSubmit);
    addEventBtn.addEventListener("click", () => {
        formTitle.textContent = "Add Event";
        eventFormContainer.style.display = "block";
    });
    cancelBtn.addEventListener("click", () => {
        eventFormContainer.style.display = "none";
        editEventId = null;
    });
    openGoogleMapsBtn.addEventListener("click", () => {
        const location = eventLocationInput.value.split(',').map(coord => coord.trim());
        if (location.length === 2) {
            window.open(`https://www.google.com/maps?q=${location[0]},${location[1]}`, '_blank');
        }
    });
    showRouteBtn.addEventListener("click", showRoute);
    currentLocationBtn.addEventListener("click", showCurrentLocation);

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredEvents = events.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm)
        );
        displayEvents(filteredEvents);
    });

    dateFilter.addEventListener("change", () => {
        const filterValue = dateFilter.value;
        const filteredEvents = filterValue === "all"
            ? events
            : events.filter(event => event.date === filterValue);
        displayEvents(filteredEvents);
    });

    typeFilter.addEventListener("change", () => {
        const filterValue = typeFilter.value;
        const filteredEvents = filterValue === "all"
            ? events
            : events.filter(event => event.type === filterValue);
        displayEvents(filteredEvents);
    });

    // Initialize map and load events and news
    initMap();
    displayEvents(events);
    fetchNews();
});
