(function(module) {
try {
  module = angular.module('angucomplete-alt.templates');
} catch (e) {
  module = angular.module('angucomplete-alt.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('angucomplete-alt-template.html',
    '<div class="angucomplete-holder" ng-mousedown="mousedownHandler($event)" ng-class="{\'angucomplete-dropdown-visible\': showDropdown}">\n' +
    '  <input id="{{id}}_value" class="{{inputClass}}" name="{{inputName}}" tabindex="{{fieldTabindex}}" type="{{inputType}}" maxlength="{{maxlength}}" placeholder="{{placeholder}}" autocapitalize="off" autocorrect="off" autocomplete="{{supportedAutocompleteValue}}" ng-model="searchStr" ng-class="{\'angucomplete-input-not-empty\': notEmpty}" ng-disabled="disableInput" ng-keydown="keydownHandler($event)" ng-keyup="keyupHandler($event)" ng-focus="onFocusHandler()" ng-blur="hideResults($event)" ng-change="inputChangeHandler(searchStr)" />\n' +
    '\n' +
    '  <div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-show="showDropdown">\n' +
    '    <div class="angucomplete-add" bb3-if="bbAddPermission && searchStr && !results[currentIndex]" permission-string="{{ bbAddPermission }}">\n' +
    '      Press\n' +
    '      <b>Enter</b> to create\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="angucomplete-searching" ng-show="searching" ng-bind="textSearching"></div>\n' +
    '    <div class="angucomplete-searching" ng-show="!searching && (!results || results.length == 0)" ng-bind="textNoResults"></div>\n' +
    '\n' +
    '    <div class="angucomplete-row" ng-repeat="result in results" ng-click="selectResult(result)" ng-mouseenter="hoverRow($index)" ng-class="{\'angucomplete-selected-row\': $index == currentIndex, \'flex\': includeBbIcons}">\n' +
    '      <div ng-if="includeBbIcons" class="angucomplete-image-holder mr1">\n' +
    '        <span class="angucomplete-image">\n' +
    '          <bb3-record-icon record="result.originalObject"></bb3-record-icon>\n' +
    '        </span>\n' +
    '      </div>\n' +
    '      <div>\n' +
    '        <div ng-if="imageField" class="angucomplete-image-holder">\n' +
    '          <img ng-if="result.image && result.image != \'\'" ng-src="{{result.image}}" class="angucomplete-image" />\n' +
    '          <div ng-if="!result.image && result.image != \'\'" class="angucomplete-image-default"></div>\n' +
    '        </div>\n' +
    '        <div class="angucomplete-title" ng-if="matchClass" ng-bind-html="result.title"></div>\n' +
    '        <div class="angucomplete-title" ng-if="!matchClass">\n' +
    '          {{ result.title }}\n' +
    '        </div>\n' +
    '        <div ng-if="matchClass && result.description && result.description != \'\'" class="angucomplete-description" ng-bind-html="result.description"></div>\n' +
    '        <div ng-if="!matchClass && result.description && result.description != \'\'" class="angucomplete-description">\n' +
    '          {{result.description}}\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '');
}]);
})();
