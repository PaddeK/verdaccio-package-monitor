'use strict';

const
    RATING_UNKNOWN = 'unknown',
    RATING_ERROR = 'error',
    RATING_WARN = 'warn',
    RATING_OK = 'ok',
    NpmInstall = ['npm', ['i', '--silent', '--package-lock-only', '--no-bin-links', '--no-audit', '--ignore-scripts']],
    NpmAudit = ['npm', ['audit', '--json']],
    fs = require('fs'),
    path = require('path'),
    series = require('p-series'),
    exec = require('execa'),
    rimraf = require('rimraf');

class Auditer
{
    static get RATING_UNKNOWN () { return RATING_UNKNOWN; }
    static get RATING_ERROR () { return RATING_ERROR; }
    static get RATING_WARN () { return RATING_WARN; }
    static get RATING_OK () { return RATING_OK; }

    static getAuditReport (logger, packageJson, cb)
    {
        let tmpFolder = fs.mkdtempSync(path.join(__dirname, 'tmp'));

        series([
            Auditer._copy.bind(null, packageJson, tmpFolder),
            Auditer._exec(NpmInstall, tmpFolder),
            Auditer._exec(NpmAudit, tmpFolder)
        ]).then(r => {
            Auditer._cleanup(tmpFolder);
            cb(Auditer._calcResult(logger, r));
        }).catch(err => {
            logger.error(err);
            Auditer._cleanup(tmpFolder);
            cb(RATING_ERROR);
        });
    }

    /**
     * @private
     */
    static _calcResult (logger, result)
    {
        /**
         * @typedef {object} Vulnerabilities
         * @property {number} info
         * @property {number} low
         * @property {number} moderate
         * @property {number} high
         * @property {number} critical
         */
        /**
         * @typedef {object} AuditReport
         * @property {object} metadata
         * @property {Vulnerabilities} metadata.vulnerabilities
         */
        let auditResult = result.pop();

        if (auditResult && !auditResult.failed && auditResult.code === 0 && auditResult.stdout) {
            try {
                return Auditer._rating(JSON.parse(auditResult.stdout).metadata.vulnerabilities);
            } catch(err) {
                logger.error(err);
                return RATING_ERROR;
            }
        }
    }

    /**
     * @param {Vulnerabilities} v
     * @private
     */
    static _rating (v)
    {
        let map = {info: 1, low: 2, moderate: 4, high: 8, critical: 16},
            rating = Object.entries(map).reduce((p, [sev, fac]) => p += v[sev] === 0 ? 0 : fac, 0);

        return rating >= 8 ? RATING_ERROR : (rating >= 2 ? RATING_WARN : RATING_OK);
    }

    /**
     * @private
     */
    static _copy (packageJson, tmpFolder)
    {
        return new Promise((ok, nok) => {
            packageJson = typeof packageJson !== 'string' ? JSON.stringify(packageJson) : packageJson;

            fs.writeFile(path.join(tmpFolder, 'package.json'), packageJson, err => err ? nok(err) : ok());
        });
    }

    /**
     * @private
     */
    static _exec (cmd, tmpFolder)
    {
        return () => exec.apply(null, cmd.concat({cwd: tmpFolder}));
    }

    /**
     * @private
     */
    static _cleanup (tmpFolder)
    {
       rimraf.sync(tmpFolder, {disableGlob: true});
    }
}

module.exports = Auditer;


