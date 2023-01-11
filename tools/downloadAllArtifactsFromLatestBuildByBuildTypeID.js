const axios = require('axios');
const fs = require('fs');

// Constants
const baseUrl = 'https://<your-teamcity-domain>';

// Get the buildType ID, API token, and branch name from the command-line arguments
const buildTypeId = process.argv[2];
const apiToken = process.argv[3];
const branchName = process.argv[4];

// Print help message if required arguments are missing
if (!buildTypeId || !apiToken) {
  console.log('Usage: node downloadArtifacts.js BUILD_TYPE_ID API_TOKEN [BRANCH_NAME]');
  console.log('Example: node downloadArtifacts.js MyProject_Build MyToken123456');
  console.log('Example: node downloadArtifacts.js MyProject_Build MyToken123456 feature/new-feature');
  process.exit(1);
}

// Make a request to the builds endpoint using the buildType ID
let buildsUrl = `${baseUrl}/app/rest/builds?buildType=id:${buildTypeId}&count=1`;
if (branchName) {
  buildsUrl += `&branch=name:${encodeURIComponent(branchName)}`;
}
axios.get(buildsUrl, {
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Accept': 'application/json'
  }
})
  .then(response => {
    // Get the build ID from the response data
    const buildId = response.data.build[0].id;
    // Make a request to the artifacts endpoint using the build ID
    return axios.get(`${baseUrl}/app/rest/builds/id:${buildId}/artifacts/children`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
  })
  .then(response => {
    // Get the list of artifact objects from the response data
    if (Array.isArray(response.data.file)) {
      artifacts = response.data.file;
    } else {
      artifacts = [response.data.file];
    }
    // Download each artifact
    return Promise.all(artifacts.map(artifact => {
      // Check if the content property exists
      if (artifact.content) {
        // Get the URL of the artifact file
        const artifactUrl = baseUrl + artifact.content.href;
        // Get the name of the artifact file
        const artifactName = artifact.name;
        // Download the artifact file
        return axios({
          url: artifactUrl,
          method: 'GET',
          responseType: 'stream',
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        }).then(response => {
          // Save the artifact file to the current directory
          response.data.pipe(fs.createWriteStream(`./${artifactName}`));
        });
      }
    }));
  })
  .catch(error => {
    console.error(error);
  });
