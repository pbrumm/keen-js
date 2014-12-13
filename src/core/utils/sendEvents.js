var Keen = require("../index"),
    each = require("./each"),
    getXHR = require("../helpers/getXhrObject");

module.exports = function(payload, callback, async) {
  var urlBase = this.url("/events"),
      data = {},
      cb = callback,
      isAsync = async || true,
      self = this,
      error_msg;

  callback = null;

  if (!Keen.enabled) {
    error_msg = "Event not recorded: Keen.enabled = false";
    self.trigger("error", error_msg);
    if (cb) {
      cb.call(this, error_msg, null);
    }
    return;
  }

  if (!self.projectId()) {
    error_msg = "Event not recorded: Missing projectId property";
    self.trigger("error", error_msg);
    if (cb) {
      cb.call(this, error_msg, null);
    }
    return;
  }

  if (!self.writeKey()) {
    error_msg = "Event not recorded: Missing writeKey property";
    self.trigger("error", error_msg);
    if (cb) {
      cb.call(this, error_msg, null);
    }
    return;
  }

  if (arguments.length > 2) {
    error_msg = "Events not recorded: Incorrect arguments provided to #addEvents method";
    self.trigger("error", error_msg);
    if (typeof arguments[2] === "function") {
      arguments[2].call(this, error_msg, null);
    }
    return;
  }

  if (typeof payload !== "object" || payload instanceof Array) {
    error_msg = "Events not recorded: Request payload must be an object";
    self.trigger("error", error_msg);
    if (cb) {
      cb.call(this, error_msg, null);
    }
    return;
  }

  // Attach properties from client.globalProperties
  if (self.config.globalProperties) {
    // Loop over each set of events
    each(payload, function(events, collection){
      // Loop over each individual event
      each(events, function(body, index){
        // Start with global properties for this collection
        var base = self.config.globalProperties(collection);
        // Apply provided properties for this event body
        each(body, function(value, key){
          base[key] = value;
        });
        // Create a new payload
        data[collection].push(base);
      });
    });
  }
  else {
    // Use existing payload
    data = payload;
  }

  if (getXHR()) {
    self.post(urlBase, data, self.writeKey(), cb, isAsync);
  }
  else {
    // TODO: queue and fire in small, asynchronous batches
    self.trigger("error", "Events not recorded: XHR support is required for batch upload");
  }

  return;
};
