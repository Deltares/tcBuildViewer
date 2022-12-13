//
// Because of CORS (cross origin resource sharing), it is easiest to host this app within the same domain as TeamCity.
//
//   e.g. https://<your-teamcity-fqdn>/tcview/
//
// Else, add the domain of your tcBuildViewer to the rest.cors.origins variable on the TeamCity server.
//
//   Option 1: Add your domain to <TeamCity Data Directory>/config/internal.properties
//   Option 2: Use a Java .properties file with to set the variable
//   Option 3: Start the Java process with -Drest.cors.origins=<your-domain>
//
// More info on CORS:
// https://www.jetbrains.com/help/teamcity/rest/teamcity-rest-api-documentation.html#CORS-support
// https://www.jetbrains.com/help/teamcity/server-startup-properties.html
//

// If your tcBuildViewer is hosted on the same domain as your TeamCity.
const teamcity_base_url = '';
// If you host your tcBuildViewer on a different domain:
// const teamcity_base_url = 'https://<your-teamcity-domain>';

// Which projects to traverse and which to ignore.
// This is used as a fallback when the user has
// no favorite ("starred") projects in TeamCity.
var default_selection = {

    include_projects: [
        "MyProject1",
        "MyProject2",
    ],

    exclude_projects:[
        "ArchivedProjects",
        "ExperimentalProject",
    ],
}

// Retrieve last X builds of every build type:
var build_count = 14;

// Don't retrieve builds that are older than X days:
var build_cutoff_days = 14;
