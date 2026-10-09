class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(what) {
  return new HttpError(404, `${what} not found`);
}

module.exports = { HttpError, notFound };
