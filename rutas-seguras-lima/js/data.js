/**
 * data.js - Datos mockeados para simular la base de datos PostgreSQL
 */

// Datos de seguridad mockeados
const securityData = {
    // Distritos con nivel de seguridad (0-100)
    districts: {
        'Miraflores': 85,
        'San Isidro': 90,
        'Surco': 75,
        'Barranco': 70,
        'San Borja': 80,
        'La Molina': 78,
        'Jesús María': 72,
        'Lince': 65,
        'San Miguel': 68,
        'Magdalena': 70,
        'Pueblo Libre': 69,
        'Lima Centro': 50,
        'Rimac': 40,
        'San Juan de Lurigancho': 35,
        'Villa El Salvador': 38,
        'San Juan de Miraflores': 42,
        'La Victoria': 45,
        'Ate': 48,
        'Callao': 40
    },
    
    // Puntos de interés para seguridad
    securityPoints: [
        {
            name: 'Comisaría Miraflores',
            lat: -12.1197,
            lng: -77.0297,
            type: 'police',
            securityLevel: 'high'
        },
        {
            name: 'Comisaría San Isidro',
            lat: -12.0977,
            lng: -77.0365,
            type: 'police',
            securityLevel: 'high'
        },
        {
            name: 'Centro Comercial Larcomar',
            lat: -12.1317,
            lng: -77.0276,
            type: 'commercial',
            securityLevel: 'high'
        },
        {
            name: 'Parque Kennedy',
            lat: -12.1219,
            lng: -77.0297,
            type: 'park',
            securityLevel: 'medium'
        },
        {
            name: 'Plaza San Miguel',
            lat: -12.0769,
            lng: -77.0825,
            type: 'commercial',
            securityLevel: 'medium'
        },
        {
            name: 'Zona de alto riesgo - La Victoria',
            lat: -12.0650,
            lng: -77.0150,
            type: 'risk',
            securityLevel: 'low'
        },
        {
            name: 'Zona monitoreada - San Borja',
            lat: -12.1019,
            lng: -76.9975,
            type: 'monitored',
            securityLevel: 'high'
        },
        {
            name: 'Patrullaje constante - Surco',
            lat: -12.1450,
            lng: -76.9917,
            type: 'police',
            securityLevel: 'high'
        },
        {
            name: 'Zona de precaución - Callao',
            lat: -12.0500,
            lng: -77.1200,
            type: 'risk',
            securityLevel: 'low'
        },
        {
            name: 'Zona Iluminada - San Isidro',
            lat: -12.0950,
            lng: -77.0410,
            type: 'lighting',
            securityLevel: 'high'
        }
    ],
    
    // Incidentes reportados
    incidents: [
        {
            type: 'Robo',
            description: 'Robo de celular',
            lat: -12.1335,
            lng: -77.0241,
            date: '2025-05-01'
        },
        {
            type: 'Asalto',
            description: 'Asalto a transeúnte',
            lat: -12.0630,
            lng: -77.0120,
            date: '2025-05-02'
        },
        {
            type: 'Sospechoso',
            description: 'Persona sospechosa merodeando',
            lat: -12.0950,
            lng: -77.0510,
            date: '2025-05-03'
        },
        {
            type: 'Robo',
            description: 'Intento de robo de vehículo',
            lat: -12.0530,
            lng: -77.1100,
            date: '2025-05-03'
        },
        {
            type: 'Vandalismo',
            description: 'Daño a propiedad pública',
            lat: -12.1150,
            lng: -77.0197,
            date: '2025-05-04'
        }
    ]
};

// Coordenadas de Lima, Perú
const LIMA_CENTER = [-12.0464, -77.0428];
const DEFAULT_ZOOM = 12;

// Mapa simulado de lugares a coordenadas para geocodificación
const placeCoordinates = {
    'miraflores': [-12.1219, -77.0297],
    'san isidro': [-12.0977, -77.0365],
    'surco': [-12.1450, -76.9917],
    'barranco': [-12.1495, -77.0219],
    'la molina': [-12.0867, -76.9055],
    'san borja': [-12.1019, -76.9975],
    'jesús maría': [-12.0705, -77.0517],
    'lince': [-12.0833, -77.0333],
    'san miguel': [-12.0789, -77.0825],
    'magdalena': [-12.0889, -77.0717],
    'pueblo libre': [-12.0717, -77.0633],
    'lima centro': [-12.0464, -77.0428],
    'rimac': [-12.0292, -77.0428],
    'san juan de lurigancho': [-12.0031, -77.0081],
    'villa el salvador': [-12.2136, -76.9319],
    'san juan de miraflores': [-12.1550, -76.9700],
    'la victoria': [-12.0650, -77.0150],
    'ate': [-12.0258, -76.9178],
    'callao': [-12.0500, -77.1200],
    'jockey plaza': [-12.0847, -76.9750],
    'parque kennedy': [-12.1219, -77.0297],
    'plaza san miguel': [-12.0769, -77.0825],
    'aeropuerto jorge chávez': [-12.0219, -77.1144],
    'universidad de lima': [-12.0836, -76.9700],
    'universidad católica': [-12.0711, -77.0796],
    'plaza de armas': [-12.0464, -77.0329],
    'estadio nacional': [-12.0672, -77.0333],
    'megaplaza': [-11.9958, -77.0600],
    'wong la molina': [-12.0867, -76.9150],
    'real plaza salaverry': [-12.0894, -77.0522]
};

// Coordenadas aproximadas de los centros de los distritos
const districtCenters = {
    'Miraflores': [-12.1219, -77.0297],
    'San Isidro': [-12.0977, -77.0365],
    'Surco': [-12.1450, -76.9917],
    'Barranco': [-12.1495, -77.0219],
    'San Borja': [-12.1019, -76.9975],
    'La Molina': [-12.0867, -76.9055],
    'Jesús María': [-12.0705, -77.0517],
    'Lince': [-12.0833, -77.0333],
    'San Miguel': [-12.0789, -77.0825],
    'Magdalena': [-12.0889, -77.0717],
    'Pueblo Libre': [-12.0717, -77.0633],
    'Lima Centro': [-12.0464, -77.0428],
    'Rimac': [-12.0292, -77.0428],
    'San Juan de Lurigancho': [-12.0031, -77.0081],
    'Villa El Salvador': [-12.2136, -76.9319],
    'San Juan de Miraflores': [-12.1550, -76.9700],
    'La Victoria': [-12.0650, -77.0150],
    'Ate': [-12.0258, -76.9178],
    'Callao': [-12.0500, -77.1200]
};