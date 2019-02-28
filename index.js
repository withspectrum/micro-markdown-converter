const { convertToRaw, convertFromRaw } = require("draft-js");
const { stateToMarkdown } = require("draft-js-export-markdown");
const { stateFromMarkdown } = require("draft-js-import-markdown");
const { createError, json, text } = require("micro");

module.exports = async (req, res) => {
  if (req.method !== "POST") throw createError(405, "Please POST your data.");

  if (req.url === "/to") {
    const raw = await json(req);
    try {
      return stateToMarkdown(convertFromRaw(raw), {
        gfm: true
      });
    } catch(err) {
      throw createError(400, 'Please provide valid, raw DraftJS content state to /to as the request body.')
    }
  } else if (req.url === "/from") {
    const md = await text(req);
    return convertToRaw(stateFromMarkdown(md), {
      parserOptions: {
        breaks: true
      }
    });
  }

  throw createError(404, "Please POST to either /to or /from.");
};
