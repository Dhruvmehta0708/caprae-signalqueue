const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const {
  dedupeLeads,
  scoreLead,
} = require("../services/leadScoring");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    const isCsvFile =
      file.mimetype.includes("csv") ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (!isCsvFile) {
      return callback(new Error("Only CSV files are allowed"));
    }

    callback(null, true);
  },
});

router.post("/analyze", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    const rows = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The uploaded CSV file is empty",
      });
    }

    let criteria = {};

    if (req.body.criteria) {
      try {
        criteria = JSON.parse(req.body.criteria);
      } catch {
        return res.status(400).json({
          success: false,
          message: "The scoring criteria is not valid JSON",
        });
      }
    }

    const { uniqueLeads, duplicatesRemoved } =
      dedupeLeads(rows);

    const scoredLeads = uniqueLeads
      .map((lead) => scoreLead(lead, criteria))
      .sort((firstLead, secondLead) => {
        if (secondLead.fitScore !== firstLead.fitScore) {
          return secondLead.fitScore - firstLead.fitScore;
        }

        return (
          secondLead.confidenceScore -
          firstLead.confidenceScore
        );
      });

    const summary = {
      "Contact Now": 0,
      "Verify First": 0,
      "Contact Later": 0,
      Skip: 0,
    };

    scoredLeads.forEach((lead) => {
      summary[lead.priority] += 1;
    });

    return res.status(200).json({
      success: true,
      importSummary: {
        totalRows: rows.length,
        uniqueLeads: scoredLeads.length,
        duplicatesRemoved,
      },
      prioritySummary: summary,
      leads: scoredLeads,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;