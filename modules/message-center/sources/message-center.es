import CliqzUtils from "../core/utils";
import CliqzEvents from "../core/events";
import CliqzMsgHandlerAlert from "./handlers/alert";
import CliqzMsgHandlerDropdown from "./handlers/dropdown";
import CliqzMsgHandlerFreshtabTop from "./handlers/freshtab-top";
import CliqzMsgHandlerFreshtabMiddle from "./handlers/freshtab-middle";
import CliqzMsgHandlerCallout from "./handlers/callout";

/* ************************************************************************* */
function _log(msg) {
	CliqzUtils.log(msg, 'CliqzMsgCenter');
}
/* ************************************************************************* */


function CliqzMsgCenter() {
  this._messageHandlers = {};

  this.showMessage = this.showMessage.bind(this);
  this.hideMessage = this.hideMessage.bind(this);

  this.registerMessageHandler('MESSAGE_HANDLER_DROPDOWN',
    new CliqzMsgHandlerDropdown());
  this.registerMessageHandler('MESSAGE_HANDLER_ALERT',
    new CliqzMsgHandlerAlert());
  this.registerMessageHandler('MESSAGE_HANDLER_FRESHTAB_TOP',
    new CliqzMsgHandlerFreshtabTop());
  this.registerMessageHandler('MESSAGE_HANDLER_FRESHTAB_MIDDLE',
    new CliqzMsgHandlerFreshtabMiddle());
}

CliqzMsgCenter.prototype = {

	registerMessageHandler: function (id, handler) {
		this._messageHandlers[id] = handler;
	},

  getHandlers: function() {
    return Object.keys(this._messageHandlers);
  },

  showMessage: function (message, handlerId, callback) {
    var handler = this._messageHandlers[handlerId];
    if (handler) {
      handler.enqueueMessage(message, callback);
    } else {
      _log('message handler not found: ' + handlerId);
    }
  },

  hideMessage: function (message, handlerId) {
    var handler = this._messageHandlers[handlerId];
    if (handler) {
      handler.dequeueMessage(message);
    } else {
      _log('message handler not found: ' + handlerId);
    }
  }
};

CliqzMsgCenter.getInstance = function () {
  CliqzMsgCenter.getInstance.instance =
    CliqzMsgCenter.getInstance.instance || new CliqzMsgCenter();
  return CliqzMsgCenter.getInstance.instance;
};
//CliqzMsgCenter.getInstance();

export default CliqzMsgCenter;
