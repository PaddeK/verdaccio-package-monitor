# verdaccio-package-monitor
Middleware plugin to monitor package versions, tags and npm audit result.

[![verdaccio-package-monitor (latest)](https://img.shields.io/npm/v/verdaccio-package-monitor/latest.svg)](https://www.npmjs.com/package/verdaccio-package-monitor)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![node](https://img.shields.io/node/v/verdaccio-package-monitor/latest.svg)](https://www.npmjs.com/package/verdaccio-package-monitor)

## Requirements

* verdaccio@3.x or higher

```
 npm install --global verdaccio-package-monitor
```

## Usage

To enable it you need to add this to your configuration file.  
Config values shown below reflect the defaults.
```
middlewares:
  package-monitor:
    # Enables the plugin - the only required config parameter
    enabled: true
    # Locale to use for moment.js date/time formating
    locale: "de"
    # If scope is given only packages in given scope are monitored (scope gets stripped from package names)
    scope: ""
    # Delay between page changes
    delay: 15000
    # Maximum number of versions shown per package (versions with tags are prioritised)
    max: 5
    # later.js schedule (text parser is used) to specify interval of npm audit checks
    audit: "every 1 day at 03:00"
```
If the plugin is enabled you can reach the monitoring page at:  
`https://your.verdaccio.hostname/-/monitor`.
  
You can override almost all config parameters via query parameter or path and jump directly to pages with hash e.g.,    
`https://your.verdaccio.hostname/@scope/monitor?timer=10000&max=3&locale=en&audit=on monday#2`  
will show you all packages in scope @scope, flip through pages every 10 seconds, shows 3 version maximum, formats  
date/time according to en locale, runs npm audit every monday and starts with page 2.

**_Hint:_** with timer=0 you can stop the automatic page flipping

## Disclaimer

This plugin is tailored to specific needs i had but should be easy to adjust for yours.  
Pull requests for features/bugfixes are welcome!

PS. Yeah i know... it's kinda hacky :see_no_evil: :hear_no_evil: :speak_no_evil:

## License

MIT (http://www.opensource.org/licenses/mit-license.php)