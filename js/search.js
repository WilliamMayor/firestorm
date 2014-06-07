var mkdirp = require('mkdirp');
var path = require('path');
var exec = require('child_process').exec;
var request = require('request');
var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;

function SearchViewModel(g) {
    var self = this;
    self.g = g;

    self.error = ko.observable();
    self.busy = ko.observable(false);
    self.query = ko.observable();
    self.results = ko.observableArray();
    self.focus = ko.observable(true);
    self.show = ko.observable(false);

    self.focus.subscribe(function(value) {
        self.show(value && self.results().length > 0);
    });

    self.clear = function() {
        self.query("");
        self.results([]);
        self.busy(false);
        self.show(false);
    };

    self.probe_git = function(url, discovered, done) {
        var cmd = g.settings.git() + " ls-remote " + url + " HEAD";
        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                self.probe_svn(url, discovered, done);
            } else {
                var name = parse_url.exec(url)[5].split('/').pop();
                discovered({
                    type: 'git',
                    name: name,
                    url: url,
                    output: stdout
                });
                done();
            }
        });
    };

    self.probe_svn = function(url, discovered, done) {
        self.probe_file(url, discovered, done);
    };

    self.probe_file = function(url, discovered, done) {
        done();
    };

    self.probe = function(url, discovered, done) {
        self.probe_git(url, discovered, done);
    };

    self.search = function() {
        self.busy(true);
        self.results([]);
        var q = self.query();
        self.probe(q, function(details) {
            self.results.push({
                name: details.name,
                type: details.type,
                url: details.url
            });
            self.show(true);
        }, function() {
            self.busy(false);
        });
    };

    self.download = function(a) {
        self.clear();
        self.g.addons.add_repo(a);
        return true;
    };

    self.on_keyup = function(_, event) {
        if (event.keyCode === 27) {
            self.focus(false);
            self.show(false);
        }
    };
}
