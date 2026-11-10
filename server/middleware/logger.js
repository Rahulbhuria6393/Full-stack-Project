/**
 * Custom HTTP request logger middleware.
 * Logs timestamp, HTTP method, route path, and completion status/duration.
 */
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const start = process.hrtime.bigint();
  const method = req.method;
  const route = req.originalUrl || req.url;

  console.log(`[${timestamp}] --> ${method} ${route}`);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `[${new Date().toISOString()}] <-- ${method} ${route} ${res.statusCode} (${durationMs.toFixed(1)} ms)`
    );
  });

  next();
};
