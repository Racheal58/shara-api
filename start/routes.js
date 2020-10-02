"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

// Route.on('/').render('welcome')
Route.group("users", () => {
  Route.get("/", "UserController.index").middleware(["auth", "isAdmin"]);
  Route.get("/:id", "UserController.show").middleware(["findUser"]);
  Route.post("/authenticate", "UserController.authenticate");
  Route.post("/register", "UserController.register");
  Route.put("/:id", "UserController.update");
  Route.delete("/:id", "UserController.delete");
}).prefix("/api/v1/users");

Route.group("products", () => {
  Route.get("/", "ProductController.index");
  Route.get("/:id", "ProductController.show");
  Route.post("/", "ProductController.create");
  Route.put("/:id", "ProductController.update");
  Route.delete("/:id", "ProductController.delete");
}).prefix("/api/v1/products");

Route.group("orders", () => {
  Route.get("/", "OrderController.index").middleware(["auth"]);
  Route.get("/:id", "OrderController.show").middleware(["auth"]);
  Route.post("/addproduct", "OrderController.addProduct").middleware(["auth"]);
  Route.delete(
    "/:orderId/removeproduct/:productId",
    "OrderController.removeProduct"
  ).middleware(["auth"]);
  Route.put(
    "/:orderId/editproduct/:productId",
    "OrderController.editProduct"
  ).middleware(["auth"]);
  Route.post("/complete/:id", "OrderController.complete");
  Route.delete("/:id", "OrderController.delete").middleware(["auth"]);
}).prefix("/api/v1/orders");

Route.any("*", ({ response }) =>
  response.status(404).json("This route does not exist")
);
