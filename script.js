document.addEventListener("DOMContentLoaded", function() {
    const apiToken = '4V3CT53YH3KHNYSR6DI7';
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
            navigator.geolocation.getCurrentPosition(function(position) {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 13);
                L.marker([latitude, longitude]).addTo(map)
                    .bindPopup('You are here')
                    .openPopup();
            });
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    // Открыть Google Maps
    function openInGoogleMaps() {
        const location = eventLocationInput.value;
        if (location) {
            const [lat, lng] = location.split(',').map(coord => coord.trim());
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
        } else {
            alert('Please select a location on the map.');
        }
    }

    // Показать маршрут
    function showRoute() {
        if (markers.length >= 2) {
            if (routeControl) {
                routeControl.remove();
            }

            const route = L.Routing.control({
                waypoints: markers.map(marker => marker.getLatLng()),
                createMarker: function() { return null; },
                routeWhileDragging: true
            }).addTo(map);

            routeControl = route;
        } else {
            alert('Please add at least two markers to show the route.');
        }
    }

    // Функция для получения событий из API Eventbrite
    async function fetchEvents() {
        try {
            const response = await fetch(`https://www.eventbriteapi.com/v3/users/me/events/?token=${apiToken}`);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();
            events = data.events || [];
            localStorage.setItem("events", JSON.stringify(events));
            displayEvents();
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    // Функция для отображения событий
    function displayEvents() {
        calendar.innerHTML = '';
        events
            .filter(event => {
                const titleMatch = event.name.text.toLowerCase().includes(searchInput.value.toLowerCase());
                const dateMatch = dateFilter.value === 'all' || event.start.local.startsWith(dateFilter.value);
                const typeMatch = typeFilter.value === 'all' || event.category === typeFilter.value;

                return titleMatch && dateMatch && typeMatch;
            })
            .forEach(event => {
                const eventElement = document.createElement("div");
                eventElement.classList.add("event");
                eventElement.innerHTML = `
                    <h3>${event.name.text}</h3>
                    <p><strong>Date:</strong> ${new Date(event.start.local).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> ${event.venue ? event.venue.address.localized_address_display : 'Not provided'}</p>
                    <p><strong>Description:</strong> ${event.description.text || 'No description'}</p>
                    <div class="event-buttons">
                        <button class="edit-btn" onclick="editEvent('${event.id}')">Edit</button>
                        <button onclick="deleteEvent('${event.id}')">Delete</button>
                    </div>
                `;
                calendar.appendChild(eventElement);
            });
    }

    // Сохранение события
    eventForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const title = document.getElementById("event-title").value;
        const date = document.getElementById("event-date").value;
        const type = document.getElementById("event-type").value;
        const description = document.getElementById("event-description").value;
        const location = document.getElementById("event-location").value;

        if (editEventId) {
            // Обновление существующего события
            const index = events.findIndex(e => e.id === editEventId);
            if (index > -1) {
                events[index] = {
                    ...events[index],
                    name: { text: title },
                    start: { local: date },
                    category: type,
                    description: { text: description },
                    venue: { address: { localized_address_display: location } }
                };
                localStorage.setItem("events", JSON.stringify(events));
                editEventId = null;
                eventFormContainer.style.display = "none";
                displayEvents();
            }
        } else {
            // Добавление нового события
            const newEvent = {
                id: Date.now().toString(),  // Используем временный ID
                name: { text: title },
                start: { local: date },
                category: type,
                description: { text: description },
                venue: { address: { localized_address_display: location } }
            };
            events.push(newEvent);
            localStorage.setItem("events", JSON.stringify(events));
            eventFormContainer.style.display = "none";
            displayEvents();
        }
    });

    // Отмена редактирования/добавления события
    cancelBtn.addEventListener("click", function() {
        eventFormContainer.style.display = "none";
    });

    // Добавление нового события
    addEventBtn.addEventListener("click", function() {
        formTitle.textContent = "Add Event";
        eventForm.reset();
        eventFormContainer.style.display = "block";
        initMap();
    });

    // Редактирование события
    window.editEvent = function(eventId) {
        const eventToEdit = events.find(e => e.id === eventId);
        if (eventToEdit) {
            formTitle.textContent = "Edit Event";
            document.getElementById("event-title").value = eventToEdit.name.text;
            document.getElementById("event-date").value = eventToEdit.start.local;
            document.getElementById("event-type").value = eventToEdit.category;
            document.getElementById("event-description").value = eventToEdit.description.text;
            document.getElementById("event-location").value = eventToEdit.venue.address.localized_address_display;
            editEventId = eventId;
            eventFormContainer.style.display = "block";
        }
    };

    // Удаление события
    window.deleteEvent = function(eventId) {
        events = events.filter(e => e.id !== eventId);
        localStorage.setItem("events", JSON.stringify(events));
        displayEvents();
    };

    // Показать события при загрузке страницы
    fetchEvents();

    // Фильтры
    searchInput.addEventListener("input", displayEvents);
    dateFilter.addEventListener("change", displayEvents);
    typeFilter.addEventListener("change", displayEvents);

    // Открытие Google Maps
    openGoogleMapsBtn.addEventListener("click", openInGoogleMaps);

    // Показать маршрут
    showRouteBtn.addEventListener("click", showRoute);

    // Показать текущее местоположение
    currentLocationBtn.addEventListener("click", showCurrentLocation);
});
