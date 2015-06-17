if (Meteor.isClient) {

    Meteor.subscribe("messages");

    var firstRenderCompleted = false;

    function scrollMessageWindow() {
        var messagesWindow = $("#messages");
        messagesWindow.animate({ scrollTop: messagesWindow.prop("scrollHeight") }, 0);
    }

    Template.messageWindow.rendered = function() {
        scrollMessageWindow();
        firstRenderCompleted = true;
    }

    Template.messageWindow.helpers({
        messages: function() {
            return Messages.find({});
        }
    });

    Template.message.onRendered(function() {
        if ( this.data.newMessage ) {
            var msg = this;
            var messageEl = $(this.firstNode);
            messageEl.bind('oanimationend animationend webkitAnimationEnd', function() {
                Meteor.call("updateNewMessage", msg.data._id);
                messageEl.unbind('oanimationend animationend webkitAnimationEnd');
            });
        }
        scrollMessageWindow();
    });

    Template.message.helpers({
        getTimestamp: function() {
            return (new Date(this.createdAt)).getTime() / 1000;
        },
        getTimeAgo: function() {
            return moment.unix((new Date(this.createdAt)).getTime() / 1000).fromNow();
        }
    });

    Template.body.events({
        "submit .chat-form": function(event) {
            var input = $(event.target).find('.chat-message')
            var text = input.val();

            if ( text.length < 1 ) return false;

            Meteor.call("addChatmessage", text);

            input.val("");

            return false;

        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

    Accounts.onLogin(function(user) {
        var userObj = Meteor.users.findOne(Meteor.userId());
    });


    // Check for when a new user is created

}

function getRandomColor() {
    var colors = [
        "#1abc9c",
        "#2ecc71",
        "#3498db",
        "#9b59b6",
        "#34495e",
        "#16a085",
        "#27ae60",
        "#2980b9",
        "#8e44ad",
        "#2c3e50",
        "#f1c40f",
        "#e67e22",
        "#e74c3c",
        "#ecf0f1",
        "#95a5a6",
        "#f39c12",
        "#d35400",
        "#c0392b",
        "#bdc3c7",
        "#7f8c8d"
    ];

    return colors[Math.floor(Math.random() * colors.length)];
}



if (Meteor.isServer) {
    Meteor.users.find().observe({
        added: function(user) {
            if ( typeof user.profile === 'undefined' ) {
                Meteor.users.update(user._id, {
                    $set: {profile: { userColor: getRandomColor() }}
                });
            }
        }
    });

    Meteor.publish("messages", function () {
        return Messages.find();
    });
}

var Messages = new Mongo.Collection("messages");

Meteor.methods({
    addChatmessage: function(text) {

        if (! Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }

        if ( text.length > 500 ) return false;

        var date = new Date();

        Messages.insert({
            name: Meteor.user().username,
            createdAt: new Date(),
            text: text,
            userId: Meteor.userId(),
            userColor: Meteor.user().profile.userColor,
            userFirstLetter: Meteor.user().username.charAt(0),
            newMessage: true
        });
    },
    updateNewMessage: function(messageId) {
        Messages.update(messageId, {$set: {newMessage: false}});
    }
});

