'use strict';

describe('angucomplete', function() {
  var $compile, $scope, $timeout;

  beforeEach(module('angucomplete'));

  beforeEach(inject(function(_$compile_, $rootScope, _$timeout_) {
    $compile = _$compile_;
    $scope = $rootScope.$new();
    $timeout = _$timeout_;
  }));

  describe('Render', function() {

    it('should render input element with given id plus _value', function() {
      var element = angular.element('<div angucomplete id="ex1" selectedobject="selectedCountry" titlefield="name"></div>');
      $scope.selectedCountry = null;
      $compile(element)($scope);
      $scope.$digest();
      expect(element.find('#ex1_value').length).toBe(1);
    });

    it('should render planceholder string', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search countries" selectedobject="selectedCountry" localdata="countries" searchfields="name" titlefield="name"/>');
      $scope.selectedCountry = null;
      $compile(element)($scope);
      $scope.$digest();
      expect(element.find('#ex1_value').attr('placeholder')).toEqual('Search countries');
    });

  });

  describe('Local data', function() {

    it('should show search results after 3 letter is entered', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search countries" selectedobject="selectedCountry" localdata="countries" searchfields="name" titlefield="name"/>');
      $scope.selectedCountry = undefined; 
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();
      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(e);
      expect(element.find('#ex1_dropdown').length).toBe(0);

      inputField.val('aa');
      inputField.trigger('input');
      inputField.trigger(e);
      expect(element.find('#ex1_dropdown').length).toBe(0);

      inputField.val('aaa');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);
    });

    it('should show search results after 1 letter is entered with minlength being set to 1', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search countries" selectedobject="selectedCountry" localdata="countries" searchfields="name" titlefield="name" minlength="1"/>');
      $scope.selectedCountry = undefined; 
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();
      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a
      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);
    });
  });

});
