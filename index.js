'use strict';

const
    DefaultRoute = '/:scope/monitor',
    DefaultLocale = 'de',
    DefaultDelay = 15000,
    DefaultScope = '',
    DefaultMaxVersions = 5,
    DefaultAuditSchedule = 'every 1 day at 03:00',
    express = require('express'),
    router = express.Router(),
    async = require('async'),
    mustache = require('mustache'),
    moment = require('moment'),
    later = require('later'),
    path = require('path'),
    fs = require('fs'),
    Auditer = require('./auditer'),
    readTpl = tpl => fs.readFileSync(path.join(__dirname, 'templates', `${tpl}.mustache`), 'utf8');

class Monitor
{
    constructor (config, options)
    {
        this._logger = options.logger;
        this._config = config.middlewares['package-monitor'];
        this._route = this._config.route || DefaultRoute;
        this._locale = this._config.locale || DefaultLocale;
        this._delay = this._config.delay || DefaultDelay;
        this._scope = this._config.scope || DefaultScope;
        this._maxVersions = this._config.max || DefaultMaxVersions;
        this._schedule =  this._config.audit || DefaultAuditSchedule;
        this._styles = fs.readFileSync(path.resolve(__dirname, 'mini.min.css'), 'utf8');
        this._mainTpl = readTpl('main');
        this._cache = new Map();

        this._partials = {
            'card-top': readTpl('card.top'),
            'card-bottom': readTpl('card.bottom'),
            version: readTpl('version'),
            card: readTpl('card')
        };

        this._interval = null;

        mustache.parse(this._mainTpl);
    }

    static _sortVerions (a, b)
    {
        let t = b.t.length - a.t.length;
        return t === 0 ? Monitor._strCmp(a, b) : t;
    }

    static _strCmp (a, b)
    {
        return b.v.localeCompare(a.v);
    }

    _reduceVersions (pkg, max)
    {
        let initial = Array(max).fill({v:'', t:[]}),
            tags = Object.entries(pkg.tags).reduce((p, [t, v]) => Object.assign(p, {[v]: (p[v] || []).concat(t)}), {}),
            times = pkg.time,
            red = (p, c, i) => {
                p[i] = {v: c, d: times[c], t: tags[c] || []};
                return p;
            };

        return pkg.versions.reduce(red, initial).sort(Monitor._sortVerions).slice(0, max).sort(Monitor._strCmp);
    }

    _prepTplData (pkg, scp, max)
    {
        return {
            name: pkg.name.slice(scp.length > 1 ? scp.length + 1 : 0),
            versions: this._reduceVersions(pkg, max),
            hasVersions: !!max,
            modified: pkg.time.modified,
            latest: pkg.tags.latest,
            audit: this._cache.get(pkg.name) || Auditer.RATING_UNKNOWN
        };
    }

    _prepPkg (storage, cards, scope, max, packageName, callback)
    {
        storage.getPackageStorage(packageName).readPackage(packageName, (err, pkg) => {
            if (!err && pkg) {
                let {name, versions, time, 'dist-tags': tags} = pkg,
                    res = {name, time, tags, versions};

                res.versions = Object.keys(res.versions);
                cards.push(this._prepTplData(res, scope, max));
                return callback();
            }

            err && this._logger.error(err.stack || err.toString());
            return callback(err || new Error('Could not read packages'));
        });
    }

    _respond (req, res, cards, err)
    {
        if (err) {
            this._logger.error(err.stack || err.toString());
            res.status(500);
            res.send('Internal server error');
            return;
        }

        let data,
            scope = this._getScope(req),
            schedule = this._getSchedule(req),
            timer = req.query.timer || this._delay,
            locale = req.query.locale || this._locale;

        moment.locale(locale);

        data = {
            cards,
            date: function() {return (text, render) => moment(render(text)).format('L')},
            time: function() {return (text, render) => moment(render(text)).format('LTS')},
            total: Math.max(~~(cards.length / 12), 1),
            lastAudit: moment(later.schedule(schedule).prev()).format('L LTS'),
            nextAudit: moment(later.schedule(schedule).next()).format('L LTS'),
            timer,
            styles: this._styles,
            title: scope ? `${scope} - Package Monitoring`: 'Package Monitoring'
        };

        res.status(200);
        res.end(mustache.render(this._mainTpl, data, this._partials));
    }

    _getScope (req)
    {
        return req.params.scope && req.params.scope.length > 1 ? req.params.scope : this._scope;
    }

    _getSchedule (req)
    {
        return later.parse.text(req.query.audit || this._schedule);
    }

    _getPackages (req, res, store, err, pkgs)
    {
        let tmp = [],
            max = ~~(req.query.max || this._maxVersions),
            schedule = this._getSchedule(req),
            doAudits = () => async.eachSeries(pkgs, this._runAudits.bind(this, store)),
            scp = this._getScope(req);

        if (err) {
            this._logger.error(err.stack || err.toString());
        }

        pkgs = pkgs.filter(n => n.startsWith(scp));

        if (this._interval === null) {
            doAudits();
            this._interval = later.setInterval(doAudits, schedule);
        }

        async.eachSeries(pkgs, this._prepPkg.bind(this, store, tmp, scp, max), this._respond.bind(this, req, res, tmp));
    }

    _runAudits (storage, packageName, callback)
    {
        storage.getPackageStorage(packageName).readPackage(packageName, (err, pkg) => {
            Auditer.getAuditReport(this._logger, pkg, rating => {
                this._cache.set(pkg.name, rating);
                callback();
            });
        });
    }

    register_middlewares (app, auth, storagePlugin)
    {
        let store = storagePlugin.localStorage.localData;

        router.get(this._route, (req, res) => store.get(this._getPackages.bind(this, req, res, store)));

        app.use('/', router);
    }
}

exports.default = Monitor;

