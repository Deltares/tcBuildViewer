# tcBuildViewer

This web-app provides a bird's-eye view on the build-result history/correlations for big projects to help tackle technical debt towards passing test-benches.

In a later stage (Q1 2023) we will implement features to better support build-results before merging branches.

## Installation steps
1. Host tcBuildViewer on a webserver.
1. Copy config-example.js to config.js and change the values.
1. Add the domain of your tcBuildViewer to the CORS (cross origin resource sharing) list for your TeamCity (read config-example.js for more information)
