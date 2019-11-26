const NotesService = (function() {
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
})();
