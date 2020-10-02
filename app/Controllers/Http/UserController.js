"use strict";

const Hash = use("Hash");

const User = use("App/Models/User");
class UserController {
  async index({ response }) {
    const users = await User.all();

    if (users.toJSON().length === 0)
      return response.status(404).json({ message: "There are no users" });

    return response
      .status(200)
      .json({ message: "Successfully retrieved all users", users });
  }

  async show({ auth, params, request, response }) {
    if (auth.user._id.toString() !== params.id) {
      return response.status(403).json({
        message: "You cannot see someone else's profile",
      });
    }
    return response.status(200).json({
      message: "Your profile has been successfully retrieved",
      user: request.user,
    });
  }

  async authenticate({ request, response, auth }) {
    const { email, password } = request.only(["email", "password"]);

    const user = await User.where("email").eq(email).first();

    if (!user)
      return response
        .status(404)
        .json({ message: "This account does not exist" });
    const isSame = await Hash.verify(password, user.password);

    if (!isSame)
      return response
        .status(401)
        .json({ message: "Your password is not correct" });

    const { token } = await auth.generate(user, true);
    return response
      .status(201)
      .json({ message: "You have been successfully logged in", token, user });
  }

  async register({ request, response, auth }) {
    try {
      const userInfo = request.all();

      const userExists = await User.where("email").eq(userInfo.email).first();
      if (userExists) {
        return response
          .status(409)
          .json({ message: "This user already exists" });
      }

      const user = await User.create({ ...userInfo, isAdmin: "false" });
      const { token } = await auth.generate(user, true);

      return response.status(200).json({
        message: "Your account has been successfully created",
        token,
        user,
      });
    } catch (error) {
      console.error("error here", error);
      response.status(400).send({ message: error.message });
    }
  }

  async update({ params, request, response }) {
    const userInfo = request.only([
      "first_name",
      "last_name",
      "email",
      "password",
      "phone_number",
    ]);

    const user = await User.find(params.id);
    if (!user) {
      return response.status(404).json({ message: "This user does not exist" });
    }

    user.first_name = userInfo.first_name;
    user.last_name = userInfo.last_name;
    user.email = userInfo.email;
    user.password = userInfo.password;
    user.phone_number = userInfo.phone_number;

    await user.save();
    return response
      .status(201)
      .json({ message: "Your profile has been successfully updated", user });
  }

  async delete({ params, response }) {
    const user = await User.find(params.id);
    if (!user) {
      return response.status(404).json({ message: "This user does not exist" });
    }

    await user.delete();
    return response.status(204).json(null);
  }
}

module.exports = UserController;
