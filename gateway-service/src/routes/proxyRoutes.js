const { createProxyMiddleware } = require("http-proxy-middleware");

const normalizeTarget = (value, name) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${name} is not configured`);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const routes = (app) => {
  const authService = normalizeTarget(process.env.AUTH_SERVICE, "AUTH_SERVICE");
  const sessionService = normalizeTarget(process.env.SESSION_SERVICE, "SESSION_SERVICE");
  const orderService = normalizeTarget(process.env.ORDER_SERVICE, "ORDER_SERVICE");
  const exitService = normalizeTarget(process.env.EXIT_SERVICE, "EXIT_SERVICE");

  app.use(
    "/api/auth",
    createProxyMiddleware({
      target: authService,
      changeOrigin: true,
      pathRewrite: (path) => `/api/auth${path}`
    })
  );

  app.use(
    "/api/sessions",
    createProxyMiddleware({
      target: sessionService,
      changeOrigin: true,
      pathRewrite: (path) => `/api/sessions${path}`
    })
  );

  app.use(
    "/api/orders",
    createProxyMiddleware({
      target: orderService,
      changeOrigin: true,
      pathRewrite: (path) => `/api/orders${path}`
    })
  );

  app.use(
    "/api/exit",
    createProxyMiddleware({
      target: exitService,
      changeOrigin: true,
      pathRewrite: (path) => `/api/exit${path}`
    })
  );

};

module.exports = routes;
