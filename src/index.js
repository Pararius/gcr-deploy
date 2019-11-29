const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
  try {
    // Get the inputs
    const gcrHost = core.getInput('host', {required: true});
    const gcpProject = core.getInput('project', {required: true});
    const dockerImage = core.getInput('image', {required: true});
    const imageTag = core.getInput('tag', {required: true});
    const tagLatest = core.getInput('tag-as-latest');

    // Push the image
    await exec.exec('docker', [
      'push',
      `${gcrHost}/${gcpProject}/${dockerImage}:${imageTag}`
    ]);

    if (tagLatest) {
      await exec.exec('gcloud', [
        'container', 'images', 'add-tag',
        `${gcrHost}/${gcpProject}/${dockerImage}:${imageTag}`,
        `${gcrHost}/${gcpProject}/${dockerImage}:latest`
      ]);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
