'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    processInclude(require('./checkout/cybersource/secureAcceptance'));
    processInclude(require('./checkout/cybersource/flexMicroform'));
});