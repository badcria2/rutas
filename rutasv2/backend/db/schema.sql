-- Crear la extensión PostGIS si no existe
CREATE EXTENSION IF NOT EXISTS postgis;

-- Eliminar tablas si existen para recrearlas
DROP TABLE IF EXISTS incidentes;
DROP TABLE IF EXISTS puntos_seguridad;

-- Tabla de puntos de seguridad
CREATE TABLE puntos_seguridad (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    ubicacion GEOGRAPHY(POINT, 4326) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índice espacial para consultas de proximidad
CREATE INDEX idx_puntos_seguridad_ubicacion ON puntos_seguridad USING GIST(ubicacion);

-- Tabla de incidentes reportados
CREATE TABLE incidentes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP NOT NULL,
    ubicacion GEOGRAPHY(POINT, 4326) NOT NULL,
    fecha_reporte TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índice espacial para consultas de proximidad
CREATE INDEX idx_incidentes_ubicacion ON incidentes USING GIST(ubicacion);
--

 CREATE TABLE rutas_favoritas (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL,  -- ID del usuario (para un sistema con autenticación)
            nombre VARCHAR(255) NOT NULL, -- Nombre descriptivo de la ruta
            origen_nombre VARCHAR(255) NOT NULL, -- Nombre del punto de origen
            origen_lat NUMERIC(10, 7) NOT NULL,  -- Latitud del origen
            origen_lng NUMERIC(10, 7) NOT NULL,  -- Longitud del origen
            destino_nombre VARCHAR(255) NOT NULL, -- Nombre del punto de destino
            destino_lat NUMERIC(10, 7) NOT NULL,  -- Latitud del destino
            destino_lng NUMERIC(10, 7) NOT NULL,  -- Longitud del destino
            modo_transporte VARCHAR(50) DEFAULT 'driving-car', -- Modo de transporte (auto, a pie, bicicleta)
            fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Índices para mejorar el rendimiento
        CREATE INDEX rutas_favoritas_usuario_id_idx ON rutas_favoritas(usuario_id);
        CREATE INDEX rutas_favoritas_fecha_idx ON rutas_favoritas(fecha_creacion);
        
        -- Comentarios para documentar la tabla
        COMMENT ON TABLE rutas_favoritas IS 'Almacena las rutas favoritas guardadas por los usuarios';
        COMMENT ON COLUMN rutas_favoritas.usuario_id IS 'ID del usuario que guardó la ruta';
        COMMENT ON COLUMN rutas_favoritas.nombre IS 'Nombre descriptivo asignado a la ruta';
        COMMENT ON COLUMN rutas_favoritas.modo_transporte IS 'Modo de transporte: driving-car, foot-walking, cycling-regular';
        
        -- Trigger para actualizar la fecha de última modificación
        CREATE OR REPLACE FUNCTION update_ultima_modificacion_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.ultima_modificacion = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_rutas_favoritas_modtime
        BEFORE UPDATE ON rutas_favoritas
        FOR EACH ROW
        EXECUTE FUNCTION update_ultima_modificacion_column();
        
        RAISE NOTICE 'Tabla rutas_favoritas creada con éxito';

-- Datos de muestra para puntos de seguridad en Lima, Perú
-- Las coordenadas están en formato POINT(longitud latitud)
INSERT INTO puntos_seguridad (nombre, tipo, descripcion, ubicacion) VALUES
-- Comisarías
('Comisaría de Miraflores', 'comisaria', 'Comisaría con atención las 24 horas. Servicios de denuncias y seguridad ciudadana.', ST_SetSRID(ST_MakePoint(-77.0318, -12.1186), 4326)),
('Comisaría de San Isidro', 'comisaria', 'Comisaría principal del distrito con servicios completos de seguridad.', ST_SetSRID(ST_MakePoint(-77.0380, -12.1050), 4326)),
('Comisaría de Santiago de Surco', 'comisaria', 'Cuenta con patrullaje frecuente en el distrito y atención ciudadana.', ST_SetSRID(ST_MakePoint(-77.0129, -12.1456), 4326)),
('Comisaría de Barranco', 'comisaria', 'Especializada en seguridad turística y protección al ciudadano.', ST_SetSRID(ST_MakePoint(-77.0270, -12.1400), 4326)),
('Comisaría de San Borja', 'comisaria', 'Con brigada de tránsito y unidad de investigación criminal.', ST_SetSRID(ST_MakePoint(-77.0047, -12.1089), 4326)),
('Comisaría de Lince', 'comisaria', 'Servicios de atención a la comunidad y patrullaje integrado.', ST_SetSRID(ST_MakePoint(-77.0355, -12.0881), 4326)),
('Comisaría de Jesús María', 'comisaria', 'Especializada en seguridad ciudadana y prevención del delito.', ST_SetSRID(ST_MakePoint(-77.0531, -12.0710), 4326)),
('Comisaría de Pueblo Libre', 'comisaria', 'Con unidad de apoyo vecinal y respuesta rápida.', ST_SetSRID(ST_MakePoint(-77.0659, -12.0747), 4326)),
('Comisaría de Magdalena', 'comisaria', 'Ofrece servicios de seguridad comunitaria y prevención.', ST_SetSRID(ST_MakePoint(-77.0740, -12.0908), 4326)),
('Comisaría de San Miguel', 'comisaria', 'Sistema de patrullaje por sectores y unidad de familia.', ST_SetSRID(ST_MakePoint(-77.0918, -12.0778), 4326)),
('Comisaría de La Molina', 'comisaria', 'Con unidades especializadas en seguridad residencial.', ST_SetSRID(ST_MakePoint(-76.9350, -12.0820), 4326)),
('Comisaría de San Luis', 'comisaria', 'Patrullaje integrado con serenazgo municipal.', ST_SetSRID(ST_MakePoint(-77.0188, -12.0780), 4326)),
('Comisaría de Surquillo', 'comisaria', 'Con unidad especializada en prevención de delitos.', ST_SetSRID(ST_MakePoint(-77.0236, -12.1103), 4326)),
('Comisaría de La Victoria', 'comisaria', 'Cobertura integral en zonas comerciales y residenciales.', ST_SetSRID(ST_MakePoint(-77.0130, -12.0658), 4326)),
('Comisaría de Cercado de Lima', 'comisaria', 'Unidad central con servicios completos de seguridad.', ST_SetSRID(ST_MakePoint(-77.0329, -12.0553), 4326)),

-- Serenazgo
('Serenazgo Miraflores', 'serenazgo', 'Base central con cobertura 24/7 y cámaras de vigilancia.', ST_SetSRID(ST_MakePoint(-77.0283, -12.1190), 4326)),
('Serenazgo San Isidro', 'serenazgo', 'Sistema de patrullaje permanente y respuesta rápida.', ST_SetSRID(ST_MakePoint(-77.0371, -12.1059), 4326)),
('Serenazgo San Borja', 'serenazgo', 'Red de cámaras de vigilancia y central de monitoreo.', ST_SetSRID(ST_MakePoint(-77.0059, -12.1002), 4326)),
('Serenazgo Santiago de Surco', 'serenazgo', 'Central de monitoreo 24 horas y patrullaje integrado.', ST_SetSRID(ST_MakePoint(-77.0130, -12.1399), 4326)),
('Serenazgo La Molina', 'serenazgo', 'Unidades de patrullaje en bicicleta y motorizado.', ST_SetSRID(ST_MakePoint(-76.9500, -12.0800), 4326)),
('Serenazgo Lince', 'serenazgo', 'Sistema de respuesta rápida y vigilancia por cuadrantes.', ST_SetSRID(ST_MakePoint(-77.0375, -12.0871), 4326)),
('Serenazgo Jesús María', 'serenazgo', 'Unidad especial de intervención y prevención.', ST_SetSRID(ST_MakePoint(-77.0490, -12.0700), 4326)),
('Serenazgo San Miguel', 'serenazgo', 'Base de operaciones con patrullaje integrado.', ST_SetSRID(ST_MakePoint(-77.0879, -12.0786), 4326)),
('Serenazgo Barranco', 'serenazgo', 'Especializado en seguridad peatonal y turística.', ST_SetSRID(ST_MakePoint(-77.0245, -12.1410), 4326)),
('Serenazgo Pueblo Libre', 'serenazgo', 'Sistema de vigilancia activa y coordinación vecinal.', ST_SetSRID(ST_MakePoint(-77.0649, -12.0765), 4326)),
('Serenazgo Surquillo', 'serenazgo', 'Unidades de intervención rápida y monitoreo.', ST_SetSRID(ST_MakePoint(-77.0210, -12.1090), 4326)),
('Serenazgo Magdalena', 'serenazgo', 'Cobertura 24/7 con patrullaje motorizado.', ST_SetSRID(ST_MakePoint(-77.0720, -12.0890), 4326)),
('Serenazgo La Victoria', 'serenazgo', 'Vigilancia especializada en zonas comerciales.', ST_SetSRID(ST_MakePoint(-77.0150, -12.0670), 4326)),
('Serenazgo San Luis', 'serenazgo', 'Patrullaje preventivo y respuesta a emergencias.', ST_SetSRID(ST_MakePoint(-77.0180, -12.0760), 4326)),
('Serenazgo Cercado de Lima', 'serenazgo', 'Central de operaciones con monitoreo constante.', ST_SetSRID(ST_MakePoint(-77.0310, -12.0560), 4326)),

-- Hospitales y centros médicos
('Hospital Rebagliati', 'hospital', 'Hospital de alta complejidad con atención de emergencias 24 horas.', ST_SetSRID(ST_MakePoint(-77.0390, -12.0785), 4326)),
('Clínica Good Hope', 'hospital', 'Centro médico con atención de emergencias y especialidades.', ST_SetSRID(ST_MakePoint(-77.0304, -12.1245), 4326)),
('Clínica Ricardo Palma', 'hospital', 'Servicios de emergencia y atención médica especializada.', ST_SetSRID(ST_MakePoint(-77.0334, -12.1055), 4326)),
('Hospital de la Solidaridad', 'hospital', 'Centro médico municipal con servicios a bajo costo.', ST_SetSRID(ST_MakePoint(-77.0280, -12.0652), 4326)),
('Clínica Internacional', 'hospital', 'Emergencias y atención médica integral para adultos y niños.', ST_SetSRID(ST_MakePoint(-77.0348, -12.0881), 4326)),
('Hospital Almenara', 'hospital', 'Hospital general con atención de emergencias complejas.', ST_SetSRID(ST_MakePoint(-77.0355, -12.0562), 4326)),
('Hospital Loayza', 'hospital', 'Centro especializado de traumatología y emergencias.', ST_SetSRID(ST_MakePoint(-77.0400, -12.0520), 4326)),
('Clínica San Pablo', 'hospital', 'Atención integral de salud y servicios de emergencia.', ST_SetSRID(ST_MakePoint(-77.0939, -12.0927), 4326)),
('Hospital del Niño', 'hospital', 'Especializado en pediatría y emergencias infantiles.', ST_SetSRID(ST_MakePoint(-77.0427, -12.0680), 4326)),
('Hospital María Auxiliadora', 'hospital', 'Centro de emergencias y atención médica general.', ST_SetSRID(ST_MakePoint(-76.9750, -12.1588), 4326)),
('Clínica Javier Prado', 'hospital', 'Servicios de emergencia y atención médica especializada.', ST_SetSRID(ST_MakePoint(-77.0280, -12.0920), 4326)),
('Hospital Casimiro Ulloa', 'hospital', 'Especializado en emergencias y trauma shock.', ST_SetSRID(ST_MakePoint(-77.0260, -12.1320), 4326)),
('Clínica Anglo Americana', 'hospital', 'Atención médica internacional y servicios de emergencia.', ST_SetSRID(ST_MakePoint(-77.0350, -12.1100), 4326)),
('Hospital Sabogal', 'hospital', 'Centro hospitalario con atención de emergencias 24/7.', ST_SetSRID(ST_MakePoint(-77.0940, -12.0620), 4326)),
('Clínica San Borja', 'hospital', 'Servicios médicos especializados y emergencias.', ST_SetSRID(ST_MakePoint(-77.0050, -12.1050), 4326)),

-- Puntos de iluminación (zonas bien iluminadas)
('Parque Kennedy', 'iluminacion', 'Zona con iluminación LED de alta potencia y cobertura completa.', ST_SetSRID(ST_MakePoint(-77.0310, -12.1210), 4326)),
('Malecón de Miraflores', 'iluminacion', 'Área completamente iluminada con sistema automatizado.', ST_SetSRID(ST_MakePoint(-77.0350, -12.1310), 4326)),
('Jockey Plaza', 'iluminacion', 'Centro comercial con iluminación exterior e interior de alta intensidad.', ST_SetSRID(ST_MakePoint(-76.9750, -12.0850), 4326)),
('Plaza San Miguel', 'iluminacion', 'Área comercial con sistema de iluminación permanente.', ST_SetSRID(ST_MakePoint(-77.0850, -12.0770), 4326)),
('Larcomar', 'iluminacion', 'Centro comercial con iluminación perimetral y vigilancia.', ST_SetSRID(ST_MakePoint(-77.0315, -12.1320), 4326)),
('Parque de la Amistad', 'iluminacion', 'Parque con sistema de iluminación LED en caminos principales.', ST_SetSRID(ST_MakePoint(-77.0020, -12.1119), 4326)),
('Real Plaza Salaverry', 'iluminacion', 'Centro comercial con iluminación interior y exterior.', ST_SetSRID(ST_MakePoint(-77.0520, -12.0805), 4326)),
('Av. Arequipa', 'iluminacion', 'Avenida principal con iluminación en toda su extensión.', ST_SetSRID(ST_MakePoint(-77.0335, -12.1000), 4326)),
('Campo de Marte', 'iluminacion', 'Parque metropolitano con iluminación en senderos principales.', ST_SetSRID(ST_MakePoint(-77.0420, -12.0700), 4326)),
('Av. La Marina', 'iluminacion', 'Vía principal con iluminación de alta potencia en todo su recorrido.', ST_SetSRID(ST_MakePoint(-77.0750, -12.0770), 4326)),
('Pentagonito', 'iluminacion', 'Perímetro completamente iluminado con alta densidad de luminarias.', ST_SetSRID(ST_MakePoint(-77.0050, -12.1080), 4326)),
('Costa Verde', 'iluminacion', 'Tramo con iluminación moderna y constante en toda la vía.', ST_SetSRID(ST_MakePoint(-77.0300, -12.1350), 4326)),
('Plaza Mayor de Lima', 'iluminacion', 'Área histórica con iluminación ornamental y de seguridad.', ST_SetSRID(ST_MakePoint(-77.0320, -12.0460), 4326)),
('Ovalo Gutiérrez', 'iluminacion', 'Intersección con iluminación de alta intensidad y cobertura.', ST_SetSRID(ST_MakePoint(-77.0312, -12.1057), 4326)),
('Av. Javier Prado', 'iluminacion', 'Vía principal con sistema de iluminación moderno y continuo.', ST_SetSRID(ST_MakePoint(-77.0200, -12.0908), 4326)),

-- Puntos adicionales de seguridad
('Puesto de Auxilio Rápido Miraflores', 'puestoseguridad', 'Módulo de atención ciudadana con personal permanente.', ST_SetSRID(ST_MakePoint(-77.0330, -12.1230), 4326)),
('Centro de Monitoreo San Isidro', 'puestoseguridad', 'Central de vigilancia con pantallas de monitoreo en tiempo real.', ST_SetSRID(ST_MakePoint(-77.0360, -12.1030), 4326)),
('Puesto de Control San Borja', 'puestoseguridad', 'Punto de control vehicular y peatonal permanente.', ST_SetSRID(ST_MakePoint(-77.0040, -12.1070), 4326)),
('Estación de Bomberos Miraflores', 'bomberos', 'Compañía de bomberos con atención de emergencias 24/7.', ST_SetSRID(ST_MakePoint(-77.0295, -12.1170), 4326)),
('Estación de Bomberos San Isidro', 'bomberos', 'Unidad de respuesta a emergencias y rescate.', ST_SetSRID(ST_MakePoint(-77.0390, -12.1040), 4326)),
('Estación de Bomberos Surco', 'bomberos', 'Compañía con unidades de rescate y emergencias.', ST_SetSRID(ST_MakePoint(-77.0150, -12.1440), 4326)),
('Puesto de Vigilancia Parque Kennedy', 'puestoseguridad', 'Módulo de vigilancia con personal rotativo.', ST_SetSRID(ST_MakePoint(-77.0316, -12.1215), 4326)),
('Módulo de Seguridad Larcomar', 'puestoseguridad', 'Punto de atención y vigilancia permanente.', ST_SetSRID(ST_MakePoint(-77.0310, -12.1315), 4326)),
('Centro de Control Via Expresa', 'puestoseguridad', 'Monitoreo de tránsito y seguridad vial.', ST_SetSRID(ST_MakePoint(-77.0280, -12.1100), 4326)),
('Puesto de Auxilio Rápido Barranco', 'puestoseguridad', 'Módulo de atención inmediata y patrullaje.', ST_SetSRID(ST_MakePoint(-77.0265, -12.1420), 4326)),
('Estación de Bomberos Magdalena', 'bomberos', 'Unidad de respuesta a emergencias con ambulancia.', ST_SetSRID(ST_MakePoint(-77.0730, -12.0900), 4326)),
('Centro de Monitoreo La Molina', 'puestoseguridad', 'Sistema de vigilancia con cámaras de alta definición.', ST_SetSRID(ST_MakePoint(-76.9520, -12.0810), 4326)),
('Puesto de Control Surquillo', 'puestoseguridad', 'Punto estratégico de vigilancia y control.', ST_SetSRID(ST_MakePoint(-77.0220, -12.1080), 4326)),
('Estación de Bomberos San Borja', 'bomberos', 'Compañía especializada en rescate y emergencias.', ST_SetSRID(ST_MakePoint(-77.0055, -12.1095), 4326)),
('Módulo de Seguridad Ciudadana Lince', 'puestoseguridad', 'Punto de atención al ciudadano y vigilancia.', ST_SetSRID(ST_MakePoint(-77.0345, -12.0885), 4326));

-- Añadir más datos según sea necesario
-- Datos de muestra para la tabla incidentes en Lima, Perú
-- Las coordenadas están en formato POINT(longitud latitud)
INSERT INTO incidentes (tipo, descripcion, fecha, ubicacion) VALUES
-- Incidentes de tipo 'robo'
('robo', 'Robo de celular a transeúnte por dos sujetos en motocicleta', '2025-05-01 14:30:00', ST_SetSRID(ST_MakePoint(-77.0270, -12.1150), 4326)),
('robo', 'Arrebato de cartera en paradero de bus', '2025-05-02 19:45:00', ST_SetSRID(ST_MakePoint(-77.0365, -12.1180), 4326)),
('robo', 'Robo de laptop en cafetería a cliente distraído', '2025-05-03 16:20:00', ST_SetSRID(ST_MakePoint(-77.0305, -12.1205), 4326)),
('robo', 'Robo de billetera en transporte público', '2025-05-04 08:10:00', ST_SetSRID(ST_MakePoint(-77.0390, -12.0950), 4326)),
('robo', 'Sustracción de pertenencias en taxi no autorizado', '2025-05-04 22:15:00', ST_SetSRID(ST_MakePoint(-77.0200, -12.1100), 4326)),
('robo', 'Robo de celular con modalidad "al paso"', '2025-05-04 17:40:00', ST_SetSRID(ST_MakePoint(-77.0380, -12.0720), 4326)),
('robo', 'Hurto de bicicleta estacionada', '2025-05-05 12:30:00', ST_SetSRID(ST_MakePoint(-77.0323, -12.1190), 4326)),
('robo', 'Robo de autopartes en vehículo estacionado', '2025-05-05 02:15:00', ST_SetSRID(ST_MakePoint(-77.0290, -12.1080), 4326)),
('robo', 'Robo a tienda de conveniencia', '2025-05-05 23:40:00', ST_SetSRID(ST_MakePoint(-77.0280, -12.0880), 4326)),
('robo', 'Arrebato de reloj a transeúnte', '2025-05-06 18:20:00', ST_SetSRID(ST_MakePoint(-77.0370, -12.0970), 4326)),

-- Incidentes de tipo 'acoso'
('acoso', 'Acoso verbal a transeúnte', '2025-05-02 15:20:00', ST_SetSRID(ST_MakePoint(-77.0340, -12.1170), 4326)),
('acoso', 'Seguimiento intimidante a estudiante', '2025-05-03 13:45:00', ST_SetSRID(ST_MakePoint(-77.0180, -12.1120), 4326)),
('acoso', 'Acoso en transporte público a pasajera', '2025-05-04 07:30:00', ST_SetSRID(ST_MakePoint(-77.0310, -12.0880), 4326)),
('acoso', 'Comportamiento intimidante hacia grupo de jóvenes', '2025-05-05 20:15:00', ST_SetSRID(ST_MakePoint(-77.0520, -12.0630), 4326)),
('acoso', 'Acoso callejero a transeúntes', '2025-05-05 18:50:00', ST_SetSRID(ST_MakePoint(-77.0250, -12.1250), 4326)),

-- Incidentes de tipo 'accidente'
('accidente', 'Colisión entre motocicleta y automóvil', '2025-05-01 08:45:00', ST_SetSRID(ST_MakePoint(-77.0400, -12.0950), 4326)),
('accidente', 'Atropello en cruce peatonal', '2025-05-02 17:30:00', ST_SetSRID(ST_MakePoint(-77.0320, -12.0650), 4326)),
('accidente', 'Choque múltiple en intersección', '2025-05-03 12:15:00', ST_SetSRID(ST_MakePoint(-77.0150, -12.1250), 4326)),
('accidente', 'Caída de peatón por desnivel en acera', '2025-05-04 09:20:00', ST_SetSRID(ST_MakePoint(-77.0270, -12.1050), 4326)),
('accidente', 'Colisión por invasión de carril', '2025-05-05 14:10:00', ST_SetSRID(ST_MakePoint(-77.0420, -12.0830), 4326)),
('accidente', 'Accidente con motociclista de delivery', '2025-05-05 19:05:00', ST_SetSRID(ST_MakePoint(-77.0350, -12.1000), 4326)),
('accidente', 'Vehículo impactó contra poste', '2025-05-06 01:30:00', ST_SetSRID(ST_MakePoint(-77.0280, -12.0900), 4326)),

-- Incidentes de tipo 'iluminacion'
('iluminacion', 'Falta de iluminación en calle secundaria', '2025-05-01 20:30:00', ST_SetSRID(ST_MakePoint(-77.0600, -12.0900), 4326)),
('iluminacion', 'Poste de luz dañado', '2025-05-02 19:15:00', ST_SetSRID(ST_MakePoint(-77.0250, -12.1220), 4326)),
('iluminacion', 'Zona de parque sin alumbrado funcionando', '2025-05-03 21:20:00', ST_SetSRID(ST_MakePoint(-77.0450, -12.1050), 4326)),
('iluminacion', 'Calle con alumbrado intermitente', '2025-05-04 22:30:00', ST_SetSRID(ST_MakePoint(-77.0370, -12.0740), 4326)),
('iluminacion', 'Pasaje peatonal oscuro por falta de mantenimiento', '2025-05-05 20:45:00', ST_SetSRID(ST_MakePoint(-77.0190, -12.1150), 4326)),

-- Incidentes de tipo 'transito'
('transito', 'Congestión por semáforo descompuesto', '2025-05-01 07:30:00', ST_SetSRID(ST_MakePoint(-77.0320, -12.0920), 4326)),
('transito', 'Bloqueo vial por manifestación', '2025-05-02 11:15:00', ST_SetSRID(ST_MakePoint(-77.0290, -12.0550), 4326)),
('transito', 'Embotellamiento por obras en la vía', '2025-05-03 18:00:00', ST_SetSRID(ST_MakePoint(-77.0180, -12.1030), 4326)),
('transito', 'Congestionamiento por vehículo averiado', '2025-05-04 13:40:00', ST_SetSRID(ST_MakePoint(-77.0400, -12.0860), 4326)),
('transito', 'Tráfico intenso por cierre parcial de carril', '2025-05-05 17:25:00', ST_SetSRID(ST_MakePoint(-77.0350, -12.1120), 4326)),

-- Incidentes varios (tipo 'otro')
('otro', 'Persona en situación de emergencia médica', '2025-05-01 15:50:00', ST_SetSRID(ST_MakePoint(-77.0330, -12.1140), 4326)),
('otro', 'Disturbio en vía pública', '2025-05-02 23:10:00', ST_SetSRID(ST_MakePoint(-77.0420, -12.0830), 4326)),
('otro', 'Persona perdida pidiendo ayuda', '2025-05-03 16:45:00', ST_SetSRID(ST_MakePoint(-77.0260, -12.1210), 4326)),
('otro', 'Fuga de agua en vía pública', '2025-05-04 10:20:00', ST_SetSRID(ST_MakePoint(-77.0310, -12.0980), 4326)),
('otro', 'Árbol caído bloqueando paso peatonal', '2025-05-05 08:30:00', ST_SetSRID(ST_MakePoint(-77.0270, -12.1060), 4326)),

-- Incidentes más recientes (últimas 24 horas)
('robo', 'Robo de celular en zona comercial', '2025-05-08 16:30:00', ST_SetSRID(ST_MakePoint(-77.0310, -12.1130), 4326)),
('acoso', 'Acoso a estudiantes cerca de universidad', '2025-05-08 14:20:00', ST_SetSRID(ST_MakePoint(-77.0280, -12.0730), 4326)),
('iluminacion', 'Calle sin iluminación por corte eléctrico', '2025-05-08 20:15:00', ST_SetSRID(ST_MakePoint(-77.0230, -12.1050), 4326)),
('accidente', 'Choque entre auto y taxi en intersección', '2025-05-08 09:45:00', ST_SetSRID(ST_MakePoint(-77.0360, -12.0950), 4326)),
('transito', 'Congestión severa por obras municipales', '2025-05-08 08:20:00', ST_SetSRID(ST_MakePoint(-77.0290, -12.1020), 4326)),
('otro', 'Incendio menor en local comercial', '2025-05-08 11:35:00', ST_SetSRID(ST_MakePoint(-77.0340, -12.0990), 4326)),
('robo', 'Intento de robo a vivienda', '2025-05-08 03:20:00', ST_SetSRID(ST_MakePoint(-77.0190, -12.1180), 4326)),
('accidente', 'Accidente con motociclista repartidor', '2025-05-08 18:50:00', ST_SetSRID(ST_MakePoint(-77.0380, -12.1010), 4326)),
('iluminacion', 'Zona de parque con luces intermitentes', '2025-05-08 19:30:00', ST_SetSRID(ST_MakePoint(-77.0330, -12.1090), 4326)),
('acoso', 'Persona sospechosa siguiendo a transeúntes', '2025-05-08 21:15:00', ST_SetSRID(ST_MakePoint(-77.0300, -12.0890), 4326));

-- Añadir más incidentes según sea necesario