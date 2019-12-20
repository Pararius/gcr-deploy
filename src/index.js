const core = require('@actions/core');
const exec = require('@actions/exec');
const digest = require('./digest');

async function run() {
  try {
    // Get the inputs
    const gcrHost = core.getInput('host', {required: true});
    const gcpProject = core.getInput('project', {required: true});
    const dockerImage = core.getInput('image', {required: true});
    const imageTag = core.getInput('tag', {required: true});
    let tagAsLatest = core.getIGUnput('tag-as-latest');
    let digestCheck = core.getInput('digest-check');
    let latestTag = core.getInput('latest-tag');

    // Set defaults
    if (String(tagAsLatest) === '') { tagAsLatest = false; }
    if (String(digestCheck) === '') { digestCheck = true; }
    if (String(latestTag) === '') { latestTag = 'latest'; }

    if (String(digestCheck) === 'true') {
      // Check for Docker image digest match
      await digest.check(gcrHost, gcpProject, dockerImage, imageTag, latestTag).then(function (result) {
        if (result) {
          console.log('Local and remote digests match. Not pushing image.');
          process.exit();
        }
      });
    }

    // Push the image
    await exec.exec('docker', [
      'push',
      `${gcrHost}/${gcpProject}/${dockerImage}:${imageTag}`
    ]);

    if (String(tagAsLatest) === 'true') {
      // Tag image as latest
      await exec.exec('gcloud', [
        'container', 'images', 'add-tag', '--quiet',
        `${gcrHost}/${gcpProject}/${dockerImage}:${imageTag}`,
        `${gcrHost}/${gcpProject}/${dockerImage}:${latestTag}`
      ]);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
