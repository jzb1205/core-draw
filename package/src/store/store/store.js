"use strict";
exports.__esModule = true;
exports.Store = void 0;
var data_1 = require("./data");
var observer_1 = require("./observer");
var uuid_1 = require("./uuid");
var Store = /** @class */ (function () {
    function Store() {
        this.data = {};
        this.observers = {};
    }
    Store.prototype.get = function (key) {
        return Store.get(key, this.data);
    };
    Store.prototype.set = function (key, value) {
        Store.set(key, value, this.data, this.observers);
    };
    Store.prototype.updated = function (key) {
        Store.updated(key, this.data, this.observers);
    };
    Store.prototype.subscribe = function (key, fn) {
        return Store.subscribe(key, fn, this.data, this.observers);
    };
    Store.get = function (key, store) {
        if (!store) {
            store = data_1.data;
        }
        if (key === undefined) {
            return store;
        }
        var props = key.split('.');
        for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
            var prop = props_1[_i];
            store = store[prop];
            if (store === undefined) {
                break;
            }
        }
        return store;
    };
    Store.set = function (key, value, store, obs) {
        if (!store) {
            store = data_1.data;
        }
        if (!obs) {
            obs = data_1.observers;
        }
        var props = key.split('.');
        var _store = store;
        for (var i = 0; i < props.length - 1; ++i) {
            if (!_store[props[i]]) {
                _store[props[i]] = {};
            }
            _store = _store[props[i]];
        }
        _store[props[props.length - 1]] = value;
        for (var id in obs) {
            if (key.indexOf(obs[id].key) === 0) {
                obs[id].fn(Store.get(obs[id].key, store));
            }
        }
    };
    Store.updated = function (key, store, obs) {
        if (!obs) {
            obs = data_1.observers;
        }
        for (var id in obs) {
            if (key.indexOf(obs[id].key) === 0) {
                obs[id].fn(Store.get(obs[id].key, store));
            }
        }
    };
    Store.subscribe = function (key, fn, store, obs) {
        if (!obs) {
            obs = data_1.observers;
        }
        var id = uuid_1.s8();
        var observer = new observer_1.Observer(id, key, fn);
        obs[id] = observer;
        var value = Store.get(key, store);
        if (value !== undefined) {
            fn(value);
        }
        return observer;
    };
    return Store;
}());
exports.Store = Store;
