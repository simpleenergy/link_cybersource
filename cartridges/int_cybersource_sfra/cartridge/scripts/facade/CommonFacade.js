'use strict';

var Logger = require('dw/system/Logger');
var CSServices = require('~/cartridge/scripts/init/SoapServiceInit');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * This common method will set merchant ID based on payment method
 * and intiate call to corresponding service, log the response
 * and return the response to call back function
 * @param {*} paymentMethod paymentMethod
 * @param {*} request request
 * @returns {*} obj
 */
function CallCYBService(paymentMethod, request) {
    var serviceResponse = null;
    // var CybersourceConstants = require('~/cartridge/scripts/utils/CybersourceConstants');
    var libCybersource = require('~/cartridge/scripts/cybersource/libCybersource');
    var CybersourceHelper = libCybersource.getCybersourceHelper();
    try {
        // var dwsvc = require('dw/svc');
        var service = CSServices.CyberSourceTransactionService;
        // get the merchant credentials from helper method
        var merchantCrdentials = CybersourceHelper.getMerhcantCredentials(paymentMethod);
        var requestWrapper = {};
        // set merchant id into request
        request.merchantID = merchantCrdentials.merchantID;
        requestWrapper.request = request;
        // set merchant credentials into wrapper
        requestWrapper.merchantCredentials = merchantCrdentials;
        // call service method
        serviceResponse = service.call(requestWrapper);
    } catch (e) {
        Logger.error('[CommonFacade.js] Error in Execute request ( {0} )', e.message);
        if (e.message.indexOf('SocketTimeoutException') !== -1) {
            return { error: true, errorMsg: e.message };
        }
        return { error: true, errorMsg: e.message };
    }
    // log the response in case of error scenario
    // eslint-disable-next-line
    if (empty(serviceResponse) || !'OK'.equals(serviceResponse.status)) {
        Logger.error('[CommonFacade.js] Error : null response');
        return { error: true, errorMsg: serviceResponse.status };
    }
    serviceResponse = serviceResponse.object;
    // logging the response object
    var CommonHelper = require('~/cartridge/scripts/helper/CommonHelper');
    CommonHelper.LogResponse(serviceResponse.merchantReferenceCode, serviceResponse.requestID, serviceResponse.requestToken, serviceResponse.reasonCode.get(), serviceResponse.decision);

    return serviceResponse;
}

/**
 * This script call service to check payment status for alipay on basis of request id generated by Initiate payment service
 * and set the response in response object and also handles the logging of different error scenarios
 * while making service call.
 * @param {*} Order Order
 * @returns {*} obj
 */
function CheckPaymentStatusRequest(Order) {
    // set the order object from pipeline dictionary
    var orderNo = Order.orderNo;
    var paymentType; var requestID; var paymentMethod;
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    collections.forEach(Order.paymentInstruments, function (paymentInstrument) {
        //  for each (var paymentInstrument in Order.paymentInstruments) {
        if (!paymentInstrument.paymentMethod.equals(PaymentInstrument.METHOD_GIFT_CERTIFICATE)) {
            paymentType = paymentInstrument.paymentTransaction.custom.apPaymentType;
            requestID = paymentInstrument.paymentTransaction.custom.requestId;
            paymentMethod = paymentInstrument.paymentMethod;
        }
    });
    // create service stubs
    var libCybersource = require('~/cartridge/scripts/cybersource/libCybersource');
    var CybersourceHelper = libCybersource.getCybersourceHelper();
    // eslint-disable-next-line
    var csReference = webreferences2.CyberSourceTransaction;

    // set alipay payment type to pass it as input in request
    var request = new csReference.RequestMessage();
    // call alipay check status service by passing required input parameters
    CybersourceHelper.apCheckStatusService(request, orderNo, requestID, paymentType, null);

    var serviceResponse = null;
    // get the response in response object
    serviceResponse = CallCYBService(paymentMethod, request);
    return serviceResponse;
}

module.exports = {
    CheckPaymentStatusRequest: CheckPaymentStatusRequest,
    CallCYBService: CallCYBService
};
