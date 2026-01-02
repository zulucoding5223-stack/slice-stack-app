import mongoose from "mongoose";

const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sizes: [
      {
        name: {
          type: String,
          enum: ["Small", "Medium", "Large"],
          required: true,
        },
        extraPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    toppings: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    flavour: { type: String, required: true, trim: true },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
  },
  { timestamps: true }
);

const pizzaModel =
  mongoose.models.Pizza || mongoose.model("pizza", pizzaSchema);

export default pizzaModel;

{
  /*      */
}
