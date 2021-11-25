import Editor from '@toast-ui/editor';
import { SkynetClient } from "skynet-js";
import { FileSystemDAC } from "fs-dac-library";
import { Buttons, Popover } from 'bootstrap';
import { popper } from '@popperjs/core';
import '../scss/index.scss';

// Base32 encoded version of resolver skylink
let appName = "040a97thkkkgrcs38gfvdc8tjntakaiq2uon13j10u7uh911ajffru8";

const editor = new Editor({
  el: document.querySelector('#editor'),
  height: '100%',
  initialEditType: 'markdown',
  previewStyle: 'vertical',
  usageStatistics: false
});

const client = new SkynetClient();
const fileSystemDAC = new FileSystemDAC();
client.loadMySky().then((mySky) => {
  mySky.loadDacs(fileSystemDAC).then(() => {
    mySky.checkLogin().then((loggedIn) => {
      if (loggedIn) {
        $('#loadingMySkyIndicator').hide();
        $('#mySkyFunctionButtons').show();
      }
    });
  });
}, (error) => {
  console.log("Error in loadMySky: " + error);
});


function promptForFilename() {
  $('#exportToSkynet').popover({
    content: `<div class="input-group">
                <input id="filenameInput" type="text" class="form-control" placeholder="filename" aria-label="filename" minlength="1">
                <div class="input-group-append">
                  <button class="btn btn-outline-secondary" type="button" id="saveBtn" disabled>Save</button>
                </div>
              </div>`,
    placement: 'auto',
    html: true,
    sanitize: false,
    customClass: "loadPopover"
  });
  $('#exportToSkynet').popover('show');
  $('#filenameInput').on('input', function( e ) {
    let $this = $( this );
    $('#saveBtn').attr( 'disabled', !$this[0].validity.valid );
  });
  $('#saveBtn').click(function(event) {
    var value = $('#filenameInput').val();
    console.log($('#filenameInput'));
    $('#exportToSkynet').popover('dispose');
    exportToSkynet(value);
  });
}

function exportToSkynet(filename) {
  console.log("Saving to skynet!");
  $('#exportToSkynet').popover({
    content: '<div id="loadingIndicator" class="spinner-grow" role="status"><span class="sr-only">Uploading...</span></div>',
    placement: 'auto',
    html: true,
    trigger: 'focus'
  });
  $('#exportToSkynet').popover('show');
  var md = editor.getMarkdown();
  console.log(md);
  var blob=new Blob([md], {type: 'text/plain'});
  //var file = new File([blob], filename + ".md", { type: 'text/plain'});
  /*
  var client = new SkynetClient();
  client.uploadFile(file).then((skylink) => {
    console.log("Skylink: " + skylink);
    client.portalUrl().then((portalUrl) => {
      var link = portalUrl + "/" + skylink.skylink.substring(6);
      $('#exportToSkynet').popover('dispose');
      $('#exportToSkynet').popover({
        content: `<a href='${link}' target="_blank">${link}</a>`,
        placement: 'auto',
        html: true,
        trigger: 'focus'
      });
      $('#exportToSkynet').popover('show');
    });
  });
  */
  fileSystemDAC.createDirectory(appName, "Documents").then((createDirResponse) => {
    console.log(createDirResponse);
    fileSystemDAC.uploadFileData(blob).then((fileData) => {
      console.log(fileData);
      fileSystemDAC.createFile(appName + "/Documents",
        filename + ".md",
        fileData
      ).then((createFileResponse) => {
        console.log(createFileResponse);
        $('#exportToSkynet').popover('dispose');
      }, (error) => console.log("createFile error: " + error));
    }, (error) => console.log("uploadFileData error: " + error));
  }, (error) => console.log('Create directory error: ' + error));
}

function loadFromSkynet(url) {
  console.log("Loading: " + url);
  fileSystemDAC.getDirectoryIndex(
    appName + "/Documents"
  ).then((dirIndex) => {
    const fileSelected = dirIndex.files[url];
    fileSystemDAC.downloadFileData(fileSelected.file, "text/plain").then((downloadedFile) => {
      console.log("Downloaded File: " + downloadedFile);
      downloadedFile.text().then((text) => {
        console.log("Downloaded File Text: " + text);
        editor.setMarkdown(text);
        $('#loadFromSkynet').popover('dispose');
      })
    }, (error) => {
      console.log("!");
      console.log(error);
    })
  });
  /*
  fetch(url).then((response) => {
    response.blob().then((data) => {
      let metadata = {
        type: 'text/plain',
      };
      let file = new File([data], "myfile.md", metadata);
      file.text().then((text) => {
        editor.setMarkdown(text);
      });
    });
  });
  */
}

function showLoadFromSkynet() {
  console.log("Loading from skynet");
  // New
  fileSystemDAC.getDirectoryIndex(
    appName + "/Documents"
  ).then((dirIndex) => {
    if (dirIndex === null || dirIndex === undefined || dirIndex.files === null || dirIndex.files === undefined) {
      console.log("Got dir index, doesn't exist");
      //Directory probably doesn't exist yet.
      $('#loadFromSkynet').popover({
        content: "No files found",
        placement: 'auto',
        trigger: "focus"
      });
      $('#loadFromSkynet').popover('show');
    } else {
      console.log("Got dir index, exists");
      const files = Object.keys(dirIndex.files);
      let fileList = document.createElement('ul');
      fileList.id = "fileList"
      for (let i = 0; i < files.length; i++) {
        let fileBtn = document.createElement('li');
        let link = document.createElement('a');
        fileBtn.appendChild(link);
        link.innerHTML = files[i];
        link.href = "javascript:void(0);"
        fileList.appendChild(fileBtn);
      }
      $(document).on('click', '#fileList > li > a', (event) => {
        console.log($(this));
        console.log(event);
        loadFromSkynet(event.currentTarget.innerHTML);
      });
      $('#loadFromSkynet').popover({
        content: fileList.outerHTML,
        placement: 'auto',
        html: true,
        sanitize: false,
        customClass: "loadPopover",
        trigger: "focus"
      });
      $('#loadFromSkynet').popover('show');
    }
  }, (error) => {
    console.log("Failed to get dir index: " + error);
  });
  // End New

  /*
  $('#loadFromSkynet').popover({
    content: `<div class="input-group">
                <input id="skylinkInput" type="text" class="form-control" placeholder="Enter URL" aria-label="skylink" minlength="1">
                <div class="input-group-append">
                  <button class="btn btn-outline-secondary" type="button" id="loadBtn" disabled>Load</button>
                </div>
              </div>`,
    placement: 'auto',
    html: true,
    sanitize: false,
    customClass: "loadPopover"
  });
  $('#loadFromSkynet').popover('show');
  $('#skylinkInput').on('input', function( e ) {
    let $this = $( this );
    $('#loadBtn').attr( 'disabled', !$this[0].validity.valid );
  });
  $('#loadBtn').click(function(event) {
    var value = $('#skylinkInput').val();
    console.log($('#skylinkInput'));
    loadFromSkynet(value);
    $('#loadFromSkynet').popover('dispose');
  });
  */
}

function shareLink() {
  console.log("Creating share link?");
  fileSystemDAC.getShareUriReadOnly(appName + "/Documents/" + "MyFile").then((url) => {
    console.log("What?");
    console.log(url);
  }, (error) => {
    console.log(error);
  });
}

function replaceDownloadButtonWithExportToSkynet() {
  let toolbarSelector = '.toastui-editor-defaultUI-toolbar';
  $(toolbarSelector).append(
         `<div class="toastui-editor-toolbar-group">
            <div class="toastui-editor-toolbar-divider"></div>
            <span id="mySkyFunctionButtons" style="display: none;">
              <button class='tui-image-editor-load-skynet-image-btn' id="loadFromSkynet" style="background: none;">
                <i class="fa fa-folder-open-o fa-2x"></i>
              </button>
              <button class='tui-image-editor-download-image-btn' id="exportToSkynet" style="background: none;">
                <i class="fa fa-save fa-2x"></i>
              </button>
            </span>
            <button style="background: none; cursor: unset;" id="loadingMySkyIndicator"><i class="fa fa-spinner fa-spin fa-2x"></i></button>
          </div>
          <div class="toastui-editor-toolbar-group" style="margin-left: auto;">
            <button id="skynetDocs" style="background: none; width: unset;">
              <a href="https://siasky.net/docs" target="_blank"><img src="BuiltWithSkynet.png" style="height: 32px;"></a>
            </button>
            <button id="github" style="background: none;">
              <a href="https://github.com/mjmay08/skynet-markdown-editor" target="_blank"><i class="fa fa-github fa-2x"></i></a>
            </button>
          </div>`
          //<button class='tui-image-editor-download-image-btn' id="shareLink" style="background: none;">
          //<i class="fa fa-share-alt fa-2x"></i>
          //</button>
  );
}

function addSkynetUploadListener() {
  $('#exportToSkynet').click(promptForFilename);
}
function addSkynetDownloadListener() {
  $('#loadFromSkynet').click(showLoadFromSkynet);
}
//function shareLinkListener() {
//  $('#shareLink').click(shareLink);
//}

replaceDownloadButtonWithExportToSkynet();
addSkynetUploadListener();
addSkynetDownloadListener();
//shareLinkListener();
