const express = require("express");
const router = require("express").Router({ mergeParams: true });
const companyController = require("../controllers/companyController");
const { raw } = express;
// const { raw, json } = express;

const useRaw = raw({ type: "application/json" });
// const useJSON = json({ type: "application/json" });

router.route("/stripe").post(useRaw, companyController.stripe);
// router.route("/stripe").post(useJSON, companyController.stripe);

module.exports = router;
