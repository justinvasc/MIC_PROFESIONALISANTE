document.addEventListener("DOMContentLoaded", function() {
    // Inicializar el mapa
    var map = L.map('map').setView([-0.1807, -78.4678], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    var marker;

    // Manejar el envío del formulario
    document.getElementById("coordinateForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Evitar que el formulario se envíe
        predecir();
    });

    function predecir() {
        var lat = parseFloat(document.getElementById("latitud").value);
        var lon = parseFloat(document.getElementById("longitud").value);
        var resultado = document.getElementById("result");

        // Definir los rangos permitidos
        const LAT_MIN = -0.384523;
        const LAT_MAX = 0.037484;
        const LON_MIN = -78.593676;
        const LON_MAX = -78.270688;

        // Validar que los valores estén dentro del rango
        if (isNaN(lat) || isNaN(lon)) {
            resultado.innerHTML = "⚠️ Ingrese valores válidos.";
            resultado.style.backgroundColor = "#fff3cd"; // Fondo amarillo claro
            resultado.style.color = "#856404"; // Texto oscuro
            resultado.style.padding = "10px";
            resultado.style.border = "1px solid #ffeeba";
            resultado.style.borderRadius = "5px";
            return; // Detener la ejecución
        }

        if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) {
            resultado.innerHTML = "⚠️ Las coordenadas están fuera del rango permitido.<br>Latitud: -0.384523 a 0.037484<br>Longitud: -78.593676 a -78.270688";
            resultado.style.backgroundColor = "#fff3cd"; // Fondo amarillo claro
            resultado.style.color = "#856404"; // Texto oscuro
            resultado.style.padding = "10px";
            resultado.style.border = "1px solid #ffeeba";
            resultado.style.borderRadius = "5px";
            return; // Detener la ejecución
        }

        // Si las coordenadas están dentro del rango, hacer la solicitud al servidor
        fetch("/predecir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitud: lat, longitud: lon })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultado.innerHTML = "⚠️ Error: " + data.error;
                resultado.style.backgroundColor = "#f8d7da"; // Fondo rojo claro
                resultado.style.color = "#721c24"; // Texto rojo oscuro
                resultado.style.padding = "10px";
                resultado.style.border = "1px solid #f5c6cb";
                resultado.style.borderRadius = "5px";
            } else {
                resultado.innerHTML = "✅ Predicción: " + data.prediccion.toFixed(3) + " m";
                resultado.style.backgroundColor = "#d4edda"; // Fondo verde claro
                resultado.style.color = "#155724"; // Texto verde oscuro
                resultado.style.padding = "10px";
                resultado.style.border = "1px solid #c3e6cb";
                resultado.style.borderRadius = "5px";

                if (marker) {
                    map.removeLayer(marker);
                }
                marker = L.marker([lat, lon]).addTo(map)
                    .bindPopup("Ondulación: " + data.prediccion.toFixed(3) + " m").openPopup();
                map.setView([lat, lon], 15);
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
            resultado.innerHTML = "❌ Error al obtener la predicción. Verifica el servidor.";
            resultado.style.backgroundColor = "#f8d7da"; // Fondo rojo claro
            resultado.style.color = "#721c24"; // Texto rojo oscuro
            resultado.style.padding = "10px";
            resultado.style.border = "1px solid #f5c6cb";
            resultado.style.borderRadius = "5px";
        });
    }
});