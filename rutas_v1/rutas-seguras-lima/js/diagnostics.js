/**
 * diagnostics.js
 * Script para diagnosticar problemas de carga de módulos
 */

(function() {
    // Función para verificar módulos al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
        console.log('%c=== DIAGNÓSTICO DE RUTAS SEGURAS LIMA ===', 'color: blue; font-weight: bold; font-size: 14px;');
        
        // Verificar carga de módulos
        checkModulesLoaded();
        
        // Verificar orden de carga
        checkLoadOrder();
        
        // Verificar posibles conflictos de nombres
        checkNameConflicts();
    });
    
    // Comprueba si los módulos necesarios están cargados
    function checkModulesLoaded() {
        console.log('%cVerificando módulos cargados:', 'font-weight: bold;');
        
        const requiredModules = [
            'UI', 'Map', 'Security', 'Routes', 'API', 
            'OpenRouteService', 'App', 'L'
        ];
        
        const results = {};
        let allLoaded = true;
        
        requiredModules.forEach(moduleName => {
            const isLoaded = typeof window[moduleName] !== 'undefined';
            results[moduleName] = isLoaded;
            
            if (!isLoaded) {
                allLoaded = false;
                console.log(`❌ ${moduleName}: No cargado`);
            } else {
                console.log(`✅ ${moduleName}: Cargado correctamente`);
            }
        });
        
        if (allLoaded) {
            console.log('%cTodos los módulos se cargaron correctamente', 'color: green; font-weight: bold;');
        } else {
            console.log('%cAlgunos módulos no se cargaron correctamente', 'color: red; font-weight: bold;');
        }
        
        return results;
    }
    
    // Comprueba el orden de carga de los scripts
    function checkLoadOrder() {
        console.log('%cVerificando orden de carga de scripts:', 'font-weight: bold;');
        
        const scripts = document.getElementsByTagName('script');
        const scriptOrder = [];
        
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src) {
                // Extraer solo el nombre del archivo
                const filename = src.substring(src.lastIndexOf('/') + 1);
                if (filename) {
                    scriptOrder.push(filename);
                }
            }
        }
        
        console.log('Orden de carga detectado:');
        scriptOrder.forEach((script, index) => {
            console.log(`${index + 1}. ${script}`);
        });
        
        // Comprueba posibles problemas de dependencias
        checkDependencyIssues(scriptOrder);
    }
    
    // Comprueba posibles problemas de dependencias
    function checkDependencyIssues(scriptOrder) {
        const dependencies = {
            'routes.js': ['security.js', 'map.js', 'api.js'],
            'app.js': ['routes.js', 'security.js', 'ui.js', 'map.js', 'api.js'],
            'security.js': ['api.js'],
            'map.js': []
        };
        
        let hasIssues = false;
        
        console.log('%cVerificando problemas de dependencias:', 'font-weight: bold;');
        
        for (const [module, deps] of Object.entries(dependencies)) {
            const moduleIndex = scriptOrder.findIndex(s => s === module);
            if (moduleIndex === -1) continue; // El módulo no está en la lista
            
            for (const dep of deps) {
                const depIndex = scriptOrder.findIndex(s => s === dep);
                if (depIndex === -1) {
                    console.log(`❌ Problema: ${module} requiere ${dep}, pero ${dep} no está cargado.`);
                    hasIssues = true;
                } else if (depIndex > moduleIndex) {
                    console.log(`❌ Problema: ${module} requiere ${dep}, pero ${dep} se carga después.`);
                    hasIssues = true;
                }
            }
        }
        
        if (!hasIssues) {
            console.log('✅ No se detectaron problemas de dependencias en el orden de carga.');
        }
    }
    
    // Comprueba posibles conflictos de nombres
    function checkNameConflicts() {
        console.log('%cVerificando posibles conflictos de nombres:', 'font-weight: bold;');
        
        // Lista de nombres que podrían causar conflictos
        const potentialConflicts = [
            'Map', // Puede conflictuar con Map de JavaScript
            'Security', // Podría conflictuar con objeto Security en algunos navegadores
            'API', // Podría conflictuar con API nativas del navegador
        ];
        
        potentialConflicts.forEach(name => {
            if (typeof window[name] !== 'undefined') {
                // Intentar determinar si es nuestro módulo o algo nativo
                const isLikelyOurModule = window[name].toString().includes('function');
                if (isLikelyOurModule) {
                    console.log(`✅ ${name}: Parece ser nuestro módulo definido correctamente`);
                } else {
                    console.log(`⚠️ ${name}: Posible conflicto. Hay un objeto global con este nombre que podría no ser nuestro módulo.`);
                }
            } else {
                console.log(`❌ ${name}: No está definido como objeto global`);
            }
        });
    }
})();