
$(function() {

  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("MGKUEbafBIIy2bY4whbBKswCrbOsyyHJdqGMqhBi",
                   "BTfNR1vMfztxszEuQJNnthQAFRDLxPyy28O3FPjO");

/***
 *    ##     ##  #######  ##     ## #### ########    ##     ## ########  ##       
 *    ###   ### ##     ## ##     ##  ##  ##          ###   ### ##     ## ##       
 *    #### #### ##     ## ##     ##  ##  ##          #### #### ##     ## ##       
 *    ## ### ## ##     ## ##     ##  ##  ######      ## ### ## ##     ## ##       
 *    ##     ## ##     ##  ##   ##   ##  ##          ##     ## ##     ## ##       
 *    ##     ## ##     ##   ## ##    ##  ##          ##     ## ##     ## ##       
 *    ##     ##  #######     ###    #### ########    ##     ## ########  ######## 
 */

  // Our basic Movie model.
  var Movie = Parse.Object.extend("Movie", {
    defaults: {
      title: "empty..",
      year: 0000,
      type: "unknown",
      isGood: false
    },

    initialize: function() {
      
    },

    toggle: function() {
      this.save({done: !this.get("done")});
    }
  });


  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

/***
 *    ##     ##  #######  ##     ## #### ########    ##       ####  ######  ######## 
 *    ###   ### ##     ## ##     ##  ##  ##          ##        ##  ##    ##    ##    
 *    #### #### ##     ## ##     ##  ##  ##          ##        ##  ##          ##    
 *    ## ### ## ##     ## ##     ##  ##  ######      ##        ##   ######     ##    
 *    ##     ## ##     ##  ##   ##   ##  ##          ##        ##        ##    ##    
 *    ##     ## ##     ##   ## ##    ##  ##          ##        ##  ##    ##    ##    
 *    ##     ##  #######     ###    #### ########    ######## ####  ######     ##    
 */

  var YourMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });

   var YourFriendsMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });


/***
 *    ##     ##  #######  ##     ## #### ########    ##     ## #### ######## ##      ## 
 *    ###   ### ##     ## ##     ##  ##  ##          ##     ##  ##  ##       ##  ##  ## 
 *    #### #### ##     ## ##     ##  ##  ##          ##     ##  ##  ##       ##  ##  ## 
 *    ## ### ## ##     ## ##     ##  ##  ######      ##     ##  ##  ######   ##  ##  ## 
 *    ##     ## ##     ##  ##   ##   ##  ##           ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##     ##   ## ##    ##  ##            ## ##    ##  ##       ##  ##  ## 
 *    ##     ##  #######     ###    #### ########       ###    #### ########  ###  ###  
 */

  // The DOM element for a Movie item...
  var MovieView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"              : "toggleDone",
      "dblclick label.movie-content" : "edit",
      "blur .edit"          : "close"
    },

    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    close: function() {
      this.model.save({content: this.input.val()});
      $(this.el).removeClass("editing");
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  
/***
 *    ##     ##    ###    #### ##    ##    ##     ## #### ######## ##      ## 
 *    ###   ###   ## ##    ##  ###   ##    ##     ##  ##  ##       ##  ##  ## 
 *    #### ####  ##   ##   ##  ####  ##    ##     ##  ##  ##       ##  ##  ## 
 *    ## ### ## ##     ##  ##  ## ## ##    ##     ##  ##  ######   ##  ##  ## 
 *    ##     ## #########  ##  ##  ####     ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##     ##  ##  ##   ###      ## ##    ##  ##       ##  ##  ## 
 *    ##     ## ##     ## #### ##    ##       ###    #### ########  ###  ###  
 */
  var MainView = Parse.View.extend({

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-movie":  "createOnEnter",
      "click .log-out": "logOut",
    },

    el: ".content",

    initialize: function() {
      console.log("MainView init");
      var self = this;

      _.bindAll(this, 'addOne', 'addAll', 'friendsAddOne', 'friendsAddAll', 'render','logOut', 'createOnEnter');

      // Main movies management template
      
      this.$el.html(_.template($("#main-movies-template").html()));

      this.input = this.$("#new-movie");
      this.allCheckbox = this.$("#toggle-all")[0];

      var yourFriendsIds = Parse.User.current().get("friendIDs");

      // Create our collection of Movies
      this.yourMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies from the current user
      this.yourMovies.query = new Parse.Query(Movie);
      this.yourMovies.query.equalTo("user", Parse.User.current());
        
      this.yourMovies.bind('add',     this.addOne);
      this.yourMovies.bind('reset',   this.addAll);
      this.yourMovies.bind('all',     this.render);

      // Fetch all the movie items for this user
      this.yourMovies.fetch();


      // Create a collection of our Friends' Movies
      this.yourFriendsMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies from the current user
      this.yourFriendsMovies.query = new Parse.Query(Movie);
      this.yourFriendsMovies.query.containedIn("facebookID", yourFriendsIds);
        
      this.yourFriendsMovies.bind('add',     this.friendsAddOne);
      this.yourFriendsMovies.bind('reset',   this.friendsAddAll);
      this.yourFriendsMovies.bind('all',     this.render);

      // Fetch all the movie items for this user
      this.yourFriendsMovies.fetch();

      state.on("change", this.filter, this);
    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {

      this.delegateEvents();

    },

    // Add a single movie item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(movie) {
      var view = new MovieView({model: movie});
      this.$("#your-movies-list").append(view.render().el);
    },

    // Add all items in the collection at once.
    addAll: function(collection, filter) {
      this.$("#your-movies-list").html("");
      this.yourMovies.each(this.addOne);
    },

     // Add a single movie item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    friendsAddOne: function(movie) {
      var view = new MovieView({model: movie});
      this.$("#friends-movies-list").append(view.render().el);
    },

    // Add all items in the collection at once.
    friendsAddAll: function(collection, filter) {
      this.$("#friends-movies-list").html("");
      this.yourFriendsMovies.each(this.friendsAddOne);
    },

    createOnEnter: function(e) {
      var self = this;
      if (e.keyCode != 13) return;

      var publicACL = new Parse.ACL();
      publicACL.setPublicReadAccess(true);
      this.yourMovies.create({
        title: this.input.val(),
        done:    false,
        user:    Parse.User.current(),
        ACL:     publicACL,
        facebookID: Parse.User.current().escape("facebookID")
      });

      this.input.val('');
    },

  });
/***
 *    ##        #######   ######   #### ##    ##    ##     ## #### ######## ##      ## 
 *    ##       ##     ## ##    ##   ##  ###   ##    ##     ##  ##  ##       ##  ##  ## 
 *    ##       ##     ## ##         ##  ####  ##    ##     ##  ##  ##       ##  ##  ## 
 *    ##       ##     ## ##   ####  ##  ## ## ##    ##     ##  ##  ######   ##  ##  ## 
 *    ##       ##     ## ##    ##   ##  ##  ####     ##   ##   ##  ##       ##  ##  ## 
 *    ##       ##     ## ##    ##   ##  ##   ###      ## ##    ##  ##       ##  ##  ## 
 *    ########  #######   ######   #### ##    ##       ###    #### ########  ###  ###  
 */
 var LogInView = Parse.View.extend({
    events: {
      "click .facebook-login-button": "facebookLogIn",
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "facebookLogIn");
      this.render();
    },

    facebookLogIn: function(e) {
      Parse.FacebookUtils.logIn("email,user_friends,read_friendlists", {
        success: function(user) {
          // Handle successful login
          FB.api(
              "/v1.0/me/",
              function (response) {
                if (response && !response.error) {
                  Parse.User.current().save("firstName",response.first_name);
                  Parse.User.current().save("facebookID",response.id);
                  new MainView();
                } else {
                  console.log("Error:")
                  console.log(response.error)
                }
              }
          );
          FB.api(
              "/v1.0/me/friends",
              function (response) {
                if (response && !response.error) {
                  var currUserFriendsIds = [];
                  for (var i = response.data.length - 1; i >= 0; i--) {
                    currUserFriendsIds.push(response.data[i].id);
                  };

                  var currUser = Parse.User.current();

                  currUser.set("friendIDs",currUserFriendsIds)

                  currUser.save(null, {
                    success: function(response) {
                      // Execute any logic that should take place after the object is saved.
                      console.log('User data saved: ' + response);
                    },
                    error: function(response, error) {
                      // Execute any logic that should take place if the save fails.
                      // error is a Parse.Error with an error code and message.
                      console.log('Failed to create save user data, with error code: ' + error.message);
                    }
                  });


                } else {
                  console.log("Friends Error:")
                  console.log(response.error)
                }
              }
          );
          new SignedInView();
        },
        error: function(user, error) {
          // Handle errors and cancellation
          console.log("\nError:");
          console.log(user);
          console.log(error);
        }
      });

    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  var SignedInView = Parse.View.extend({

    events: {
      "click .log-out": "logOut"
    },

    el: ".content",

    initialize: function() {
      var self = this;

      this.$el.html(_.template($("#signed-in-template").html()));

    },
    logOut: function(e) {
      Parse.User.logOut();

      new LogInView();
      this.undelegateEvents();
      delete this;
    }

  });


/***
 *       ###    ########  ########     ##     ## #### ######## ##      ## 
 *      ## ##   ##     ## ##     ##    ##     ##  ##  ##       ##  ##  ## 
 *     ##   ##  ##     ## ##     ##    ##     ##  ##  ##       ##  ##  ## 
 *    ##     ## ########  ########     ##     ##  ##  ######   ##  ##  ## 
 *    ######### ##        ##            ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##        ##             ## ##    ##  ##       ##  ##  ## 
 *    ##     ## ##        ##              ###    #### ########  ###  ###  
 */
  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#wdywln-app"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new MainView();
      } else {
        new LogInView();
      }
    }
  });

/***
 *       ###    ########  ########     ########  ######## ########  
 *      ## ##   ##     ## ##     ##    ##     ##    ##    ##     ## 
 *     ##   ##  ##     ## ##     ##    ##     ##    ##    ##     ## 
 *    ##     ## ########  ########     ########     ##    ########  
 *    ######### ##        ##           ##   ##      ##    ##   ##   
 *    ##     ## ##        ##           ##    ##     ##    ##    ##  
 *    ##     ## ##        ##           ##     ##    ##    ##     ## 
 */
  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});
