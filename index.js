window.addEventListener('load', () => {
  const notes = document.getElementById('notes')
  const message = document.getElementById('message-container')
  const plus = document.getElementById('plus')
  plus.addEventListener('click', addNote)
  const note = item =>
    (`
    <div class="title-x">
      <input type="text" value="${item.title}" id='txt-title-${item.id}' class="txt-title"/>
      <button class="close" id='btn-${item.id}'>&times;</button>
    </div>
    <textarea type="text" placeholder="${item.note}" id='txt-note-${item.id}' class="txt-note"></textarea>
    `)

  // fetch notes

  async function fetchNotes() {
    const data = await getNotes()
    if (data.length === 0) {
      addMessage()
    } else {
      data.map(item => {
        createNote(item)
      })
    }
  }

  // functions

  function addMessage() {
    message.style.display = 'flex'
  }

  function quitMessage() {
    message.style.display = 'none'
  }

  function createNote(item) {
    const node = document.createElement('div')
    node.innerHTML = note(item)
    node.classList.add('note')
    node.setAttribute('id', `note-${item.id}`)
    notes.appendChild(node)
    closeNote(item.id)
    save(item.id)
    sizeTxtArea(item.id)
  }

  async function addNote() {
    const newNote = await postNote()
    createNote(newNote)
    quitMessage()
  }

  function closeNote(id) {
    const button = document.getElementById(`btn-${id}`)
    const note = document.getElementById(`note-${id}`)
    button.addEventListener('click', e => {
      e.preventDefault()
      deleteNote(id)
      const { parentNode } = note
      parentNode.removeChild(note)
      if (parentNode.childElementCount === 1) {
        addMessage()
      }
    })
  }

  function save(id) {
    const txtArea = document.getElementById(`txt-note-${id}`)
    txtArea.addEventListener('keyup', () => {
      if (event.keyCode === 13) {
        event.preventDefault()
        txtArea.blur()
        document.body.focus()
        const title = document.getElementById(`txt-title-${id}`).value
        const note = document.getElementById(`txt-note-${id}`).value
        const data = {
          title,
          note
        }
        const txtAreaHeight = txtArea.offsetHeight
        localStorage.setItem(`size-${id}`, `${txtAreaHeight}px`)
        putNote(data, id)
      }
    })
  }

  function sizeTxtArea(id) {
    const size = localStorage.getItem(`size-${id}`)
    if (size !== null) {
      const txtArea = document.getElementById(`txt-note-${id}`)
      txtArea.style.height = size
    }
  }

  // request functions

  async function getNotes() {
    const res = await fetch('http://localhost:8080')
    const data = await res.json()
    return data
  }

  async function putNote(data, id) {
    await fetch(`http://localhost:8080/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async function postNote() {
    const response = await fetch(`http://localhost:8080/`, {
      method: 'POST',
      body: JSON.stringify({ title: '', note: '' }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const res = await response.json()
    const newNote = { title: '', note: '', id: res.id }
    return newNote
  }

  async function deleteNote(id) {
    await fetch(`http://localhost:8080/${id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' }
    })
  }

  // init

  fetchNotes()

})