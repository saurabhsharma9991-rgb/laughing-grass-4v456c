/** Structured JSON logs for webhooks, email, and auth. */
export function logEvent(channel, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    channel,
    message,
    ...meta,
  };
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[${channel}]`, message, Object.keys(meta).length ? meta : "");
  }
}
