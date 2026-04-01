const mongoose = require("mongoose");

const connectDb = () => {
  mongoose.connection.on("connected", () => {
    console.log("Database connected....");
  });

  return mongoose.connect(`${process.env.MONGODB_URI}/Blog-writing-agent`)
    .then(() => {
      console.log("Connected to MongoDB successfully");
      console.log("using db: ", mongoose.connection.name)
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    });
};

module.exports = connectDb;
