 

/**
 * controllers/geocodingController.js
 * Controladores para las operaciones de geocodificación
 */

const Geocoding = require('../models/geocoding');
const Place = require('../models/Place');
const District = require('../models/district');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/errorHandler');
const config = require('../config/app');

// Geocodificar dirección o lugar
exports.geocode = catchAsync(async (req, res, next) => {
  const { address } = req.query;
  
  if (!address) {
    return next(new AppError('Se requiere el parámetro "address"', 400));
  }
  
  const results = await Geocoding.geocode(address);
  
  res.status(200).json({
    success: true,
    query: address,
    results,
    count: results.length
  });
});

// Buscar lugares por nombre
exports.searchPlaces = catchAsync(async (req, res, next) => {
  const { query, limit = config.geocoding.defaultMaxResults } = req.query;
  
  if (!query) {
    return next(new AppError('Se requiere el parámetro "query"', 400));
  }
  
  const results = await Place.search(query, parseInt(limit));
  
  res.status(200).json({
    success: true,
    query,
    results,
    count: results.length
  });
});

// Buscar calles por nombre
exports.searchStreets = catchAsync(async (req, res, next) => {
  const { query, limit = config.geocoding.defaultMaxResults } = req.query;
  
  if (!query) {
    return next(new AppError('Se requiere el parámetro "query"', 400));
  }
  
  const results = await Geocoding.searchStreets(query, parseInt(limit));
  
  res.status(200).json({
    success: true,
    query,
    results,
    count: results.length
  });
});

// Geocodificación inversa (coordenadas a dirección)
exports.reverseGeocode = catchAsync(async (req, res, next) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return next(new AppError('Se requieren coordenadas válidas (lat y lng)', 400));
  }
  
  const result = await Geocoding.reverseGeocode(parseFloat(lat), parseFloat(lng));
  
  res.status(200).json({
    success: true,
    coordinates: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
    ...result
  });
});

// Encontrar lugares cercanos a un punto
exports.findNearby = catchAsync(async (req, res, next) => {
  const { lat, lng, radius = config.geocoding.defaultRadius, limit = config.geocoding.defaultMaxResults, categories } = req.query;
  
  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return next(new AppError('Se requieren coordenadas válidas (lat y lng)', 400));
  }
  
  // Procesar categorías si existen
  const categoryArray = categories ? categories.split(',') : null;
  
  // Validar categorías si se proporcionan
  if (categoryArray && categoryArray.length > 0) {
    const invalidCategories = categoryArray.filter(
      cat => !config.geocoding.categories.includes(cat)
    );
    
    if (invalidCategories.length > 0) {
      return next(new AppError(`Categorías inválidas: ${invalidCategories.join(', ')}`, 400));
    }
  }
  
  const places = await Place.findNearby(
    parseFloat(lat), 
    parseFloat(lng), 
    parseInt(radius), 
    parseInt(limit), 
    categoryArray
  );
  
  // Obtener información del distrito
  const district = await District.findByPoint(parseFloat(lat), parseFloat(lng));
  
  res.status(200).json({
    success: true,
    coordinates: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
    district,
    radius_meters: parseInt(radius),
    places,
    count: places.length
  });
});

// Obtener información del distrito que contiene un punto
exports.findDistrict = catchAsync(async (req, res, next) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return next(new AppError('Se requieren coordenadas válidas (lat y lng)', 400));
  }
  
  const district = await District.findByPoint(parseFloat(lat), parseFloat(lng));
  
  if (!district) {
    return next(new AppError('No se encontró un distrito para estas coordenadas', 404));
  }
  
  res.status(200).json({
    success: true,
    coordinates: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
    district
  });
});

// Obtener sugerencias de dirección
exports.suggestAddress = catchAsync(async (req, res, next) => {
  const { partial, limit = 5 } = req.query;
  
  if (!partial) {
    return next(new AppError('Se requiere el parámetro "partial"', 400));
  }
  
  const suggestions = await Geocoding.suggestAddress(partial, parseInt(limit));
  
  res.status(200).json({
    success: true,
    query: partial,
    suggestions,
    count: suggestions.length
  });
});

// Obtener estadísticas de seguridad por distrito
exports.getSecurityStats = catchAsync(async (req, res, next) => {
  const stats = await District.getSecurityStats();
  
  res.status(200).json({
    success: true,
    stats,
    count: stats.length
  });
});