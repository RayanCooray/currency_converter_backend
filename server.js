require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const requestIp = require("request-ip");

const app = express();
app.use(express.json());
app.use(cors());
app.use(requestIp.mw());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true 
  });
  

const TransferSchema = new mongoose.Schema({
  ip: String,
  fromCountry: String,
  toCountry: String,
  amount: Number,
  convertedAmount: Number,
  date: { type: Date, default: Date.now },
});

const Transfer = mongoose.model("Transfer", TransferSchema);

app.post("/convert", async (req, res) => {
  const { from, to, amount } = req.body;
  const ip = req.clientIp;

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/${from}/${to}`
    );
    const data = await response.json();
    const convertedAmount = amount * data.conversion_rate;

    const transfer = new Transfer({ ip, fromCountry: from, toCountry: to, amount, convertedAmount });
    await transfer.save();

    res.json({ convertedAmount });
  } catch (error) {
    res.status(500).json({ error: "Conversion failed" });
  }
});

app.get("/transfers", async (req, res) => {
  const ip = req.clientIp;
  const transfers = await Transfer.find({ ip });
  res.json(transfers);
});

app.delete("/transfers/:id", async (req, res) => {
  await Transfer.findByIdAndDelete(req.params.id);
  res.json({ message: "Transfer revoked" });
});

app.listen(5000, () => console.log("Server running on port 5000"));
