# verdaccio-package-monitor
middleware plugin to monitor package versions, tags and npm audit result

[![verdaccio (latest)](https://img.shields.io/npm/v/verdaccio-package-monitor/latest.svg)](https://www.npmjs.com/package/verdaccio-package-monitor)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
[![node](https://img.shields.io/node/v/verdaccio-package-monitor/latest.svg)](https://www.npmjs.com/package/verdaccio-package-monitor)

## Requirements

* verdaccio@3.x or higher

```
 npm install --global verdaccio-package-monitor
```

## Usage
To enable it you need to add this to your configuration file.
```
middlewares:
  package-monitor:
    route: "/:scope/monitor"
    locale: "de"
    scope: "@yourscope"
    delay: 15000
    max: 5
    audit: "every 1 day at 03:00"
```

## Disclaimer

This plugin is experimental and unstable. Please report any issue you found.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)