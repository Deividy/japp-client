(function () {
    var template = {
        errorHandler: function (jqXHR, textStatus, erorThrown) {
            alert(textStatus);
            window.location.reload(true);
        },

        loading: {
            show: function () { },
            hide: function () { }
        }
    };


    JA = window.JA = {
        initialized: false,

        build: function (options) {
            if (this.initialized) {
                throw new Error("JA is already initialized");
            }

            if (!options) options = { };

            var app = new JApp(options);

            for (var key in app) {
                this[key] = app[key];
            }

            this.errorHandler = _.bind(this.errorHandler, this);
            this.initialized = true;
        },

        inherit: function (child, superclass) {
            function c() {
                this.constructor = child.constructor;
            }
            c.prototype = superclass.prototype;

            for (var prop in superclass) {
                if (Object.hasOwnProperty.call(superclass, prop)) {
                    child[prop] = superclass[prop];
                }
            }

            child.prototype = new c();

            return child;
        }
    };

    var JApp = function (options) {
        this.routes = { };

        _.extend(this, Backbone.Events);
        _.extend(this, options);
        _.defaults(this, template);

        this._activePage = null;

        this._pages = [ ];
        this._pageById = { };

        this.runningTasks = [ ];
    };

    _.extend(JApp.prototype, {
        createRoutesForPages: function () {
            var self = this;

            _.each(this._pages, function (page) {
                if (!page.isRoute || self.routes[page.id]) return;

                self.routes[page.id] = function () {
                    self.navigate(page.id);
                };

            });
        },

        startRouter: function () {
            this.createRoutesForPages();

            var Router = Backbone.Router.extend({
                routes: this.routes
            });

            this.router = new Router();

            Backbone.history.start();
        },

        addPage: function (pageObj) {
            ArgumentValidator.object(pageObj, 'pageObj');

            var page = new JA.Page(pageObj);
            this._pages.push(page);
            this._pageById[page.id] = page;  

            return page;
        },

        page: function (pageId) {
            ArgumentValidator.string(pageId, 'pageId');

            var page = this._pageById[pageId];
            if (page) return page;

            throw new Error("Page " + pageId + " not found!");
        },

        activePage: function () {
            return this._activePage || { id: undefined };
        },

        navigate: function (pageId) {
            ArgumentValidator.string(pageId, 'pageId');

            if (JA.activePage().id === pageId) return;

            var activePage = null;

            _.each(this._pages, function (page) {
                if (page.id !== pageId && this.activePage().id === page.id) {
                    return page.deactivate();
                }

                if (page.id === pageId) {
                    page.activate();
                    activePage = page;
                }
            }, this);

            if (activePage === null) {
                throw new Error("Page " + pageId + " not found");
            }

            this._activePage = activePage;
        },

        addRunningTask: function (object) {
            ArgumentValidator.object(object, 'object')

            var id = new Date().getTime()
            this.runningTasks.push(_.extend(object, { id: id }))
            return id
        },

        removeRunningTask: function (id) {
            ArgumentValidator.number(id, 'id')

            var idx = this.runningTasks.length;
            while (idx--) {
                if (this.runningTasks[idx].id === id) {
                    this.runningTasks.splice(idx, 1);
                    return true;
                }
            }
            
            return false;
        },

        get: function (url, data, callback) {
            return this.ajax('get', url, data, callback);
        },

        post: function (url, data, callback) {
            return this.ajax('post', url, data, callback);
        },

        delete: function (url, data, callback) {
            return this.ajax('delete', url, data, callback);
        },

        put: function (url, data, callback) {
            return this.ajax('put', url, data, callback);
        },

        ajax: function (method, url, data, callback) {
            if (_.isFunction(data)) {
                callback = data;
                data = { };
            }

            ArgumentValidator.string(url, 'url');
            ArgumentValidator.objectOrEmpty(data, 'data');
            ArgumentValidator.type('Function', callback, 'callback');

            this.loading.show();
            var runningTaskId = this.addRunningTask({
                method: method, url: url, data: data, callback: callback 
            });

            return $.ajax({
                type: method.toUpperCase(),
                url: url,
                dataType: 'json',
                data: data,
                success: _.bind(function () {
                    this.removeRunningTask(runningTaskId)

                    if (this.runningTasks.length === 0) {
                        this.loading.hide();
                    }
                    callback.apply(this, arguments);
                }, this),
                error: this.errorHandler,
                cache: false
            });  
        }
    });
} ());
