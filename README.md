# GCR Deploy for GitHub Actions

This action pushes a Docker image to Google Container Registry (GCR).

## Prerequisites

This action assumes you are already logged in to your Google Cloud environment.
For an example on how to achieve this, check the [Full workflow example](#full-workflow-example) below.

## Inputs

### `host`

**Required** Hostname of the registry. Default `'gcr.io'`.

### `project`

**Required** Name of the Google Cloud Platform project where your registry resides (example: `'foobar-191284'`)

### `image`

**Required** Name of the Docker image to push (example: `'node'`)

### `tag`

**Required** Tag of the Docker image to push (example: `'feature-x'`)

### `tag-as-latest`

Whether or not to tag the pushed image with the "latest" tag. Default `'false'`

## Example usage

Push the `node:feature-x` image to the registry at `eu.gcr.io/my-node-project`.

```yaml
uses: Pararius/gcr-deploy@v1
with:
  host: 'eu.gcr.io'
  project: 'my-node-project'
  image: 'node'
  tag: 'feature-x'
```

Push the `node:feature-y` image to the registry at `gcr.io/node-project-148182` and tag it as "latest":

```yaml
uses: Pararius/gcr-deploy@v1
with:
  project: 'node-project-148182'
  image: 'node'
  tag: 'feature-y'
  tag-as-latest: 'true'
```

## Full workflow example

```yaml
name: CD pipeline

on:
  pull_request:
    types: [closed]
    branches:
    - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged

    steps:
      - uses: actions/checkout@v1

      # Store the short commit hash (first 7 characters) as environment variable
      - name: Set short commit hash
        run: echo ::set-env name=SHORT_TAG::$(echo ${GITHUB_SHA::7})

      # Login to Google Cloud using a service account.
      # The JSON key for this service account is stored as a base64 encoded string
      #   in the GCLOUD_AUTH secret.
      - name: Login to Google Cloud
        env:
          GCLOUD_AUTH: ${{ secrets.GCLOUD_AUTH }}
        run: |
          echo "$GCLOUD_AUTH" | base64 --decode > ${HOME}/gcloud.json
          gcloud auth activate-service-account --key-file=${HOME}/gcloud.json
          gcloud auth configure-docker

      - name: Build Docker image (use short commit hash as tag)
        run: |
          docker build -t eu.gcr.io/my-node-project/node:${{ env.SHORT_TAG }} \
            --cache-from eu.gcr.io/my-node-project/node:latest
            .

      - uses: Pararius/gcr-deploy@v1
        with:
          host: eu.gcr.io
          project: my-node-project
          image: node
          tag: ${{ env.SHORT_TAG }}
          tag-as-latest: true
```

This workflow will run whenever a PR against the `master` branch is closed and merged.
It will checkout our code, build an image called `node`, tagged with the short commit hash.
After this is done, the built image is deployed to the GCR instance at `eu.gcr.io/my-node-project`.
It will also be tagged as "latest".

This will result in an image with the following tags being pushed to GCR (assuming short commit hash is `abcd1234`):

* `eu.gcr.io/my-node-project/node:abcd1234`
* `eu.gcr.io/my-node-project/node:latest`
