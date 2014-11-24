// Avatar object to be exported
Avatar = {

  // If defined (e.g. from a startup config file in your app), these options
  // override default functionality
  options: {

    // This property on the user object will be used for retrieving gravatars
    // (useful when user emails are not published).
    emailHashProperty: '',

    // What to show when no avatar can be found via linked services:
    // 'initials' (default) or 'image'
    defaultType: '',

    // This will replace the included default avatar image's URL
    // ('packages/bengott_avatar/default.png'). It can be a relative path
    // (relative to website's base URL, e.g. 'images/defaultAvatar.png').
    defaultImageUrl: '',

    // Gravatar default option to use (overrides default image URL)
    // Options are available at:
    // https://secure.gravatar.com/site/implement/images/#default-image
    gravatarDefault: '',

    // Server base URL. If calling Avatar.getUrl() from the server, this property
    // is REQUIRED (because server can't call window.location to figure it out).
    // Also, if this property is defined, it will effectively override the code that
    // tries to automatically determine your website's base URL.
    serverBaseUrl: ''
  },

  // Get the initials of the user
  getInitials: function (user) {

    var initials = '';
    var parts = [];

    if (user && user.profile && user.profile.firstName) {
      initials = user.profile.firstName.charAt(0).toUpperCase();

      if (user.profile.lastName) {
        initials += user.profile.lastName.charAt(0).toUpperCase();
      }
      else if (user.profile.familyName) {
        initials += user.profile.familyName.charAt(0).toUpperCase();
      }
      else if (user.profile.secondName) {
        initials += user.profile.secondName.charAt(0).toUpperCase();
      }
    }
    else if (user && user.profile && user.profile.name) {
      parts = user.profile.name.split(' ');
      // Limit getInitials to first and last initial to avoid problems with
      // very long multi-part names (e.g. "Jose Manuel Garcia Galvez")
      initials = _.first(parts).charAt(0).toUpperCase();
      if (parts.length > 1) {
        initials += _.last(parts).charAt(0).toUpperCase();
      }
    }

    return initials;
  },

  // Get the url of the user's avatar
  getUrl: function (user) {

    var url, defaultUrl, baseUrl;

    defaultUrl = Avatar.options.defaultImageUrl || 'packages/bengott_avatar/default.png';

    // If it's a relative path (no '//' anywhere), complete the URL
    if (defaultUrl.indexOf('//') === -1) {

      // Strip starting slash if it exists
      if (defaultUrl.charAt(0) === '/') defaultUrl = defaultUrl.slice(1);

      // Get the base URL
      if (Avatar.options.serverBaseUrl) {
        baseUrl = Avatar.options.serverBaseUrl;
        // Strip ending slash if it exists
        if (baseUrl.charAt(baseUrl.length - 1) === '/') baseUrl = baseUrl.slice(0, -1);
      } else {
        // If on the client, figure out the base URL automatically
        if (Meteor.isClient) {
          baseUrl = window.location.origin;
        }
        // The server will not abide this, man. Warn via console.
        else if (Meteor.isServer) {
          console.warn('[bengott:avatar] Cannot generate default avatar URL: ' +
                       'serverBaseUrl option is not defined.');
        }
      }
      // Put it all together
      defaultUrl = baseUrl + '/' + defaultUrl;
    }

    var svc = getService(user);
    if (svc === 'twitter') {
      // use larger image (200x200 is smallest custom option)
      url = user.services.twitter.profile_image_url.replace('_normal.', '_200x200.');
    }
    else if (svc === 'facebook') {
      // use larger image (~200x200)
      url = 'http://graph.facebook.com/' + user.services.facebook.id + '/picture?type=large';
    }
    else if (svc === 'google') {
      url = user.services.google.picture;
    }
    else if (svc === 'github') {
      url = 'http://avatars.githubusercontent.com/' + user.services.github.username + '?s=200';
    }
    else if (svc === 'instagram') {
      url = user.services.instagram.profile_picture;
    }
    else if (svc === 'none') {
      var gravatarDefault;
      var validGravatars = ['404', 'mm', 'identicon', 'monsterid', 'wavatar', 'retro', 'blank'];

      // Initials are shown when Gravatar returns 404. Therefore, pass '404'
      // as the gravatarDefault unless defaultType is image.
      if (Avatar.options.defaultType === 'image') {
        var valid = _.contains(validGravatars, Avatar.options.gravatarDefault);
        gravatarDefault = valid ? Avatar.options.gravatarDefault : defaultUrl;
      }
      else {
        gravatarDefault = '404';
      }

      var options = {
        // NOTE: Gravatar's default option requires a publicly accessible URL,
        // so it won't work when your app is running on localhost and you're
        // using an image with either the standard default URL or a custom
        // defaultImageUrl that is a relative path (e.g. 'images/defaultAvatar.png').
        default: gravatarDefault,
        size: 200, // use 200x200 like twitter and facebook above (might be useful later)
        secure: Meteor.isClient && window.location.protocol === 'https:'
      };

      var emailOrHash = getEmailOrHash(user);
      url = Gravatar.imageUrl(emailOrHash, options);
    }

    return url;
  }
};
