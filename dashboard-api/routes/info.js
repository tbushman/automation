//const { prs, startTime } = require('../data.json');
const prs = []
const startTime = new Date()
const router = require('express').Router();

const firstPR = 0//prs[0].number;
const lastPR = 0//prs[prs.length - 1].number;
router.get('/', (request, response) => {
  const { prs, startTime } = container.data;
  const firstPR = prs[0].number;
  const lastPR = prs[prs.length - 1].number;

  response.json({
    ok: true,
    lastUpdate: startTime,
    numPRs: prs.length,
    prRange: `${firstPR}-${lastPR}`
  });
});

module.exports = router;
