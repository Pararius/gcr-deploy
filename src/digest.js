const core = require('@actions/core');
const exec = require('@actions/exec');

module.exports = {
  match: async function (image, imageTag, latestTag) {
    let localDigest = '';
    let remoteDigest = '';

    try {

      // Get digest of local image
      await exec.exec(
        'docker',
        ['images', '--no-trunc', '--quiet', `${image}:${imageTag}`],
        {
          listeners: {
            stdout: (data) => localDigest = data.toString()
          }
        }
      );

      // Get digest of latest image on remote
      await exec.exec(
        'gcloud',
        [
          'container', 'images', 'describe', '--format', 'value(image_summary.digest)',
          `${image}:${latestTag}`
        ],
        {
          listeners: {
            stdout: (data) => remoteDigest = data.toString()
          }
        }
      );
    } catch (error) {
      core.error(error);
      core.setFailed(error.message);
    }

    core.debug(`Found local digest: ${localDigest}`.trimEnd());
    core.debug(`Found remote digest: ${remoteDigest}`.trimEnd());

    return (localDigest !== '' && localDigest === remoteDigest);
  }
};
