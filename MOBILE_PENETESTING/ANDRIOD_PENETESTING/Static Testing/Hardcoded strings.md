use search option that will serach in the whole project and look for variables

like

- http://
- https://
- [firbase.io](http://firbase.io)
- clientID
- clientSecret

etc

Files to check

- resources/strings.xml
- resources.arsc/res/values/strings.xml

Check all the .xmls file might contain some creds

Hardcoded strings can also be found in activity source code

Threat Vector

- Login bypass (username/password, or client creds)
- URLs exposed (http/https)
- API Keys Exposed
- Firebase URLs ([firebase.io](http://firebase.io))