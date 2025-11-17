// Error occured during processing ( Exeptions )
process.on("uncaughtException", (err) => {
  console.log("server closed due to unhandled rejection");
  console.log(err.stack);
  process.exit(1);
});

// Imports
const app = require("./application");
const config = require("dotenv");
const axios = require("axios");

// Environmental variable setup
config.config({ path: "./config.env" });

// Server setup
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}`)
);

// Error occured on rejection
process.on("unhandledRejection", (err) => {
  server.close(() => {
    setTimeout(() => {
      console.log("server closed due to unhandled rejection");
      console.log(err.stack);
      process.exit(1);
    }, 5000);
  });
});

// Keep the server awake on RENDER.com
const url =
  process.env.RENDER_EXTERNAL_URL ||
  "https://onebeat-stripe-hubspot.onrender.com/companies/ping";
// "http://127.0.0.1:3000/companies/ping";
if (url) {
  setInterval(() => {
    axios
      .get(url)
      .then(() => console.log(`Pinged ${url} to stay awake`))
      .catch((err) => console.error("Wake ping failed:", err.message));
  }, 5 * 60 * 1000);
}
