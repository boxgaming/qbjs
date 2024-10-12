/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-v15';
const RUNTIME = 'runtime';
const PREFIX = (self.location.origin.indexOf("github.io") == -1) ? "/" : "/qbjs/";

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  PREFIX + 'codemirror/themes/qb45.css',
  PREFIX + 'codemirror/themes/qb64-vscode.css',
  PREFIX + 'codemirror/themes/qbjs.css',
  PREFIX + 'codemirror/themes/vscode-dark.css',
  PREFIX + 'codemirror/themes/win-classic.css',
  PREFIX + 'codemirror/active-line.js',
  PREFIX + 'codemirror/annotatescrollbar.js',
  PREFIX + 'codemirror/codemirror.min.css',
  PREFIX + 'codemirror/codemirror.min.js',
  PREFIX + 'codemirror/dialog.css',
  PREFIX + 'codemirror/dialog.js',
  PREFIX + 'codemirror/matchesonscrollbar.css',
  PREFIX + 'codemirror/matchesonscrollbar.js',
  PREFIX + 'codemirror/qb-lang.js',
  PREFIX + 'codemirror/search.js',
  PREFIX + 'codemirror/searchcursor.js',
  PREFIX + 'export/auto.html',
  PREFIX + 'export/fullscreen-hover.svg',
  PREFIX + 'export/fullscreen.svg',
  PREFIX + 'export/logo.png',
  PREFIX + 'export/play.html',
  PREFIX + 'export/qbjs.css',
  PREFIX + 'gx/__gx_font_default_black.png',
  PREFIX + 'gx/__gx_font_default.png',
  PREFIX + 'gx/gx.js',
  PREFIX + 'img/about-hover.svg',
  PREFIX + 'img/about.svg',
  PREFIX + 'img/console-hide-hover.svg',
  PREFIX + 'img/console-hide.svg',
  PREFIX + 'img/console-show-hover.svg',
  PREFIX + 'img/console-show.svg',
  PREFIX + 'img/delete-hover.svg',
  PREFIX + 'img/delete.svg',
  PREFIX + 'img/file.svg',
  PREFIX + 'img/folder.svg',
  PREFIX + 'img/fullscreen.png',
  PREFIX + 'img/methods-hover.svg',
  PREFIX + 'img/methods.svg',
  PREFIX + 'img/new-folder-hover.svg',
  PREFIX + 'img/new-folder.svg',
  PREFIX + 'img/open-hover.svg',
  PREFIX + 'img/open.svg',
  PREFIX + 'img/play.png',
  PREFIX + 'img/refresh.svg',
  PREFIX + 'img/run-hover.svg',
  PREFIX + 'img/run.svg',
  PREFIX + 'img/save-hover.svg',
  PREFIX + 'img/save.svg',
  PREFIX + 'img/settings-hover.svg',
  PREFIX + 'img/settings.svg',
  PREFIX + 'img/share-hover.svg',
  PREFIX + 'img/share.svg',
  PREFIX + 'img/slide-left-hover.svg',
  PREFIX + 'img/slide-left.svg',
  PREFIX + 'img/slide-right-hover.svg',
  PREFIX + 'img/slide-right.svg',
  PREFIX + 'img/stop-hover.svg',
  PREFIX + 'img/stop.svg',
  PREFIX + 'img/upload-hover.svg',
  PREFIX + 'img/upload.svg',
  PREFIX + 'lib/graphics/2d.bas',
  PREFIX + 'lib/io/fs.bas',
  PREFIX + 'lib/web/console.bas',
  PREFIX + 'lib/web/dom.bas',
  PREFIX + 'lib/web/storage.bas',
  PREFIX + 'util/jszip.min.js',
  PREFIX + 'util/lzutf8.js',
  PREFIX + 'util/pako.2.1.0.min.js',
  PREFIX + 'util/shorty.min.js',
  PREFIX + 'util/showdown.min.js',
  PREFIX + 'util/showdown.min.js.map',
  PREFIX + 'favicon.ico',
  PREFIX + 'githelp.js',
  PREFIX + 'index.html',
  PREFIX, // '/', // Alias for index.html
  PREFIX + 'logo-256.png',
  PREFIX + 'logo.png',
  PREFIX + 'manifest.json',
  PREFIX + 'play.png',
  PREFIX + 'qb.js',
  PREFIX + 'qb2js.js',
  PREFIX + 'qbjs-ide.css',
  PREFIX + 'qbjs-ide.js',
  PREFIX + 'qbjs.woff2',
  PREFIX + 'vfs.js'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});