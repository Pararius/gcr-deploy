const core = require('@actions/core');
const exec = require('@actions/exec');

module.exports = {
    check: async function (gcrHost, gcpProject, dockerImage, imageTag, latestTag) {
        try {
            let localDigest = '';
            let remoteDigest = '';

            const localOptions = {};
            const remoteOptions = {};

            localOptions.listeners = {
                stdout: (data) => {
                    localDigest += data.toString();
                }
            };

            remoteOptions.listeners = {
                stdout: (data) => {
                    remoteDigest += data.toString();
                }
            };

            // Get digest of local image
            await exec.exec('docker', [
                'image', 'inspect', '--format', '"{{.RepoDigests}}"',
                `${gcrHost}/${gcpProject}/${dockerImage}:${imageTag}`
            ], localOptions);

            // Get digest of latest image on remote
            await exec.exec('gcloud', [
                'container', 'images', 'describe',
                `${gcrHost}/${gcpProject}/${dockerImage}:${latestTag}`,
                '--format=\'value(image_summary.digest)\''
            ], remoteOptions);

            console.log(`Found local digest: ${localDigest}`.trimEnd());
            console.log(`Found remote digest: ${remoteDigest}`.trimEnd());

            return (
                localDigest !== '' &&
                remoteDigest !== '' &&
                localDigest === remoteDigest
            );
        } catch (error) {
            core.setFailed(error.message);
        }
    }
};
