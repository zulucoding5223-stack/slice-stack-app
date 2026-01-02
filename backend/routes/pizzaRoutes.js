import express from 'express';
import { authMiddleware } from '../middlewares/userAuth.js';
import { createPizza, updatePizza } from '../controllers/pizzaController.js';
import { upload } from '../utils/multer.js';
const pizzaRoutes = express.Router();

pizzaRoutes.post('/create-pizza', authMiddleware, upload.array('images', 5), createPizza)
pizzaRoutes.post('/update-pizza/:id', authMiddleware, upload.array('images', 5), updatePizza)


export default pizzaRoutes;