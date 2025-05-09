/**
 * controllers/placesController.js
 * Controladores para operaciones CRUD de lugares
 */

const Place = require('../models/Place');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/errorHandler');
const config = require('../config/app');

// Obtener todos los lugares
exports.getAllPlaces = catchAsync(async (req, res, next) => {
  // Este endpoint podría ser peligroso con muchos datos
  // Implementamos paginación
  const { page = 1, limit = 20, category } = req.query;
  
  // Consulta SQL directa con paginación y filtro opcional por categoría
  const { pool } = require('../config/database');
  
  // Determinar el offset para la paginación
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Preparar la consulta base
  let query = `
    SELECT 
      id, name, category, subcategory,
      ST_Y(geom::geometry) AS latitude,
      ST_X(geom::geometry) AS longitude,
      address, district, search_priority, created_at
    FROM geocoding.places
  `;
  
  // Agregar filtro por categoría si se proporciona
  const queryParams = [];
  if (category) {
    query += ` WHERE category = $1`;
    queryParams.push(category);
  }
  
  // Agregar ordenamiento y paginación
  query += `
    ORDER BY search_priority ASC, created_at DESC
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;
  
  // Agregar los parámetros de paginación
  queryParams.push(parseInt(limit), offset);
  
  // Consulta adicional para obtener el total
  let countQuery = "SELECT COUNT(*) FROM geocoding.places";
  if (category) {
    countQuery += " WHERE category = $1";
  }
  
  // Ejecutar ambas consultas en paralelo
  const [dataResult, countResult] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, category ? [category] : [])
  ]);
  
  // Obtener los resultados
  const places = dataResult.rows;
  const totalCount = parseInt(countResult.rows[0].count);
  
  // Calcular metadatos de paginación
  const totalPages = Math.ceil(totalCount / parseInt(limit));
  
  res.status(200).json({
    success: true,
    meta: {
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    },
    places,
    count: places.length
  });
});

// Obtener un lugar por ID
exports.getPlaceById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return next(new AppError('ID de lugar inválido', 400));
  }
  
  const place = await Place.findById(parseInt(id));
  
  res.status(200).json({
    success: true,
    place
  });
});

// Crear un nuevo lugar
exports.createPlace = catchAsync(async (req, res, next) => {
  const { 
    name, alternative_names, category, subcategory, 
    latitude, longitude, address, district, search_priority 
  } = req.body;
  
  // Validar los campos obligatorios
  if (!name || !latitude || !longitude) {
    return next(new AppError('Se requieren nombre y coordenadas (latitude, longitude)', 400));
  }
  
  // Validar coordenadas
  if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
    return next(new AppError('Coordenadas inválidas', 400));
  }
  
  // Validar categoría si se proporciona
  if (category && !config.geocoding.categories.includes(category)) {
    return next(new AppError(`Categoría inválida: ${category}`, 400));
  }
  
  // Crear el lugar
  const place = await Place.create({
    name,
    alternative_names,
    category,
    subcategory,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    address,
    district,
    search_priority
  });
  
  res.status(201).json({
    success: true,
    message: 'Lugar creado correctamente',
    place
  });
});

// Actualizar un lugar existente
exports.updatePlace = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { 
    name, alternative_names, category, subcategory, 
    latitude, longitude, address, district, search_priority 
  } = req.body;
  
  if (!id || isNaN(parseInt(id))) {
    return next(new AppError('ID de lugar inválido', 400));
  }
  
  // Validar coordenadas si se proporcionan
  if ((latitude !== undefined && isNaN(parseFloat(latitude))) || 
      (longitude !== undefined && isNaN(parseFloat(longitude)))) {
    return next(new AppError('Coordenadas inválidas', 400));
  }
  
  // Validar categoría si se proporciona
  if (category && !config.geocoding.categories.includes(category)) {
    return next(new AppError(`Categoría inválida: ${category}`, 400));
  }
  
  // Preparar datos para actualización
  const placeData = {
    name,
    alternative_names,
    category,
    subcategory,
    latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
    longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
    address,
    district,
    search_priority: search_priority !== undefined ? parseInt(search_priority) : undefined
  };
  
  // Actualizar el lugar
  const place = await Place.update(parseInt(id), placeData);
  
  res.status(200).json({
    success: true,
    message: 'Lugar actualizado correctamente',
    place
  });
});

// Eliminar un lugar
exports.deletePlace = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return next(new AppError('ID de lugar inválido', 400));
  }
  
  await Place.delete(parseInt(id));
  
  res.status(200).json({
    success: true,
    message: 'Lugar eliminado correctamente',
    id: parseInt(id)
  });
});