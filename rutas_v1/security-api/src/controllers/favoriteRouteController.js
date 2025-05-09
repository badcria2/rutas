const FavoriteRoute = require('../models/favoriteRoute');

const favoriteRouteController = {
  /**
   * Add a new favorite route.
   */
  addFavoriteRoute: async (req, res) => {
    try {
      const {
        userId,
        routeName,
        routeData
      } = req.body;
      // Note: In a real application, you would get the userId from the authenticated user
      const newFavoriteRoute = await FavoriteRoute.create({
        user_id: userId,
        route_name: routeName,
        route_data: routeData
      });
      res.status(201).json(newFavoriteRoute);
    } catch (error) {
      console.error('Error adding favorite route:', error);
      res.status(500).json({
        message: 'Error adding favorite route',
        error: error.message
      });
    }
  },

  /**
   * Get all favorite routes for a user.
   */
  getFavoriteRoutes: async (req, res) => {
    try {
      const userId = req.params.userId; // Assuming userId is in the route parameters
      // Note: In a real application, you would get the userId from the authenticated user
      const favoriteRoutes = await FavoriteRoute.findByUserId(userId);
      res.status(200).json(favoriteRoutes);
    } catch (error) {
      console.error('Error getting favorite routes:', error);
      res.status(500).json({
        message: 'Error getting favorite routes',
        error: error.message
      });
    }
  },

  /**
   * Delete a favorite route by ID.
   */
  deleteFavoriteRoute: async (req, res) => {
    try {
      const routeId = req.params.id;
      const deletedCount = await FavoriteRoute.delete(routeId);
      if (deletedCount === 0) {
        return res.status(404).json({
          message: 'Favorite route not found'
        });
      }
      res.status(200).json({
        message: 'Favorite route deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting favorite route:', error);
      res.status(500).json({
        message: 'Error deleting favorite route',
        error: error.message
      });
    }
  },
};

module.exports = favoriteRouteController;