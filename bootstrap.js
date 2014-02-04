

const Cc = Components.classes;
const Ci = Components.interfaces;

function isNativeUI() {
  let appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
  return (appInfo.ID == "{aa3c5121-dab2-40e2-81ca-7ea25febc110}");
}

var menuId;

function reportBrokenSite(window) {
    let browser = window.BrowserApp.selectedTab.browser;
    let url = encodeURIComponent(browser.currentURI.spec);
    let host = encodeURIComponent(browser.currentURI.host);
    let version = "27"; // FIXME
    let short_desc = host+"%20is%20broken";
    let sysInfo = Cc["@mozilla.org/system-info;1"].
        getService(Ci.nsIPropertyBag2);
    let device = sysInfo.getProperty("manufacturer") + "%20" + sysInfo.getProperty("device");

    let bzurl = "https://bugzilla-dev.allizom.org/form.mobile.compat?";
    let tab = window.BrowserApp.addTab(bzurl
                                       + "op_sys=Firefox%20for%20Android"
                                       + "&software_version=" + version
                                       + "&bug_file_loc=" + url
                                       + "&short_desc=" + short_desc
                                       + "&device=" + device);


/*"https://bugzilla.mozilla.org/form.mobile.compat?op_sys=Android&software_version=" + 
                                       version + "&bug_file_loc" + "product=Tech%20Evangelism&component=Mobile&bug_file_loc="+url+"&short_desc="+host+"%20is%20broken");*/
}

function loadIntoWindow(window) {
  if (!window)
    return;
  menuId = window.NativeWindow.menu.add("report broken site", null, function() { reportBrokenSite(window); });
}

function unloadFromWindow(window) {
  if (!window)
    return;
    window.NativeWindow.menu.remove(menuId);
}

var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function onLoad() {
      domWindow.removeEventListener("load", onLoad, false);
      loadIntoWindow(domWindow);
    }, false);
  },
 
  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(aData, aReason) {
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
