const { createProxyMiddleware } = require("http-proxy-middleware");

const routes = (app) => {

  app.use(
    "/api/auth",
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE,
      changeOrigin: true,
      pathRewrite: (path) => `/api/auth${path}`
    })
  );

  app.use(
    "/api/sessions",
    createProxyMiddleware({
      target: process.env.SESSION_SERVICE,
      changeOrigin: true,
      pathRewrite: (path) => `/api/sessions${path}`
    })
  );

  app.use(
    "/api/orders",
    createProxyMiddleware({
      target: process.env.ORDER_SERVICE,
      changeOrigin: true,
      pathRewrite: (path) => `/api/orders${path}`
    })
  );

  app.use(
    "/api/exit",
    createProxyMiddleware({
      target: process.env.EXIT_SERVICE,
      changeOrigin: true,
      pathRewrite: (path) => `/api/exit${path}`
    })
  );

};

module.exports = routes;
