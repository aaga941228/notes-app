window.addEventListener("load", () => {
  /****************** global variables ***************************/
  let counter = 0;
  const notes = document.getElementById("notes");
  const loader = document.getElementById("loader");
  const message = document.getElementById("message");
  const plus = document.getElementById("plus");
  plus.addEventListener("click", addNote);
  const note = item => `
    <div class="row mw-100 mh-100">
    <div class="col-10 m-0 pr-0 title-x">
    <input type="text" value="${item.title}" id='txt-title-${item.id}' class="txt-title mx-0 mw-100"/>
    </div>
    <div class="col-2 m-0 p-0">
    <button class="close" id='btn-${item.id}'>&times;</button>
    </div>
    </div>
    <div class="row">
    <div class="col-12">
    <textarea type="text" id='txt-note-${item.id}' class="txt-note w-100">${item.note}</textarea>
    </div>
    </div>
    `;

  /****************** fetchNotes ***************************/
  async function init() {
    const data = await NotesService.getNotes();
    data.length === 0
      ? addMessage()
      : data.map(item => {
          createNote(item);
        });
  }

  /****************** functions ***************************/

  function addMessage() {
    message.classList.remove("d-none");
  }

  function quitMessage() {
    message.classList.add("d-none");
  }

  function createNote(item) {
    const node = document.createElement("div");
    node.setAttribute("id", `note-${item.id}`);
    node.className = "container note m-1 col-sm-6 col-lg-4 col-xl-3";
    node.innerHTML = note(item);
    notes.appendChild(node);
    saveNote(item.id);
    incrementSize(item.id);
    sizeTxtArea(item.id);
    closeNote(item.id);
  }

  async function addNote() {
    const newNote = await NotesService.postNote();
    createNote(newNote);
    quitMessage();
  }

  function closeNote(id) {
    const button = document.getElementById(`btn-${id}`);
    const note = document.getElementById(`note-${id}`);
    button.addEventListener("click", e => {
      e.preventDefault();
      NotesService.deleteNote(id);
      notes.removeChild(note);
      if (notes.childElementCount === 0) {
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
    NotesService.putNote(data, id);
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

  function incrementSize(id) {
    const txtArea = document.getElementById(`txt-note-${id}`);
    txtArea.addEventListener("keydown", () => {
      txtArea.style.height = "1px";
      txtArea.style.height = 32 + txtArea.scrollHeight + "px";
    });
  }

  /****************** Pendings ***************************/
  window.addEventListener("offline", () => {
    loader.classList.remove("d-none");
    loader.classList.add("d-flex");
  });

  window.addEventListener("online", () => {
    loader.classList.add("d-none");
    loader.classList.remove("d-flex");
    doPendings();
  });

  async function doPendingRequests(req) {
    const request = JSON.parse(req);
    switch (request.method) {
      case "DELETE":
        await NotesService.deleteNote(request.id);
        break;
      case "PUT":
        await NotesService.putNote(request.data, request.id);
        break;
      case "POST":
        await NotesService.postNote(request.id);
        break;
      default:
        break;
    }
  }

  function removePendingRequests(id) {
    localStorage.removeItem(`request-${id}`);
  }

  function enqueueRequest(element) {
    localStorage.setItem(`request-${counter}`, JSON.stringify(element));
    counter++;
  }

  async function doPendings() {
    for (let i = 0; i < counter; i++) {
      const req = localStorage.getItem(`request-${i}`);
      await doPendingRequests(req);
      removePendingRequests(i);
    }
    NotersService.counter = 0;
  }

  /********************** NotesService *******************************/
  const NotesService = (function() {
    async function getNotes() {
      const res = await fetch("http://localhost:8080/api/notes");
      const data = await res.json();
      return data;
    }

    async function putNote(data, id) {
      if (navigator.onLine) {
        await fetch(`http://localhost:8080/api/notes/${id}`, {
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
          const response = await fetch(`http://localhost:8080/api/notes`, {
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
          const response = await fetch(`http://localhost:8080/api/notes`, {
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
        await fetch(`http://localhost:8080/api/notes/${id}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" }
        });
      } else {
        enqueueRequest({ id, method: "DELETE" });
      }
    }

    function ID() {
      return (
        "_" +
        Math.random()
          .toString(36)
          .substr(2, 9)
      );
    }

    return {
      getNotes,
      postNote,
      putNote,
      deleteNote
    };
  })();

  /********************** init *******************************/
  init();
});
