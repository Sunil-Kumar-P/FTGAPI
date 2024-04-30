const express = require("express");
const URL = require("../models/url");

const router = express.Router();

router.get("/", async (req, res) => {
  return res.render("home", {
  });
});

router.get("/history", async (req, res) => {
  if (!req.user) return res.redirect("/login");
  return res.render("history", {
  });
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.get("/login", (req, res) => {
  return res.render("login");
});

module.exports = router;
