-- db/migrations/init.sql

-- Crear tablas
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    security_level INTEGER NOT NULL CHECK (security_level >= 0 AND security_level <= 100),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL
);

CREATE TABLE IF NOT EXISTS security_points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    type VARCHAR(50) NOT NULL,
    security_level VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Poblar datos iniciales
-- Distritos
INSERT INTO districts (name, security_level, latitude, longitude) VALUES
('Miraflores', 85, -12.1219, -77.0297),
('San Isidro', 90, -12.0977, -77.0365),
('Surco', 75, -12.1450, -76.9917),
('Barranco', 70, -12.1495, -77.0219),
('San Borja', 80, -12.1019, -76.9975),
('La Molina', 78, -12.0867, -76.9055),
('Jesús María', 72, -12.0705, -77.0517),
('Lince', 65, -12.0833, -77.0333),
('San Miguel', 68, -12.0789, -77.0825),
('Magdalena', 70, -12.0889, -77.0717),
('Pueblo Libre', 69, -12.0717, -77.0633),
('Lima Centro', 50, -12.0464, -77.0428),
('Rimac', 40, -12.0292, -77.0428),
('San Juan de Lurigancho', 35, -12.0031, -77.0081),
('Villa El Salvador', 38, -12.2136, -76.9319),
('San Juan de Miraflores', 42, -12.1550, -76.9700),
('La Victoria', 45, -12.0650, -77.0150),
('Ate', 48, -12.0258, -76.9178),
('Callao', 40, -12.0500, -77.1200);

-- Puntos de seguridad
INSERT INTO security_points (name, latitude, longitude, type, security_level) VALUES
('Comisaría Miraflores', -12.1197, -77.0297, 'police', 'high'),
('Comisaría San Isidro', -12.0977, -77.0365, 'police', 'high'),
('Centro Comercial Larcomar', -12.1317, -77.0276, 'commercial', 'high'),
('Parque Kennedy', -12.1219, -77.0297, 'park', 'medium'),
('Plaza San Miguel', -12.0769, -77.0825, 'commercial', 'medium'),
('Zona de alto riesgo - La Victoria', -12.0650, -77.0150, 'risk', 'low'),
('Zona monitoreada - San Borja', -12.1019, -76.9975, 'monitored', 'high'),
('Patrullaje constante - Surco', -12.1450, -76.9917, 'police', 'high'),
('Zona de precaución - Callao', -12.0500, -77.1200, 'risk', 'low'),
('Zona Iluminada - San Isidro', -12.0950, -77.0410, 'lighting', 'high');

-- Incidentes
INSERT INTO incidents (type, description, latitude, longitude, date) VALUES
('Robo', 'Robo de celular', -12.1335, -77.0241, '2025-05-01'),
('Asalto', 'Asalto a transeúnte', -12.0630, -77.0120, '2025-05-02'),
('Sospechoso', 'Persona sospechosa merodeando', -12.0950, -77.0510, '2025-05-03'),
('Robo', 'Intento de robo de vehículo', -12.0530, -77.1100, '2025-05-03'),
('Vandalismo', 'Daño a propiedad pública', -12.1150, -77.0197, '2025-05-04');