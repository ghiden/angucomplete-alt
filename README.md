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
* Clear on selection: when you select an item, input field is cleared.
* Blur event handling, thanks to @leejsinclair
* Override suggestions

### Getting Started
Download the code, and include the angucomplete-alt.js file in your page. Then add the angucomplete-alt module to your Angular App file, e.g.
```html
var app = angular.module('app', ["angucomplete-alt"]);
```

### Local Usage

```html
<angucomplete-alt id="ex1"
              place-holder="Search countries"
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
<angucomplete id="members"
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
| id | A unique ID for the field | Yes | members |
| placeholder | Placeholder text for the search field | No | Search members |
| pause | The time to wait (in milliseconds) before searching when the user enters new characters | No | 400 |
| selected-object | Where to store the selected object in your model/controller (like ng-model) | Yes | myObject |
| remote-url | The remote URL to hit to query for results in JSON. angucomplete will automatically append the search string on the end of this, so it must be a GET request | No | http://myserver.com/api/users/find?searchstr= |
| remote-url-data-field | The name of the field in the JSON object returned back that holds the Array of objects to be used for the autocomplete list. | No | results |
| title-field | The name of the field in the JSON objects returned back that should be used for displaying the title in the autocomplete list. Note, if you want to combine fields together, you can comma separate them here (e.g. for a first and last name combined) | Yes | firstName,lastName |
| description-field | The name of the field in the JSON objects returned back that should be used for displaying the description in the autocomplete list | No | twitterUsername |
| image-field | The name of the field in the JSON objects returned back that should be used for displaying an image in the autocomplete list | No | pic |
| minlength | The minimum length of string required before searching | No | 3 |
| input-class | The classes to use for styling the input box | No | form-control |
| local-data | The local data variable to use from your controller. Should be an array of objects | No | countriesList |
| search-fields | The fields from your local data to search on (comma separate them) | No | title,description |
| remote-url-request-formatter | A function that takes a query string and returns parameter(s) for GET. It should take the query string as argument and returns a key-value object.| No | Suppose if you need to send a query keyword and a timestamp to search API, you can write a function like this in the parent scope. $scope.dataFormatFn = function(str) { return {q: str, timestamp: +new Date()}; } |
| clear-selected | To clear out input field upon selecting an item, set this attribute to true. | No | true |
| override-suggestions | To override suggestions and set the value in input field to selectedObject | No | true |

