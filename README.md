# rutas
# Backend Rutas Seguras Lima

Este backend proporciona una API para la aplicación "Rutas Seguras Lima", diseñada para ofrecer rutas seguras en la ciudad de Lima, Perú. La aplicación permite calcular rutas teniendo en cuenta la seguridad de las zonas, reportar incidentes y gestionar rutas favoritas.

## Arquitectura del backend

El backend está estructurado siguiendo una arquitectura modular que separa claramente las responsabilidades:

```
project-root/
├── backend/
│   ├── config/
│   │   ├── db.config.js              # Configuración de base de datos
│   │   ├── server.config.js          # Configuración del servidor
│   │   └── app.config.js             # Configuraciones de la aplicación (OpenRouteService, etc.)
│   │
│   ├── controllers/
│   │   ├── seguridad.controller.js   # Controladores para puntos de seguridad
│   │   ├── incidentes.controller.js  # Controladores para incidentes
│   │   ├── rutas.controller.js       # Controladores para rutas
│   │   └── favoritos.controller.js   # Controladores para rutas favoritas
│   │
│   ├── db/
│   │   └── db.js                     # Módulo de conexión a base de datos
│   │
│   ├── middleware/
│   │   ├── error.middleware.js       # Manejo de errores centralizado
│   │   └── validators.middleware.js  # Validación de datos de entrada
│   │
│   ├── models/
│   │   ├── seguridad.model.js        # Modelos/consultas para puntos de seguridad
│   │   ├── incidentes.model.js       # Modelos/consultas para incidentes
│   │   ├── rutas.model.js            # Modelos/consultas para rutas
│   │   └── favoritos.model.js        # Modelos/consultas para rutas favoritas
│   │
│   ├── routes/
│   │   ├── index.js                  # Archivo principal que agrupa todas las rutas
│   │   ├── seguridad.routes.js       # Rutas para puntos de seguridad
│   │   ├── incidentes.routes.js      # Rutas para incidentes
│   │   ├── rutas.routes.js           # Rutas para cálculo de rutas
│   │   └── favoritos.routes.js       # Rutas para rutas favoritas
│   │
│   ├── services/
│   │   ├── openroute.service.js      # Servicio para interactuar con OpenRouteService
│   │   ├── seguridad.service.js      # Lógica de negocio relacionada con la seguridad
│   │   └── rutas.service.js          # Lógica de negocio relacionada con rutas
│   │
│   ├── utils/
│   │   ├── route.utils.js            # Funciones de ayuda para el cálculo de rutas
│   │   ├── geo.utils.js              # Utilidades para cálculos geográficos
│   │   └── response.utils.js         # Formateadores de respuesta
│   │
│   └── server.js                     # Punto de entrada principal
```

Esta estructura sigue los principios de:
- **Separación de responsabilidades**: Cada componente tiene un propósito claro y específico
- **Modularidad**: Cada módulo se puede modificar o reemplazar de forma independiente
- **Escalabilidad**: Facilita añadir nuevas funcionalidades
- **Mantenibilidad**: Facilita la comprensión y el mantenimiento del código

## Flujo de la solicitud

1. El cliente envía una solicitud HTTP
2. La solicitud es recibida por el servidor Express y enrutada al controlador correspondiente
3. El controlador valida los datos de entrada (a través de middleware si es necesario)
4. El controlador llama a los servicios necesarios para procesar la lógica de negocio
5. Los servicios pueden interactuar con la base de datos a través de los modelos
6. El controlador recibe los resultados y responde al cliente

## Endpoints API

### Puntos de Seguridad

```
GET /api/puntos-seguridad
```

Obtiene puntos de seguridad (comisarías, hospitales, serenazgo, etc.) cercanos a una ubicación.

**Parámetros de consulta:**
- `lat` (número): Latitud del centro (por defecto: -12.0464, centro de Lima)
- `lng` (número): Longitud del centro (por defecto: -77.0428, centro de Lima)
- `radio` (número): Radio de búsqueda en metros (por defecto: 1000)

**Ejemplo de respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Comisaría de Miraflores",
    "tipo": "comisaria",
    "descripcion": "Atiende las 24 horas",
    "lat": -12.1178,
    "lng": -77.0378,
    "distancia": 532
  },
  ...
]
```

### Incidentes

```
GET /api/incidentes
```

Obtiene incidentes de seguridad reportados cercanos a una ubicación.

**Parámetros de consulta:**
- `lat` (número): Latitud del centro
- `lng` (número): Longitud del centro
- `radio` (número): Radio de búsqueda en metros

**Ejemplo de respuesta:**
```json
[
  {
    "id": 1,
    "tipo": "robo",
    "descripcion": "Robo de celular",
    "fecha": "2023-04-15T18:30:00Z",
    "lat": -12.1240,
    "lng": -77.0310,
    "distancia": 320
  },
  ...
]
```

```
POST /api/incidentes
```

Registra un nuevo incidente de seguridad.

**Cuerpo de la solicitud:**
```json
{
  "tipo": "robo",
  "descripcion": "Arrebato de celular en la esquina",
  "fecha": "2023-05-01T14:30:00Z",
  "ubicacion": {
    "lat": -12.1245,
    "lng": -77.0315
  }
}
```

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Incidente registrado con éxito",
  "incidente": {
    "id": 10,
    "tipo": "robo",
    "descripcion": "Arrebato de celular en la esquina",
    "fecha": "2023-05-01T14:30:00Z",
    "lat": -12.1245,
    "lng": -77.0315
  }
}
```

### Rutas Seguras

```
POST /api/rutas-seguras
```

Obtiene la ruta más segura entre dos puntos considerando los incidentes y puntos de seguridad.

**Cuerpo de la solicitud:**
```json
{
  "origen": {
    "lat": -12.0464,
    "lng": -77.0428
  },
  "destino": {
    "lat": -12.1111,
    "lng": -77.0222
  },
  "modo": "driving-car"
}
```

**Ejemplo de respuesta:**
```json
{
  "ruta": {
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-77.0428, -12.0464],
        [-77.0425, -12.0500],
        ...
      ]
    },
    "properties": {
      "segments": [
        {
          "distance": 5420.7,
          "duration": 723.4,
          "steps": [...]
        }
      ],
      "summary": {
        "distance": 5420.7,
        "duration": 723.4
      }
    },
    "seguridadScore": 82
  },
  "puntosSeguridad": [
    {
      "id": 3,
      "nombre": "Serenazgo Municipal",
      "tipo": "serenazgo",
      "descripcion": "Patrullaje constante",
      "lat": -12.0485,
      "lng": -77.0410,
      "distancia": 145
    },
    ...
  ]
}
```

```
GET /api/rutas-alternativas
```

Obtiene rutas alternativas entre dos puntos ordenadas por índice de seguridad.

**Parámetros de consulta:**
- `origen_lat` (número): Latitud del origen
- `origen_lng` (número): Longitud del origen
- `destino_lat` (número): Latitud del destino
- `destino_lng` (número): Longitud del destino
- `modo` (texto): Modo de transporte (por defecto: "driving-car")

**Ejemplo de respuesta:**
```json
{
  "rutas": [
    {
      "geometry": {...},
      "properties": {...},
      "seguridadScore": 85
    },
    {
      "geometry": {...},
      "properties": {...},
      "seguridadScore": 78
    },
    {
      "geometry": {...},
      "properties": {...},
      "seguridadScore": 65
    }
  ]
}
```

```
GET /api/ruta-visual
```

Genera una ruta visual para mostrar en el mapa junto con información de seguridad.

**Parámetros de consulta:**
- `origen_lat` (número): Latitud del origen
- `origen_lng` (número): Longitud del origen
- `destino_lat` (número): Latitud del destino
- `destino_lng` (número): Longitud del destino
- `modo` (texto): Modo de transporte

**Ejemplo de respuesta:**
```json
{
  "ruta": {
    "tipo": "FeatureCollection",
    "propiedades": {
      "distancia": 5420.7,
      "duracion": 723.4
    },
    "caracteristicas": [...],
    "bounds": [-77.0500, -12.1200, -77.0300, -12.0400],
    "seguridadScore": 78
  },
  "puntosSeguridad": [...]
}
```

### Rutas Favoritas

```
GET /api/ruta-favorita
```

Obtiene todas las rutas favoritas guardadas por el usuario.

**Parámetros de consulta:**
- `usuario_id` (número): ID del usuario (por defecto: 1)

**Ejemplo de respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Casa al trabajo",
    "origen": {
      "nombre": "Mi casa",
      "coordenadas": {
        "lat": -12.0464,
        "lng": -77.0428
      }
    },
    "destino": {
      "nombre": "Oficina",
      "coordenadas": {
        "lat": -12.1111,
        "lng": -77.0222
      }
    },
    "modoTransporte": "driving-car",
    "fechaCreacion": "2023-04-20T10:30:00Z"
  },
  ...
]
```

```
GET /api/ruta-favorita/:id
```

Obtiene una ruta favorita específica por su ID.

**Parámetros de ruta:**
- `id` (número): ID de la ruta favorita

**Ejemplo de respuesta:**
```json
{
  "id": 1,
  "nombre": "Casa al trabajo",
  "origen": {
    "nombre": "Mi casa",
    "coordenadas": {
      "lat": -12.0464,
      "lng": -77.0428
    }
  },
  "destino": {
    "nombre": "Oficina",
    "coordenadas": {
      "lat": -12.1111,
      "lng": -77.0222
    }
  },
  "modoTransporte": "driving-car",
  "fechaCreacion": "2023-04-20T10:30:00Z"
}
```

```
POST /api/ruta-favorita
```

Guarda una nueva ruta favorita.

**Cuerpo de la solicitud:**
```json
{
  "nombre": "Universidad a casa",
  "origen": {
    "nombre": "Universidad",
    "coordenadas": {
      "lat": -12.0710,
      "lng": -77.0810
    }
  },
  "destino": {
    "nombre": "Mi casa",
    "coordenadas": {
      "lat": -12.0464,
      "lng": -77.0428
    }
  },
  "modoTransporte": "foot-walking"
}
```

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Ruta favorita guardada con éxito",
  "ruta": {
    "id": 2,
    "nombre": "Universidad a casa",
    "origen": {
      "nombre": "Universidad",
      "coordenadas": {
        "lat": -12.0710,
        "lng": -77.0810
      }
    },
    "destino": {
      "nombre": "Mi casa",
      "coordenadas": {
        "lat": -12.0464,
        "lng": -77.0428
      }
    },
    "modoTransporte": "foot-walking",
    "fechaCreacion": "2023-05-10T14:25:00Z"
  }
}
```

```
PUT /api/ruta-favorita/:id
```

Actualiza una ruta favorita existente.

**Parámetros de ruta:**
- `id` (número): ID de la ruta favorita

**Cuerpo de la solicitud:**
```json
{
  "nombre": "Universidad a casa (actualizado)",
  "origen": {
    "nombre": "Universidad Nacional",
    "coordenadas": {
      "lat": -12.0710,
      "lng": -77.0810
    }
  },
  "destino": {
    "nombre": "Mi casa",
    "coordenadas": {
      "lat": -12.0464,
      "lng": -77.0428
    }
  },
  "modoTransporte": "cycling-regular"
}
```

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Ruta favorita actualizada con éxito",
  "ruta": {
    "id": 2,
    "nombre": "Universidad a casa (actualizado)",
    "origen": {
      "nombre": "Universidad Nacional",
      "coordenadas": {
        "lat": -12.0710,
        "lng": -77.0810
      }
    },
    "destino": {
      "nombre": "Mi casa",
      "coordenadas": {
        "lat": -12.0464,
        "lng": -77.0428
      }
    },
    "modoTransporte": "cycling-regular",
    "fechaCreacion": "2023-05-10T14:25:00Z"
  }
}
```

```
DELETE /api/ruta-favorita/:id
```

Elimina una ruta favorita.

**Parámetros de ruta:**
- `id` (número): ID de la ruta favorita

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Ruta favorita eliminada con éxito"
}
```

## Configuración y despliegue

### Requisitos previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior) con extensión PostGIS
- API key de OpenRouteService

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
PORT=3000
NODE_ENV=development

DB_USER=postgres
DB_HOST=localhost
DB_NAME=security_db
DB_PASSWORD=tu_contraseña
DB_PORT=5432

OPENROUTE_API_KEY=tu_clave_api_de_openrouteservice
```

### Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```
   npm install
   ```
3. Configura la base de datos:
   ```
   npm run setup-db
   ```
4. Inicia el servidor:
   ```
   npm start
   ```

Para desarrollo, puedes usar:
```
npm run dev
```

## Tecnologías utilizadas

- **Node.js**: Entorno de ejecución
- **Express**: Framework web
- **PostgreSQL**: Base de datos relacional
- **PostGIS**: Extensión para datos geoespaciales
- **OpenRouteService API**: Servicio de cálculo de rutas
- **Dotenv**: Gestión de variables de entorno
- **Cors**: Manejo de Cross-Origin Resource Sharing
- **Body-parser**: Procesamiento de cuerpos de solicitud

## Arquitectura de datos

La aplicación utiliza varias tablas principales:

- `puntos_seguridad`: Almacena comisarías, hospitales, puntos de serenazgo, etc.
- `incidentes`: Registra incidentes de seguridad reportados
- `rutas_favoritas`: Guarda las rutas favoritas de los usuarios

## Próximas mejoras

- Implementación de autenticación de usuarios
- Mejora del algoritmo de cálculo de índice de seguridad
- Integración con fuentes oficiales de datos de criminalidad
- Panel de administración para gestionar puntos de seguridad
- API para estadísticas y reportes

## Licencia
 