document.addEventListener("DOMContentLoaded", function() {
    let events = JSON.parse(localStorage.getItem("events")) || [];
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

    function saveEvents() {
        localStorage.setItem("events", JSON.stringify(events));
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
                <p><strong>Location:</strong> <a href="#" class="location-link" data-lat="${event.location.split(',')[0]}" data-lng="${event.location.split(',')[1]}">${event.location}</a></p>
                <div class="event-buttons">
                    <button class="edit-btn" data-id="${event.id}">Edit</button>
                    <button class="delete-btn" data-id="${event.id}">Delete</button>
                </div>
            `;
            calendar.appendChild(eventElement);
        });

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", deleteEvent);
        });

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", editEvent);
        });

        document.querySelectorAll(".location-link").forEach(link => {
            link.addEventListener("click", showEventOnMap);
        });
    }

    function addEvent(event) {
        event.preventDefault();
        const newEvent = {
            id: editEventId || Date.now(),
            title: eventForm["event-title"].value,
            date: eventForm["event-date"].value,
            type: eventForm["event-type"].value,
            description: eventForm["event-description"].value,
            location: eventForm["event-location"].value,
        };

        if (editEventId) {
            events = events.map(ev => ev.id === editEventId ? newEvent : ev);
            editEventId = null;
        } else {
            events.push(newEvent);
        }

        saveEvents();
        displayEvents(events);
        eventForm.reset();
        toggleEventForm();
    }

    function deleteEvent(event) {
        const eventId = parseInt(event.target.dataset.id, 10);
        events = events.filter(ev => ev.id !== eventId);
        saveEvents();
        displayEvents(events);
    }

    function editEvent(event) {
        const eventId = parseInt(event.target.dataset.id, 10);
        const eventToEdit = events.find(ev => ev.id === eventId);

        if (eventToEdit) {
            formTitle.textContent = "Edit Event";
            eventForm["event-title"].value = eventToEdit.title;
            eventForm["event-date"].value = eventToEdit.date;
            eventForm["event-type"].value = eventToEdit.type;
            eventForm["event-description"].value = eventToEdit.description;
            eventForm["event-location"].value = eventToEdit.location;

            editEventId = eventToEdit.id;
            toggleEventForm();
        }
    }

    function showEventOnMap(event) {
        event.preventDefault();
        const lat = parseFloat(event.target.dataset.lat);
        const lng = parseFloat(event.target.dataset.lng);
        map.setView([lat, lng], 13);

        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        currentMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup(`Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
            .openPopup();
    }

    addEventBtn.addEventListener("click", () => {
        formTitle.textContent = "Add Event";
        eventForm.reset();
        toggleEventForm();
    });

    cancelBtn.addEventListener("click", toggleEventForm);
    eventForm.addEventListener("submit", addEvent);
    openGoogleMapsBtn.addEventListener("click", () => {
        const location = eventForm["event-location"].value;
        window.open(`https://www.google.com/maps/search/?api=1&query=${location}`, '_blank');
    });
    showRouteBtn.addEventListener("click", () => {
        const location = eventForm["event-location"].value.split(',');
        const lat = parseFloat(location[0]);
        const lng = parseFloat(location[1]);

        if (routeControl) {
            map.removeControl(routeControl);
        }

        routeControl = L.Routing.control({
            waypoints: [
                L.latLng(map.getCenter().lat, map.getCenter().lng),
                L.latLng(lat, lng)
            ],
            createMarker: function() { return null; },
            routeWhileDragging: true
        }).addTo(map);
    });
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

    displayEvents(events);
    initMap();
});
