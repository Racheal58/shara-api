"use strict";
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use("App/Models/User");

class IsAdmin {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle(
    {
      auth: {
        user: { _id },
      },
      response,
    },
    next
  ) {
    const user = await User.find(_id);

    if (user.isAdmin === "false" || user.isAdmin === false)
      return response.status(403).json({
        message:
          "Unfortunately, you are not authorized to carry out this operation",
      });

    await next();
  }
}

module.exports = IsAdmin;
