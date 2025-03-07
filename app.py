from flask import Flask, request, jsonify, render_template
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import KNeighborsRegressor
import os

app = Flask(__name__)

# 📌 Cargar datos de normalización
filename = "datos_crudos.txt"
if not os.path.exists(filename):
    print(f"❌ ERROR: El archivo {filename} no fue encontrado.")
    exit()

df = pd.read_csv(filename, sep='\s+')

# 📌 Preparar datos
X = df[['latitud', 'longitud']].values
y = df['ondulacion'].values

# 📌 Aplicar KNN
knn_regressor = KNeighborsRegressor(n_neighbors=15, weights='distance')
knn_regressor.fit(X, y)
neighbor_features = knn_regressor.predict(X).reshape(-1, 1)
X_extended = np.hstack((X, neighbor_features))

# 📌 Normalización
scaler_X = MinMaxScaler()
X_normalized = scaler_X.fit_transform(X_extended)
scaler_y = MinMaxScaler()
y_normalized = scaler_y.fit_transform(y.reshape(-1, 1))

# 📌 Cargar modelo
try:
    model = tf.keras.models.load_model("modelo_entrenado.h5")
    print("✅ Modelo cargado correctamente.")
except Exception as e:
    print(f"❌ ERROR al cargar el modelo: {e}")
    model = None  

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        data = request.get_json()
        print(f"📥 Datos recibidos en Flask: {data}")

        if not data or 'latitud' not in data or 'longitud' not in data:
            return jsonify({'error': '❌ Faltan datos'}), 400

        lat = float(data['latitud'])
        lon = float(data['longitud'])

        # Definir los rangos permitidos
        LAT_MIN = -0.384523
        LAT_MAX = 0.037484
        LON_MIN = -78.593676
        LON_MAX = -78.270688

        # Validar que los valores estén dentro del rango
        if lat < LAT_MIN or lat > LAT_MAX or lon < LON_MIN or lon > LON_MAX:
            return jsonify({'error': '⚠️ Las coordenadas están fuera del rango permitido.'}), 400

        if model is None:
            return jsonify({'error': '⚠️ El modelo no está cargado'}), 500

        neighbor_feature = knn_regressor.predict([[lat, lon]])[0]

        input_data = np.array([[lat, lon, neighbor_feature]])
        input_normalized = scaler_X.transform(input_data)

        pred = model.predict(input_normalized)
        pred_denorm = scaler_y.inverse_transform(pred)[0][0]

        pred_final = float(pred_denorm)

        print(f"✅ Predicción generada: {pred_final}")

        return jsonify({'prediccion': pred_final})

    except Exception as e:
        print(f"⚠️ ERROR: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
