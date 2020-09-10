"use strict";

const Order = use("App/Models/Order");
const Product = use("App/Models/Product");
const Mail = use("Mail");
const Smser = use("Smser");

class OrderController {
  async index({
    auth: {
      user: { _id },
    },
    request,
    response,
  }) {
    const user = request.input("user");

    if (user === "true" && _id) {
      const userOrder = await Order.where({
        userId: _id,
        isCompleted: false,
      }).first();

      if (!userOrder) {
        return response
          .status(404)
          .json({ message: "This user does not have any un-completed order" });
      }

      return response.status(200).json({
        message: "Successfully retrieved your order",
        order: userOrder,
      });
    }

    const orders = await Order.all();
    if (orders.toJSON().length === 0)
      return response
        .status(404)
        .json({ message: "There are currently no orders" });

    return response
      .status(200)
      .json({ message: "Successfully retrieved all Orders", orders });
  }

  async show({
    auth: {
      user: { _id },
    },
    params: { id },
    response,
  }) {
    const order = await Order.where("_id").eq(id).first();

    if (!order) {
      return response
        .status(404)
        .json({ message: "This order does not exist" });
    }
    if (JSON.stringify(order.userId) !== JSON.stringify(_id)) {
      return response.status(403).json({
        message:
          "This order does not belong to you. Therefore you cannot access it",
      });
    }

    return response.status(200).json({
      message: "Successfully retrieved your order",
      order,
    });
  }

  async addProduct({
    auth: {
      user: { _id },
    },
    request,
    response,
  }) {
    const orderInfo = request.all();

    const product = await Product.find(orderInfo._id);
    if (!product)
      return response
        .status(404)
        .json({ message: "This product does not exist" });

    const userOrder = await Order.where({
      userId: _id,
      isCompleted: false,
    }).first();

    if (userOrder) {
      let productIndex;
      let product = {};
      userOrder.products.find((element, index) => {
        if (element._id === orderInfo._id) {
          productIndex = index;
          product = { ...element };
        }
        return;
      });
      if (productIndex !== undefined) {
        userOrder.products.splice(productIndex, 1, {
          ...orderInfo,
          quantity: orderInfo.quantity + product.quantity,
        });
      } else {
        userOrder.products.push(orderInfo);
      }
      await userOrder.save();
      return response.status(201).json({
        message: "Successfully added product to order",
        order: userOrder,
      });
    }

    const order = await Order.create({
      userId: _id,
      products: [orderInfo],
      isCompleted: false,
    });
    return response
      .status(201)
      .json({ message: "Successfully added product to order", order });
  }

  async removeProduct({
    auth: {
      user: { _id },
    },
    params: { orderId, productId },
    response,
  }) {
    const order = await Order.where("_id").eq(orderId).first();

    if (!order) {
      return response
        .status(404)
        .json({ message: "This order does not exist" });
    }

    if (JSON.stringify(order.userId) !== JSON.stringify(_id)) {
      return response.status(403).json({
        message:
          "This order does not belong to you. Therefore you cannot access it",
      });
    }

    if (order.isCompleted === true) {
      return response.status(403).json({
        message: "This order has already been processed and cannot be edited",
      });
    }

    let productIndex;
    order.products.find((element, index) => {
      if (element._id === productId) return (productIndex = index);
    });

    if (productIndex === undefined) {
      return response
        .status(404)
        .json({ message: "This product does not exist in this order" });
    }

    order.products.splice(productIndex, 1);
    await order.save();
    return response.status(201).json({
      message: "Successfully removed product from order",
      order,
    });
  }

  async editProduct({
    auth: {
      user: { _id },
    },
    params: { orderId, productId },
    request,
    response,
  }) {
    const { quantity } = request.all();
    console.log(quantity)

    const order = await Order.where("_id").eq(orderId).first();

    if (!order) {
      return response
        .status(404)
        .json({ message: "This order does not exist" });
    }

    if (JSON.stringify(order.userId) !== JSON.stringify(_id)) {
      return response.status(403).json({
        message:
          "This order does not belong to you. Therefore you cannot access it",
      });
    }

    if (order.isCompleted === true) {
      return response.status(403).json({
        message: "This order has already been processed and cannot be edited",
      });
    }

    let productIndex;
    let product = {};
    order.products.find((element, index) => {
      if (element._id === productId) {
        productIndex = index;
        product = { ...element };
      }
      return;
    });
    if (productIndex !== undefined) {
      order.products.splice(productIndex, 1, {
        ...product,
        quantity,
      });
    } else {
      return response.status(404).json({
        message: "This product is not available in this order",
      });
    }
    await order.save();
    return response.status(201).json({
      message: "Successfully edited product quantity in order",
      order,
    });
  }

  async delete({
    auth: {
      user: { _id },
    },
    params: { id },
    response,
  }) {
    const order = await Order.find(id);
    if (!order) {
      return response
        .status(404)
        .json({ message: "This order does not exist" });
    }

    if (JSON.stringify(order.userId) !== JSON.stringify(_id)) {
      return response.status(403).json({
        message:
          "This order does not belong to you. Therefore you cannot access it",
      });
    }

    await order.delete();
    return response.status(204).json(null);
  }

  async complete({
    auth: {
      user: { email, phone_number, first_name, _id },
    },
    params: { id },
    response,
  }) {
    const order = await Order.where({ _id: id, isCompleted: false }).first();

    if (!order) {
      return response
        .status(404)
        .json({ message: "This order does not exist" });
    }

    if (JSON.stringify(order.userId) !== JSON.stringify(_id)) {
      return response.status(403).json({
        message:
          "This order does not belong to you. Therefore you cannot access it",
      });
    }

    //

    await Mail.send("emails.complete", { order }, (message) => {
      message
        .to(email)
        .from("noreply@shara.com")
        .subject("Your order has been completed");
    });

    // sms

    // client.messages
    //   .create({
    //     body: buildMessage(),
    //     from: Env.get("TWILIO_NUMBER"),
    //     to: phone_number,
    //   })
    //   .then(message => console.log(message))
    //   .catch(err => console.log(err));

    // console.log(Env.get("TWILIO_NUMBER"));
    await Smser.send(
      `Dear ${first_name}, Your Order has been sucessfully completed. Please check your email for complete details.`,
      phone_number
    );

    // await Smser.send("Test message", (message) => {
    //   // message.from(Env.get("TWILIO_NUMBER"));
    //   message.to("+2347018228593");
    // });

    // await Smser.send("Test message", (message) => {
    //   console.log("message", message);
    //   message.to("+2348153337028");
    // });

    // console.log("sms", sms);

    //
    /*
     ** if error while sending email or sms return an error occured so they should try again
     */

    //
    // order.isCompleted = true;
    // await order.save()
    return response.status(200).json({
      message: "Successfully completed your order",
      order,
    });
  }
}

module.exports = OrderController;
