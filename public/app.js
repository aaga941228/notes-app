window.addEventListener("load", () => {
  window.addEventListener("online", () => {
    doPendings();
  });
  let counter = 0;
  const notesService = NotesService();
  // const requestsQueue = RequestsQueue();
  const notes = document.getElementById("notes");
  const message = document.getElementById("message-container");
  const plus = document.getElementById("plus");
  plus.addEventListener("click", addNote);
  const note = item => `
    <div class="title-x">
    <input type="text" value="${item.title}" id='txt-title-${item.id}' class="txt-title"/>
    <button class="close" id='btn-${item.id}'>&times;</button>
    </div>
    <textarea type="text" id='txt-note-${item.id}' class="txt-note">${item.note}</textarea>
    `;

  /****************** fetchNotes ***************************/

  async function init() {
    const data = await notesService.getNotes();
    if (data.length === 0) {
      addMessage();
    } else {
      data.map(item => {
        createNote(item);
      });
    }
  }

  /****************** functions ***************************/

  const ID = function() {
    return (
      "_" +
      Math.random()
        .toString(36)
        .substr(2, 9)
    );
  };

  function addMessage() {
    message.style.display = "flex";
  }

  function quitMessage() {
    message.style.display = "none";
  }

  function createNote(item) {
    const node = document.createElement("div");
    node.setAttribute("id", `note-${item.id}`);
    node.innerHTML = note(item);
    node.classList.add("note");
    notes.appendChild(node);
    saveNote(item.id);
    sizeTxtArea(item.id);
    closeNote(item.id);
  }

  async function addNote() {
    const newNote = await notesService.postNote();
    createNote(newNote);
    quitMessage();
  }

  function closeNote(id) {
    const button = document.getElementById(`btn-${id}`);
    const note = document.getElementById(`note-${id}`);
    button.addEventListener("click", e => {
      e.preventDefault();
      const { parentNode } = note;
      notesService.deleteNote(id);
      parentNode.removeChild(note);
      if (parentNode.childElementCount === 1) {
        addMessage();
      }
    });
  }

  function confirmSave(id) {
    const txtArea = document.getElementById(`txt-note-${id}`);
    const title = document.getElementById(`txt-title-${id}`).value;
    const note = txtArea.value;
    const data = {
      title,
      note
    };
    const txtAreaHeight = txtArea.offsetHeight;
    localStorage.setItem(`size-${id}`, `${txtAreaHeight}px`);
    notesService.putNote(data, id);
  }

  function saveNote(id) {
    const txtArea = document.getElementById(`txt-note-${id}`);
    txtArea.addEventListener("keyup", event => {
      if (event.keyCode === 13) {
        event.preventDefault();
        confirmSave(id);
      }
    });
    txtArea.addEventListener("focus", event => {
      interval = setInterval(() => {
        event.preventDefault();
        confirmSave(id);
      }, 10000);
    });
    txtArea.addEventListener("blur", () => {
      clearInterval(interval);
    });
  }

  function sizeTxtArea(id) {
    const size = localStorage.getItem(`size-${id}`);
    if (size !== null) {
      const txtArea = document.getElementById(`txt-note-${id}`);
      txtArea.style.height = size;
    }
  }

  /****************** PendingRequets ***************************/

  // async function doPendingRequets() {
  //   const req = requestsQueue.dequeue();
  //   if (requestsQueue.isEmpty()) {
  //     doPendingRequets();
  //   }
  //   return;
  // }

  async function doPendingRequests(req) {
    const request = JSON.parse(req);
    switch (request.method) {
      case "DELETE":
        await notesService.deleteNote(request.id);
        break;
      case "PUT":
        await notesService.putNote(request.data, request.id);
        break;
      case "POST":
        await notesService.postNote(request.id);
        break;
      default:
        break;
    }
  }
  function removePendingRequests(id) {
    localStorage.removeItem(`request-${id}`);
  }

  async function doPendings() {
    for (let i = 0; i < counter; i++) {
      const req = localStorage.getItem(`request-${i}`);
      await doPendingRequests(req);
      removePendingRequests(i);
    }
    counter = 0;
  }

  /****************** NotesService ***************************/

  function NotesService() {
    async function getNotes() {
      const res = await fetch("http://localhost:8080");
      const data = await res.json();
      return data;
    }

    async function putNote(data, id) {
      if (navigator.onLine) {
        await fetch(`http://localhost:8080/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json"
          }
        });
      } else {
        enqueueRequest({ id, data, method: "PUT" });
      }
    }

    async function postNote(id) {
      if (navigator.onLine) {
        if (id === undefined) {
          const response = await fetch(`http://localhost:8080/`, {
            method: "POST",
            body: JSON.stringify({ title: "", note: "" }),
            headers: {
              "Content-Type": "application/json"
            }
          });
          const res = await response.json();
          const newNote = {
            title: "",
            note: "",
            id: res.id
          };
          return newNote;
        } else {
          const response = await fetch(`http://localhost:8080/`, {
            method: "POST",
            body: JSON.stringify({ id, title: "", note: "" }),
            headers: {
              "Content-Type": "application/json"
            }
          });
          const res = await response.json();
          return res;
        }
      } else {
        const id = ID();
        enqueueRequest({ id, method: "POST" });
        return { id, title: "", note: "" };
      }
    }

    async function deleteNote(id) {
      if (navigator.onLine) {
        await fetch(`http://localhost:8080/${id}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" }
        });
      } else {
        enqueueRequest({ id, method: "DELETE" });
      }
    }

    return {
      getNotes,
      postNote,
      putNote,
      deleteNote
    };
  }

  /****************** RequestsQueue ***************************/

  function enqueueRequest(element) {
    localStorage.setItem(`request-${counter}`, JSON.stringify(element));
    counter++;
  }

  /********************** init *******************************/
  init();
});
