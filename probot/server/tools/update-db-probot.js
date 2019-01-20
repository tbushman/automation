const mongoose = require('mongoose');

const { PRtest, INFOtest } = require('../../test/utils/testmodels');
const PR = ( process.env.TEST_ENV ? PRtest : require('../models').PR );
const INFO = ( process.env.TEST_ENV ? INFOtest : require('../models').INFO );

// added to prevent deprecation warning when findOneAndUpdate is used
mongoose.set('useFindAndModify', false);
const updateDbProbot = async(context) => {
  const payload = context.payload;
  const action = payload.action;
  const pullRequest = payload.pull_request;
  const number = pullRequest.number;
  const updatedAt = pullRequest.updated_at;
  const title = pullRequest.title;
  const username = pullRequest.user.login;
  const lastUpdate = new Date();

  const existingPR = await PR.findOne({ _id: number }).then(doc => doc)
    .catch(err => console.log(err));

  if (action === 'closed') {
    await PR.deleteOne({ _id: number })
      .then(() => console.log('delete PR #' + number))
      .catch(err => {
        // need to log the payload to a file for later manual update
        throw `Failed to remove PR from db
        ${err.message}
        `;
     });
     console.log('deleted ' + number);
  } else {
    console.log('add/updated ' + number);
    const files =
      await context.github.pullRequests.listFiles(context.issue()).data;
    // const filenames = [...files].filename;
    const filenames = files.map(file => file.filename);
    await PR.updateOne(
      { _id: number },
      { updatedAt: updatedAt,
        title: title,
        username: username,
        filenames: filenames
      },
      { upsert: true })
      .then(() => console.log('added or updated PR #' + number))
      .catch(err => {
        // need to log the payload to a file for later manual update
        throw `Failed to add PR to db
        ${err.message}
        `;
    });
  }

  const numPRs = await PR.countDocuments();
  if (numPRs > 0) {
    // update info collection
    const [ { firstPR, lastPR }] = await PR.aggregate(
      [{
        $group: {
          _id: null,
          firstPR: { $min: '$_id' },
          lastPR: { $max: '$_id' }
        }
      }]
    );
    const info = {
      lastUpdate,
      numPRs,
      prRange: `${firstPR}-${lastPR}`
    };
    await INFO.updateOne(info)
      .catch(err => {
        console.log(err);
      });
  }

  return existingPR;
};

module.exports = { updateDbProbot };
