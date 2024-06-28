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
const PRECACHE = 'precache-v2';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  'codemirror/themes/qb45.css',
  'codemirror/themes/qb64-vscode.css',
  'codemirror/themes/qbjs.css',
  'codemirror/themes/vscode-dark.css',
  'codemirror/themes/win-classic.css',
  'codemirror/active-line.js',
  'codemirror/annotatescrollbar.js',
  'codemirror/codemirror.min.css',
  'codemirror/codemirror.min.js',
  'codemirror/dialog.css',
  'codemirror/dialog.js',
  'codemirror/matchesonscrollbar.css',
  'codemirror/matchesonscrollbar.js',
  'codemirror/qb-lang.js',
  'codemirror/search.js',
  'codemirror/searchcursor.js',
  'export/auto.html',
  'export/fullscreen-hover.svg',
  'export/fullscreen.svg',
  'export/logo.png',
  'export/play.html',
  'export/qbjs.css',
  'gx/__gx_font_default_black.png',
  'gx/__gx_font_default.png',
  'gx/gx.js',
  'img/about-hover.svg',
  'img/about.svg',
  'img/console-hide-hover.svg',
  'img/console-hide.svg',
  'img/console-show-hover.svg',
  'img/console-show.svg',
  'img/delete-hover.svg',
  'img/delete.svg',
  'img/file.svg',
  'img/folder.svg',
  'img/fullscreen.png',
  'img/new-folder-hover.svg',
  'img/new-folder.svg',
  'img/open-hover.svg',
  'img/open.svg',
  'img/play.png',
  'img/refresh.svg',
  'img/run-hover.svg',
  'img/run.svg',
  'img/save-hover.svg',
  'img/save.svg',
  'img/settings-hover.svg',
  'img/settings.svg',
  'img/share-hover.svg',
  'img/share.svg',
  'img/slide-left-hover.svg',
  'img/slide-left.svg',
  'img/slide-right-hover.svg',
  'img/slide-right.svg',
  'img/stop-hover.svg',
  'img/stop.svg',
  'img/upload-hover.svg',
  'img/upload.svg',
  'lib/graphics/2d.bas',
  'lib/io/fs.bas',
  'lib/web/console.bas',
  'lib/web/dom.bas',
  'lib/web/storage.bas',
  'util/jszip.min.js',
  'util/lzutf8.js',
  'util/pako.2.1.0.min.js',
  'util/shorty.min.js',
  'util/showdown.min.js',
  'util/showdown.min.js.map',
  'favicon.ico',
  'githelp.js',
  'index.html',
  '/', // Alias for index.html
  'logo-256.png',
  'logo.png',
  'manifest.json',
  'play.png',
  'qb.js',
  'qb2js.js',
  'qbjs-ide.css',
  'qbjs-ide.js',
  'qbjs.woff2',
  'vfs.js'
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