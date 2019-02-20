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
## Disclaimer

This plugin is tailored to specific needs i had but should be easy to adjust for yours.  
Pull requests for features/bugfixes are welcome!

PS. Yeah i know... it's kinda hacky :see_no_evil: :hear_no_evil: :speak_no_evil:

## License

MIT (http://www.opensource.org/licenses/mit-license.php)