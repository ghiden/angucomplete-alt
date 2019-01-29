'use strict';

angular.module('angucomplete-alt.templates', []);
angular.module('angucomplete-alt', ['angucomplete-alt.templates']);;
'use strict';

angular.module('angucomplete-alt').directive('angucompleteAlt', ['$q', '$parse', '$http', '$sce', '$timeout', '$interpolate', '$log', function ($q, $parse, $http, $sce, $timeout, $interpolate, $log) {
  // keyboard events
  var KEY_DOWN = 40;
  var KEY_RIGHT = 39;
  var KEY_UP = 38;
  var KEY_LEFT = 37;
  var KEY_ESCAPE = 27;
  var KEY_ENTER = 13;
  var KEY_TAB = 9;

  var MIN_LENGTH = 3;
  var MAX_LENGTH = 524288; // the default max length per the html maxlength attribute
  var DEFAULT_PAUSE = 500;
  var BLUR_TIMEOUT = 200;

  // string constants
  var REQUIRED_CLASS = 'autocomplete-required';
  var TEXT_SEARCHING = 'Searching...';
  var TEXT_NORESULTS = 'No results found';
  var DEFAULT_TEMPLATE_URL = 'angucomplete-alt-template.html';
  var BROWSER_IS_CHROME = navigator.userAgent.includes('Chrome');

  var link = function link($scope, element, attributes, formController) {
    var subElements = {
      inputField: element.find('input'),
      dropdown: element[0].querySelector('.angucomplete-dropdown')
    };

    var config = {
      displayNoResults: undefined,
      displaySearching: undefined,
      hideTimer: undefined,
      httpCallInProgress: false,
      httpCanceller: null,
      isScrollOn: false,
      minlength: MIN_LENGTH,
      mostRecentKeyPressed: undefined,
      mousedownOn: null,
      requiredClassName: REQUIRED_CLASS,
      responseFormatter: undefined,
      searchTimer: null,
      submitOnEnter: undefined,
      unbindInitialValue: undefined,
      validState: null
    };

    var getCorrectTarget = function getCorrectTarget(target) {
      if (target.id) {
        return target;
      }

      if (!$scope.matchClass) {
        return target;
      }

      if (!target.className || !target.parentNode) {
        return target;
      }

      if (angular.isString(target.className) && target.className.indexOf($scope.matchClass) >= 0) {
        return target.parentNode;
      }

      return target;
    };

    // #194 dropdown list not consistent in collapsing (bug).
    var clickoutHandlerForDropdown = function clickoutHandlerForDropdown(event) {
      config.mousedownOn = null;
      $scope.hideResults(event);
      document.body.removeEventListener('click', clickoutHandlerForDropdown);
    };

    $scope.supportedAutocompleteValue = BROWSER_IS_CHROME ? 'nope' : 'off';

    $scope.mousedownHandler = function (event) {
      var target = getCorrectTarget(event.target);
      if (target.id) {
        config.mousedownOn = target.id;

        if (config.mousedownOn === $scope.id + '_dropdown') {
          document.body.addEventListener('click', clickoutHandlerForDropdown);
        }
      } else {
        config.mousedownOn = target.className;
      }
    };

    $scope.currentIndex = $scope.focusFirst ? 0 : null;
    $scope.searching = false;

    var handleRequired = function handleRequired(valid) {
      $scope.notEmpty = valid;
      config.validState = $scope.searchStr;

      if ($scope.fieldRequired && formController && $scope.inputName) {
        formController[$scope.inputName].$setValidity(config.requiredClassName, valid);
      }
    };

    var callOrAssign = function callOrAssign(value) {
      if (angular.isFunction($scope.selectedObject)) {
        $scope.selectedObject(value, $scope.selectedObjectData, config.mostRecentKeyPressed);
      } else {
        $scope.selectedObject = value;
      }

      if (value) {
        handleRequired(true);
      } else {
        handleRequired(false);
      }
    };

    var extractValue = function extractValue(obj, key) {
      if (!key) {
        return obj;
      }

      var keys = key.split('.');
      var result = obj;

      for (var i = 0; i < keys.length; i += 1) {
        result = result[keys[i]];
      }

      return result;
    };

    var extractTitle = function extractTitle(data) {
      // split title fields and run extractValue for each and join with ' '
      return $scope.titleField.split(',').map(function (field) {
        return extractValue(data, field);
      }).join(' ');
    };

    var handleInputChange = function handleInputChange(newval, initial) {
      if (!newval) {
        return;
      }

      if (angular.isObject(newval)) {
        $scope.searchStr = extractTitle(newval);
        callOrAssign({ originalObject: newval });
      } else if (angular.isString(newval) && newval.length > 0) {
        $scope.searchStr = newval;
      } else {
        $log.error('Tried to set ' + (!!initial ? 'initial' : '') + ' value of angucomplete to', newval, 'which is an invalid value');
      }

      handleRequired(true);
    };

    config.unbindInitialValue = $scope.$watch('initialValue', function (newval) {
      if (newval) {
        // remove $scope listener
        config.unbindInitialValue();
        // change input
        handleInputChange(newval, true);
      }
    });

    $scope.$watch('fieldRequired', function (newval, oldval) {
      if (newval === oldval) {
        return;
      }

      if (!newval) {
        formController[$scope.inputName].$setValidity(config.requiredClassName, true);
      } else if (!config.validState || $scope.currentIndex === -1) {
        handleRequired(false);
      } else {
        handleRequired(true);
      }
    });

    var clearResults = function clearResults() {
      $scope.showDropdown = false;
      $scope.results = [];

      if (subElements.dropdown) {
        subElements.dropdown.scrollTop = 0;
      }
    };

    $scope.$on('angucomplete-alt:clearInput', function (event, elementId) {
      if (!elementId || elementId === $scope.id) {
        $scope.searchStr = null;
        callOrAssign();
        handleRequired(false);
        clearResults();
      }
    });

    $scope.$on('angucomplete-alt:changeInput', function (event, elementId, newval) {
      var shouldHandleInputChange = !!elementId && elementId === $scope.id;
      if (!shouldHandleInputChange) {
        return;
      }

      handleInputChange(newval);
    });

    // for IE8 quirkiness about event.which
    var ie8EventNormalizer = function ie8EventNormalizer(event) {
      return event.which ? event.which : event.keyCode;
    };

    var callFunctionOrIdentity = function callFunctionOrIdentity(fn) {
      return function (data) {
        return $scope[fn] ? $scope[fn](data) : data;
      };
    };

    var setInputString = function setInputString(str) {
      callOrAssign({ originalObject: str });

      if ($scope.clearSelected) {
        $scope.searchStr = null;
      }

      clearResults();
    };

    var findMatchString = function findMatchString(target, str) {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
      // Escape user input to be treated as a literal string within a regular expression
      var regex = new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (!target) {
        return;
      }

      if (!target.match || !target.replace) {
        target = target.toString();
      }

      var matches = target.match(regex);
      var result = void 0;

      if (matches) {
        var replacedContent = '<span class="' + $scope.matchClass + '">' + matches[0] + '</span>';
        result = target.replace(regex, replacedContent);
      } else {
        result = target;
      }
      return $sce.trustAsHtml(result);
    };

    var keyupEnterHandler = function keyupEnterHandler(event) {
      event.preventDefault();
    };

    var keyupUpHandler = function keyupUpHandler(event) {
      event.preventDefault();
    };

    var initializeResults = function initializeResults() {
      $scope.showDropdown = config.displaySearching;
      $scope.currentIndex = $scope.focusFirst ? 0 : -1;
      $scope.results = [];
    };

    var checkExactMatch = function checkExactMatch(result, obj, str) {
      if (!str) {
        return false;
      }

      for (var key in obj) {
        if (obj[key].toLowerCase() === str.toLowerCase()) {
          $scope.selectResult(result);
          return true;
        }
      }

      return false;
    };

    var processResults = function processResults(responseData, str) {
      var description, text, formattedText, formattedDesc;

      if (responseData && responseData.length > 0) {
        $scope.results = [];

        for (var i = 0; i < responseData.length; i += 1) {
          if ($scope.titleField && $scope.titleField !== '') {
            text = formattedText = extractTitle(responseData[i]);
          }

          description = '';
          if ($scope.descriptionField) {
            description = formattedDesc = extractValue(responseData[i], $scope.descriptionField);
          }

          var image = '';
          if ($scope.imageField) {
            image = extractValue(responseData[i], $scope.imageField);
          }

          if ($scope.matchClass) {
            formattedText = findMatchString(text, str);
            formattedDesc = findMatchString(description, str);
          }

          $scope.results[$scope.results.length] = {
            title: formattedText,
            description: formattedDesc,
            image: image,
            originalObject: responseData[i]
          };
        }
      } else {
        $scope.results = [];
      }

      var matchCase = {
        title: text,
        desc: description || ''
      };

      if ($scope.autoMatch && $scope.results.length === 1 && checkExactMatch($scope.results[0], matchCase, $scope.searchStr)) {
        $scope.showDropdown = false;
      } else if ($scope.results.length === 0 && !config.displayNoResults) {
        $scope.showDropdown = false;
      } else {
        $scope.showDropdown = true;
      }
    };

    var getLocalResults = function getLocalResults(str) {
      var searchFields = $scope.searchFields.split(',');

      if (angular.isDefined($scope.parseInput())) {
        str = $scope.parseInput()(str);
      }

      var matches = [];

      for (var i = 0; i < $scope.localData.length; i += 1) {
        var foundMatch = false;

        for (var s = 0; s < searchFields.length; s += 1) {
          var value = extractValue($scope.localData[i], searchFields[s]) || '';
          foundMatch = foundMatch || value.toString().toLowerCase().indexOf(str.toString().toLowerCase()) >= 0;
        }

        if (foundMatch) {
          matches[matches.length] = $scope.localData[i];
        }
      }

      return matches;
    };

    var cancelHttpRequest = function cancelHttpRequest() {
      if (config.httpCanceller) {
        config.httpCanceller.resolve();
      }
    };

    var generateHttpSuccessCallback = function generateHttpSuccessCallback(str) {
      var generatedCallback = function generatedCallback(responseData, status, headers, httpConfig) {
        // normalize return obejct from promise
        if (!status && !headers && !httpConfig && responseData.data) {
          responseData = responseData.data;
        }

        $scope.searching = false;
        var extractedValue = extractValue(config.responseFormatter(responseData), $scope.remoteUrlDataField);
        processResults(extractedValue, str);
      };

      return generatedCallback;
    };

    var httpErrorCallback = function httpErrorCallback(errorRes, status, headers, httpConfig) {
      $scope.searching = config.httpCallInProgress;

      // normalize return obejct from promise
      if (!status && !headers && !httpConfig) {
        status = errorRes.status;
      }

      // cancelled/aborted
      if (status === 0 || status === -1) {
        return;
      }
      if ($scope.remoteUrlErrorCallback) {
        $scope.remoteUrlErrorCallback(errorRes, status, headers, httpConfig);
      } else {
        $log.error('http error');
      }
    };

    var getRemoteResultsWithCustomHandler = function getRemoteResultsWithCustomHandler(str) {
      cancelHttpRequest();

      config.httpCanceller = $q.defer();

      $scope.remoteApiHandler(str, config.httpCanceller.promise).then(generateHttpSuccessCallback(str)).catch(httpErrorCallback);
    };

    var getRemoteResults = function getRemoteResults(str) {
      var params = {};
      var url = $scope.remoteUrl + encodeURIComponent(str);

      if ($scope.remoteUrlRequestFormatter) {
        params = { params: $scope.remoteUrlRequestFormatter(str) };
        url = $scope.remoteUrl;
      }

      if (!!$scope.remoteUrlRequestWithCredentials) {
        params.withCredentials = true;
      }

      cancelHttpRequest();

      config.httpCanceller = $q.defer();
      params.timeout = config.httpCanceller.promise;
      config.httpCallInProgress = true;

      $http.get(url, params).then(generateHttpSuccessCallback(str)).catch(httpErrorCallback).finally(function () {
        config.httpCallInProgress = false;
      });
    };

    var searchTimerComplete = function searchTimerComplete(str) {
      // Begin the search
      if (!str || str.length < config.minlength) {
        return;
      }

      if ($scope.localData) {
        var matches;
        if (angular.isDefined($scope.localSearch())) {
          matches = $scope.localSearch()(str, $scope.localData);
        } else {
          matches = getLocalResults(str);
        }
        $scope.searching = false;
        processResults(matches, str);
      } else if ($scope.remoteApiHandler) {
        getRemoteResultsWithCustomHandler(str);
      } else {
        getRemoteResults(str);
      }
    };

    var keyupDownHandler = function keyupDownHandler(event) {
      event.preventDefault();

      if (!$scope.showDropdown && $scope.searchStr && $scope.searchStr.length >= config.minlength) {
        initializeResults();
        $scope.searching = true;
        searchTimerComplete($scope.searchStr);
      }
    };

    var keyupEscapeHandler = function keyupEscapeHandler() {
      clearResults();
      subElements.inputField.val($scope.searchStr);
    };

    var waitUntilNextDigestCycle = function waitUntilNextDigestCycle(callback) {
      return $timeout(callback);
    };

    var keyupDefaultHandler = function keyupDefaultHandler() {
      if (config.minlength === 0 && !$scope.searchStr) {
        return;
      }

      if (!$scope.searchStr || $scope.searchStr === '') {
        $scope.showDropdown = false;
      } else if ($scope.searchStr.length >= config.minlength) {
        initializeResults();

        if (config.searchTimer) {
          $timeout.cancel(config.searchTimer);
        }

        $scope.searching = true;

        config.searchTimer = waitUntilNextDigestCycle(function () {
          searchTimerComplete($scope.searchStr);
        }, $scope.pause);
      }

      if (config.validState && config.validState !== $scope.searchStr && !$scope.clearSelected) {
        callOrAssign();
      }
    };

    $scope.keyupHandler = function (event) {
      var keyPressed = ie8EventNormalizer(event);
      if (keyPressed === KEY_LEFT || keyPressed === KEY_RIGHT) {
        return;
      }

      switch (keyPressed) {
        case KEY_ENTER:
          return keyupEnterHandler(event);
        case KEY_UP:
          return keyupUpHandler(event);
        case KEY_DOWN:
          return keyupDownHandler(event);
        case KEY_ESCAPE:
          return keyupEscapeHandler(event);
        default:
          keyupDefaultHandler(event);
      }
    };

    var handleOverrideSuggestions = function handleOverrideSuggestions() {
      if (!$scope.overrideSuggestions) {
        return;
      }

      var hasInput = /\S/.test(subElements.inputField.val());
      var valuesAreEqual = $scope.selectedObject && $scope.selectedObject.originalObject === $scope.searchStr;

      var valueWasOverridden = hasInput && !valuesAreEqual;
      if (!valueWasOverridden) {
        return;
      }

      // cancel search timer
      $timeout.cancel(config.searchTimer);

      // cancel http request
      cancelHttpRequest();

      setInputString($scope.searchStr);
    };

    var dropdownRowOffsetHeight = function dropdownRowOffsetHeight(row) {
      var css = getComputedStyle(row);
      return row.offsetHeight + parseInt(css.marginTop, 10) + parseInt(css.marginBottom, 10);
    };

    var dropdownHeight = function dropdownHeight() {
      var dropdownBoundingTop = subElements.dropdown.getBoundingClientRect().top;
      var maxHeight = parseInt(getComputedStyle(subElements.dropdown).maxHeight, 10);

      return dropdownBoundingTop + maxHeight;
    };

    var dropdownRow = function dropdownRow() {
      return element[0].querySelectorAll('.angucomplete-row')[$scope.currentIndex];
    };

    var dropdownRowTop = function dropdownRowTop() {
      var rowBoundingTop = dropdownRow().getBoundingClientRect().top;
      var dropdownBoundingTop = subElements.dropdown.getBoundingClientRect().top;
      var paddingTop = parseInt(getComputedStyle(subElements.dropdown).paddingTop, 10);

      return rowBoundingTop - (dropdownBoundingTop + paddingTop);
    };

    var dropdownScrollTopTo = function dropdownScrollTopTo(offset) {
      subElements.dropdown.scrollTop = subElements.dropdown.scrollTop + offset;
    };

    var updateInputField = function updateInputField() {
      var current = $scope.results[$scope.currentIndex];

      if ($scope.matchClass) {
        subElements.inputField.val(extractTitle(current.originalObject));
      } else {
        subElements.inputField.val(current.title);
      }
    };

    var keydownEnterHandler = function keydownEnterHandler(event) {
      if ($scope.currentIndex >= 0 && $scope.currentIndex < $scope.results.length) {
        event.preventDefault();
        $scope.selectResult($scope.results[$scope.currentIndex]);
      } else {
        handleOverrideSuggestions();
        clearResults();
      }

      if (!config.submitOnEnter) {
        event.preventDefault();
      }
    };

    var keydownDownHandler = function keydownDownHandler(event) {
      event.preventDefault();

      if ($scope.currentIndex + 1 < $scope.results.length && $scope.showDropdown) {
        $scope.currentIndex += 1;
        updateInputField();

        waitUntilNextDigestCycle(function () {
          if (config.isScrollOn) {
            var row = dropdownRow();
            if (dropdownHeight() < row.getBoundingClientRect().bottom) {
              dropdownScrollTopTo(dropdownRowOffsetHeight(row));
            }
          }
        });
      }
    };

    var keydownUpHandler = function keydownUpHandler(event) {
      event.preventDefault();

      if ($scope.currentIndex >= 1) {
        $scope.currentIndex -= 1;

        updateInputField();

        waitUntilNextDigestCycle(function () {
          if (config.isScrollOn) {
            var rowTop = dropdownRowTop();
            if (rowTop < 0) {
              dropdownScrollTopTo(rowTop - 1);
            }
          }
        });
      } else if ($scope.currentIndex === 0) {
        $scope.currentIndex = -1;
        subElements.inputField.val($scope.searchStr);
      }
    };

    var keydownTabHandler = function keydownTabHandler() {
      var shouldShowDropdown = $scope.results.length > 0 && $scope.showDropdown;
      if (!shouldShowDropdown) {
        return;
      }

      if ($scope.currentIndex === -1 && $scope.overrideSuggestions) {
        // intentionally not sending event so that it does not
        // prevent default tab behavior
        handleOverrideSuggestions();
      } else {
        if ($scope.currentIndex === -1) {
          $scope.currentIndex = 0;
        }

        $scope.selectResult($scope.results[$scope.currentIndex]);
      }
    };

    $scope.keydownHandler = function (event) {

      var keyPressed = ie8EventNormalizer(event);
      config.mostRecentKeyPressed = keyPressed;

      if (keyPressed === KEY_ESCAPE) {
        // This is very specific to IE10/11 #272
        // without this, IE clears the input text
        event.preventDefault();
        return;
      }

      var hasResults = angular.isDefined($scope.results);
      var resultNavigationKeys = [KEY_TAB, KEY_ENTER, KEY_DOWN];
      var resultNavigationKeyPressed = resultNavigationKeys.indexOf(keyPressed) !== -1;
      if (resultNavigationKeyPressed && !hasResults) {
        // intentionally not sending event to handlers
        // so we don't operate on undefined results
        if ($scope.searchStr && $scope.searchStr.length > 0) {
          handleOverrideSuggestions();
        }
        return;
      }

      switch (keyPressed) {
        case KEY_ENTER:
          return keydownEnterHandler(event);
        case KEY_DOWN:
          return keydownDownHandler(event);
        case KEY_UP:
          return keydownUpHandler(event);
        case KEY_TAB:
          return keydownTabHandler(event);
      }
    };

    var showAll = function showAll() {
      if ($scope.localData) {
        $scope.searching = false;
        processResults($scope.localData, '');
      } else if ($scope.remoteApiHandler) {
        $scope.searching = true;
        getRemoteResultsWithCustomHandler('');
      } else {
        $scope.searching = true;
        getRemoteResults('');
      }
    };

    $scope.onFocusHandler = function () {

      $scope.resetHideResults();

      if ($scope.focusIn) {
        $scope.focusIn();
      }

      if (config.minlength === 0 && (!$scope.searchStr || $scope.searchStr.length === 0)) {
        $scope.currentIndex = $scope.focusFirst ? 0 : $scope.currentIndex;
        $scope.showDropdown = true;
        showAll();
      }
    };

    var dropdownWasClicked = function dropdownWasClicked() {
      if (!config.mousedownOn || !angular.isString(config.mousedownOn)) {
        return false;
      }

      var exactIdMatch = config.mousedownOn === $scope.id + '_dropdown';
      if (exactIdMatch) {
        return true;
      }

      var containsAngucomplete = config.mousedownOn.indexOf('angucomplete') >= 0;
      var containsMatchClass = config.mousedownOn.indexOf($scope.matchClass) >= 0;
      return containsAngucomplete || containsMatchClass;
    };

    $scope.hideResults = function () {
      if (dropdownWasClicked()) {
        config.mousedownOn = null;
        return;
      }

      config.hideTimer = waitUntilNextDigestCycle(function () {
        clearResults();

        if ($scope.searchStr && $scope.searchStr.length > 0) {
          subElements.inputField.val($scope.searchStr);
        }
      }, BLUR_TIMEOUT);

      cancelHttpRequest();

      if ($scope.focusOut) {
        $scope.focusOut();
      }

      if ($scope.overrideSuggestions) {
        if ($scope.searchStr && $scope.searchStr.length > 0 && $scope.currentIndex === -1) {
          handleOverrideSuggestions();
        }
      }
    };

    $scope.resetHideResults = function () {
      if (!config.hideTimer) {
        return;
      }

      $timeout.cancel(config.hideTimer);
    };

    $scope.hoverRow = function (index) {
      $scope.currentIndex = index;
    };

    $scope.selectResult = function (result) {

      // Restore original values
      if ($scope.matchClass) {
        result.title = extractTitle(result.originalObject);
        result.description = extractValue(result.originalObject, $scope.descriptionField);
      }

      if ($scope.clearSelected) {
        $scope.searchStr = null;
      } else {
        $scope.searchStr = result.title;
      }

      callOrAssign(result);
      clearResults();
    };

    $scope.inputChangeHandler = function (str) {

      if (str.length < config.minlength) {
        cancelHttpRequest();
        clearResults();
      } else if (str.length === 0 && config.minlength === 0) {
        showAll();
      }

      if ($scope.inputChanged) {
        str = $scope.inputChanged(str);
      }

      return str;
    };

    // check required
    if ($scope.fieldRequiredClass && $scope.fieldRequiredClass !== '') {
      config.requiredClassName = $scope.fieldRequiredClass;
    }

    // check min length
    if ($scope.minlength && $scope.minlength !== '') {
      config.minlength = parseInt($scope.minlength, 10);
    }

    // check pause time
    if (!$scope.pause) {
      $scope.pause = DEFAULT_PAUSE;
    }

    // check clearSelected
    if (!$scope.clearSelected) {
      $scope.clearSelected = false;
    }

    // check override suggestions
    if (!$scope.overrideSuggestions) {
      $scope.overrideSuggestions = false;
    }

    // check required field
    if ($scope.fieldRequired && formController) {
      // check initial value, if given, set validitity to true
      if ($scope.initialValue) {
        handleRequired(true);
      } else {
        handleRequired(false);
      }
    }

    $scope.inputType = attributes.type ? attributes.type : 'text';

    // set strings for "Searching..." and "No results"
    $scope.textSearching = attributes.textSearching ? attributes.textSearching : TEXT_SEARCHING;
    $scope.textNoResults = attributes.textNoResults ? attributes.textNoResults : TEXT_NORESULTS;

    config.displaySearching = $scope.textSearching === 'false' ? false : true;
    config.displayNoResults = $scope.textNoResults === 'false' ? false : true;
    config.submitOnEnter = $scope.submitOnEnter === 'true' || $scope.submitOnEnter === '';

    // set max length (default to maxlength deault from html
    $scope.maxlength = attributes.maxlength ? attributes.maxlength : MAX_LENGTH;

    // set response formatter
    config.responseFormatter = callFunctionOrIdentity('remoteUrlResponseFormatter');

    // set config.isScrollOn
    waitUntilNextDigestCycle(function () {
      var css = getComputedStyle(subElements.dropdown);
      config.isScrollOn = css.maxHeight && css.overflowY === 'auto';
    });
  };

  return {
    restrict: 'EA',
    require: '^?form',
    scope: {
      selectedObject: '=',
      selectedObjectData: '=',
      disableInput: '=',
      initialValue: '=',
      localData: '=',
      localSearch: '&',
      remoteUrlRequestFormatter: '=',
      remoteUrlRequestWithCredentials: '@',
      remoteUrlResponseFormatter: '=',
      remoteUrlErrorCallback: '=',
      remoteApiHandler: '=',
      id: '@',
      type: '@',
      placeholder: '@',
      textSearching: '@',
      textNoResults: '@',
      remoteUrl: '@',
      remoteUrlDataField: '@',
      titleField: '@',
      descriptionField: '@',
      imageField: '@',
      inputClass: '@',
      pause: '@',
      searchFields: '@',
      minlength: '@',
      matchClass: '@',
      clearSelected: '@',
      overrideSuggestions: '@',
      fieldRequired: '=',
      fieldRequiredClass: '@',
      inputChanged: '=',
      autoMatch: '@',
      focusOut: '&',
      focusIn: '&',
      fieldTabindex: '@',
      inputName: '@',
      focusFirst: '@',
      parseInput: '&',
      submitOnEnter: '@'
    },
    templateUrl: function templateUrl(_element, attributes) {
      return attributes.templateUrl || DEFAULT_TEMPLATE_URL;
    },
    compile: function compile(tElement) {
      var startSym = $interpolate.startSymbol();
      var endSym = $interpolate.endSymbol();
      if (!(startSym === '{{' && endSym === '}}')) {
        var interpolatedHtml = tElement.html().replace(/\{\{/g, startSym).replace(/\}\}/g, endSym);
        tElement.html(interpolatedHtml);
      }
      return link;
    }
  };
}]);;
'use strict';

(function (module) {
  try {
    module = angular.module('angucomplete-alt.templates');
  } catch (e) {
    module = angular.module('angucomplete-alt.templates', []);
  }
  module.run(['$templateCache', function ($templateCache) {
    $templateCache.put('angucomplete-alt-template.html', '<div class="angucomplete-holder" ng-mousedown="mousedownHandler($event)" ng-class="{\'angucomplete-dropdown-visible\': showDropdown}">\n' + '  <input id="{{id}}_value" class="{{inputClass}}" name="{{inputName}}" tabindex="{{fieldTabindex}}" type="{{inputType}}" maxlength="{{maxlength}}" placeholder="{{placeholder}}" autocapitalize="off" autocorrect="off" autocomplete="{{supportedAutocompleteValue}}" ng-model="searchStr" ng-class="{\'angucomplete-input-not-empty\': notEmpty}" ng-disabled="disableInput" ng-keydown="keydownHandler($event)" ng-keyup="keyupHandler($event)" ng-focus="onFocusHandler()" ng-blur="hideResults($event)" ng-change="inputChangeHandler(searchStr)" />\n' + '\n' + '  <div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-show="showDropdown">\n' + '    <div class="angucomplete-searching" ng-show="searching" ng-bind="textSearching"></div>\n' + '    <div class="angucomplete-searching" ng-show="!searching && (!results || results.length == 0)" ng-bind="textNoResults"></div>\n' + '\n' + '    <div class="angucomplete-row" ng-repeat="result in results" ng-click="selectResult(result)" ng-mouseenter="hoverRow($index)" ng-class="{\'angucomplete-selected-row\': $index == currentIndex}">\n' + '      <div ng-if="imageField" class="angucomplete-image-holder">\n' + '        <img ng-if="result.image && result.image != \'\'" ng-src="{{result.image}}" class="angucomplete-image" />\n' + '        <div ng-if="!result.image && result.image != \'\'" class="angucomplete-image-default"></div>\n' + '      </div>\n' + '      <div class="angucomplete-title" ng-if="matchClass" ng-bind-html="result.title"></div>\n' + '      <div class="angucomplete-title" ng-if="!matchClass">\n' + '        {{ result.title }}\n' + '      </div>\n' + '      <div ng-if="matchClass && result.description && result.description != \'\'" class="angucomplete-description" ng-bind-html="result.description"></div>\n' + '      <div ng-if="!matchClass && result.description && result.description != \'\'" class="angucomplete-description">\n' + '        {{result.description}}\n' + '      </div>\n' + '    </div>\n' + '  </div>\n' + '</div>\n' + '');
  }]);
})();