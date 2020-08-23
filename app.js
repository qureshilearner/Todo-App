let db = firebase.database().ref("items/");
let list = [];
console.log(moment());
let listHeader = document.querySelector("#list-header");
let spinner = document.querySelector(".spiner").classList;
spinner.add("d-flex");

let isOpen;
console.log(isOpen);

db.once("value")
  .then((db) => {
    console.log(db.val() === null);
    if (db.val() === null) {
      listHeader.innerHTML = "No Items Added Yet!";
      spinner.remove("d-flex");
    } else {
      listHeader.innerHTML = "Item List";
      spinner.remove("d-flex");
    }
  })
  .catch((_) => alert("error"));

db.on("child_added", (data) => {
  listHeader.innerHTML = "Item List";
  let _list = document.querySelector("#list");
  let { id, text, at } = data.val();
  let post_at = isUpdated(data.val());
  let updated = data.val().updated !== undefined;
  console.log(list.length === 0);
  list.push({ id, text, at: post_at });
  _list.innerHTML += `<li class="list-group-item" data-itemid="${id}" onmouseleave="_mouseEvents(event)" onmouseenter="_mouseEvents(event)">
  <div class="row g-0" id="0">
      <div class="card-text col-md-8">
          ${text}
      </div>
      <div class="col-md-4 d-flex align-items-center justify-content-center invisible">
                  <button type="button" class="btn btn-primary btn-sm mr-1"
                      style="background-color: #3b5998;" data-toggle="modal"
                      data-target="#editModal" onClick="updateItem(event)">
                      <i class="far fa-edit"></i>
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" style="background-color: #dd4b39;"
                      onClick="deleteItem(event)">
                      <i class="far fa-trash-alt"></i>
                  </button>
      </div>
  </div>
  <span class="text-muted text-center" style="font-size: 0.82rem;" data-updated="${updated}" data-time="${at}">${post_at}</span>
</li>`;
});

db.on("child_changed", function (data) {
  isOpen = document.querySelector("#editModal").classList.contains("show");
  var { id, text, at } = data.val();
  let t = document.querySelectorAll("li");
  for (let i = 0; i < t.length; i++) {
    const _id = t[i].dataset.itemid;
    if (id === _id) {
      list.find((li, i) => {
        if (li !== undefined && li.id === _id) {
          list[i].text = text;
          list[i].at = at;
          isOpen && modalIsOpen("updated", text, list[i].id);
        }
      });
      let d = t[i].children[0].children[0];
      d.innerHTML = text;
      t[i].children[1].innerHTML = isUpdated(data.val());
      t[i].children[1].dataset.time = data.val().at;
      t[i].children[1].dataset.updated = true;
    }
  }
});

db.on("child_removed", function (data) {
  var { id } = data.val();
  let t = document.querySelectorAll("li");
  for (let i = 0; i < t.length; i++) {
    const _id = t[i].dataset.itemid;
    if (id === _id) {
      list.find((li, j) => {
        if (li !== undefined && li.id === _id) {
          isOpen = document
            .querySelector("#editModal")
            .classList.contains("show");
          list.splice(j, 1);
          isOpen && modalIsOpen("deleted", "", id);
        }
      });
      t[i].remove();
      list.length === 0 && (listHeader.innerHTML = "No Items Added Yet!");
    }
  }
  // console.log("The new status is:  "+ updated_item);
});

function _mouseEvents(event) {
  let e = event;
  let v = e.target.children[0].children[1].classList;
  switch (e.type) {
    case "mouseenter":
      v.remove("invisible");
      v.add("visible");
      break;
    case "mouseleave":
      v.remove("visible");
      v.add("invisible");
      break;
    default:
      break;
  }
}

//Add Item Event
let add_item = document.querySelector(".dbtn");
add_item.addEventListener("click", addItem, false);

function addItem() {
  let text = document.querySelector("#txt");
  let t = text.value;
  let id = db.push().key;
  let obj = { id: `${id}`, text: t, at: `${new Date()}` };
  if (t.trim() !== "") {
    db.child(id)
      .set(obj)
      .then(() => {
        alert("add", t);
        text.value = "";
      })
      .catch(() => alert("error"));
  }
}

let updateItem = (event) => {
  console.log(list);
  let t = event.target.closest("li");
  save.setAttribute("data-id", `${t.dataset.itemid}`);
  save.classList.add("disabled");
  let newVal = document.querySelector("#updater");
  newVal.removeAttribute("disabled");
  list.find((li) => {
    if (li !== undefined && t.dataset.itemid === li.id) {
      newVal.value = li.text;
    }
  });
};

let deleteItem = (event) => {
  let l = event.target.closest("li");
  db.child(`${l.dataset.itemid}`).remove();
  alert("delete", l.children[0].children[0].innerHTML);
};

let saveChanges = (e) => {
  let id = e.dataset.id;
  let newVal = document.querySelector("#updater");
  db.child(`${id}`).update({
    text: newVal.value,
    at: `${new Date()}`,
    updated: true,
  });
  alert("update", newVal.value);
};

let isUpdated = (obj) => {
  let at = moment(obj.at).fromNow();
  let r = "";
  obj.updated !== undefined && obj.updated
    ? (r = `Updated at ${at}`)
    : (r = at);
  return r;
};

//updateTime
(() => {
  setInterval(() => {
    let li = document.querySelectorAll("li");
    if (li !== undefined) {
      for (let i = 0; i < li.length; i++) {
        let l = li[i].children[1];
        // let r = "";
        l.dataset.updated === "true"
          ? (l.innerHTML = `Updated at ${moment(l.dataset.time).fromNow()}`)
          : (l.innerHTML = moment(l.dataset.time).fromNow());
        // l.innerHTML = r + moment(l.dataset.time).fromNow();
      }
    }
  }, 2000);
})();

let modalIsOpen = (type, newVal, id) => {
  let currentText = document.querySelector("#updater");
  let isUpdating = id === save.dataset.id;
  console.log(isUpdating);
  let info = document.querySelector("#msg");
  if (isUpdating) {
    let msg = `This item has been `;
    if (type === "deleted") {
      msg += `${type}`;
      save.classList.add("disabled");
      currentText.setAttribute("disabled", true);
    } else {
      msg += `${type} to ${newVal}`;
    }
    info.innerHTML = msg;
    currentText.value = newVal;
    setTimeout(() => {
      info.innerHTML = "";
    }, 1500);
  }
};

let alert = (type, item = "") => {
  let alertBox = document.querySelector("#info");
  // let alertBox = document.createElement("div");
  let l = alertBox.classList;
  l.add("d-block");
  switch (type) {
    case "add":
      l.add("alert-success");
      alertBox.innerText = `${item} added successfully !`;
      break;
    case "update":
      l.add("alert-info");
      alertBox.innerText = `${item} updated successfully !`;
      break;
    case "delete":
      l.add("alert-info");
      alertBox.innerText = `${item} deleted successfully !`;
      break;
    case "error":
      l.add("alert-danger");
      alertBox.innerText = `Oops something went wrong!`;
      break;
    default:
      break;
  }
  // parent.children[1].prepend(alertBox);
  setTimeout(() => {
    // parent.children[1].removeChild(alertBox);
    l.remove("d-block");
  }, 1500);
};

let toggle = (e) => {
  console.log(e.value);
  if (e.value.trim() !== "") {
    save.classList.remove("disabled");
  } else {
    save.classList.add("disabled");
  }
};
