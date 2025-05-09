/**
 * L.Polyline.SnakeAnim.js
 * Extensión para animar líneas (polylines) en Leaflet con efecto "snake"
 * 
 * Basado en el plugin L.Polyline.Snake original por Igor Vladyka
 * https://github.com/IvanSanchez/Leaflet.Polyline.SnakeAnim
 */

(function() {
    // Si Leaflet no está cargado, no hacer nada
    if (typeof L === 'undefined') {
        console.error('Se requiere Leaflet para L.Polyline.SnakeAnim');
        return;
    }

    /**
     * Devuelve la longitud de una polyline en píxeles
     * @param {L.Map} map - El mapa en el que está la polyline
     * @param {Array} latlngs - Array de puntos [lat, lng]
     * @returns {Number} - Longitud en píxeles
     */
    function polylineLength(map, latlngs) {
        let pixelLength = 0;
        
        for (let i = 1; i < latlngs.length; i++) {
            const p1 = map.latLngToLayerPoint(latlngs[i-1]);
            const p2 = map.latLngToLayerPoint(latlngs[i]);
            pixelLength += p1.distanceTo(p2);
        }
        
        return pixelLength;
    }

    /**
     * Genera un array de latlngs para la animación
     * @param {L.Map} map - El mapa
     * @param {Array} latlngs - Array original de latlngs
     * @param {Number} length - Longitud deseada del array
     * @returns {Array} - Array interpolado
     */
    function interpolateArray(map, latlngs, length) {
        const result = [];
        
        // Caso especial: array vacío o solo un punto
        if (latlngs.length < 2) {
            return latlngs;
        }

        // Longitud total en píxeles
        const totalLength = polylineLength(map, latlngs);
        let segmentLength = 0;
        let segmentFractionsDone = 0;
        let segment = 0;
        
        // Primer punto siempre igual
        result.push(latlngs[0]);
        
        for (let i = 1; i < length - 1; i++) {
            const fractionDone = i / (length - 1);
            const pixelPos = fractionDone * totalLength;
            
            // Encontrar el segmento actual
            let nextSegmentLength = segmentLength;
            while (segment < latlngs.length - 1) {
                const p1 = map.latLngToLayerPoint(latlngs[segment]);
                const p2 = map.latLngToLayerPoint(latlngs[segment + 1]);
                nextSegmentLength += p1.distanceTo(p2);
                
                if (nextSegmentLength > pixelPos) break;
                
                segment++;
                segmentLength = nextSegmentLength;
                segmentFractionsDone = 0;
            }
            
            if (segment >= latlngs.length - 1) {
                // Si llegamos al final, usar el último punto
                result.push(latlngs[latlngs.length - 1]);
                continue;
            }
            
            // Interpolar entre los puntos de este segmento
            const p1 = map.latLngToLayerPoint(latlngs[segment]);
            const p2 = map.latLngToLayerPoint(latlngs[segment + 1]);
            const segmentPixelLength = p1.distanceTo(p2);
            const segmentFraction = (pixelPos - segmentLength) / segmentPixelLength;
            
            // Nuevo punto interpolado
            const x = p1.x + segmentFraction * (p2.x - p1.x);
            const y = p1.y + segmentFraction * (p2.y - p1.y);
            const interpolatedLatLng = map.layerPointToLatLng([x, y]);
            
            result.push(interpolatedLatLng);
        }
        
        // Último punto siempre igual
        result.push(latlngs[latlngs.length - 1]);
        
        return result;
    }

    // Extender L.Polyline con funciones de animación
    L.Polyline.include({
        /**
         * Inicia la animación de la polyline
         * @param {Object} options - Opciones de animación
         */
        snakeIn: function(options = {}) {
            if (this._snaking) return;
            
            this._snaking = true;
            this._originalLatLngs = this.getLatLngs();
            
            const defaultOptions = {
                duration: 2000,  // Duración en ms
                easing: t => t * (2 - t),  // Función de aceleración
                steps: 100,  // Número de pasos de la animación
                onComplete: null  // Callback al completar
            };
            
            this._snakeOptions = { ...defaultOptions, ...options };
            
            // Ocultar la línea inicialmente
            const originalStyle = this.options;
            this.setStyle({ opacity: 0 });
            
            // Crear una nueva línea que se irá "dibujando"
            this._snakingLine = L.polyline([], originalStyle).addTo(this._map);
            
            // Interporlar el array de puntos
            this._snakeLatLngs = interpolateArray(
                this._map, 
                this._originalLatLngs, 
                this._snakeOptions.steps
            );
            
            // Iniciar la animación
            this._snakeAnimate(0);
            
            return this;
        },
        
        /**
         * Función recursiva de animación
         * @param {Number} step - Paso actual de la animación
         */
        _snakeAnimate: function(step) {
            const options = this._snakeOptions;
            const progress = step / options.steps;
            
            // Aplicar función de aceleración
            const easeProgress = options.easing(progress);
            
            // Calcular cuántos puntos mostrar
            const showUpTo = Math.floor(this._snakeLatLngs.length * easeProgress);
            
            // Actualizar la línea animada
            this._snakingLine.setLatLngs(this._snakeLatLngs.slice(0, showUpTo));
            
            if (progress < 1) {
                // Calcular tiempo para el siguiente frame
                const timePerStep = options.duration / options.steps;
                
                // Programar siguiente animación
                setTimeout(() => {
                    this._snakeAnimate(step + 1);
                }, timePerStep);
            } else {
                // Animación completada
                this._snakeCleanup();
                
                // Llamar al callback si existe
                if (typeof options.onComplete === 'function') {
                    options.onComplete.call(this);
                }
            }
        },
        
        /**
         * Limpieza después de la animación
         */
        _snakeCleanup: function() {
            if (!this._snaking) return;
            
            // Restaurar la polyline original
            this.setLatLngs(this._originalLatLngs);
            this.setStyle({ opacity: this._snakingLine.options.opacity });
            
            // Eliminar la línea temporal
            this._map.removeLayer(this._snakingLine);
            
            // Limpiar variables
            this._snaking = false;
            this._snakingLine = null;
            this._snakeLatLngs = null;
            this._snakeOptions = null;
        }
    });

    // Si estamos en un entorno con múltiples mapas, usar esto también en L.Polyline.Multi
    if (L.Polyline.Multi) {
        L.Polyline.Multi.include({
            snakeIn: L.Polyline.prototype.snakeIn,
            _snakeAnimate: L.Polyline.prototype._snakeAnimate,
            _snakeCleanup: L.Polyline.prototype._snakeCleanup
        });
    }

    // Añadir indicador para identificar que el plugin está cargado
    L.Polyline.SnakeAnim = true;
})();