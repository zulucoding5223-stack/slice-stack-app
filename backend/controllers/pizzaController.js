import pizzaModel from "../models/pizzaSchema.js";
import userModel from "../models/userModel.js";
import cloudinary from "../utils/cloudinary.js";

export const createPizza = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);

    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return res.status(403).json({
        success: false,
        message: "Only admins and the owner can create a pizza.",
      });
    }

    const { name, description, basePrice, flavour } = req.body;

    if (!name || !description || !basePrice || !flavour) {
      return res.status(400).json({
        success: false,
        message: "Name, description, flavour and base price are required",
      });
    }

    let sizes = [];
    if (req.body.sizes) {
      try {
        sizes = JSON.parse(req.body.sizes);

        if (!Array.isArray(sizes)) {
          return res.status(400).json({
            success: false,
            message: "Sizes must be an array of objects",
          });
        }

        for (let i = 0; i < sizes.length; i++) {
          const size = sizes[i];

          if (!size.name || size.name.trim() === "") {
            return res.status(400).json({
              success: false,
              message: `Size at index ${i} has empty name`,
            });
          }

          if (
            size.extraPrice === undefined ||
            size.extraPrice === null ||
            typeof size.extraPrice !== "number" ||
            size.extraPrice < 0
          ) {
            return res.status(400).json({
              success: false,
              message: `Size at index ${i} has invalid extraPrice`,
            });
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Sizes must be valid JSON",
          error: error.message,
        });
      }
    } else {
      sizes = [];
    }

    let toppings = [];
    if (req.body.toppings) {
      try {
        toppings = JSON.parse(req.body.toppings);

        if (!Array.isArray(toppings)) {
          return res.status(400).json({
            success: false,
            message: "Sizes must be an array of objects",
          });
        }

        for (let i = 0; i < toppings.length; i++) {
          const topping = toppings[i];

          if (!topping.name || topping.name.trim() === "") {
            return res.status(400).json({
              success: false,
              message: `Size at index ${i} has empty name`,
            });
          }

          if (
            topping.price === undefined ||
            topping.price === null ||
            typeof topping.price !== "number" ||
            topping.price < 0
          ) {
            return res.status(400).json({
              success: false,
              message: `Topping at index ${i} has invalid extraPrice`,
            });
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Toppings must be valid JSON",
          error: error.message,
        });
      }
    } else {
      toppings = [];
    }

    let images = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { folder: "pizza_images" }
        )
      );

      const uploadedImages = await Promise.all(uploadPromises);

      images = uploadedImages.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: "Please add images to your pizza.",
      });
    }

    let isAvailable = true;
    if (req.body.isAvailable) {
      isAvailable = req.body.isAvailable;
    }
    const pizza = await pizzaModel.create({
      name,
      description,
      basePrice,
      sizes,
      toppings,
      images,
      flavour,
      isAvailable,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Pizza created successfully",
      pizza,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create pizza",
      error: error.message,
    });
  }
};

export const updatePizza = async (req, res) => {
  try {
    const pizzaId = req.params.id;
    const pizza = await pizzaModel.findById(pizzaId);

    if (!pizza) {
      return res.status(404).json({
        success: false,
        message: "Pizza not found",
      });
    }

    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return res.status(403).json({
        success: false,
        message: "Only admins or owners can update pizza",
      });
    }

    const { name, description, basePrice, flavour, isAvailable } = req.body;
    if (name) pizza.name = name;
    if (description) pizza.description = description;
    if (basePrice) pizza.basePrice = basePrice;
    if (flavour) pizza.flavour = flavour;
    if (isAvailable !== undefined) pizza.isAvailable = isAvailable;

    if (req.body.sizes) {
      try {
        const sizes = JSON.parse(req.body.sizes);
        if (!Array.isArray(sizes)) {
          return res.status(400).json({
            success: false,
            message: "Sizes must be an array of objects",
          });
        }

        for (let i = 0; i < sizes.length; i++) {
          const size = sizes[i];
          if (!size.name || size.name.trim() === "")
            return res.status(400).json({
              success: false,
              message: `Size at index ${i} has empty name`,
            });
          if (
            size.extraPrice === undefined ||
            size.extraPrice === null ||
            typeof size.extraPrice !== "number" ||
            size.extraPrice < 0
          )
            return res.status(400).json({
              success: false,
              message: `Size at index ${i} has invalid extraPrice`,
            });
        }

        pizza.sizes = sizes;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Sizes must be valid JSON",
          error: error.message,
        });
      }
    }

    if (req.body.toppings) {
      try {
        const toppings = JSON.parse(req.body.toppings);
        if (!Array.isArray(toppings)) {
          return res.status(400).json({
            success: false,
            message: "Toppings must be an array of objects",
          });
        }

        for (let i = 0; i < toppings.length; i++) {
          const topping = toppings[i];
          if (!topping.name || topping.name.trim() === "")
            return res.status(400).json({
              success: false,
              message: `Topping at index ${i} has empty name`,
            });
          if (
            topping.price === undefined ||
            topping.price === null ||
            typeof topping.price !== "number" ||
            topping.price < 0
          )
            return res.status(400).json({
              success: false,
              message: `Topping at index ${i} has invalid price`,
            });
        }

        pizza.toppings = toppings;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Toppings must be valid JSON",
          error: error.message,
        });
      }
    }

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            { folder: "pizza_images" }
          )
        )
      );
      const images = uploadedImages.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));

      pizza.images = images;
    }

    await pizza.save();

    return res.status(200).json({
      success: true,
      message: "Pizza updated successfully",
      pizza,
      updatedAt: (pizza.updatedAt).toLocaleTimeString()
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to update pizza",
      error: error.message,
    });
  }
};
