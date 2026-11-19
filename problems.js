// The API's one shape for an error answer: { status, title, detail }, such as
//   { "status": 404, "title": "Not Found", "detail": "There's no pet 99." }
// status is the status code, title is that code's standard name, and detail says what went wrong this time.
// Ready to use: app.js and routes/pets.js call it.
import { STATUS_CODES } from "node:http";

export function sendProblem(res, status, detail) {
  res.status(status).json({ status, title: STATUS_CODES[status], detail });
}
