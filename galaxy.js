(function galaxy() {
  if (!(Spicetify.Platform && Spicetify.Platform)) {
    setTimeout(galaxy, 100);
    return;
  }

  const defImage = `https://github.com/harbassan/spicetify-galaxy/blob/main/assets/default_bg.jpg?raw=true`;

  const bannerInput = document.createElement("input");
  bannerInput.type = "file";
  bannerInput.className = "banner-input";
  bannerInput.accept = [
    "image/jpeg",
    "image/apng",
    "image/avif",
    "image/gif",
    "image/png",
    "image/svg+xml",
    "image/webp",
  ].join(",");
  //

  //
  const editObserver = new MutationObserver((mutation_list) => {
    for (let mutation of mutation_list) {
      if (mutation.addedNodes.length) {
        const popupContent = mutation.addedNodes[0].querySelector(".main-playlistEditDetailsModal-content");
        if (!popupContent) continue;
        const coverSelect = popupContent.querySelector(".main-playlistEditDetailsModal-albumCover");
        const bannerSelect = coverSelect.cloneNode(true);
        bannerSelect.id = "banner-select";

        const [, , uid] = Spicetify.Platform.History.location.pathname.split("/");
        const base64 = localStorage.getItem("galaxy:playlistBg:" + uid);

        if (base64) {
          bannerSelect.querySelector("img").src = base64;
          bannerSelect.querySelector("img").removeAttribute("srcset");
        }

        const optButton = bannerSelect.querySelector(".main-playlistEditDetailsModal-imageDropDownButton");
        optButton.querySelector("svg").children[0].remove();
        optButton
          .querySelector("svg")
          .append(document.querySelector(".main-playlistEditDetailsModal-closeBtn path").cloneNode());

        optButton.onclick = () => {
          localStorage.removeItem("galaxy:playlistBg:" + uid);
          bannerSelect.querySelector("img").src = coverSelect.querySelector("img").src;
          loadBg_playlist(uid);
        };

        popupContent.append(bannerSelect);
        popupContent.append(bannerInput);

        const editButton = bannerSelect.querySelector(".main-editImageButton-image.main-editImageButton-overlay");
        editButton.onclick = () => {
          bannerInput.click();
        };
      }
    }
  });
  //

  //
  bannerInput.onchange = () => {
    if (!bannerInput.files.length) return;

    const file = bannerInput.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      const [, , uid] = Spicetify.Platform.History.location.pathname.split("/");
      if (!uid) {
        console.log("heblisw");
        try {
          localStorage.setItem("galaxy:startupBg", result);
        } catch {
          Spicetify.showNotification("File too large");
          return;
        }
        document.querySelector("#home-select img").src = result;
      } else {
        try {
          localStorage.setItem("galaxy:playlistBg:" + uid, result);
        } catch {
          Spicetify.showNotification("File too large");
          return;
        }
        loadBg_playlist(uid);

        document.querySelector("#banner-select img").src = result;
        document.querySelector("#banner-select img").removeAttribute("srcset");
      }
    };
    reader.readAsDataURL(file);
  };

  editObserver.observe(document.body, { childList: true });
  //

  //
  const startImage = localStorage.getItem("galaxy:startupBg") || defImage;
  const bgContainer = document.createElement("div");
  bgContainer.className = "bg-main-container";
  document.body.prepend(bgContainer);
  bgContainer.innerHTML = `</div><div class="bg-image-container"><img class="bg-main-image" src="${startImage}"></div><div class="bg-main-shadow">`;
  const bgImage = bgContainer.children[0].children[0];
  //

  waitForElement([".os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
    scrollNode.addEventListener("scroll", () => {
      bgContainer.children[0].style.webkitMaskImage = `linear-gradient(rgba(0, 0, 0, ${
        0.75 - scrollNode.scrollTop / 1000 < 0.3 ? 0.3 : 0.75 - scrollNode.scrollTop / 1000
      }) 0px, rgba(0, 0, 0, 0.1) 90%)`;
    });
  });

  waitForElement([".main-userWidget-box"], ([profMenu]) => {
    const header = profMenu.parentElement;
    const dest = document.querySelector(".main-navBar-navBar");
    header.removeChild(profMenu);
    dest.append(profMenu);
  });

  //
  waitForElement([`.main-navBar-navBarItem[data-id="/marketplace"]`], ([marketLink]) => {
    marketLink.querySelector("span").className = "Type__TypeElement-goli3j-0 eHCcSU ellipsis-one-line";
  });
  //

  function waitForElement(els, func, timeout = 100) {
    const queries = els.map((el) => document.querySelector(el));
    if (queries.every((a) => a)) {
      func(queries);
    } else if (timeout > 0) {
      setTimeout(waitForElement, 100, els, func, --timeout);
    }
  }

  //
  waitForElement([".Root__main-view .os-viewport.os-viewport-native-scrollbars-invisible"], ([mainView]) => {
    mainView.addEventListener("scroll", () => {
      if (mainView.scrollTop == 0) {
        mainView.setAttribute("fade", "bottom");
      } else if (mainView.scrollTop + mainView.clientHeight >= mainView.scrollHeight) {
        mainView.setAttribute("fade", "top");
      } else {
        mainView.setAttribute("fade", "full");
      }
    });
  });

  const playlistEdit = new Spicetify.Topbar.Button("edit-playlist", "edit", () => {
    const button = document.querySelector(".main-entityHeader-titleButton");
    button.click();
  });
  playlistEdit.element.classList.toggle("hidden", true);

  const homeEdit = new Spicetify.Topbar.Button("edit-home", "edit", () => {
    const content = document.createElement("div");
    content.innerHTML = `<div class="main-playlistEditDetailsModal-albumCover" id="home-select"><div class="main-entityHeader-image" draggable="false"><img aria-hidden="false" draggable="false" loading="eager" class="main-image-image main-entityHeader-image main-entityHeader-shadow"></div><div class="main-playlistEditDetailsModal-imageChangeButton"><div class="main-editImage-buttonContainer"><button class="main-editImageButton-image main-editImageButton-overlay" aria-haspopup="true" type="button"><div class="main-editImageButton-icon icon"><svg role="img" height="48" width="48" aria-hidden="true" viewBox="0 0 24 24" class="Svg-sc-1bi12j5-0 EQkJl"><path d="M17.318 1.975a3.329 3.329 0 114.707 4.707L8.451 20.256c-.49.49-1.082.867-1.735 1.103L2.34 22.94a1 1 0 01-1.28-1.28l1.581-4.376a4.726 4.726 0 011.103-1.735L17.318 1.975zm3.293 1.414a1.329 1.329 0 00-1.88 0L5.159 16.963c-.283.283-.5.624-.636 1l-.857 2.372 2.371-.857a2.726 2.726 0 001.001-.636L20.611 5.268a1.329 1.329 0 000-1.879z"></path></svg><span class="Type__TypeElement-goli3j-0 gAmaez main-editImageButton-copy">Choose photo</span></div></button></div></div><div class="main-playlistEditDetailsModal-imageDropDownContainer"><button class="main-playlistEditDetailsModal-imageDropDownButton" type="button"><svg role="img" height="16" width="16" viewBox="0 0 16 16" class="Svg-sc-1bi12j5-0 EQkJl"><path d="M1.47 1.47a.75.75 0 011.06 0L8 6.94l5.47-5.47a.75.75 0 111.06 1.06L9.06 8l5.47 5.47a.75.75 0 11-1.06 1.06L8 9.06l-5.47 5.47a.75.75 0 01-1.06-1.06L6.94 8 1.47 2.53a.75.75 0 010-1.06z"></path></svg><span class="hidden-visually">Edit photo</span></button></div></div>`;
    img = content.querySelector("img");
    img.src = localStorage.getItem("galaxy:startupBg") || defImage;
    const editButton = content.querySelector(".main-editImageButton-image.main-editImageButton-overlay");
    editButton.onclick = () => {
      bannerInput.click();
    };
    const removeButton = content.querySelector(".main-playlistEditDetailsModal-imageDropDownButton");
    removeButton.onclick = () => {
      localStorage.removeItem("galaxy:startupBg");
      content.querySelector("img").src = defImage;
    };
    Spicetify.PopupModal.display({ title: "Galaxy Settings", content: content });
  });
  homeEdit.element.classList.toggle("hidden", false);

  Spicetify.Platform.History.listen(async ({ pathname }) => {
    const [, type, uid] = pathname.split("/");
    if (type === "playlist" || type === "album" || type === "artist") loadBg(uid, type);
    else if (type === "") {
      bgImage.src = startImage;
    }
    type === "playlist"
      ? playlistEdit.element.classList.toggle("hidden", false)
      : playlistEdit.element.classList.toggle("hidden", true);
    type === ""
      ? homeEdit.element.classList.toggle("hidden", false)
      : homeEdit.element.classList.toggle("hidden", true);
  });

  function loadBg(uid, type) {
    if (type == "playlist") {
      if (localStorage.getItem("galaxy:playlistBg:" + uid)) {
        bgImage.src = localStorage.getItem("galaxy:playlistBg:" + uid);
        return;
      }

      // initial low quality image
      const uri = Spicetify.URI.playlistV2URI(uid);
      Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri.toURI()}/metadata`, {
        policy: { picture: true },
      }).then((res) => {
        const meta = res.metadata;
        bgImage.src = meta.picture;
      });
    }

    Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/${type + "s"}/${uid}`).then((res) => {
      bgImage.src = res.images[0].url;
    });
  }
})();
