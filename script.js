document.addEventListener("DOMContentLoaded", function() {
    const events = [];
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
    let editEventId = null;
    let map;
    let currentMarker = null;
    let markers = [];
    let geocoder;
    let routeControl;

    // Инициализация карты
    function initMap() {
        map = L.map('map').setView([0, 0], 2);  // Начальная позиция и уровень зума

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        geocoder = L.Control.Geocoder.nominatim();

        // Добавляем поиск на карту
        L.Control.geocoder().addTo(map);

        // Добавляем обработчик событий для карты
        map.on('click', function(e) {
            const { lat, lng } = e.latlng;

            // Удаление предыдущего маркера
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }

            // Добавление нового маркера
            currentMarker = L.marker([lat, lng]).addTo(map)
                .bindPopup(`Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
                .openPopup();
            
            eventLocationInput.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            markers.push(currentMarker);
        });
    }

    // Показать текущее местоположение
    function showCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude: lat, longitude: lng } = position.coords;
                map.setView([lat, lng], 13);
                L.marker([lat, lng]).addTo(map)
                    .bindPopup("You are here")
                    .openPopup();
            }, () => {
                alert("Unable to retrieve your location.");
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

    function toggleEventForm() {
        eventFormContainer.style.display = eventFormContainer.style.display === 'none' ? 'block' : 'none';
    }

    function displayEvents(events) {
        calendar.innerHTML = "";
        events.forEach(event => {
            const eventElement = document.createElement("div");
            eventElement.className = "event";
            eventElement.innerHTML = `
                <h3>${event.title}</h3>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Type:</strong> ${event.type}</p>
                <p><strong>Description:</strong> ${event.description}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <div class="event-buttons">
                    <button class="edit-btn" onclick="editEvent(${event.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteEvent(${event.id})">Delete</button>
                </div>
            `;
            calendar.appendChild(eventElement);
        });
    }

    function editEvent(id) {
        const event = events.find(event => event.id === id);
        if (event) {
            editEventId = id;
            formTitle.textContent = "Edit Event";
            document.getElementById("event-title").value = event.title;
            document.getElementById("event-date").value = event.date;
            document.getElementById("event-type").value = event.type;
            document.getElementById("event-description").value = event.description;
            document.getElementById("event-location").value = event.location;
            toggleEventForm();
        }
    }

    function deleteEvent(id) {
        const index = events.findIndex(event => event.id === id);
        if (index !== -1) {
            events.splice(index, 1);
            displayEvents(events);
        }
    }

    function updateEvent(id) {
        const title = document.getElementById("event-title").value;
        const date = document.getElementById("event-date").value;
        const type = document.getElementById("event-type").value;
        const description = document.getElementById("event-description").value;
        const location = document.getElementById("event-location").value;

        const event = events.find(e => e.id === id);
        if (event) {
            event.title = title;
            event.date = date;
            event.type = type;
            event.description = description;
            event.location = location;
            displayEvents(events);
        }
        toggleEventForm();
    }

    function addEvent() {
        const title = document.getElementById("event-title").value;
        const date = document.getElementById("event-date").value;
        const type = document.getElementById("event-type").value;
        const description = document.getElementById("event-description").value;
        const location = document.getElementById("event-location").value;

        const newEvent = {
            id: events.length + 1,
            title,
            date,
            type,
            description,
            location
        };

        events.push(newEvent);
        displayEvents(events);
        toggleEventForm();
    }

    function filterEvents() {
        const searchQuery = searchInput.value.toLowerCase();
        const selectedDate = dateFilter.value;
        const selectedType = typeFilter.value;

        const filteredEvents = events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchQuery) || event.description.toLowerCase().includes(searchQuery);
            const matchesDate = selectedDate === "all" || event.date === selectedDate;
            const matchesType = selectedType === "all" || event.type === selectedType;

            return matchesSearch && matchesDate && matchesType;
        });

        displayEvents(filteredEvents);
    }

    function openInGoogleMaps() {
        const location = document.getElementById("event-location").value;
        if (location) {
            const [lat, lng] = location.split(',').map(Number);
            const url = `https://www.google.com/maps?q=${lat},${lng}`;
            window.open(url, '_blank');
        }
    }

    function showRoute() {
        // Remove previous route
        if (routeControl) {
            routeControl.remove();
        }

        // Check if there are at least two markers
        if (markers.length >= 2) {
            const waypoints = markers.map(marker => marker.getLatLng());
            routeControl = L.Routing.control({
                waypoints: waypoints,
                routeWhileDragging: true
            }).addTo(map);
        } else {
            alert("Please add at least two markers to show a route.");
        }
    }

    addEventBtn.addEventListener("click", function() {
        editEventId = null;
        formTitle.textContent = "Add Event";
        document.getElementById("event-form").reset();
        toggleEventForm();
    });

    cancelBtn.addEventListener("click", function() {
        toggleEventForm();
    });

    openGoogleMapsBtn.addEventListener("click", openInGoogleMaps);
    showRouteBtn.addEventListener("click", showRoute);
    currentLocationBtn.addEventListener("click", showCurrentLocation);

    eventForm.addEventListener("submit", function(e) {
        e.preventDefault();
        if (editEventId !== null) {
            updateEvent(editEventId);
        } else {
            addEvent();
        }
    });

    searchInput.addEventListener("input", filterEvents);
    dateFilter.addEventListener("change", filterEvents);
    typeFilter.addEventListener("change", filterEvents);

    // Инициализация карты
    initMap();
});
