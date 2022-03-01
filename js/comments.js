//var npcId; - filled by PHP in the view
//var voiceActorId - filled by PHP in the view
//var userId; - filled by PHP in the view
//var userName; - filled by PHP in the view
//var userAvatar; - filled by PHP in the view

// var commentItemHtml = '<div class="comment" style="margin: auto;"><button data-comment-id="{id}" class="delete-comment-button">×</button><table><tr><td rowspan="2"><img src="{gravatar}" alt="Avatar" class="comment-avatar" /></td><td><strong>{name}</strong>{badges}</td></tr><tr><td><div class="comment-content">{comment}</div></td></tr></table></div><br>';
var commentItemHtml = '<div class="comment" style="margin: auto;"><table style="margin-top: -45px;"><tr><td rowspan="2"><img src="{gravatar}" alt="Avatar" class="comment-avatar"/></td><td class="comment-main-column"><strong><a href="cast/"><p style="padding-top: 8px;"></strong><div class="author-badge" title="This user is the author of this recording.">Author</div><div class="contributor-badge" title="This user contributed to this project.">Contributor</div></td><td><button data-comment-id="{id}" class="delete-comment-button">×</button></td></tr><tr></tr><tr class="comment-container"><p style="width: 100% "><hr style="width: 95%;bottom: -97px;position: relative;"></p><td class="comment-main-column"><div class="comment-content"><p style="min-width: 110%;margin-top: -25px;margin-bottom: -30px;">{comment}</p></div></td></tr></table></div><br></div>'
// var commentItemHtml = '<div class="comment" style="margin: auto;"><button data-comment-id="{id}" class="delete-comment-button">×</button><table><tr><td><img src="{gravatar}" alt="Avatar" class="comment-avatar" /></td><td><strong>{name}</strong>{badges}</td></tr><tr class="comment-container"><p style="width: 100% "><hr style="width: 95%;bottom: -140px;position: relative;"></p><td class="comment-main-column"><div class="comment-content"><p style="min-width: 110%;">{comment}</p></div></td></tr>';
$("#new-comment-button").on('click', function () {
    $("form").slideDown(1500);
    $("#new-comment-button").hide();
    $("#hide-form-button").show();
})
$("#hide-form-button").on('click', function () {
    $("form").slideUp(1500);
    $("#hide-form-button").hide();
    $("#new-comment-button").show();
})

$("#contributor-option").on('click', function () {
    $("#contributor-option").addClass('selected');
    $("#guest-option").removeClass('selected');
    $("#guest-form").hide();
    $("#contributor-form").show();
})
$("#guest-option").on('click', function () {
    $("#guest-option").addClass('selected');
    $("#contributor-option").removeClass('selected');
    $("#contributor-form").hide();
    $("#guest-form").show();
})

$("form").on('submit', function (event) {
    event.preventDefault();
    let recordingId = $(event.target).attr('data-recording-id');
    let name, email, content, antispam, verified;
    if ($("#contributor-option").length === 1 && $("#contributor-option").hasClass('selected')) {
        //Posting as a contributor
        verified = true;
        content = $("#content-contributor").val();
    }
    else {
        verified = false;
        name = $("#name").val();
        email = $("#email").val();
        content = $("#content-guest").val();
        antispam = $("#antispam").val();
    }

    $.ajax({
        url: "contents/npc/" + npcId + "/comments/" + recordingId + "/new",
        type: 'POST',
        data: {
            'verified': verified,
            'name': name,
            'email': email,
            'content': content,
            'antispam': antispam
        },
        success: function (result, message) {
            let name, badges = "", gravatar, content;
            if ($("#contributor-option").length === 1 && $("#contributor-option").hasClass('selected')) {
                name = "<a href='cast/" + userId + "'>" + userName + "</a>";
                gravatar = userAvatar;
                if (userId == voiceActorId) {
                    badges = "<div class=\"author-badge\" title=\"This user is the author of this recording.\">Author</div>";
                }
                badges += "<div class=\"contributor-badge\" title=\"This user contributed to this project.\">Contributor</div>";
                content = $("#content-contributor").val().replace(/\n/g, '<br>');
            }
            else {
                name = $("#name").val();
                if (name === '') {
                    name = 'Anonymous';
                }
                gravatar = "https://www.gravatar.com/avatar/" + md5(email) + "?d=identicon";
                badges = "";
                content = $("#content-guest").val().replace(/\n/g, '<br>');
            }

            let comment;
            comment = commentItemHtml.replace('{name}', name);
            comment = comment.replace('{gravatar}', gravatar);
            comment = comment.replace('{badges}', badges);
            comment = comment.replace('{id}', result); //Response from the server is just the number representing the ID of the new comment
            comment = comment.replace('{comment}', content);
            $comment = $(comment);
            $comment.find('.delete-comment-button').on('click', deleteComment)
            $("#comments").prepend($comment);
            $("#hide-form-button").click();
            $("#comments :first-child").fadeIn(3500);
            $("#content-contributor").val("");
            $("#content-guest").val("");

        },
        error: function (result, message, error) {
            alert("An error occurred: " + error);
        }
    });
});

var $deletingComment;
$(".delete-comment-button").on('click', deleteComment);

function deleteComment(event) {
    if (!confirm('Do you really want to delete this comment?')) {
        return;
    }

    $deletingComment = $(event.target).closest('.comment');

    $.ajax({
        url: "contents/npc/" + npcId + "/comments/" + $("form").attr('data-recording-id') + "/delete/" + $(event.target).attr('data-comment-id'),
        type: 'DELETE',
        success: function (result, message) {
            $deletingComment.slideUp(500);
            $deletingComment = undefined;
        },
        error: function (result, message, error) {
            alert("An error occurred: " + error);
        }
    });
}