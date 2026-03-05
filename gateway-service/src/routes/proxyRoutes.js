const { createProxyMiddleware } = require("http-proxy-middleware");

const routes = (app) => {

  app.use(
    "/api/auth",
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE,
      changeOrigin: true
    })
  );

  app.use(
    "/api/sessions",
    createProxyMiddleware({
      target: process.env.SESSION_SERVICE,
      changeOrigin: true
    })
  );

  app.use(
    "/api/orders",
    createProxyMiddleware({
      target: process.env.ORDER_SERVICE,
      changeOrigin: true
    })
  );

  app.use(
    "/api/exit",
    createProxyMiddleware({
      target: process.env.EXIT_SERVICE,
      changeOrigin: true
    })
  );

};

module.exports = routes;