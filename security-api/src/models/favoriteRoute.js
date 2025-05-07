// This is a basic example using a placeholder 'db' object
// You would replace 'db' with your actual database connection pool or client
const db = require('../config/db'); // Assuming your db connection is here

class FavoriteRoute {
    constructor(id, user_id, route_name, route_data) {
        this.id = id;
        this.user_id = user_id;
        this.route_name = route_name;
        this.route_data = route_data;
    }

    static async create({ user_id, route_name, route_data }) {
        const query = `
            INSERT INTO favorite_routes (user_id, route_name, route_data)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [user_id, route_name, JSON.stringify(route_data)];

        try {
            const result = await db.query(query, values);
            const newRoute = result.rows[0];
            return new FavoriteRoute(newRoute.id, newRoute.user_id, newRoute.route_name, newRoute.route_data);
        } catch (error) {
            console.error("Error creating favorite route:", error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        const query = `
            SELECT * FROM favorite_routes WHERE user_id = $1;
        `;
        const values = [userId];

        try {
            const result = await db.query(query, values);
            return result.rows.map(row => new FavoriteRoute(row.id, row.user_id, row.route_name, row.route_data));
        } catch (error) {
            console.error("Error finding favorite routes by user ID:", error);
            throw error;
        }
    }

    static async findById(id) {
        const query = `
            SELECT * FROM favorite_routes WHERE id = $1;
        `;
        const values = [id];

        try {
            const result = await db.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return new FavoriteRoute(row.id, row.user_id, row.route_name, row.route_data);
            }
            return null; // Route not found
        } catch (error) {
            console.error("Error finding favorite route by ID:", error);
            throw error;
        }
    }

    static async deleteById(id) {
        const query = `
            DELETE FROM favorite_routes WHERE id = $1 RETURNING *;
        `;
        const values = [id];

        try {
            const result = await db.query(query, values);
            if (result.rows.length > 0) {
                const deletedRoute = result.rows[0];
                return new FavoriteRoute(deletedRoute.id, deletedRoute.user_id, deletedRoute.route_name, deletedRoute.route_data);
            }
            return null; // Route not found
        } catch (error) {
            console.error("Error deleting favorite route by ID:", error);
            throw error;
        }
    }
}

module.exports = FavoriteRoute;