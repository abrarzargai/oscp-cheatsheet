Use the search option to search the whole project and look for variables

like

- http://
- https://
- firebase.io
- clientID
- clientSecret

etc

Files to check

- resources/strings.xml
- resources.arsc/res/values/strings.xml

Check all the .xml files; they might contain some credentials

Hardcoded strings can also be found in activity source code

Threat Vector

- Login bypass (username/password, or client creds)
- URLs exposed (http/https)
- API Keys Exposed
- Firebase URLs ([firebase.io](http://firebase.io))