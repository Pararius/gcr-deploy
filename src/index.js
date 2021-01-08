const core = require('@actions/core');
const exec = require('@actions/exec');
const digest = require('./digest');

async function run() {
  const
    gcrHost = core.getInput('host', {required: true}),
    gcpProject = core.getInput('project', {required: true}),
    dockerImage = core.getInput('image', {required: true}),
    imageTag = core.getInput('tag', {required: true}),
    tagAsLatest = (core.getInput('tag-as-latest') || 'false') === 'true',
    digestCheck = (core.getInput('digest-check') || 'true') === 'true',
    latestTag = core.getInput('latest-tag') || 'latest'
  ;

  const image = `${gcrHost}/${gcpProject}/${dockerImage}`;

  if (digestCheck) {
    const match = await digest.match(image, imageTag, latestTag);

    if (match) {
      return 'Local and remote digests match. Not pushing image.';
    }
  }

  const taggedImage = `${image}:${imageTag}`;
  const latestImage = `${image}:${latestTag}`;

  // Push the image
  await exec.exec('docker', ['push', taggedImage]);

  let msg = `Pushed image ${taggedImage}`;

  if (tagAsLatest) {
    // Tag image as latest
    await exec.exec('gcloud', [
      'container', 'images', 'add-tag', '--quiet', taggedImage, latestImage
    ]);

    msg += ' and tagged as latest';
  }

  return msg;
}

run()
  .then(
    msg => core.info(msg)
  )
  .catch(err => {
    core.error(err);
    core.setFailed(err.message);
  })
;
