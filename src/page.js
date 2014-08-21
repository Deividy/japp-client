(function () {
    var template = {
        isRoute: true,
        afterDeactivate: function () { },
        beforeDeactivate: function (next) {
            next();
        },
        afterActivate: function () { },
        beforeActivate: function (next) {
            // by default we always activate the first display of a page
            this._displays[0].activate();
            next();
        }
    };

    JA.Page = function (options) {
        ArgumentValidator.keysWithString(options, [ "id" ], "options");

        _.extend(this, Backbone.Events);

        _.extend(this, options);
        _.defaults(this, template);

        this._activeDisplay = null;
        this._displays = [ ];
        this._displayById = { };
    };

    _.extend(JA.Page.prototype, {
        display: function (displayId) {
            ArgumentValidator.string(displayId, 'displayId');

            var display = this._displayById[displayId];
            if (display) return display;

            throw new Error("Display " + displayId + " not found!");
        },

        addDisplay: function (displayObj) {
            ArgumentValidator.object(displayObj, 'displayObj');

            var display = new JA.Display(displayObj)
            this._displays.push(display);
            this._displayById[display.id] = display;

            display.hide();

            return display;
        },

        activateAllDisplays: function () {
            _.each(this._displays, function (display) {
                if (!display.isActive) {
                    display.activate();
                }
            });
        },

        deactivateAllDisplays: function () {
            _.each(this._displays, function (display) {
                if (display.isActive) {
                    display.deactivate();
                }
            });
        },

        activate: function () {
            var self = this;

            this.beforeActivate(function () {
                self.afterActivate();
            });
        },

        deactivate: function () {
            var self = this;

            this.beforeDeactivate(function () {
                self.deactivateAllDisplays();
                self.afterDeactivate();
            });
        }
    });
} ());
