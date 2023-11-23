(function galaxy() {
  if (!(Spicetify.Player.data && Spicetify.Platform)) {
    setTimeout(galaxy, 100);
    return;
  }

  console.log("galaxy running");

  Object.keys(localStorage).forEach(item => {
    if (item.includes("galaxy:temp")) localStorage.removeItem(item);
  });

  const config = {}

  function parseOptions() {
    config.blurHomeBackground = JSON.parse(localStorage.getItem("blurHomeBackground"));
    config.useCurrSongAsHome = JSON.parse(localStorage.getItem("useCurrentSongAsHome"));
    config.useHomeEverywhere = JSON.parse(localStorage.getItem("useHomeEverywhere"));
    config.blurAllBackgrounds = JSON.parse(localStorage.getItem("blurAllBackgrounds"));
    config.showHeaderImage = JSON.parse(localStorage.getItem("showHeaderImage"));
  }
  parseOptions()

  let isDim = false;

  function loopOptions(page) {
    if (page === "/") {
      if (config.blurHomeBackground) {
        document.querySelector(".bg-main-shadow").classList.toggle("blur-enabled", true);
      } else {
        document.querySelector(".bg-main-shadow").classList.toggle("blur-enabled", false);
      }
      if (config.useCurrSongAsHome) {
        fetchCurrTrackAlbumImage();
      } else {
        setBg(startImage);
      }
    } else {
      if (config.blurAllBackgrounds) {
        document.querySelector(".bg-main-shadow").classList.toggle("blur-enabled", true);
      } else {
        document.querySelector(".bg-main-shadow").classList.toggle("blur-enabled", false);
      }
      if (config.useHomeEverywhere) {
        config.useCurrSongAsHome ? fetchCurrTrackAlbumImage() : setBg(startImage);
      }
    }
    if (config.showHeaderImage && !document.querySelector("style[galaxy-showHeaderImage]")) {
      const style = document.createElement("style");
      style.setAttribute("galaxy-showHeaderImage", "");
      style.innerHTML = `
      .playlist-playlist-playlistImageContainer,
      .main-entityHeader-imageContainer { display: block; } 
      .main-entityHeader-headerText { align-items: start; }
      .main-entityHeader-title { text-align: left; }
      .main-entityHeader-shadow { box-shadow: none;}`;
      document.body.append(style);
    } else if (!config.showHeaderImage && document.querySelector("style[galaxy-showHeaderImage]")) {
      document.querySelector("style[galaxy-showHeaderImage]").remove();
    } 
  }

  const defImage = `https://github.com/harbassan/spicetify-galaxy/blob/main/assets/default_bg.jpg?raw=true`;
  let startImage = localStorage.getItem("galaxy:startupBg") || defImage;

  async function fetchCurrTrackAlbumImage() {
    console.log("galaxy: fetching current track album image...");
    const data = Spicetify.Player.data.item.metadata;
    if (localStorage.getItem(`galaxy:tempAlbumImage:${data.album_uri.split(":")[2]}`)) {
      setBg(localStorage.getItem(`galaxy:tempAlbumImage:${data.album_uri.split(":")[2]}`))
      return
    }
    setBg(data.image_xlarge_url);
    const dataHigh = await Spicetify.CosmosAsync.get(`https://api.deezer.com/search/album?q=artist:"${data.album_artist_name}" album:"${data.album_title}"`);
    let album = dataHigh.data.find(e => e.title == data.album_title)
    const uid = Spicetify.URI.fromString(data.album_uri).id
    try {
      setBg(album.cover_xl);
      localStorage.setItem(`galaxy:tempAlbumImage:${uid}`, album.cover_xl)
    } catch {
      console.log("galaxy: unable to fetch image from deezer api");
    }
  }

  async function fetchAlbumImage(uid) {
    console.log("galaxy: fetching album image...");
    if (localStorage.getItem(`galaxy:tempAlbumImage:${uid}`)) {
      setBg(localStorage.getItem(`galaxy:tempAlbumImage:${uid}`))
      return
    }
    const data = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/albums/${uid}`);
    setBg(data.images[0].url);
    const dataHigh = await Spicetify.CosmosAsync.get(`https://api.deezer.com/search/album?q=artist:"${data.artists[0].name}" album:"${data.name}"`);
    let album = dataHigh.data.find(e => e.title == data.name)
    try {
      setBg(album.cover_xl);
      localStorage.setItem(`galaxy:tempAlbumImage:${uid}`, album.cover_xl)
    } catch {
      console.log("galaxy: unable to fetch image from deezer api");
    }
  }

  async function fetchArtistImage(uid) {
    console.log("galaxy: fetching artist image...");
    const bannerSect = document.querySelector(".under-main-view");
    const observer = new MutationObserver(mutation_list => {
      for (mutation of mutation_list) {
        if (mutation.addedNodes.length) {
          const bannerImg = mutation.addedNodes[0].querySelector("div").style.backgroundImage;
          setBg(bannerImg.slice(5, bannerImg.length - 2));
        }
      }
    });
    observer.observe(bannerSect, { childList: true });

    const data = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/artists/${uid}`);
    setTimeout(() => {
      if (!document.querySelector(".under-main-view .main-entityHeader-background")) setBg(data.images[0].url);
    }, 600);
  }

  async function fetchPlaylistImage(uid) {
    console.log("galaxy: fetching default playlist image...");
    const uri = `spotify:playlist:${uid}`;
    Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}/metadata`, {
      policy: { picture: true },
    }).then(data => {
      setBg(data.metadata.picture);
    });

    const dataHigh = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/playlists/${uid}`);
    setBg(dataHigh.images[0].url);
    localStorage.setItem("galaxy:tempPlaylistBg:" + uid, dataHigh.images[0].url);
  }

  function getPlaylistImage(uid) {
    if (localStorage.getItem("galaxy:playlistBg:" + uid)) {
      console.log("galaxy: fetching stored playlist image...");
      setBg(localStorage.getItem("galaxy:playlistBg:" + uid));
      return;
    }
    if (localStorage.getItem("galaxy:tempPlaylistBg:" + uid)) {
      console.log("galaxy: fetching temporarily stored playlist image...");
      setBg(localStorage.getItem("galaxy:tempPlaylistBg:" + uid));
      return;
    }
    fetchPlaylistImage(uid);
  }

  function setBg(imageData) {
    bgImage.src = imageData;
  }

  function waitForElement(els, func, timeout = 100) {
    const queries = els.map(el => document.querySelector(el));
    if (queries.every(a => a)) {
      func(queries);
    } else if (timeout > 0) {
      setTimeout(waitForElement, 50, els, func, --timeout);
    }
  }

  // input for custom background images
  const bannerInput = document.createElement("input");
  bannerInput.type = "file";
  bannerInput.className = "banner-input";
  bannerInput.accept = ["image/jpeg", "image/apng", "image/avif", "image/gif", "image/png", "image/svg+xml", "image/webp"].join(",");

  // listen for edit playlist popup
  const editObserver = new MutationObserver(mutation_list => {
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

        const srcInput = document.createElement("input");
        srcInput.type = "text";
        srcInput.classList.add("main-playlistEditDetailsModal-textElement", "main-playlistEditDetailsModal-titleInput");
        srcInput.id = "src-input";
        srcInput.placeholder = "Banner image URL (recommended)";

        const optButton = bannerSelect.querySelector(".main-playlistEditDetailsModal-imageDropDownButton");
        optButton.querySelector("svg").children[0].remove();
        optButton.querySelector("svg").append(document.querySelector(".main-playlistEditDetailsModal-closeBtn path").cloneNode());

        optButton.onclick = () => {
          localStorage.removeItem("galaxy:playlistBg:" + uid);
          bannerSelect.querySelector("img").src = coverSelect.querySelector("img").src;
        };

        popupContent.append(bannerSelect);
        popupContent.append(bannerInput);
        popupContent.append(srcInput);

        const editButton = bannerSelect.querySelector(".main-editImageButton-image.main-editImageButton-overlay");
        editButton.onclick = () => {
          bannerInput.click();
        };

        const save = popupContent.querySelector(".main-playlistEditDetailsModal-save button");
        save.addEventListener("click", () => {
          if (srcInput.value) {
            localStorage.setItem("galaxy:playlistBg:" + uid, srcInput.value);
          }
          getPlaylistImage(uid);
        });
      }
    }
  });

  editObserver.observe(document.body, { childList: true });

  // when user selects a custom background image
  bannerInput.onchange = () => {
    if (!bannerInput.files.length) return;

    const file = bannerInput.files[0];
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target.result;
      const [, , uid] = Spicetify.Platform.History.location.pathname.split("/");
      if (!uid) {
        try {
          localStorage.setItem("galaxy:startupBg", result);
        } catch {
          Spicetify.Snackbar.enqueueSnackbar("File too large");
          return;
        }
        document.querySelector("#home-select img").src = result;
      } else {
        try {
          localStorage.setItem("galaxy:playlistBg:" + uid, result);
        } catch {
          Spicetify.Snackbar.enqueueSnackbar("File too large");
          return;
        }
        loadBg_playlist(uid);

        document.querySelector("#banner-select img").src = result;
        document.querySelector("#banner-select img").removeAttribute("srcset");
      }
    };
    reader.readAsDataURL(file);
  };

  // create the background elements
  const bgContainer = document.createElement("div");
  bgContainer.className = "bg-main-container";
  bgContainer.innerHTML = `</div><div class="bg-image-container"><img class="bg-main-image"></div><div class="bg-main-shadow">`;
  const bgImage = bgContainer.children[0].children[0];
  document.body.prepend(bgContainer);

  // add fade and dimness effects to mainview scroll node
  waitForElement([".Root__main-view .os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
    scrollNode.addEventListener("scroll", () => {
      // dim
      if (!isDim) {
        bgContainer.children[0].style.webkitMaskImage = `linear-gradient(rgba(0, 0, 0, ${
          0.75 - scrollNode.scrollTop / 1000 < 0.3 ? 0.3 : 0.75 - scrollNode.scrollTop / 1000
        }) 0px, rgba(0, 0, 0, 0.1) 90%)`;
      }
      // fade
      if (scrollNode.scrollTop == 0) {
        scrollNode.setAttribute("fade", "bottom");
      } else if (scrollNode.scrollHeight - scrollNode.scrollTop - scrollNode.clientHeight == 0) {
        scrollNode.setAttribute("fade", "top");
      } else {
        scrollNode.setAttribute("fade", "full");
      }
    });
  });

  waitForElement([".Root__nav-bar .os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
    scrollNode.setAttribute("fade", "bottom");
    scrollNode.addEventListener("scroll", () => {
      // fade
      if (scrollNode.scrollTop == 0) {
        scrollNode.setAttribute("fade", "bottom");
      } else if (scrollNode.scrollHeight - scrollNode.scrollTop - scrollNode.clientHeight == 0) {
        scrollNode.setAttribute("fade", "top");
      } else {
        scrollNode.setAttribute("fade", "full");
      }
    });
  });

  waitForElement([".Root__nav-right-sidebar .os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
    scrollNode.setAttribute("fade", "bottom");
    scrollNode.addEventListener("scroll", () => {
      // fade
      if (scrollNode.scrollTop == 0) {
        scrollNode.setAttribute("fade", "bottom");
      } else if (scrollNode.scrollHeight - scrollNode.scrollTop - scrollNode.clientHeight == 0) {
        scrollNode.setAttribute("fade", "top");
      } else {
        scrollNode.setAttribute("fade", "full");
      }
    });
  });

  // create edit playlist topbar button
  const playlistEdit = new Spicetify.Topbar.Button("edit-playlist", "edit", () => {
    const button = document.querySelector(".main-entityHeader-titleButton");
    button.click();
  });
  playlistEdit.element.classList.toggle("hidden", true);

  // create edit home topbar button
  const homeEdit = new Spicetify.Topbar.Button("edit-home", "edit", () => {
    const content = document.createElement("div");
    content.innerHTML = `
    <div class="main-playlistEditDetailsModal-albumCover" id="home-select">
      <div class="main-entityHeader-image" draggable="false">
        <img aria-hidden="false" draggable="false" loading="eager" class="main-image-image main-entityHeader-image main-entityHeader-shadow"></div>
      <div class="main-playlistEditDetailsModal-imageChangeButton">
        <div class="main-editImage-buttonContainer">
          <button class="main-editImageButton-image main-editImageButton-overlay" aria-haspopup="true" type="button">
            <div class="main-editImageButton-icon icon">
              <svg role="img" height="48" width="48" aria-hidden="true" viewBox="0 0 24 24" class="Svg-sc-1bi12j5-0 EQkJl"><path d="M17.318 1.975a3.329 3.329 0 114.707 4.707L8.451 20.256c-.49.49-1.082.867-1.735 1.103L2.34 22.94a1 1 0 01-1.28-1.28l1.581-4.376a4.726 4.726 0 011.103-1.735L17.318 1.975zm3.293 1.414a1.329 1.329 0 00-1.88 0L5.159 16.963c-.283.283-.5.624-.636 1l-.857 2.372 2.371-.857a2.726 2.726 0 001.001-.636L20.611 5.268a1.329 1.329 0 000-1.879z"></path></svg><span class="Type__TypeElement-goli3j-0 gAmaez main-editImageButton-copy">Choose photo</span></div></button></div></div><div class="main-playlistEditDetailsModal-imageDropDownContainer"><button class="main-playlistEditDetailsModal-imageDropDownButton" type="button"><svg role="img" height="16" width="16" viewBox="0 0 16 16" class="Svg-sc-1bi12j5-0 EQkJl"><path d="M1.47 1.47a.75.75 0 011.06 0L8 6.94l5.47-5.47a.75.75 0 111.06 1.06L9.06 8l5.47 5.47a.75.75 0 11-1.06 1.06L8 9.06l-5.47 5.47a.75.75 0 01-1.06-1.06L6.94 8 1.47 2.53a.75.75 0 010-1.06z"></path></svg><span class="hidden-visually">Edit photo</span></button></div></div>`;

    const optionList = document.createElement("div");

    function createOption(name, desc, defVal) {
      const optionRow = document.createElement("div");
      optionRow.classList.add("galaxyOptionRow");
      optionRow.innerHTML = `
      <span class="galaxyOptionDesc">${desc}</span>
      <button class="galaxyOptionToggle">
        <span class="toggleWrapper">
          <span class="toggle"></span>
        </span>
      </button>`;
      optionRow.setAttribute("name", name);
      optionRow.querySelector("button").addEventListener("click", () => {
        optionRow.querySelector(".toggle").classList.toggle("enabled");
      });
      const isEnabled = JSON.parse(localStorage.getItem(name)) ?? defVal;
      optionRow.querySelector(".toggle").classList.toggle("enabled", isEnabled);
      optionList.append(optionRow);
    }

    const srcInput = document.createElement("input");
    srcInput.type = "text";
    srcInput.classList.add("main-playlistEditDetailsModal-textElement", "main-playlistEditDetailsModal-titleInput");
    srcInput.id = "src-input";
    srcInput.placeholder = "Banner image URL (recommended)";
    content.append(srcInput);

    createOption("useCurrentSongAsHome", "Use currently playing song as home bg", false);
    createOption("useHomeEverywhere", "Use the home bg everywhere", false);
    createOption("blurHomeBackground", "Blur the home bg", false);
    createOption("blurAllBackgrounds", "Blur the bg on other pages", false);
    createOption("showHeaderImage", "Show the playlist/album img in header", false);

    content.append(optionList);

    img = content.querySelector("img");
    img.src = localStorage.getItem("galaxy:startupBg") || defImage;
    const editButton = content.querySelector(".main-editImageButton-image.main-editImageButton-overlay");
    editButton.onclick = () => {
      bannerInput.click();
    };
    const removeButton = content.querySelector(".main-playlistEditDetailsModal-imageDropDownButton");
    removeButton.onclick = () => {
      content.querySelector("img").src = defImage;
    };

    const saveButton = document.createElement("button");
    saveButton.id = "home-save";
    saveButton.innerHTML = "Save";

    saveButton.addEventListener("click", () => {
      // update changed bg image
      startImage = srcInput.value || content.querySelector("img").src;
      localStorage.setItem("galaxy:startupBg", startImage);

      // save options to local storage
      [...optionList.children].forEach(option => {
        localStorage.setItem(option.getAttribute("name"), option.querySelector(".toggle").classList.contains("enabled"));
        console.log(`galaxy: ${option.getAttribute("name")} set to ${option.querySelector(".toggle").classList.contains("enabled")}`);
      });
      parseOptions();
      loopOptions("/")
    });

    content.append(saveButton);

    const issueButton = document.createElement("a");
    issueButton.classList.add("issue-button");
    issueButton.innerHTML = "Report Issue";
    issueButton.href = "https://github.com/harbassan/spicetify-galaxy";
    content.append(issueButton);

    Spicetify.PopupModal.display({ title: "Galaxy Settings", content: content });
  });
  homeEdit.element.classList.toggle("hidden", false);

  // startup parse
  loopOptions("/");

  // pages on which to not dim background
  const notDimPages = ["/playlist/", "/artist/", "/album/", "/folder/", "/collection/tracks"];


  const bgImageWrapper = bgContainer.children[0];

  // on page change
  Spicetify.Platform.History.listen(({ pathname }) => {
    const [, type, uid] = pathname.split("/");

    // change background images for certain pages
    if (!config.useHomeEverywhere) {
      switch (type) {
        case "playlist":
          getPlaylistImage(uid);
          break;
        case "album":
          fetchAlbumImage(uid);
          break;
        case "artist":
          fetchArtistImage(uid);
          break;
        case "lyrics":
          fetchCurrTrackAlbumImage();
      }
      if (pathname === "/collection/tracks") fetchCurrTrackAlbumImage();
    }

    isDim = !(notDimPages.some(page => pathname.includes(page)) || pathname == "/");

    // dim pages without art
    bgImageWrapper.style.webkitMaskImage = `linear-gradient(rgba(0, 0, 0, ${isDim ? 0.3 : 0.75}) 0px, rgba(0, 0, 0, 0.1) 90%)`;

    // center topbar elements on dim pages
    waitForElement([".main-topBar-topbarContentWrapper"], ([topbarWrapper]) => {
      isDim ? topbarWrapper.classList.add("center") : topbarWrapper.classList.remove("center");
    });

    // add or remove topbar edit buttons
    playlistEdit.element.classList.toggle("hidden", type !== "playlist");
    homeEdit.element.classList.toggle("hidden", pathname !== "/");

    loopOptions(pathname);
  });

  // change home and lyrics page background on songchange
  Spicetify.Player.addEventListener("songchange", () => {
    const pathname = Spicetify.Platform.History.location.pathname;
    if ((pathname === "/lyrics" || pathname === "/collection/tracks") && !config.useHomeEverywhere) {
      fetchCurrTrackAlbumImage();
    }
    loopOptions(pathname);
  });
})();
