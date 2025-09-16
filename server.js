// Error occured during processing ( Exeptions )
process.on("uncaughtException", (err) => {
  console.log("server closed due to unhandled rejection");
  console.log(err.stack);
  process.exit(1);
});

// Imports
const app = require("./application");
const config = require("dotenv");

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
