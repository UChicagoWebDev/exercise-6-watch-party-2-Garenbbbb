// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

// Custom validation on the password reset fields
const passwordField = document.querySelector(".profile input[name=password]");
const repeatPasswordField = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password]").value;
  const r = repeatPassword.value;
  return p == r;
};

const checkPasswordRepeat = () => {
  const passwordField = document.querySelector(".profile input[name=password]");
  if(passwordField.value == repeatPasswordField.value) {
    repeatPasswordField.setCustomValidity("");
    return;
  } else {
    repeatPasswordField.setCustomValidity("Password doesn't match");
  }
}

passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);

// TODO:  On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

// TODO:  When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder. You do not have to parse variable names out
//        of the curly  braces—they are for illustration only. You can just replace the contents
//        of the parent element (and in fact can remove the {{}} from index.html if you want).

// TODO:  Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

// TODO:  When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process.
//        (Hint: https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value)
function startMessagePolling() {
  const roomID = WATCH_PARTY_ROOM_ID
  clearChatHistory(); 
  function fetchAndDisplayMessages() {
    getMessages(roomID).then(messages => {
      clearChatHistory(); 
      messages.forEach(message => {
        displayMessage(message);
      });
    }).finally(() => {
      setTimeout(fetchAndDisplayMessages, 100);
    });
  }
  fetchAndDisplayMessages();
}

function clearChatHistory() {
  const messagesContainer = document.querySelector('.messages');
  while (messagesContainer.firstChild) {
    messagesContainer.removeChild(messagesContainer.firstChild);
  }
}

function getMessages(roomId) {
  const apiKey = WATCH_PARTY_API_KEY;

  return fetch(`http://127.0.0.1:5000/api/rooms/${roomId}/messages`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


function displayMessage(message) {
  const messagesContainer = document.querySelector('.messages');
  const messageElement = document.createElement('message');
  messageElement.innerHTML = `
    <author>${message.user_name}</author>
    <content>${message.body}</content>
  `;

  messagesContainer.appendChild(messageElement);
}


document.addEventListener('DOMContentLoaded', function () {
  const commentForm = document.getElementById('commentForm');
  commentForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const commentTextarea = document.getElementById('comment_body');
    const messageBody = commentTextarea.value; 

    if (messageBody) {
      postMessage(messageBody)
        .then(response => {
          console.log('Message posted successfully:', response);
        })
        .catch(error => {
          console.error('Error posting message:', error);
        });
    }
  });
});

window.addEventListener('DOMContentLoaded', function () {

  showPage()
  showUserName()
  showRooms()

  window.addEventListener('popstate', (event) => {
    showPage()
    showUserName()
    showRooms()
  })


  const signUpButton = document.querySelector(".signup")
  if (signUpButton) {
    signUpButton.addEventListener("click", function (e) {
      e.preventDefault()
      onclickSignUp()
    })
  }

  const profileButton = document.querySelector(".loggedIn a")
  if (profileButton) {
    profileButton.addEventListener("click", function (e) {
      e.preventDefault()
      onclickProfile()
    })
  }

  const loginLink = document.querySelector(".loggedOut a")
  if (loginLink) {
    loginLink.addEventListener("click", function (e) {
      e.preventDefault()
      onclickSignUp()
    })
  }

  const buttonlogout = document.querySelector(".exit.logout")
  if (buttonlogout) {
    buttonlogout.addEventListener("click", function (e) {
      e.preventDefault()
      localStorage.removeItem("userName")
      localStorage.removeItem("api_key")
      localStorage.removeItem("user_id")
      history.pushState({ path: "/" }, "", "/")
      showPage()
      showUserName()
    })
  }
  else {
    console.error("fail logout")
  }

  
  const buttonupdateUserName = document.getElementById("updateusername")
  if (buttonupdateUserName) {
    buttonupdateUserName.addEventListener("click", function (e) {
      e.preventDefault()
      onclickUpdateName()
    })
  }
  const buttonupdatePassword = document.getElementById("updatepassword")
  if (buttonupdatePassword) {
    buttonupdatePassword.addEventListener("click", function (e) {
      e.preventDefault()
      onclickUpdatePassword()
    })
  }
})


function onclickProfile () {
  const state = { path: "/profile" }
  const url = "/profile"
  history.pushState(state, "", url)
  showPage()
}




function showPage () {
  SPLASH.classList.add("hide")
  PROFILE.classList.add("hide")
  LOGIN.classList.add("hide")
  ROOM.classList.add("hide")
  const path = window.location.pathname

  if (path == "/") {
    SPLASH.classList.remove("hide")
  }
  else if (path == "/login") {
    LOGIN.classList.remove("hide")
  }
  else if (path.startsWith("/rooms/")) {
    ROOM.classList.remove("hide")
  }
  else if (path == "/profile") {
    PROFILE.classList.remove("hide")
  }
  else {
  }
}


function showRooms () {
  fetch('http://127.0.0.1:5000/api/room/showrooms', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(rooms => {
    const noRoom = document.querySelector(".noRooms")
    if (rooms.length > 0) {
      const div = document.querySelector(".roomList")
      div.innerHTML = ""
      rooms.forEach(room => {
        const r = document.createElement('a')
        r.innerHTML = `${room.id}: <strong> ${room.name} </strong>`
        r.addEventListener("click", function (e) {
          e.preventDefault()
          history.pushState({ path: `/rooms/${room.room_id}` }, "", `/rooms/${room.room_id}`)
          showPage()
        })
        div.appendChild(r)
      })
      noRoom.style.display = "none"
    }
    else {
      noRoom.style.display = "block"
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function showUserName() {
  let uname = localStorage.getItem("userName")
  if (!uname) {
    uname = "Guest User"
  }
  document.querySelectorAll(".username").forEach(name => {
    name.textContent = uname
  })
}

const buttonCreateRoom = document.getElementById("create_room")
if (buttonCreateRoom) {
  buttonCreateRoom.addEventListener("click", function (e) {
    const roomName = prompt("Enter the name:");
    e.preventDefault()
    fetch('/api/room/createroom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': localStorage.getItem('api_key')
      },
      body: JSON.stringify({room_name: roomName})
    })
    .then(response => {
      return response.json() 
    })
    .then(
      location.reload()
    )
    .catch(error => {
      console.error('Error:', error);
    });
  })
}


const buttonLogin = document.getElementById("userlogin")
if (buttonLogin) {
  buttonLogin.addEventListener("click", function (e) {
    e.preventDefault()
    fetch('http://127.0.0.1:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "username": document.getElementById("usernameLogin").value,
        "password": document.getElementById("usernamePass").value
      })
    })
    .then(response => {
      return response.json()
    })
    .then(user => {
      if (user.success) {
        localStorage.setItem('userName', user.user_name)
        localStorage.setItem('api_key', user.api_key)
        localStorage.setItem('user_id', user.user_id)
        showUserName()
        const state = { path: "/" }
        const url = "/"
        history.pushState(state, "", url)
        showPage()
      }
      else {
        document.getElementById('failmessagelogin').style.display = 'block'
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  })
}
else{
  console.warn("login warn")
}

function onclickSignUp () {
  const div = document.getElementById('failmessagelogin')
  div.style.display = 'none'
  history.pushState({ path: "/login" }, "", "/login")
  showPage()
}


const buttonCreateUser = document.getElementById("createUsers")
if (buttonCreateUser) {
  buttonCreateUser.addEventListener("click", function (e) {
    e.preventDefault()
    fetch('http://127.0.0.1:5000/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      return response.json()
    })
    .then(user => {
      localStorage.setItem('userName', user.user_name)
      localStorage.setItem('api_key', user.api_key)
      localStorage.setItem('user_id', user.user_id)
      showUserName()
      history.pushState({ path: "/" }, "", "/")
      showPage()
    })
    .catch(error => {
      console.error('Error:', error);
    });
  })
}
else{
  console.warn("signup warn")
}


function onclickUpdateName () {
  const user_name = document.getElementById("updateusernameInput").value
  fetch('http://127.0.0.1:5000/api/update_username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': localStorage.getItem('api_key')
    },
    body: JSON.stringify({
      "new_username": user_name,
      "uid": localStorage.getItem('user_id')
    })
  })
  .then(response => {
    return response.json() 
  })
  .then(user => {
    if (user.success) {
      localStorage.setItem('userName', user_name)
      showUserName()
      showPage()
      window.alert("username updated.");
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}


function onclickUpdatePassword () {
  const pwd = document.getElementById("updatepasswordInput").value
  const repeatpwd = document.getElementById("repeatpasswordInput").value
  const errorPass = document.getElementById('passwordnomatch')
  errorPass.style.display = 'none'

  if (pwd != repeatpwd) {
    errorPass.style.display = 'block'
    return
  }
  fetch('http://127.0.0.1:5000/api/updatePassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': localStorage.getItem('api_key')
    },
    body: JSON.stringify({
      "new_password": pwd,
      "uid": localStorage.getItem('user_id')
    })
  })
  .then(response => {
    return response.json()
  })
  .then(user => {
    if (user.success) {
      showPage()
      window.alert("Password updated.");
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
