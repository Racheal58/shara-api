"use strict";

const Product = use("App/Models/Product");
class ProductController {
  async index({ response }) {
    let products = await Product.all();

    return response
      .status(200)
      .json({ message: "Successfully retrieved all products", products });
  }

  async show({ params: { id }, response }) {
    const product = await Product.find(id);

    if (!product)
      return response
        .status(404)
        .json({ message: "This product does not exist" });

    return response
      .status(200)
      .json({ message: "Product has been successfully retrieved", product });
  }

  async create({ request, response }) {
    let productInfo = request.all();

    const product = await Product.create({
      ...productInfo,
    });

    return response
      .status(201)
      .json({ message: "Product has been successfully created", product });
  }

  async update({ params: { id }, request, response }) {
    const productInfo = request.only(["name", "description", "price", "imageUrl"]);

    const product = await Product.find(id);
    if (!product) {
      return response
        .status(404)
        .json({ message: "This product does not exist" });
    }

    product.name = productInfo.name;
    product.description = productInfo.description;
    product.price = productInfo.price;
    product.imageUrl = productInfo.imageUrl;

    await product.save();
    return response
      .status(201)
      .json({ message: "Product has been successfully updated", product });
  }

  async delete({ params: { id }, response }) {
    const product = await Product.find(id);
    if (!product) {
      return response
        .status(404)
        .json({ message: "This product does not exist" });
    }

    await product.delete();

    return response.status(204).json(null);
  }
}

module.exports = ProductController;
