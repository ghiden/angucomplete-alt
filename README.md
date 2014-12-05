angucomplete-alt
============

This is a fork of Daryl Rowland's angucomplete (https://github.com/darylrowland/angucomplete) with a bit of tweaks such as:

* change long attribute names to hyphenated ones
* coding style similar to angular standard
* refactored in general
* jshint
* more test coverage

To see a demo go here: http://ghiden.github.io/angucomplete-alt

###Key Features
* Show just a title, a title and a description or a title, description and image in your autocomplete list
* Deliberately minimally styled so you can customise it to your heart's content!
* Reads JSON data and allows you to specify which fields to use for display
* Simple setup - e.g. to pull data from a server, just set the url parameter

### Extra Features
* Request format function: if you need to tweak data before you send to your search API, you can set your own format function. Search query goes through your function and gets sent to your API.
* Response format function: if you need to tweak response from the server before it gets processed by the directive, you can set your own format function. Raw HTTP response goes through your function. Thanks to @nekcih for proposing this feature.
* Clear on selection: when you select an item, input field is cleared.
* Blur event handling, thanks to @leejsinclair
* Override suggestions
* You can either bind an object or callback function
    * bind an object: it works as regular two-way-data-binding
    * callback function: when a selection is made by user, this callback is called with the selected object. When the selection is deselected, the callback is called with undefined. Thanks to @nekcih for proposing this feature.
* Required support: It is a bit different from ng-required which becomes valid when there is any character in input field. This required becomes valid when a selection is made. Class name is "autocomplete-required" and customizable. Thanks to @alindber for the initial idea.
* Custom texts for "Searching..." and "No results found", thanks to @vhuerta for this idea.
* Be able to set initial value. This becomes handy if you use this directive for updating existing model.
* Be able to set a error callback for ajax request
* Add a callback for tracking input changes. Thanks to @urecio for the initial idea.
* Auto match
* Add callbacks for tracking focus in/out.
* Enable/disable input field
* Show scrollbar. See [example #1](http://ghiden.github.io/angucomplete-alt/#example1)
* Clear input by sending $broadcast from parent scope. Thanks to @Leocrest for #61.
* Override template with your own. When you use this feature, test throughly as it might break other features. Thanks to @sdbondi for #74.

### Getting Started
Download the package, and include the dist/angucomplete-alt.min.js file in your page.

```bash
bower install angucomplete-alt --save
```

Then add the angucomplete-alt module to your Angular App file, e.g.

```js
var app = angular.module('app', ["angucomplete-alt"]);
```

### Local Usage

```html
<angucomplete-alt id="ex1"
              placeholder="Search countries"
              pause="100"
              selected-object="selectedCountry"
              local-data="countries"
              search-fields="name"
              title-field="name"
              minlength="1"
              input-class="form-control form-control-small"/>
```

### Remote Usage

```html
<angucomplete-alt id="members"
              placeholder="Search members"
              pause="400"
              selected-object="testObj"
              remote-url="http://myserver.com/api/user/find?s="
              remote-url-data-field="results"
              title-field="firstName,surname"
              description-field="email"
              image-field="profilePic"
              input-class="form-control form-control-small"/>
```

### Description of attributes
| Attribute        | Description           | Required | Example  |
| :------------- |:-------------| :-----:| :-----|
| id | A unique ID for the field. [example](http://ghiden.github.io/angucomplete-alt/#example1) | Yes | members |
| placeholder | Placeholder text for the search field. [example](http://ghiden.github.io/angucomplete-alt/#example1) | No | Search members |
| pause | The time to wait (in milliseconds) before searching when the user enters new characters. [example](http://ghiden.github.io/angucomplete-alt/#example1) | No | 400 |
| selected-object | Either an object in your scope or callback function. If you set an object, it will be two-way-bound data as usual. If you set a callback, it gets called when selection is made. [example](http://ghiden.github.io/angucomplete-alt/#example1) | Yes | selectedObject or objectSelectedCallback |
| remote-url | The remote URL to hit to query for results in JSON. angucomplete will automatically append the search string on the end of this, so it must be a GET request. [example](http://ghiden.github.io/angucomplete-alt/#example5) | No | http://myserver.com/api/users/find?searchstr= |
| remote-url-data-field | The name of the field in the JSON object returned back that holds the Array of objects to be used for the autocomplete list. [example](http://ghiden.github.io/angucomplete-alt/#example5) | No | results |
| title-field | The name of the field in the JSON objects returned back that should be used for displaying the title in the autocomplete list. Note, if you want to combine fields together, you can comma separate them here (e.g. for a first and last name combined). If you want to access nested field, use dot to connect attributes (e.g. name.first). [example](http://ghiden.github.io/angucomplete-alt/#example1) | Yes | firstName,lastName |
| description-field | The name of the field in the JSON objects returned back that should be used for displaying the description in the autocomplete list. [example](http://ghiden.github.io/angucomplete-alt/#example6) | No | twitterUsername |
| image-field | The name of the field in the JSON objects returned back that should be used for displaying an image in the autocomplete list. [example](http://ghiden.github.io/angucomplete-alt/#example2) | No | pic |
| minlength | The minimum length of string required before searching. [example](http://ghiden.github.io/angucomplete-alt/#example1) | No | 3 |
| input-class | The classes to use for styling the input box. [example](http://ghiden.github.io/angucomplete-alt/#example1) | No | form-control |
| dropdown-row-class | The classes to use for styling the dropdown row. | No | selected-row |
| match-class | If it is assigned, matching part of title is highlighted with given class style. [example](http://ghiden.github.io/angucomplete-alt/#example6) | No | highlight |
| local-data | The local data variable to use from your controller. Should be an array of objects. [example](http://ghiden.github.io/angucomplete-alt/#example1) | No | countriesList |
| search-fields | The fields from your local data to search on (comma separate them). Each field can contain dots for accessing nested attribute. [example](http://ghiden.github.io/angucomplete-alt/#example1) | No | title,description |
| remote-url-request-formatter | A function that takes a query string and returns parameter(s) for GET. It should take the query string as argument and returns a key-value object. [example](http://ghiden.github.io/angucomplete-alt/#example5) | No | Suppose if you need to send a query keyword and a timestamp to search API, you can write a function like this in the parent scope. $scope.dataFormatFn = function(str) { return {q: str, timestamp: +new Date()}; } |
| remote-url-response-formatter | A function on the scope that will modify raw response from remote API before it is rendered in the drop-down.  Useful for adding data that may not be available from the API.  The specified function must return the object in the format that angucomplete understands. | No | addImageUrlToObject |
| remote-url-error-callback | A callback funciton to handle error response from $http.get | No | httpErrorCallbackFn |
| clear-selected | To clear out input field upon selecting an item, set this attribute to true. [example](http://ghiden.github.io/angucomplete-alt/#example3) | No | true |
| override-suggestions | To override suggestions and set the value in input field to selectedObject. [example](http://ghiden.github.io/angucomplete-alt/#example4) | No | true |
| field-required | Set field to be required. Requirement for this to work is that this directive needs to be in a form. Default class name is "autocomplete-required". [example](http://ghiden.github.io/angucomplete-alt/#example8) | No | true |
| field-required-class | Set custom class name for required. | No | "match" |
| text-searching | Custom string to show when search is in progress. | No | "Searching for items..." |
| text-no-results | Custom string to show when there is no match. | No | "Not found" |
| initial-value | Initial value for internal ng-model. [example](http://ghiden.github.io/angucomplete-alt/#example9) | No | "some string" |
| input-changed | A callback function that is called when input field is changed. [example](http://ghiden.github.io/angucomplete-alt/#example10) |  No | inputChangedFn |
| auto-match | Allows for auto selecting an item if the search text matches a search results attributes exactly. [example](http://ghiden.github.io/angucomplete-alt/#example11) |  No | true |
| focus-in | A function or expression to be called when input field gets focused. [example](http://ghiden.github.io/angucomplete-alt/#example12) |  No | focusIn() |
| focus-out | A function or expression to be called when input field lose focus. [example](http://ghiden.github.io/angucomplete-alt/#example12) |  No | focusOut() |
| disable-input | A model to control disable/enable of input field. [example page](http://ghiden.github.io/angucomplete-alt/#example13) |  No | disableInput |
| template-url | Customize the markup of the autocomplete template. [example page](http://ghiden.github.io/angucomplete-alt/#example14) |  No | "/my-custom-template.html" |

### Scrollbar

To show scrollbar, you need to set the following css style to angucomplete-dropdown class, and then the directive automatically picks it up.
```css
.angucomplete-dropdown {
    ...
    overflow-y: auto;
    max-height: 200px; // your preference
    ...
}
```
See [example #1](http://ghiden.github.io/angucomplete-alt/#example1)

### Clear Input

To clear all angucomplete-alt input fields, send this message
```js
$scope.$broadcast('angucomplete-alt:clearInput');
```

To clear an angucomplete-alt input field, send this message with id of the directive. For example, the id of the directive is 'autocomplete-1'.
```js
$scope.$broadcast('angucomplete-alt:clearInput', 'autocomplete-1');
```

### Contributors

Here is the list of [contributors](CONTRIBUTORS.md).
Here is how to [contribute](CONTRIBUTING.md).
Of course the easiest contribution is to give it a star!
